import { describe, expect, it } from "vitest";
import { createLegacyRecoveryCode, matchesLegacyRecoveryCode, normalizeLegacyRecoveryCode } from "./recoveryCodes";

describe("legacy recovery codes", () => {
  it("formats a stable non-reversible code and accepts normalized user entry", () => {
    const openId = "local_AbCdEfGhIjKlMnOpQrStU";
    const code = createLegacyRecoveryCode(openId);
    expect(code).toMatch(/^SF-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);
    expect(normalizeLegacyRecoveryCode(code.toLowerCase().replaceAll("-", " "))).toBe(code);
    expect(matchesLegacyRecoveryCode(openId, code)).toBe(true);
  });

  it("rejects malformed or mismatched input", () => {
    expect(normalizeLegacyRecoveryCode("local_test_user_00001")).toBeNull();
    expect(matchesLegacyRecoveryCode("local_AbCdEfGhIjKlMnOpQrStU", "SF-1111-2222-3333")).toBe(false);
  });
});
