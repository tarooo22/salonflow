import { describe, expect, it } from "vitest";
import { addBooking, parseBookings, parseSaved, toggleSlug, type DeviceBooking } from "./deviceSaved";

const booking = (patch: Partial<DeviceBooking> = {}): DeviceBooking => ({ slug: "studio-vake", salonName: "ვაკის სტუდია", services: ["თმის შეჭრა"], startsAt: "2026-11-02T08:00:00.000Z", ...patch });

describe("deviceSaved", () => {
  it("survives missing or corrupt storage", () => {
    expect(parseSaved(null)).toEqual([]);
    expect(parseSaved("{oops")).toEqual([]);
    expect(parseSaved('{"a":1}')).toEqual([]);
    expect(parseBookings("nope")).toEqual([]);
  });

  it("drops malformed entries and deduplicates slugs", () => {
    expect(parseSaved('["a",3,"a","b",""]')).toEqual(["a", "b"]);
    expect(parseBookings(JSON.stringify([booking(), { slug: "x" }, booking({ startsAt: "not a date" })]))).toEqual([booking()]);
  });

  it("toggles a slug on and off", () => {
    expect(toggleSlug(["a"], "b")).toEqual(["b", "a"]);
    expect(toggleSlug(["b", "a"], "b")).toEqual(["a"]);
  });

  it("replaces a booking with the same salon and start, newest first, capped", () => {
    const first = booking();
    const other = booking({ slug: "other", startsAt: "2026-11-03T08:00:00.000Z" });
    expect(addBooking([first], other)).toEqual([other, first]);
    expect(addBooking([first, other], booking({ services: ["ფერი"] }))).toEqual([booking({ services: ["ფერი"] }), other]);
    const many = Array.from({ length: 40 }, (_, index) => booking({ startsAt: new Date(Date.UTC(2026, 10, 1, index)).toISOString() }));
    expect(many.reduce<DeviceBooking[]>((list, item) => addBooking(list, item), [])).toHaveLength(30);
  });

  it("never stores manage tokens: a booking has only salon, services and time", () => {
    expect(Object.keys(booking()).sort()).toEqual(["salonName", "services", "slug", "startsAt"]);
  });
});
