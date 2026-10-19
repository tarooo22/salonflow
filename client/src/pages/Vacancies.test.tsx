import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EMPLOYMENT_LABELS, formatUtcDate, salaryLabel } from "@/components/catalog/Commerce";

const list = readFileSync(new URL("./Vacancies.tsx", import.meta.url), "utf8");
const detail = readFileSync(new URL("./VacancyDetail.tsx", import.meta.url), "utf8");

describe("vacancy formatting", () => {
  it("labels employment types in Georgian", () => {
    expect(EMPLOYMENT_LABELS).toMatchObject({ FULL_TIME: "სრული განაკვეთი", PART_TIME: "ნახევარი განაკვეთი", CHAIR_RENTAL: "სავარძლის ქირა", FREELANCE: "ფრილანსი" });
  });

  it("formats salary ranges from integer tetri and never invents a figure", () => {
    expect(salaryLabel(null, null)).toBe("ანაზღაურება შეთანხმებით");
    expect(salaryLabel(120000, 200000)).toContain(" – ");
    expect(salaryLabel(120000, null)).toMatch(/-დან$/);
    expect(salaryLabel(null, 200000)).toMatch(/-მდე$/);
  });

  it("prints the UTC calendar day as DD.MM.YYYY", () => {
    expect(formatUtcDate(new Date("2026-03-05T23:30:00Z"))).toBe("05.03.2026");
    expect(formatUtcDate(null)).toBeNull();
  });
});

describe("vacancies pages", () => {
  it("list uses the catalog world, server filters, offset load-more and honest empty states", () => {
    expect(list).toContain('<div className="cw min-h-screen">');
    expect(list).toContain("trpc.vacancies.publicList.useQuery");
    expect(list).toContain("LoadMoreButton");
    expect(list).toContain("BRAND.name");
    expect(list).toContain("ამჟამად გამოქვეყნებული ვაკანსია არ არის.");
  });

  it("detail shows description, tel/mailto contacts, business link and expiry", () => {
    expect(detail).toContain("trpc.vacancies.publicDetail.useQuery");
    expect(detail).toContain("href={`tel:");
    expect(detail).toContain("href={`mailto:");
    expect(detail).toContain("/salon/${item.locationPublicSlug}");
    expect(detail).toContain("formatUtcDate(item.expiresAt)");
    expect(detail).toContain("BRAND.name");
  });
});
