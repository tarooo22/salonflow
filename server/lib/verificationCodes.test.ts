import { describe, expect, it } from "vitest";
import { MAX_VERIFICATION_CODE_ATTEMPTS, VERIFICATION_CODE_TTL_MS, createVerificationCode, hashVerificationCode, verificationCodeExpiresAt } from "./verificationCodes";

describe("verification codes", () => {
  it("creates six-digit codes and purpose-bound hashes", () => {
    const code = createVerificationCode();
    expect(code).toMatch(/^\d{6}$/);
    expect(hashVerificationCode("a@example.com", "EMAIL_VERIFICATION", code)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashVerificationCode("a@example.com", "EMAIL_VERIFICATION", code)).not.toBe(hashVerificationCode("a@example.com", "PHONE_VERIFICATION", code));
  });

  it("uses a bounded 10-minute lifetime and five attempts", () => {
    expect(verificationCodeExpiresAt(1_000).getTime()).toBe(1_000 + VERIFICATION_CODE_TTL_MS);
    expect(MAX_VERIFICATION_CODE_ATTEMPTS).toBe(5);
  });
});
