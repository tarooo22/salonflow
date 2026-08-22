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
