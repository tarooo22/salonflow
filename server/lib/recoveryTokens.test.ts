import { describe, expect, it } from "vitest";
import { PASSWORD_RESET_TTL_MS, createPasswordResetToken, hashPasswordResetToken, passwordResetExpiresAt } from "./recoveryTokens";

describe("password recovery tokens", () => {
  it("creates opaque URL-safe tokens and persists only deterministic hashes", () => {
    const token = createPasswordResetToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{32,128}$/);
    expect(hashPasswordResetToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashPasswordResetToken(token)).toBe(hashPasswordResetToken(token));
  });

  it("sets the documented 30-minute expiry", () => {
    expect(passwordResetExpiresAt(1_000).getTime()).toBe(1_000 + PASSWORD_RESET_TTL_MS);
  });
});
