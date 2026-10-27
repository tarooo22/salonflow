import { describe, expect, it } from "vitest";
import { slugifyGeorgian } from "./slug";

describe("slugifyGeorgian", () => {
  it("transliterates Mkhedruli letters", () => {
    expect(slugifyGeorgian("ვაკის სალონი")).toBe("vakis-saloni");
    expect(slugifyGeorgian("ჟღარტი ჭიქა ხაჭაპური ძალა")).toBe("zhgharti-chika-khachapuri-dzala");
    expect(slugifyGeorgian("შენი ფრჩხილები წყალი")).toBe("sheni-prchkhilebi-tsqali");
  });
  it("keeps Latin and digits, lowercases, collapses and trims separators", () => {
    expect(slugifyGeorgian("  Nino Beauty Studio!! ")).toBe("nino-beauty-studio");
    expect(slugifyGeorgian("Salon №5 -- ვაკე")).toBe("salon-5-vake");
    expect(slugifyGeorgian("---")).toBe("");
  });
  it("caps the length at 60 without a trailing dash", () => {
    const slug = slugifyGeorgian("ა".repeat(30) + " " + "ბ".repeat(40));
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith("-")).toBe(false);
  });
});
