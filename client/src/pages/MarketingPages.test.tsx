import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./MarketingPages.tsx", import.meta.url), "utf8");

describe("truthful public product-information routes", () => {
  it("describes supported operational modules without customer proof or pricing claims", () => {
    expect(source).toContain("ჩაწერები და კალენდარი");
    expect(source).toContain("კლიენტები და გუნდი");
    expect(source).toContain("ფინანსები და ანგარიშები");
  });

  it("does not invent a subscription amount while billing is unconfigured", () => {
    expect(source).toContain("ჯერ არ არის კონფიგურირებული");
    expect(source).toContain("არ ვაჩვენებთ გამოგონილ ტარიფებს");
    expect(source).not.toContain("₾35");
  });

  it("does not expose a fabricated public support channel", () => {
    expect(source).toContain("არ არის კონფიგურირებული საჯარო მხარდაჭერის ფორმა");
    expect(source).toContain("გამოგონილ საკონტაქტო არხს");
  });

  it("uses the shared brand constant instead of the retired product name", () => {
    expect(source).toContain("BRAND.name");
    expect(source).not.toContain("SalonFlow");
  });

  it("renders every page in the cw appointment-card world", () => {
    expect(source).toContain('<div className="cw min-h-screen">');
    expect(source).toContain("mkt-card");
    expect(source).toContain("mkt-btn-primary");
    expect(source).not.toContain("cw-dashed");
    expect(source).toContain("CatalogHeader");
    expect(source).toContain("CatalogFooter");
    expect(source).not.toContain("sf-");
  });

  it("keeps the five marketing routes exported", () => {
    for (const name of ["FeaturesPage", "PricingPage", "DemoPage", "FaqPage", "ContactPage"]) expect(source).toContain(`export function ${name}`);
  });
});
