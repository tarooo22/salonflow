import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { verticalForCategory, verticalsForListing } from "@/lib/verticals";
import { isNewListing, listingMatchesVertical, newestListings } from "@/components/catalog/Tickets";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("catalog home", () => {
  it("leads with a working what/where search that goes to the catalog", () => {
    expect(source).toContain('role="search"');
    expect(source).toContain("რა გჭირდება?");
    expect(source).toContain("სად?");
    expect(source).toContain('marketplaceDiscoveryHref("/salons", undefined, what, where)');
  });

  it("lists only real approved listings and never fabricates businesses", () => {
    expect(source).toContain("trpc.marketplace.directory.useQuery");
    expect(source).toContain("პირველი გადამოწმებული ადგილები მალე გამოჩნდება.");
    expect(source).toContain("ფასიანი განთავსება");
  });

  it("marks dental, products and vacancies as coming soon", () => {
    expect(source).toContain("სტომატოლოგიური კლინიკები მალე დაემატება.");
    expect(source).toContain("პროდუქტები");
    expect(source).toContain("ვაკანსიები");
  });

  it("uses the shared brand constant instead of a hard-coded name", () => {
    expect(source).toContain("BRAND.name");
    expect(source).not.toContain("SalonFlow");
  });
});

describe("verticals", () => {
  it("maps category slugs to verticals", () => {
    expect(verticalForCategory("hair")).toBe("beauty");
    expect(verticalForCategory("cosmetology")).toBe("aesthetics");
    expect(verticalForCategory("dental-implants")).toBe("dental");
  });

  it("filters listings by vertical", () => {
    const listing = { categories: [{ slug: "hair" }, { slug: "cosmetology" }] };
    expect(verticalsForListing(listing.categories)).toEqual(["beauty", "aesthetics"]);
    expect(listingMatchesVertical(listing as never, "aesthetics")).toBe(true);
    expect(listingMatchesVertical(listing as never, "dental")).toBe(false);
    expect(listingMatchesVertical(listing as never, null)).toBe(true);
  });

  it("treats listings approved in the last 30 days as new, newest first", () => {
    const now = new Date("2026-10-19T12:00:00Z");
    const older = { approvedAt: "2026-09-01T00:00:00Z" };
    const recent = { approvedAt: "2026-10-10T00:00:00Z" };
    const newest = { approvedAt: "2026-10-18T00:00:00Z" };
    expect(isNewListing(older, now)).toBe(false);
    expect(isNewListing({ approvedAt: null }, now)).toBe(false);
    expect(newestListings([older, recent, newest], now)).toEqual([newest, recent]);
  });
});
