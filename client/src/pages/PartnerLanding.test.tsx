import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./PartnerLanding.tsx", import.meta.url), "utf8");

describe("Partner landing owner activation copy", () => {
  it("uses truthful registration, manual review and trial language", () => {
    expect(source).toContain("სალონის რეგისტრაცია");
    expect(source).toContain("ხელით განხილვა");
    expect(source).toContain("Trial ავტომატურად არ აქტიურდება");
    expect(source).not.toContain("დაიწყეთ 7-დღიანი trial");
  });

  it("offers the approved public support route without placing bank data on the page", () => {
    expect(source).toContain("61576174343901");
    expect(source).toContain("მოგვწერეთ Facebook-ზე");
    expect(source).not.toContain("GE64BG0000000161381468");
  });

  it("uses the current project-scoped illustrative photography assets", () => {
    expect(source).toContain("salon-interior_d9ad9a03.jpg");
    expect(source).toContain("salon-pink-chairs_414fa07a.jpg");
    expect(source).toContain("salon-team-space_0e322fb7.jpg");
    expect(source).toContain('event.currentTarget.style.display = "none"');
  });
});
