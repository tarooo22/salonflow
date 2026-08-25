import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./BillingAdmin.tsx", import.meta.url), "utf8");

describe("Billing payments admin safety UX", () => {
  it("requires an explicit confirmation before granting a month and localizes review state", () => {
    expect(source).toContain("AlertDialog");
    expect(source).toContain("დაადასტურეთ 1-თვიანი პაკეტი");
    expect(source).toContain("ხელით დადასტურება და 1 თვის ჩართვა");
    expect(source).toContain("receiptStatusLabel");
  });
});
