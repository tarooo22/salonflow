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

  it("uses shared Salon House panels and notes for public trust surfaces", () => {
    expect(source).toContain("sf-salon-panel");
    expect(source).toContain("sf-salon-note");
    expect(source).toContain("sf-salon-media-frame");
  });
});
