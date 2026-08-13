import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { passwordResetTokens, users } from "../../drizzle/schema";
import { consumePasswordResetAndUpdatePassword, createPasswordResetToken as createPasswordResetTokenRecord, requireDb } from "../db";
import { createPasswordResetToken, hashPasswordResetToken, passwordResetExpiresAt } from "../lib/recoveryTokens";
import { authRouter } from "./auth";

const describeLive = process.env.RUN_LIVE_DB_TESTS === "1" ? describe : describe.skip;
const suffix = `${Date.now().toString(36)}${Math.floor(Math.random() * 1_000_000).toString(36)}`;
const fixtureEmail = `live.recovery.${suffix}@salonflow.invalid`;
const fixtureUserOpenId = `live_recovery_${suffix}`;
let fixtureUserId = 0;

describeLive("password recovery live database verification", () => {
  beforeAll(async () => {
    const db = await requireDb();
    await db.insert(users).values({
      openId: fixtureUserOpenId,
      name: "Live recovery verification user",
      email: fixtureEmail,
      normalizedEmail: fixtureEmail,
      passwordHash: "initial-live-hash",
      loginMethod: "password",
      role: "user",
      accountStatus: "ACTIVE",
    });
    const [user] = await db.select().from(users).where(eq(users.openId, fixtureUserOpenId)).limit(1);
    if (!user) throw new Error("Recovery fixture user was not created");
    fixtureUserId = user.id;
  });

  afterAll(async () => {
    const db = await requireDb();
    if (fixtureUserId) {
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, fixtureUserId));
      await db.delete(users).where(eq(users.id, fixtureUserId));
    }
  });

  it("persists only a hash for an existing account and keeps the public response generic", async () => {
    const caller = authRouter.createCaller({} as never);
    const existing = await caller.requestPasswordReset({ email: fixtureEmail });
    const unknown = await caller.requestPasswordReset({ email: `unknown.${suffix}@salonflow.invalid` });
    const db = await requireDb();
    const rows = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.userId, fixtureUserId));

    expect(existing).toEqual({ accepted: true });
    expect(unknown).toEqual({ accepted: true });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(rows[0]?.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("consumes an active token exactly once, persists the replacement password, and rejects expiry", async () => {
    const activeToken = createPasswordResetToken();
    await createPasswordResetTokenRecord({
      id: nanoid(21),
      userId: fixtureUserId,
      tokenHash: hashPasswordResetToken(activeToken),
      expiresAt: passwordResetExpiresAt(),
    });

    await expect(consumePasswordResetAndUpdatePassword({ tokenHash: hashPasswordResetToken(activeToken), passwordHash: "replacement-live-hash" })).resolves.toBe(true);
    await expect(consumePasswordResetAndUpdatePassword({ tokenHash: hashPasswordResetToken(activeToken), passwordHash: "must-not-apply" })).resolves.toBe(false);
    const db = await requireDb();
    const [updatedUser] = await db.select().from(users).where(eq(users.id, fixtureUserId)).limit(1);
    expect(updatedUser?.passwordHash).toBe("replacement-live-hash");

    const expiredToken = createPasswordResetToken();
    await createPasswordResetTokenRecord({
      id: nanoid(21),
      userId: fixtureUserId,
      tokenHash: hashPasswordResetToken(expiredToken),
      expiresAt: new Date(Date.now() - 60_000),
    });
    await expect(consumePasswordResetAndUpdatePassword({ tokenHash: hashPasswordResetToken(expiredToken), passwordHash: "must-not-apply" })).resolves.toBe(false);
  });
});
