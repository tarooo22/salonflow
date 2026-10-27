import { describe, expect, it } from "vitest";
import { distanceKm, marketplaceDiscoveryFilters, marketplaceDiscoveryHref, marketplacePromotionLabel, sortByDistance } from "./MarketplaceDiscovery";

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

describe("Near me", () => {
  const tbilisi = { latitude: 41.7151, longitude: 44.8271 };

  it("computes great-circle distance in km from E6 coordinates", () => {
    expect(distanceKm(tbilisi, { latitudeE6: 41_715_100, longitudeE6: 44_827_100 })).toBeLessThan(0.05);
    // Tbilisi to Batumi is about 280 km in a straight line.
    const toBatumi = distanceKm(tbilisi, { latitudeE6: 41_641_800, longitudeE6: 41_636_700 });
    expect(toBatumi).toBeGreaterThan(260);
    expect(toBatumi).toBeLessThan(300);
  });

  it("sorts listings with a map point nearest first and keeps the rest, in order, after them", () => {
    const items = [
      { id: "a", mapPoint: null },
      { id: "b", mapPoint: { latitudeE6: 41_641_800, longitudeE6: 41_636_700 } },
      { id: "c", mapPoint: { latitudeE6: 41_716_000, longitudeE6: 44_828_000 } },
      { id: "d", mapPoint: undefined },
    ];
    const sorted = sortByDistance(items, tbilisi);
    expect(sorted.map(item => item.id)).toEqual(["c", "b", "a", "d"]);
    expect(sorted[0]!.distanceKm).toBeLessThan(1);
    expect(sorted[2]!.distanceKm).toBeNull();
  });
});
