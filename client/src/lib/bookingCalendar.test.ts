import { describe, expect, it } from "vitest";
import { createBookingCalendarIcs } from "./bookingCalendar";

describe("booking calendar export", () => {
  const event = {
    startsAt: new Date("2026-08-20T08:30:00.000Z"),
    endsAt: new Date("2026-08-20T09:15:00.000Z"),
    title: "თმის შეჭრა — SalonFlow",
    location: "ვაკე, თბილისი",
    description: "ჯავშანი ელოდება სალონის დადასტურებას.",
  };

  it("creates a standards-compatible tentative appointment using only provided visit details", () => {
    const ics = createBookingCalendarIcs(event);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART:20260820T083000Z");
    expect(ics).toContain("DTEND:20260820T091500Z");
    expect(ics).toContain("SUMMARY:თმის შეჭრა — SalonFlow");
    expect(ics).toContain("STATUS:TENTATIVE");
    expect(ics).toContain("END:VCALENDAR");
  });
});
