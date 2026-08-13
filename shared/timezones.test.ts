import { describe, expect, it } from "vitest";
import { businessDayRange, dateKeyInTimeZone, zonedDateTimeToUtc } from "./timezones";

describe("IANA business-day helpers", () => {
  it("maps Asia/Tbilisi's local day back to the correct UTC bounds", () => {
    const range = businessDayRange("Asia/Tbilisi", new Date("2026-01-10T22:30:00.000Z"));

    expect(range.dateKey).toBe("2026-01-11");
    expect(range.startsAt.toISOString()).toBe("2026-01-10T20:00:00.000Z");
    expect(range.endsAt.toISOString()).toBe("2026-01-11T20:00:00.000Z");
  });

  it("keeps a local date stable when an IANA zone observes DST", () => {
    const start = zonedDateTimeToUtc({ year: 2026, month: 3, day: 29, hour: 0, minute: 0, second: 0 }, "Europe/Berlin");
    const range = businessDayRange("Europe/Berlin", start);

    expect(dateKeyInTimeZone(start, "Europe/Berlin")).toBe("2026-03-29");
    expect(range.endsAt.getTime() - range.startsAt.getTime()).toBe(23 * 60 * 60 * 1000);
  });
});
