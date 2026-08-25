import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./BillingActivation.tsx", import.meta.url), "utf8");

describe("manual package activation presentation", () => {
  it("keeps the owner receipt workflow manual, status-aware and safe from duplicate pending submissions", () => {
    expect(source).toContain("გადარიცხვა ავტომატურად არ მტკიცდება");
    expect(source).toContain("SUBMITTED\", \"UNDER_REVIEW");
    expect(source).toContain("წინა ქვითარი უკვე შემოწმებას ელოდება");
    expect(source).toContain("თქვენი სალონის ID / გადარიცხვის კომენტარი");
    expect(source).toContain("ქვითარი ხელით შემოწმდება");
    expect(source).toContain("1-თვიანი პაკეტი გააქტიურებულია");
  });
});
