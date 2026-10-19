import { describe, expect, it } from "vitest";
import { marketplaceDiscoveryFilters, marketplaceDiscoveryHref, marketplacePromotionLabel } from "./MarketplaceDiscovery";

describe("Marketplace discovery disclosure", () => {
  it("uses explicit promoted-placement labels rather than pretending to rank salons organically", () => {
    expect(marketplacePromotionLabel("VIP")).toBe("VIP / რეკლამა");
    expect(marketplacePromotionLabel("RECOMMENDED")).toBe("რეკომენდებული");
    expect(marketplacePromotionLabel(undefined)).toBeNull();
  });

  it("creates and reads deep links for category and search discovery without losing filter context", () => {
    expect(marketplaceDiscoveryHref("/salons", "hair", "ვაკე სალონი")).toBe("/salons?category=hair&q=%E1%83%95%E1%83%90%E1%83%99%E1%83%94+%E1%83%A1%E1%83%90%E1%83%9A%E1%83%9D%E1%83%9C%E1%83%98");
    expect(marketplaceDiscoveryFilters("?category=hair&q=%E1%83%95%E1%83%90%E1%83%99%E1%83%94+%E1%83%A1%E1%83%90%E1%83%9A%E1%83%9D%E1%83%9C%E1%83%98")).toEqual({ categorySlug: "hair", search: "ვაკე სალონი", area: "" });
    expect(marketplaceDiscoveryHref("/salons/map", "nails")).toBe("/salons/map?category=nails");
  });

  it("carries the area filter after category and q, trimmed, and omits it when empty", () => {
    expect(marketplaceDiscoveryHref("/salons", undefined, undefined, "ბათუმი")).toBe("/salons?area=%E1%83%91%E1%83%90%E1%83%97%E1%83%A3%E1%83%9B%E1%83%98");
    expect(marketplaceDiscoveryHref("/salons", "nails", "მანიკიური", "  ვაკე ")).toBe("/salons?category=nails&q=%E1%83%9B%E1%83%90%E1%83%9C%E1%83%98%E1%83%99%E1%83%98%E1%83%A3%E1%83%A0%E1%83%98&area=%E1%83%95%E1%83%90%E1%83%99%E1%83%94");
    expect(marketplaceDiscoveryHref("/salons/map", "nails", "", "   ")).toBe("/salons/map?category=nails");
    expect(marketplaceDiscoveryFilters("?q=%E1%83%9B%E1%83%90%E1%83%9C%E1%83%98%E1%83%99%E1%83%98%E1%83%A3%E1%83%A0%E1%83%98&area=%E1%83%95%E1%83%90%E1%83%99%E1%83%94")).toEqual({ categorySlug: undefined, search: "მანიკიური", area: "ვაკე" });
  });
});
