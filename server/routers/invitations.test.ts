import { createHash } from "node:crypto";
import { SignJWT } from "jose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({ db: null as unknown, createLocalSessionToken: vi.fn(), hashPassword: vi.fn() }));

vi.mock("../db", () => ({ requireDb: vi.fn(async () => mocked.db) }));
vi.mock("../_core/env", () => ({ ENV: { cookieSecret: "invite-test-secret-0123456789abcdef" } }));
vi.mock("../_core/cookies", () => ({ getSessionCookieOptions: () => ({ httpOnly: true, path: "/" }) }));
vi.mock("../lib/localSessions", () => ({ createLocalSessionToken: mocked.createLocalSessionToken }));
vi.mock("../lib/passwords", () => ({ hashPassword: mocked.hashPassword }));

import { invitationsRouter } from "./invitations";

const existingUser = { id: 51, openId: "local_existing_owner_0001", name: "ნინო", email: "nino@example.com", normalizedEmail: "nino@example.com", loginMethod: "local", role: "user" as const };

async function inviteToken() {
  const payload = { id: "invite_2026_abcdefgh", organizationId: "organization_2026_abcd", email: "nino@example.com", role: "STAFF", publicDisplayName: "ნინო", color: "#17826A" };
  const token = await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1d").sign(new TextEncoder().encode("invite-test-secret-0123456789abcdef"));
  const invite = { id: payload.id, status: "PENDING", tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 86_400_000), invitedByUserId: 1, createdAt: new Date() };
  return { token, invite };
}

function inviteDb(selectRows: unknown[][], affectedRows = 1, txSelectRows: unknown[] = []) {
  let call = 0;
  const updateSet = vi.fn(() => ({ where: vi.fn(async () => [{ affectedRows }]) }));
  const tx = {
    insert: vi.fn(() => ({ values: vi.fn(async () => undefined) })), update: vi.fn(() => ({ set: updateSet })),
    delete: vi.fn(() => ({ where: vi.fn(async () => undefined) })),
    select: vi.fn(() => ({ from: () => ({ where: () => ({ limit: async () => txSelectRows }) }) })),
  };
  return {
    select: vi.fn(() => ({ from: () => ({ where: () => ({ limit: async () => selectRows[call++] ?? [] }) }) })),
    transaction: vi.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx)),
    tx,
    updateSet,
  };
}

function context(user: unknown) {
  const cookie = vi.fn();
  return { ctx: { req: {}, res: { cookie }, user } as never, cookie };
}

describe("invitations.accept", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuses to join or sign in an existing account unless that account is the signed-in caller", async () => {
    const { token, invite } = await inviteToken();
    const db = inviteDb([[invite], [existingUser]]);
    mocked.db = db;
    const { ctx, cookie } = context(null);

    await expect(invitationsRouter.createCaller(ctx).accept({ token, password: "attacker-password-123" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.transaction).not.toHaveBeenCalled();
    expect(mocked.hashPassword).not.toHaveBeenCalled();
    expect(cookie).not.toHaveBeenCalled();
  });

  it("adds a signed-in existing user without touching their password or issuing a new session", async () => {
    const { token, invite } = await inviteToken();
    const db = inviteDb([[invite], [existingUser], []]);
    mocked.db = db;
    const { ctx, cookie } = context(existingUser);

    await expect(invitationsRouter.createCaller(ctx).accept({ token })).resolves.toEqual({ organizationId: "organization_2026_abcd", role: "STAFF" });
    expect(db.updateSet).toHaveBeenCalledTimes(1);
    expect(db.updateSet).toHaveBeenCalledWith(expect.objectContaining({ status: "ACCEPTED", acceptedByUserId: 51 }));
    expect(mocked.hashPassword).not.toHaveBeenCalled();
    expect(cookie).not.toHaveBeenCalled();
  });

  it("reactivates the removed member's membership and staff profile instead of inserting duplicates", async () => {
    const { token, invite } = await inviteToken();
    const former = { id: "membership_old_0001", status: "DISABLED" };
    const db = inviteDb([[invite], [existingUser], [former]], 1, [{ id: "staff_profile_old_01" }]);
    mocked.db = db;
    const { ctx } = context(existingUser);

    await expect(invitationsRouter.createCaller(ctx).accept({ token })).resolves.toEqual({ organizationId: "organization_2026_abcd", role: "STAFF" });
    expect(db.tx.insert).not.toHaveBeenCalled();
    expect(db.updateSet).toHaveBeenCalledWith(expect.objectContaining({ status: "ACTIVE", role: "STAFF", disabledAt: null }));
    expect(db.updateSet).toHaveBeenCalledWith(expect.objectContaining({ status: "ACTIVE", onlineBookingVisible: true }));
    expect(db.updateSet).toHaveBeenCalledWith(expect.objectContaining({ status: "ACCEPTED" }));
  });

  it("rolls back when the invite was already claimed by a concurrent accept", async () => {
    const { token, invite } = await inviteToken();
    mocked.db = inviteDb([[invite], [existingUser], []], 0);
    const { ctx } = context(existingUser);

    await expect(invitationsRouter.createCaller(ctx).accept({ token })).rejects.toMatchObject({ code: "CONFLICT" });
  });
});
