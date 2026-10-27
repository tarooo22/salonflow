import { describe, expect, it } from "vitest";
import { formatGelTetri, formatKaDateTime } from "./presentation";

describe("Georgian presentation helpers", () => {
  it("formats integer tetri as GEL without floating-point storage", () => {
    expect(formatGelTetri(7550)).toContain("75,50");
    expect(formatGelTetri(7550)).toContain("₾");
  });

  it("formats dates using the Georgian locale", () => {
    expect(formatKaDateTime(new Date("2026-08-14T10:30:00.000Z"), "Asia/Tbilisi")).toContain("2026");
  });
});

describe("formatDateTimeForLocale", () => {
  it("uses the hand-written Georgian format for ka and Intl for other languages", async () => {
    const { formatDateTimeForLocale } = await import("./presentation");
    const value = new Date("2026-11-03T14:41:00.000Z");
    expect(formatDateTimeForLocale(value, "ka", "Asia/Tbilisi")).toBe(formatKaDateTime(value, "Asia/Tbilisi"));
    expect(formatDateTimeForLocale(value, "ka", "Asia/Tbilisi")).not.toMatch(/M\d/);
    expect(formatDateTimeForLocale(value, "en", "Asia/Tbilisi")).toContain("2026");
  });
});
