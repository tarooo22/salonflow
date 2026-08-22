import { describe, expect, it } from "vitest";
import { canTransitionMarketplaceListing, isPromotionVisible, marketplaceDirectoryPublicListing, marketplacePromotionLifecycleStatus, marketplacePublicMapPoint, normalizeMarketplaceGeocodeCandidates } from "./marketplace";

describe("Marketplace governance helpers", () => {
  it("allows owners to submit only editable listing states", () => {
    expect(canTransitionMarketplaceListing("DRAFT", "SUBMITTED", false)).toBe(true);
    expect(canTransitionMarketplaceListing("REJECTED", "SUBMITTED", false)).toBe(true);
    expect(canTransitionMarketplaceListing("APPROVED", "SUBMITTED", false)).toBe(false);
    expect(canTransitionMarketplaceListing("DRAFT", "APPROVED", false)).toBe(false);
  });

  it("reserves approval, hiding and rejection for a platform admin", () => {
    expect(canTransitionMarketplaceListing("SUBMITTED", "APPROVED", true)).toBe(true);
    expect(canTransitionMarketplaceListing("APPROVED", "HIDDEN", true)).toBe(true);
    expect(canTransitionMarketplaceListing("SUBMITTED", "SUBMITTED", true)).toBe(false);
  });

  it("shows promoted placement only while its active schedule contains the current time", () => {
    const now = new Date("2026-08-22T10:00:00.000Z");
    expect(isPromotionVisible({ status: "ACTIVE", startsAt: new Date("2026-08-22T09:00:00.000Z"), endsAt: new Date("2026-08-22T11:00:00.000Z") }, now)).toBe(true);
    expect(isPromotionVisible({ status: "SCHEDULED", startsAt: new Date("2026-08-22T09:00:00.000Z"), endsAt: new Date("2026-08-22T11:00:00.000Z") }, now)).toBe(true);
    expect(isPromotionVisible({ status: "SCHEDULED", startsAt: new Date("2026-08-22T11:00:00.000Z"), endsAt: new Date("2026-08-22T12:00:00.000Z") }, now)).toBe(false);
    expect(isPromotionVisible({ status: "ACTIVE", startsAt: new Date("2026-08-22T08:00:00.000Z"), endsAt: new Date("2026-08-22T10:00:00.000Z") }, now)).toBe(false);
  });

  it("derives scheduled, active and expired promotion visibility from the time range without a client-side payment state", () => {
    const now = new Date("2026-08-22T10:00:00.000Z");
    expect(marketplacePromotionLifecycleStatus({ status: "SCHEDULED", startsAt: new Date("2026-08-22T11:00:00.000Z"), endsAt: new Date("2026-08-22T12:00:00.000Z") }, now)).toBe("SCHEDULED");
    expect(marketplacePromotionLifecycleStatus({ status: "SCHEDULED", startsAt: new Date("2026-08-22T09:00:00.000Z"), endsAt: new Date("2026-08-22T12:00:00.000Z") }, now)).toBe("ACTIVE");
    expect(marketplacePromotionLifecycleStatus({ status: "ACTIVE", startsAt: new Date("2026-08-22T08:00:00.000Z"), endsAt: new Date("2026-08-22T09:00:00.000Z") }, now)).toBe("EXPIRED");
    expect(marketplacePromotionLifecycleStatus({ status: "CANCELLED", startsAt: new Date("2026-08-22T08:00:00.000Z"), endsAt: new Date("2026-08-22T12:00:00.000Z") }, now)).toBe("CANCELLED");
  });

  it("never returns private coordinates without explicit map visibility", () => {
    expect(marketplacePublicMapPoint({ mapVisibility: false, latitudeE6: 41450000, longitudeE6: 44790000 })).toBeNull();
    expect(marketplacePublicMapPoint({ mapVisibility: true, latitudeE6: null, longitudeE6: 44790000 })).toBeNull();
    expect(marketplacePublicMapPoint({ mapVisibility: true, latitudeE6: 41450000, longitudeE6: 44790000 })).toEqual({ latitudeE6: 41450000, longitudeE6: 44790000 });
  });

  it("keeps address and coordinates out of the normal directory projection", () => {
    const projected = marketplaceDirectoryPublicListing({ locationId: "location_123456", name: "ტესტ სალონი", address: "Private address", latitudeE6: 41450000, longitudeE6: 44790000, mapVisibility: true });
    expect(projected).toEqual({ locationId: "location_123456", name: "ტესტ სალონი" });
    expect(projected).not.toHaveProperty("address");
    expect(projected).not.toHaveProperty("latitudeE6");
    expect(projected).not.toHaveProperty("mapPoint");
  });

  it("returns a map point only in the deliberate map projection and only with consent", () => {
    const denied = marketplaceDirectoryPublicListing({ locationId: "location_123456", address: "Private", latitudeE6: 41450000, longitudeE6: 44790000, mapVisibility: false }, true);
    const approved = marketplaceDirectoryPublicListing({ locationId: "location_123456", address: "Private", latitudeE6: 41450000, longitudeE6: 44790000, mapVisibility: true }, true);
    expect(denied.mapPoint).toBeNull();
    expect(approved.mapPoint).toEqual({ latitudeE6: 41450000, longitudeE6: 44790000 });
  });

  it("normalizes bounded geocode candidates and ignores malformed coordinate data", () => {
    const candidates = normalizeMarketplaceGeocodeCandidates({ status: "OK", results: [{ place_id: "place-1", formatted_address: "თბილისი", address_components: [], types: [], geometry: { location: { lat: 41.7151, lng: 44.8271 }, location_type: "ROOFTOP", viewport: { northeast: { lat: 41.8, lng: 44.9 }, southwest: { lat: 41.6, lng: 44.7 } } } }, { place_id: "bad", formatted_address: "გარეთ", address_components: [], types: [], geometry: { location: { lat: 91, lng: 44.8 }, location_type: "APPROXIMATE", viewport: { northeast: { lat: 91, lng: 45 }, southwest: { lat: 90, lng: 44 } } } }] });
    expect(candidates).toEqual([{ placeId: "place-1", formattedAddress: "თბილისი", latitudeE6: 41715100, longitudeE6: 44827100 }]);
    expect(normalizeMarketplaceGeocodeCandidates({ status: "ZERO_RESULTS", results: [] })).toEqual([]);
  });
});
