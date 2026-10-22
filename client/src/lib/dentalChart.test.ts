import { describe, expect, it } from "vitest";
import { isValidToothCode } from "../../../shared/validation";
import { allToothCodes, TOOTH_LAYOUT, toothAriaLabel } from "./dentalChart";

describe("dentalChart layout", () => {
  it("has 32 permanent and 20 primary teeth, all valid FDI codes", () => {
    expect(allToothCodes("permanent")).toHaveLength(32);
    expect(allToothCodes("primary")).toHaveLength(20);
    for (const code of [...allToothCodes("permanent"), ...allToothCodes("primary")]) expect(isValidToothCode(code)).toBe(true);
  });
  it("orders arches right to left like a chart", () => {
    expect(TOOTH_LAYOUT.permanent.upper[0]).toEqual(["18", "17", "16", "15", "14", "13", "12", "11"]);
    expect(TOOTH_LAYOUT.permanent.upper[1][0]).toBe("21");
    expect(TOOTH_LAYOUT.permanent.lower[0][0]).toBe("48");
    expect(TOOTH_LAYOUT.primary.upper[0]).toEqual(["55", "54", "53", "52", "51"]);
    expect(TOOTH_LAYOUT.primary.lower[1]).toEqual(["71", "72", "73", "74", "75"]);
  });
  it("builds accessible names", () => {
    expect(toothAriaLabel("16", "FILLED")).toBe("კბილი 16 — ბჟენი");
    expect(toothAriaLabel("16", undefined)).toBe("კბილი 16 — ჩანაწერი არ არის");
  });
});
