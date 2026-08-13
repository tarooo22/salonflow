import { describe, expect, it, vi } from "vitest";
import { COOKIE_NAME } from "@shared/const";

const mocked = vi.hoisted(() => ({
  getUserByNormalizedEmail: vi.fn(),
  createLocalUser: vi.fn(),
  createSessionToken: vi.fn(),
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
  nanoid: vi.fn(),
}));

vi.mock("../db", () => ({
  getUserByNormalizedEmail: mocked.getUserByNormalizedEmail,
  createLocalUser: mocked.createLocalUser,
}));
vi.mock("../_core/sdk", () => ({ sdk: { createSessionToken: mocked.createSessionToken } }));
vi.mock("../_core/cookies", () => ({ getSessionCookieOptions: () => ({ httpOnly: true, path: "/", sameSite: "none", secure: true }) }));
vi.mock("../lib/passwords", () => ({ hashPassword: mocked.hashPassword, verifyPassword: mocked.verifyPassword }));
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
});
