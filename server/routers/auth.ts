import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { legacyLocalAccountClaimSchema, localLoginSchema, localRegistrationSchema } from "../../shared/validation";
import { users } from "../../drizzle/schema";
import { createLocalUser, getIncompleteLocalUserByRecoveryCode, getUserByNormalizedEmail, getUserByOpenId, requireDb } from "../db";
import { getSessionCookieOptions } from "../_core/cookies";
import { publicProcedure, router } from "../_core/trpc";
import { normalizeEmail } from "../lib/normalization";
import { createLocalSessionToken } from "../lib/localSessions";
import { hashPassword, verifyPassword } from "../lib/passwords";

function safeUser(user: { id: number; openId: string; name: string | null; email: string | null }) {
  return { id: user.id, openId: user.openId, name: user.name, email: user.email };
}

async function issueSession(ctx: { req: any; res: any }, user: { openId: string; name: string | null }) {
  const token = await createLocalSessionToken(user.openId, user.name);
  ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
}

export const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  register: publicProcedure.input(localRegistrationSchema).mutation(async ({ ctx, input }) => {
    const existing = await getUserByNormalizedEmail(input.email);
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "ამ ელფოსტით ანგარიში უკვე არსებობს. შედით სისტემაში." });
    const passwordHash = await hashPassword(input.password);
    const user = await createLocalUser({ openId: `local_${nanoid(21)}`, name: input.name, email: input.email, passwordHash });
    if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "ანგარიშის შექმნა ვერ მოხერხდა." });
    await issueSession(ctx, user);
    return safeUser(user);
  }),
  login: publicProcedure.input(localLoginSchema).mutation(async ({ ctx, input }) => {
    const user = await getUserByNormalizedEmail(input.email);
    const accepted = user?.accountStatus === "ACTIVE" && user.loginMethod === "local" && await verifyPassword(input.password, user.passwordHash);
    if (!accepted || !user) throw new TRPCError({ code: "UNAUTHORIZED", message: "ელფოსტა ან პაროლი არასწორია." });
    const db = await requireDb();
    await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
    await issueSession(ctx, user);
    return safeUser(user);
  }),
  claimLegacyLocal: publicProcedure.input(legacyLocalAccountClaimSchema).mutation(async ({ ctx, input }) => {
    const user = "recoveryCode" in input ? await getIncompleteLocalUserByRecoveryCode(input.recoveryCode) : await getUserByOpenId(input.openId);
    const canClaim = Boolean(
      user
      && user.openId.startsWith("local_")
      && user.accountStatus === "ACTIVE"
      && !user.email
      && !user.normalizedEmail
      && !user.loginMethod
      && user.passwordHash,
    );
    const passwordMatches = canClaim && user ? await verifyPassword(input.password, user.passwordHash) : false;
    if (!passwordMatches || !user) throw new TRPCError({ code: "UNAUTHORIZED", message: "ძველი ანგარიშის დადასტურება ვერ მოხერხდა." });

    const existing = await getUserByNormalizedEmail(input.email);
    if (existing && existing.id !== user.id) throw new TRPCError({ code: "CONFLICT", message: "ამ ელფოსტით ანგარიში უკვე არსებობს. შედით სისტემაში." });
    const normalizedEmail = normalizeEmail(input.email);
    if (!normalizedEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "ელფოსტა არასწორია." });

    const db = await requireDb();
    const result = await db.update(users).set({
      email: input.email.trim(),
      normalizedEmail,
      loginMethod: "local",
      lastSignedIn: new Date(),
    }).where(and(
      eq(users.id, user.id),
      eq(users.openId, user.openId),
      isNull(users.email),
      isNull(users.normalizedEmail),
      isNull(users.loginMethod),
    ));
    if (result[0].affectedRows !== 1) throw new TRPCError({ code: "CONFLICT", message: "ანგარიშის მონაცემები შეიცვალა. სცადეთ სისტემაში შესვლა." });
    const claimedUser = { ...user, email: input.email.trim(), normalizedEmail, loginMethod: "local" };
    await issueSession(ctx, claimedUser);
    return safeUser(claimedUser);
  }),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});
