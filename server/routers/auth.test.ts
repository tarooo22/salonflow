import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserByNormalizedEmail: vi.fn(),
  createLocalUser: vi.fn(),
  requireDb: vi.fn(),
  createLocalSessionToken: vi.fn(),
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock("../db", () => ({
  getUserByNormalizedEmail: mocks.getUserByNormalizedEmail,
  createLocalUser: mocks.createLocalUser,
  requireDb: mocks.requireDb,
}));
vi.mock("../lib/localSessions", () => ({ createLocalSessionToken: mocks.createLocalSessionToken }));
vi.mock("../_core/cookies", () => ({ getSessionCookieOptions: () => ({ httpOnly: true, path: "/", sameSite: "lax", secure: false }) }));
vi.mock("../lib/passwords", () => ({ hashPassword: mocks.hashPassword, verifyPassword: mocks.verifyPassword }));

import { authRouter } from "./auth";

const localUser = { id: 44, openId: "local_test_user_00001", name: "თამარი", email: "tamari@example.com", passwordHash: "stored-hash", accountStatus: "ACTIVE", loginMethod: "local" };

function context() {
  const cookie = vi.fn();
  const clearCookie = vi.fn();
  return { ctx: { req: {}, res: { cookie, clearCookie }, user: null } as never, cookie };
}

describe("local auth router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createLocalSessionToken.mockResolvedValue("signed-local-session");
  });

  it("registers a unique local account and issues the existing signed app session cookie", async () => {
    mocks.getUserByNormalizedEmail.mockResolvedValue(undefined);
    mocks.hashPassword.mockResolvedValue("scrypt$hashed");
    mocks.createLocalUser.mockResolvedValue(localUser);
    const { ctx, cookie } = context();

    await expect(authRouter.createCaller(ctx).register({ name: "თამარი", email: "tamari@example.com", password: "ძლიერი-პაროლი-123" })).resolves.toEqual({ id: 44, openId: "local_test_user_00001", name: "თამარი", email: "tamari@example.com" });
    expect(mocks.createLocalUser).toHaveBeenCalledWith(expect.objectContaining({ name: "თამარი", email: "tamari@example.com", passwordHash: "scrypt$hashed" }));
    expect(cookie).toHaveBeenCalledWith("app_session_id", "signed-local-session", expect.objectContaining({ httpOnly: true, sameSite: "lax" }));
  });

  it("rejects an invalid local login without issuing a session", async () => {
    mocks.getUserByNormalizedEmail.mockResolvedValue(localUser);
    mocks.verifyPassword.mockResolvedValue(false);
    const { ctx, cookie } = context();

    await expect(authRouter.createCaller(ctx).login({ email: "tamari@example.com", password: "არასწორი-პაროლი" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(cookie).not.toHaveBeenCalled();
  });
});
