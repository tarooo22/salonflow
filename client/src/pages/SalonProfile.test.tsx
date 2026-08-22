import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./SalonProfile.tsx", import.meta.url), "utf8");

describe("SalonProfile booking handoff", () => {
  it("renders a localized booking path only behind the existing booking-enabled gate", () => {
    expect(source).toContain("bookingPathLabels");
    expect(source).toContain("ჩაწერის გზა");
    expect(source).toContain("{salon.bookingEnabled ? <div");
    expect(source).toContain("დაცული მოთხოვნა");
  });

  it("uses the shared Salon House presentation while retaining owner-approved public profile data", () => {
    expect(source).toContain("sf-salon-media-frame");
    expect(source).toContain("sf-salon-panel");
    expect(source).toContain("experienceYears");
    expect(source).toContain("კლიენტის ცალკე თანხმობით");
    expect(source).toContain("მფლობელის ან მენეჯერის მიერ დამტკიცებული");
  });

  it("surfaces Marketplace categories only through the approved public listing query", () => {
    expect(source).toContain("marketplace.listingBySlug");
    expect(source).toContain("marketplaceListing?.categories.length");
  });
});
