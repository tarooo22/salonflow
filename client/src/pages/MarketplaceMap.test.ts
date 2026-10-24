import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { marketplaceMapMarkerPosition } from "./MarketplaceMap";

describe("Marketplace map marker positioning", () => {
  it("centers a single owner-shared point without requiring a map SDK", () => {
    expect(marketplaceMapMarkerPosition({ latitudeE6: 41715100, longitudeE6: 44827100 }, [{ latitudeE6: 41715100, longitudeE6: 44827100 }])).toEqual({ left: "50%", top: "50%" });
  });

  it("keeps multiple confirmed markers inside the visual map surface", () => {
    const points = [{ latitudeE6: 41700000, longitudeE6: 44800000 }, { latitudeE6: 41800000, longitudeE6: 44900000 }];
    expect(marketplaceMapMarkerPosition(points[0], points)).toEqual({ left: "10%", top: "90%" });
    expect(marketplaceMapMarkerPosition(points[1], points)).toEqual({ left: "90%", top: "10%" });
  });
});

describe("Marketplace map page shell", () => {
  const source = readFileSync(new URL("./MarketplaceMap.tsx", import.meta.url), "utf8");

  it("uses the catalog world, shared salon cards and Chawera meta, keeping URL-synced filters and the Google Maps link", () => {
    expect(source).toContain('<div className="cw">');
    expect(source).toContain('<main id="main-content">');
    expect(source).toContain("BRAND.name");
    expect(source).not.toContain("SalonFlow");
    expect(source).toContain("<SalonCard ");
    expect(source).toContain('marketplaceDiscoveryHref("/salons/map", nextCategory, searchDraft, area)');
    expect(source).toContain("https://www.google.com/maps/search/?api=1&query=");
  });
});
