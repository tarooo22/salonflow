import { describe, expect, it, vi } from "vitest";
import { COOKIE_NAME } from "@shared/const";

const mocked = vi.hoisted(() => ({
  getUserByNormalizedEmail: vi.fn(),
  createLocalUser: vi.fn(),
  createPasswordResetToken: vi.fn(),
  supersedeActivePasswordResetTokens: vi.fn(),
  consumePasswordResetAndUpdatePassword: vi.fn(),
  createSessionToken: vi.fn(),
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
  nanoid: vi.fn(),
  hashPasswordResetToken: vi.fn(),
  createPasswordResetTokenValue: vi.fn(),
  passwordResetExpiresAt: vi.fn(),
}));

vi.mock("../db", () => ({
  getUserByNormalizedEmail: mocked.getUserByNormalizedEmail,
  createLocalUser: mocked.createLocalUser,
  createPasswordResetToken: mocked.createPasswordResetToken,
  supersedeActivePasswordResetTokens: mocked.supersedeActivePasswordResetTokens,
  consumePasswordResetAndUpdatePassword: mocked.consumePasswordResetAndUpdatePassword,
}));
vi.mock("../_core/sdk", () => ({ sdk: { createSessionToken: mocked.createSessionToken } }));
vi.mock("../_core/cookies", () => ({ getSessionCookieOptions: () => ({ httpOnly: true, path: "/", sameSite: "none", secure: true }) }));
vi.mock("../lib/passwords", () => ({ hashPassword: mocked.hashPassword, verifyPassword: mocked.verifyPassword }));
vi.mock("../lib/recoveryTokens", () => ({ createPasswordResetToken: mocked.createPasswordResetTokenValue, hashPasswordResetToken: mocked.hashPasswordResetToken, passwordResetExpiresAt: mocked.passwordResetExpiresAt }));
vi.mock("nanoid", () => ({ nanoid: mocked.nanoid }));

import { authRouter } from "./auth";

const localUser = {
  id: 7,
  openId: "local_generated_open_id",
  name: "ნინო ქავთარაძე",
  email: "nino@example.com",
  normalizedEmail: "nino@example.com",
  normalizedPhone: null,
  passwordHash: "stored-hash",
  avatarKey: null,
  locale: "ka-GE",
  loginMethod: "password",
  role: "user" as const,
  accountStatus: "ACTIVE" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function context() {
  const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  return {
    cookies,
    ctx: {
      user: null,
      req: { protocol: "https", headers: {} },
      res: { cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }) },
    },
  };
}

describe("local auth", () => {
  it("registers a normalized local account and sets a secure session", async () => {
    const { ctx, cookies } = context();
    mocked.getUserByNormalizedEmail.mockResolvedValueOnce(undefined);
    mocked.hashPassword.mockResolvedValueOnce("hashed-password");
    mocked.nanoid.mockReturnValueOnce("generated_open_id");
    mocked.createLocalUser.mockResolvedValueOnce(localUser);
    mocked.createSessionToken.mockResolvedValueOnce("session-token");

    await expect(authRouter.createCaller(ctx as never).register({ name: " ნინო ქავთარაძე ", email: "NINO@EXAMPLE.COM", password: "secure-password-2026" })).resolves.toEqual({ id: 7, name: "ნინო ქავთარაძე" });
    expect(mocked.createLocalUser).toHaveBeenCalledWith(expect.objectContaining({ openId: "local_generated_open_id", email: "nino@example.com", passwordHash: "hashed-password" }));
    expect(cookies).toEqual([expect.objectContaining({ name: COOKIE_NAME, value: "session-token", options: expect.objectContaining({ httpOnly: true, secure: true }) })]);
  });

  it("rejects an incorrect password without setting a session", async () => {
    const { ctx, cookies } = context();
    mocked.getUserByNormalizedEmail.mockResolvedValueOnce(localUser);
    mocked.verifyPassword.mockResolvedValueOnce(false);

    await expect(authRouter.createCaller(ctx as never).login({ email: "nino@example.com", password: "wrong-password" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(cookies).toEqual([]);
  });

  it("accepts password-reset requests without disclosing whether the email exists", async () => {
    mocked.getUserByNormalizedEmail.mockResolvedValueOnce(localUser).mockResolvedValueOnce(undefined);
    mocked.nanoid.mockReturnValueOnce("reset-token-record-id");
    mocked.createPasswordResetTokenValue.mockReturnValueOnce("raw-reset-token");
    mocked.hashPasswordResetToken.mockReturnValueOnce("stored-reset-token-hash");
    mocked.passwordResetExpiresAt.mockReturnValueOnce(new Date("2026-08-13T12:30:00.000Z"));
    const caller = authRouter.createCaller(context().ctx as never);

    await expect(caller.requestPasswordReset({ email: "nino@example.com" })).resolves.toEqual({ accepted: true });
    await expect(caller.requestPasswordReset({ email: "unknown@example.com" })).resolves.toEqual({ accepted: true });
    expect(mocked.createPasswordResetToken).toHaveBeenCalledWith({
      id: "reset-token-record-id",
      userId: localUser.id,
      tokenHash: "stored-reset-token-hash",
      expiresAt: new Date("2026-08-13T12:30:00.000Z"),
    });
    expect(mocked.supersedeActivePasswordResetTokens).toHaveBeenCalledWith(localUser.id);
  });

  it("hashes the supplied reset token and replaces the password only when it is active", async () => {
    mocked.hashPasswordResetToken.mockReturnValueOnce("stored-token-hash");
    mocked.hashPassword.mockResolvedValueOnce("new-password-hash");
    mocked.consumePasswordResetAndUpdatePassword.mockResolvedValueOnce(true);

    await expect(authRouter.createCaller(context().ctx as never).resetPassword({ token: "valid_reset_token_0123456789abcdefghijklm", password: "new-secure-password-2026" })).resolves.toEqual({ success: true });
    expect(mocked.consumePasswordResetAndUpdatePassword).toHaveBeenCalledWith({ tokenHash: "stored-token-hash", passwordHash: "new-password-hash" });
  });
});
