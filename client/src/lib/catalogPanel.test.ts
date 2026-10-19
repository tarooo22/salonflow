import { describe, expect, it } from "vitest";
import { buildVacancyInput, emptyVacancyForm, optionalGelToTetri, vacancyStatusInfo } from "./catalogPanel";

const valid = { ...emptyVacancyForm, locationId: "location_00001", title: " სტილისტი ", description: "აღწერა აღწერა", contactPhone: "+995555000000" };

describe("catalog panel helpers", () => {
  it("converts GEL input to integer tetri without floats", () => {
    expect(optionalGelToTetri("1500")).toBe(150000);
    expect(optionalGelToTetri("19,90")).toBe(1990);
    expect(optionalGelToTetri("0.1")).toBe(10);
    expect(optionalGelToTetri("")).toBeNull();
    expect(optionalGelToTetri("12.345")).toBeUndefined();
    expect(optionalGelToTetri("abc")).toBeUndefined();
  });

  it("builds a vacancy payload with tetri salaries and trimmed text", () => {
    const result = buildVacancyInput({ ...valid, salaryFromGel: "1500", salaryToGel: "2500.50" });
    expect(result).toMatchObject({ ok: true, value: { title: "სტილისტი", salaryFromTetri: 150000, salaryToTetri: 250050, contactPhone: "+995555000000", contactEmail: null, roleCategory: null } });
  });

  it("rejects missing contact, reversed salary range and invalid salary", () => {
    expect(buildVacancyInput({ ...valid, contactPhone: "" }).ok).toBe(false);
    expect(buildVacancyInput({ ...valid, salaryFromGel: "3000", salaryToGel: "2000" }).ok).toBe(false);
    expect(buildVacancyInput({ ...valid, salaryFromGel: "1e3" }).ok).toBe(false);
  });

  it("maps vacancy state to a Georgian status label", () => {
    expect(vacancyStatusInfo({ status: "DRAFT", isExpired: false }).label).toBe("დრაფტი");
    expect(vacancyStatusInfo({ status: "PUBLISHED", isExpired: false }).label).toBe("გამოქვეყნებული");
    expect(vacancyStatusInfo({ status: "PUBLISHED", isExpired: true }).label).toBe("ვადაგასული");
    expect(vacancyStatusInfo({ status: "CLOSED", isExpired: false }).label).toBe("დახურული");
  });
});
