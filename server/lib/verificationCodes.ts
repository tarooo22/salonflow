import { createHash, randomInt } from "node:crypto";

export const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_VERIFICATION_CODE_ATTEMPTS = 5;

export function createVerificationCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashVerificationCode(destination: string, purpose: string, code: string) {
  return createHash("sha256").update(`${destination}\u0000${purpose}\u0000${code}`).digest("hex");
}

export function verificationCodeExpiresAt(now = Date.now()) {
  return new Date(now + VERIFICATION_CODE_TTL_MS);
}
