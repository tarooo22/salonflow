import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./PartnerLanding.tsx", import.meta.url), "utf8");

describe("Partner landing (management program page)", () => {
  it("uses truthful registration, manual review and trial language", () => {
    expect(source).toContain("რეგისტრაცია");
    expect(source).toContain("ხელით განხილვა");
    expect(source).toContain("საცდელი წვდომა ავტომატურად არ აქტიურდება");
    expect(source).toContain("7-დღიანი საცდელი წვდომა");
    expect(source).not.toContain("დაიწყეთ 7-დღიანი trial");
  });

  it("sends the primary call to action to registration and the secondary one to contact", () => {
    expect(source).toContain('<Link href="/register" className="cw-btn cw-btn-stamp">');
    expect(source).toContain('<Link href="/contact" className="cw-btn cw-btn-line');
  });

  it("covers all three verticals and marks dental as coming soon", () => {
    expect(source).toContain("VERTICALS");
    expect(source).toContain('item.id === "dental"');
    expect(source).toContain("სტომატოლოგიური კლინიკები მალე დაემატება");
  });

  it("offers the approved public support route without placing bank data on the page", () => {
    expect(source).toContain("61576174343901");
    expect(source).toContain("მოგვწერეთ Facebook-ზე");
    expect(source).not.toContain("GE64BG0000000161381468");
  });

  it("does not invent social proof, prices or the old product name", () => {
    expect(source).not.toContain("SalonFlow");
    expect(source).not.toMatch(/₾|GEL\s?\d|\d\s?₾/);
    expect(source).not.toMatch(/testimonial|\d+\+ (სალონ|კლიენტ)/i);
  });

  it("is a cw page with a main landmark, brand-aware meta and no legacy sf- styling", () => {
    expect(source).toContain('<div className="cw min-h-screen">');
    expect(source).toContain('id="main-content"');
    expect(source).toContain("BRAND.name");
    expect(source).toContain('canonicalPath: "/partner"');
    expect(source).not.toContain("sf-");
  });
});
