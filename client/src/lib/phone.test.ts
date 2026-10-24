import { describe, expect, it } from "vitest";

import { formatPhoneDisplay } from "./phone";

describe("formatPhoneDisplay", () => {
  it("groups international mobile numbers", () => {
    expect(formatPhoneDisplay("+995599352314")).toBe("+995 599 35 23 14");
    expect(formatPhoneDisplay("+995 599 35 23 14")).toBe("+995 599 35 23 14");
  });
  it("adds the country code to 9-digit local numbers", () => {
    expect(formatPhoneDisplay("599352314")).toBe("+995 599 35 23 14");
    expect(formatPhoneDisplay("599 35 23 14")).toBe("+995 599 35 23 14");
  });
  it("groups landlines", () => {
    expect(formatPhoneDisplay("+995322000000")).toBe("+995 32 2 00 00 00");
  });
  it("returns unknown input unchanged", () => {
    for (const value of ["", "abc", "+4915112345678", "12345"]) expect(formatPhoneDisplay(value)).toBe(value);
  });
});
