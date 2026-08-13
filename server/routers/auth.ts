import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { localLoginSchema, localRegistrationSchema } from "../../shared/validation";
import { users } from "../../drizzle/schema";
import { createLocalUser, getUserByNormalizedEmail, requireDb } from "../db";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import { publicProcedure, router } from "../_core/trpc";
import { hashPassword, verifyPassword } from "../lib/passwords";

function safeUser(user: { id: number; openId: string; name: string | null; email: string | null }) {
  return { id: user.id, openId: user.openId, name: user.name, email: user.email };
}

async function issueSession(ctx: { req: any; res: any }, user: { openId: string; name: string | null }) {
  const token = await sdk.createSessionToken(user.openId, { name: user.name || "SalonFlow User" });
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
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});
