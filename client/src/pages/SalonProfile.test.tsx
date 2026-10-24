import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MAX_SELECTED_SERVICES } from "@shared/validation";
import { bookingHref, localWeekdayMinutes, openStatus } from "./SalonProfile";

const source = readFileSync(new URL("./SalonProfile.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../components/catalog/profile.css", import.meta.url), "utf8");

describe("SalonProfile catalog world", () => {
  it("renders inside the cw catalog chrome with a skip target", () => {
    expect(source).toContain('<div className="cw">');
    expect(source).toContain("<CatalogHeader />");
    expect(source).toContain("<CatalogFooter />");
    expect(source).toContain('<main id="main-content">');
    expect(source).not.toContain("sf-public-page");
    expect(source).not.toContain("--sf-");
  });

  it("uses the brand constant for the page title instead of the retired name", () => {
    expect(source).toContain("${BRAND.name}");
    expect(source).not.toContain("| SalonFlow");
  });
});

describe("SalonProfile booking handoff", () => {
  it("links the stamp button to the booking flow with comma-separated service IDs", () => {
    expect(bookingHref("gldani-beauty", [])).toBe("/book/gldani-beauty");
    expect(bookingHref("gldani-beauty", ["a1", "b2"])).toBe("/book/gldani-beauty?services=a1,b2");
    expect(bookingHref("gldani-beauty", ["x_y-Z"])).toBe("/book/gldani-beauty?services=x_y-Z");
    expect(source).toContain("დაჯავშნა");
    expect(source).toContain("დროის არჩევა");
    expect(source).toContain("აირჩიე სერვისი");
  });

  it("only offers booking when the existing booking-enabled gate allows it, and says so otherwise", () => {
    expect(source).toContain("const bookable = salon.bookingEnabled");
    expect(source).toContain("{!bookable ?");
    expect(source).toContain("{bookable ? <div className=\"cwp-bar\"");
    expect(source).toContain("დრო საბოლოოდ მოწმდება ჩაწერის დადასტურებისას");
    expect(source).not.toContain("billingCode");
  });

  it("caps the selection at what the multi-service booking endpoint accepts", () => {
    expect(MAX_SELECTED_SERVICES).toBe(6);
    expect(source).toContain("disabled={blocked}");
  });

  it("selects services with native checkbox semantics and a labelled search", () => {
    expect(source).toContain('type="checkbox"');
    expect(source).toContain("<label");
    expect(source).toContain('type="search"');
    expect(source).toContain("aria-expanded={open}");
    expect(source).toContain("aria-controls={panelId}");
    expect(source).toContain('role="tablist"');
    expect(source).toContain('role="tab"');
    expect(source).toContain('role="tabpanel"');
    expect(source).toContain("ArrowRight");
  });
});

describe("SalonProfile truthfulness", () => {
  it("shows only approved public data and invents no ratings, counts or discounts", () => {
    expect(source).toContain("experienceYears");
    expect(source).toContain("კლიენტის ცალკე თანხმობით");
    expect(source).toContain("გამოქვეყნებამდე იგი გადის მოდერაციას");
    expect(source).toContain("{feedback.length");
    expect(source).not.toMatch(/discount|oldPrice|originalPrice/i);
  });

  it("surfaces the verified mark and categories only through the approved marketplace listing query", () => {
    expect(source).toContain("marketplace.listingBySlug");
    expect(source).toContain("approved={Boolean(marketplace.data)}");
    expect(source).toContain("დამტკიცებული პროფილი");
    expect(source).toContain("verticalsForListing(categories)");
    expect(source).toContain('href="/salons"');
  });

  it("never renders an empty section: no dashed placeholder boxes and no uppercase", () => {
    expect(source).not.toContain("cwp-dashed");
    expect(source).not.toContain("soonStamp");
    expect(styles).not.toMatch(/uppercase|Martian/i);
  });

  it("keeps the vertical colour scoped to regions via custom properties", () => {
    expect(styles).toContain("--v-bg");
    expect(styles).toContain("prefers-reduced-motion: reduce");
    expect(styles.replace(/mask-image:[^;]*;/g, "")).not.toMatch(/linear-gradient|radial-gradient/); // the tab strip edge-fade is a mask, not a background
  });
});

describe("openStatus", () => {
  // 2026-10-19 is a Monday. Asia/Tbilisi is UTC+4 all year.
  const hours = [
    { weekday: 0, startLocalTime: "10:00:00", endLocalTime: "19:00:00" },
    { weekday: 1, startLocalTime: "10:00", endLocalTime: "19:00" },
    { weekday: 5, startLocalTime: "11:00", endLocalTime: "16:00" },
  ];
  const zone = "Asia/Tbilisi";
  const at = (iso: string) => new Date(iso);

  it("reads the weekday and time in the location timezone, not the viewer's", () => {
    expect(localWeekdayMinutes(at("2026-10-19T06:30:00Z"), zone)).toEqual({ weekday: 0, minutes: 10 * 60 + 30 });
    expect(localWeekdayMinutes(at("2026-10-19T21:00:00Z"), zone)).toEqual({ weekday: 1, minutes: 60 });
    expect(localWeekdayMinutes(at("2026-10-19T00:00:00Z"), "Not/AZone")).toBeNull();
  });

  it("is open inside the window and reports when it closes", () => {
    expect(openStatus(hours, zone, at("2026-10-19T06:30:00Z"))).toEqual({ open: true, closesAt: "19:00" });
  });

  it("is closed at the closing minute and names the next opening", () => {
    expect(openStatus(hours, zone, at("2026-10-19T15:00:00Z"))).toEqual({ open: false, next: { daysAhead: 1, weekday: 1, time: "10:00" } });
  });

  it("looks ahead to later today before the shop opens", () => {
    expect(openStatus(hours, zone, at("2026-10-19T04:00:00Z"))).toEqual({ open: false, next: { daysAhead: 0, weekday: 0, time: "10:00" } });
  });

  it("skips days without hours and wraps over the week", () => {
    expect(openStatus(hours, zone, at("2026-10-21T08:00:00Z"))).toEqual({ open: false, next: { daysAhead: 3, weekday: 5, time: "11:00" } });
  });

  it("returns null when the data cannot answer", () => {
    expect(openStatus([], zone, at("2026-10-19T06:30:00Z"))).toBeNull();
    expect(openStatus(hours, "", at("2026-10-19T06:30:00Z"))).toBeNull();
  });
});

describe("SalonProfile products", () => {
  it("lists the location's products only when there are some", () => {
    expect(source).toContain("trpc.products.byLocation.useQuery");
    expect(source).toContain("products.length ? <section");
    expect(source).toContain("tabProducts");
    expect(source).toContain("<ProductGrid items={products} />");
  });
});
