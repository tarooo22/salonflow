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
