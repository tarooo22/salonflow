import { describe, expect, it } from "vitest";
import { formatDose, parseDoseToHundredths } from "./clinicalDose";

describe("parseDoseToHundredths", () => {
  it("converts decimals exactly", () => {
    expect(parseDoseToHundredths("12.5")).toBe(1250);
    expect(parseDoseToHundredths("12,5")).toBe(1250);
    expect(parseDoseToHundredths("0.07")).toBe(7);
    expect(parseDoseToHundredths("1.15")).toBe(115);
    expect(parseDoseToHundredths("20")).toBe(2000);
    expect(parseDoseToHundredths(" 0.1 ")).toBe(10);
  });
  it("rejects invalid input", () => {
    for (const bad of ["", "0", "0.00", "1.234", "-1", "abc", "1e3", ".5", "100000.01"]) expect(parseDoseToHundredths(bad)).toBeNull();
  });
});

describe("formatDose", () => {
  it("formats hundredths with unit", () => {
    expect(formatDose(1250, "UNITS")).toBe("12.5 ერთეული (U)");
    expect(formatDose(7, "ML")).toBe("0.07 მლ");
    expect(formatDose(200, "MG")).toBe("2 მგ");
    expect(formatDose(null, null)).toBe("");
  });
});
