import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./MarketplaceDirectory.tsx", import.meta.url), "utf8");
const filters = readFileSync(new URL("../components/public/MarketplaceDiscovery.tsx", import.meta.url), "utf8");

describe("Marketplace Directory discovery handoff", () => {
  it("keeps Home discovery filters URL-backed while debouncing text entry", () => {
    expect(source).toContain('marketplaceDiscoveryHref("/salons", categorySlug, nextSearch, nextArea)');
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
    expect(source).toContain('setArea(""); setAreaDraft(""); setLocation(marketplaceDiscoveryHref("/salons", categorySlug, searchDraft))');
    expect(filters).toContain('areaTag: "ადგილი: "');
    expect(filters).toContain("{text.areaTag}{area.trim()}");
    expect(filters).toContain('removeFilter: "ფილტრის მოხსნა"');
    expect(filters).toContain("aria-label={text.removeFilter}");
  });

  it("lives in the catalog world: shared tickets in shelves, vertical tabs, Chawera meta", () => {
    expect(source).toContain('<div className="cw min-h-screen">');
    expect(source).toContain('<main id="main-content">');
    expect(source).toContain("BRAND.name");
    expect(source).not.toContain("SalonFlow");
    for (const shelf of ["title={text.vip}", "title={text.recommended}", 'vip: "VIP"', 'recommended: "რეკომენდებული"', "newestListings", "TicketShelf"]) expect(source).toContain(shelf);
    expect(filters).toContain("verticalForCategory");
    expect(filters).toContain('role="search"');
  });
});
