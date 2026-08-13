// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { isResetTokenShape } from "./PasswordRecovery";

describe("password recovery token client guard", () => {
  it("accepts opaque reset-token shapes and rejects malformed values", () => {
    expect(isResetTokenShape("valid_reset_token_0123456789abcdefghijklm")).toBe(true);
    expect(isResetTokenShape("not/a/token")).toBe(false);
    expect(isResetTokenShape(null)).toBe(false);
  });
});
