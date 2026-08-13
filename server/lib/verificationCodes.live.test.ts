import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { verificationCodes } from "../../drizzle/schema";
import { consumeVerificationCode, createVerificationCode as createVerificationCodeRecord, requireDb } from "../db";
import { MAX_VERIFICATION_CODE_ATTEMPTS, createVerificationCode, hashVerificationCode, verificationCodeExpiresAt } from "./verificationCodes";

const describeLive = process.env.RUN_LIVE_DB_TESTS === "1" ? describe : describe.skip;
const suffix = `${Date.now().toString(36)}${Math.floor(Math.random() * 1_000_000).toString(36)}`;
const destinations = ["limit", "once", "scope", "expired"].map(name => `${name}.${suffix}@salonflow.invalid`);

async function insertCode(destination: string, purpose: "EMAIL_VERIFICATION" | "PHONE_VERIFICATION", code: string, expiresAt = verificationCodeExpiresAt()) {
  await createVerificationCodeRecord({
    id: nanoid(21),
    destination,
    purpose,
    codeHash: hashVerificationCode(destination, purpose, code),
    expiresAt,
  });
}

describeLive("verification-code live database verification", () => {
  afterAll(async () => {
    const db = await requireDb();
    for (const destination of destinations) await db.delete(verificationCodes).where(eq(verificationCodes.destination, destination));
  });

  it("locks a code after five failed attempts", async () => {
    const [destination] = destinations;
    const code = createVerificationCode();
    await insertCode(destination, "EMAIL_VERIFICATION", code);
    for (let attempt = 0; attempt < MAX_VERIFICATION_CODE_ATTEMPTS; attempt += 1) {
      await expect(consumeVerificationCode({ destination, purpose: "EMAIL_VERIFICATION", codeHash: hashVerificationCode(destination, "EMAIL_VERIFICATION", "000000"), maxAttempts: MAX_VERIFICATION_CODE_ATTEMPTS })).resolves.toBe(false);
    }
    await expect(consumeVerificationCode({ destination, purpose: "EMAIL_VERIFICATION", codeHash: hashVerificationCode(destination, "EMAIL_VERIFICATION", code), maxAttempts: MAX_VERIFICATION_CODE_ATTEMPTS })).resolves.toBe(false);
  });

  it("enforces purpose isolation, expiry, and one-time consumption", async () => {
    const [, onceDestination, scopeDestination, expiredDestination] = destinations;
    const onceCode = createVerificationCode();
    await insertCode(onceDestination, "EMAIL_VERIFICATION", onceCode);
    const onceInput = { destination: onceDestination, purpose: "EMAIL_VERIFICATION" as const, codeHash: hashVerificationCode(onceDestination, "EMAIL_VERIFICATION", onceCode), maxAttempts: MAX_VERIFICATION_CODE_ATTEMPTS };
    await expect(consumeVerificationCode(onceInput)).resolves.toBe(true);
    await expect(consumeVerificationCode(onceInput)).resolves.toBe(false);

    const scopeCode = createVerificationCode();
    await insertCode(scopeDestination, "EMAIL_VERIFICATION", scopeCode);
    await expect(consumeVerificationCode({ destination: scopeDestination, purpose: "PHONE_VERIFICATION", codeHash: hashVerificationCode(scopeDestination, "PHONE_VERIFICATION", scopeCode), maxAttempts: MAX_VERIFICATION_CODE_ATTEMPTS })).resolves.toBe(false);
    await expect(consumeVerificationCode({ destination: scopeDestination, purpose: "EMAIL_VERIFICATION", codeHash: hashVerificationCode(scopeDestination, "EMAIL_VERIFICATION", scopeCode), maxAttempts: MAX_VERIFICATION_CODE_ATTEMPTS })).resolves.toBe(true);

    const expiredCode = createVerificationCode();
    await insertCode(expiredDestination, "EMAIL_VERIFICATION", expiredCode, new Date(Date.now() - 60_000));
    await expect(consumeVerificationCode({ destination: expiredDestination, purpose: "EMAIL_VERIFICATION", codeHash: hashVerificationCode(expiredDestination, "EMAIL_VERIFICATION", expiredCode), maxAttempts: MAX_VERIFICATION_CODE_ATTEMPTS })).resolves.toBe(false);
  });
});
