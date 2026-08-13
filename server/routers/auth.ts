import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { localLoginSchema, localRegistrationSchema, passwordResetRequestSchema, passwordResetSchema } from "@shared/validation";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { normalizeEmail } from "../lib/normalization";
import { hashPassword, verifyPassword } from "../lib/passwords";
import { createPasswordResetToken, hashPasswordResetToken, passwordResetExpiresAt } from "../lib/recoveryTokens";

const INVALID_CREDENTIALS_MESSAGE = "ელფოსტა ან პაროლი არასწორია.";

async function issueSession(ctx: { req: Parameters<typeof getSessionCookieOptions>[0]; res: { cookie: (name: string, value: string, options: Record<string, unknown>) => unknown } }, user: { openId: string; name: string | null }) {
  const token = await sdk.createSessionToken(user.openId, { name: user.name ?? "", expiresInMs: ONE_YEAR_MS });
  const cookieOptions = getSessionCookieOptions(ctx.req);
  ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}

export const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
  register: publicProcedure.input(localRegistrationSchema).mutation(async ({ ctx, input }) => {
    const normalizedEmail = normalizeEmail(input.email);
    if (!normalizedEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "ელფოსტა სავალდებულოა." });
    if (await db.getUserByNormalizedEmail(normalizedEmail)) {
      throw new TRPCError({ code: "CONFLICT", message: "ამ ელფოსტით ანგარიში უკვე არსებობს. შედით სისტემაში." });
    }

    try {
      const user = await db.createLocalUser({
        openId: `local_${nanoid(21)}`,
        name: input.name.trim(),
        email: normalizedEmail,
        passwordHash: await hashPassword(input.password),
      });
      if (!user) throw new Error("User creation did not return a user");
      await issueSession(ctx, user);
      return { id: user.id, name: user.name };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "რეგისტრაცია ვერ დასრულდა. სცადეთ ხელახლა." });
    }
  }),
  login: publicProcedure.input(localLoginSchema).mutation(async ({ ctx, input }) => {
    const user = await db.getUserByNormalizedEmail(input.email);
    const valid = user?.accountStatus === "ACTIVE" && await verifyPassword(input.password, user?.passwordHash);
    if (!valid || !user) throw new TRPCError({ code: "UNAUTHORIZED", message: INVALID_CREDENTIALS_MESSAGE });
    await issueSession(ctx, user);
    return { id: user.id, name: user.name };
  }),
  requestPasswordReset: publicProcedure.input(passwordResetRequestSchema).mutation(async ({ input }) => {
    // Always perform the normalized lookup, but return the same response for every
    // address so the endpoint cannot disclose whether an account exists.
    const user = await db.getUserByNormalizedEmail(input.email);
    if (user?.accountStatus === "ACTIVE" && user.passwordHash) {
      const token = createPasswordResetToken();
      await db.createPasswordResetToken({
        id: nanoid(21),
        userId: user.id,
        tokenHash: hashPasswordResetToken(token),
        expiresAt: passwordResetExpiresAt(),
      });
    }
    // The raw token is intentionally discarded until a verified transactional-email
    // sender exists. It must never be returned through this public endpoint.
    return { accepted: true } as const;
  }),
  resetPassword: publicProcedure.input(passwordResetSchema).mutation(async ({ input }) => {
    const consumed = await db.consumePasswordResetAndUpdatePassword({
      tokenHash: hashPasswordResetToken(input.token),
      passwordHash: await hashPassword(input.password),
    });
    if (!consumed) throw new TRPCError({ code: "BAD_REQUEST", message: "პაროლის აღდგენის ბმული მიუწვდომელია ან ვადაგასულია." });
    return { success: true } as const;
  }),
});
