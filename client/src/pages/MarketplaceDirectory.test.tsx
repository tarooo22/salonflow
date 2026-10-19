import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./MarketplaceDirectory.tsx", import.meta.url), "utf8");

describe("Marketplace Directory discovery handoff", () => {
  it("keeps Home discovery filters URL-backed while debouncing text entry", () => {
    expect(source).toContain('marketplaceDiscoveryHref("/salons", categorySlug, nextSearch, area)');
    expect(source).toContain("}, 250)");
    expect(source).toContain("searchDraft");
  });

  it("preserves category and map discovery controls with an explicit reset", () => {
    expect(source).toContain('marketplaceDiscoveryHref("/salons/map", categorySlug, search, area)');
    expect(source).toContain('setLocation("/salons")');
    expect(source).toContain("რუკაზე ნახვა");
  });

  it("reads the area param, sends it to the query, keeps it on category change and offers a removable chip", () => {
    expect(source).toContain("area: area.trim() || undefined");
    expect(source).toContain('marketplaceDiscoveryHref("/salons", nextCategory, searchDraft, area)');
    expect(source).toContain("setArea(filters.area)");
    expect(source).toContain("setArea(\"\"); setLocation(\"/salons\")");
    expect(source).toContain("ადგილი: {area.trim()}");
    expect(source).toContain('aria-label="ფილტრის მოხსნა"');
  });
});
