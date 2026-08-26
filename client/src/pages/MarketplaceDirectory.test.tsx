import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./MarketplaceDirectory.tsx", import.meta.url), "utf8");

describe("Marketplace Directory discovery handoff", () => {
  it("keeps Home discovery filters URL-backed while debouncing text entry", () => {
    expect(source).toContain('marketplaceDiscoveryHref("/salons", categorySlug, nextSearch)');
    expect(source).toContain("}, 250)");
    expect(source).toContain("searchDraft");
  });

  it("preserves category and map discovery controls with an explicit reset", () => {
    expect(source).toContain('marketplaceDiscoveryHref("/salons/map", categorySlug, search)');
    expect(source).toContain('setLocation("/salons")');
    expect(source).toContain("რუკაზე ნახვა");
  });
});
