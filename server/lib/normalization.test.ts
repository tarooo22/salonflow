import { describe, expect, it } from "vitest";
import { normalizeEmail, normalizeGeorgianPhone, toTetri } from "./normalization";
import { roleCan } from "../access";

describe("contact normalization", () => {
  it("normalizes common Georgian mobile number formats to E.164", () => {
    expect(normalizeGeorgianPhone("555 12 34 56")).toBe("+995555123456");
    expect(normalizeGeorgianPhone("+995 555 12 34 56")).toBe("+995555123456");
    expect(normalizeGeorgianPhone("0555123456")).toBe("+995555123456");
  });

  it("normalizes email without inventing a value", () => {
    expect(normalizeEmail("  HELLO@EXAMPLE.GE ")).toBe("hello@example.ge");
    expect(normalizeEmail(" ")).toBeNull();
  });
});

describe("financial and role safeguards", () => {
  it("converts GEL only at the presentation boundary", () => {
    expect(toTetri("12.34")).toBe(1234);
    expect(toTetri(50)).toBe(5000);
  });

  it("reserves finance and reports access for the owner role", () => {
    expect(roleCan("OWNER", "finance:manage")).toBe(true);
    expect(roleCan("MANAGER", "reports:view")).toBe(false);
    expect(roleCan("RECEPTIONIST", "finance:view")).toBe(false);
    expect(roleCan("STAFF", "calendar:manage")).toBe(false);
  });
});
