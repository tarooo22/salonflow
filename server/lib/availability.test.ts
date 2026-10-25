// These suites cover enforced opening hours (off by default until the backfill; see fetchOpeningHours).
process.env.ENFORCE_OPENING_HOURS = "true";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { describe, expect, it } from "vitest";
import { MAX_APPOINTMENT_BUFFER_MINUTES, appointmentsNearWindow, fetchOpeningHours, fitsOpeningHours, fitsWorkingHours, generateAvailableSlots, isSlotAvailable } from "./availability";
import { locationOpeningHours, scheduleExceptions, workingHourRules } from "../../drizzle/schema";

const at = (time: string) => new Date(`2026-08-12T${time}:00.000Z`);

describe("server-side availability", () => {
  it("rejects service buffers that overlap an existing appointment", () => {
    expect(isSlotAvailable(at("10:00"), at("11:00"), [{ startsAt: at("09:30"), endsAt: at("10:00") }], 15, 0)).toBe(false);
    expect(isSlotAvailable(at("10:15"), at("11:15"), [{ startsAt: at("09:30"), endsAt: at("10:00") }], 15, 0)).toBe(true);
  });

  it("generates only slots inside opening hours and outside occupied time", () => {
    const slots = generateAvailableSlots({
      openingStart: at("09:00"),
      openingEnd: at("11:00"),
      durationMinutes: 60,
      slotIntervalMinutes: 30,
      busyIntervals: [{ startsAt: at("10:00"), endsAt: at("11:00") }],
    });
    expect(slots.map(slot => slot.startsAt.toISOString().slice(11, 16))).toEqual(["09:00"]);
  });
});

describe("shared window and opening-hours rules", () => {
  it("bounds an appointments read to the window widened by the largest possible buffer", () => {
    const query = new MySqlDialect().sqlToQuery(appointmentsNearWindow(at("10:00"), at("11:00")) as never);
    expect(query.sql).toBe("(`appointments`.`startsAt` < ? and `appointments`.`endsAt` > ?)");
    expect(MAX_APPOINTMENT_BUFFER_MINUTES).toBe(240); // matches the service buffer cap in shared/validation.ts
    expect(query.params).toEqual(["2026-08-12 15:00:00.000", "2026-08-12 06:00:00.000"]); // 11:00 + 4 h, 10:00 − 4 h (UTC)
  });

  it("applies opening hours only when on record, counting the after-buffer against closing", () => {
    const atTime = (time: string) => at(time.slice(0, 5));
    const opening = [{ weekday: 2, startLocalTime: "10:00:00", endLocalTime: "14:00:00" }];
    expect(fitsOpeningHours([], 2, atTime, at("08:00"), at("09:00"))).toBe(true);
    expect(fitsOpeningHours(opening, 2, atTime, at("13:00"), at("14:00"))).toBe(true);
    expect(fitsOpeningHours(opening, 2, atTime, at("13:00"), at("14:15"))).toBe(false);
    expect(fitsOpeningHours(opening, 2, atTime, at("09:30"), at("10:30"))).toBe(false);
    expect(fitsOpeningHours(opening, 3, atTime, at("11:00"), at("12:00"))).toBe(false);
  });
});

describe("staff-side working-hours check", () => {
  // Friday 2026-08-14 (schema weekday 4), Tbilisi UTC+4.
  const utc = (time: string) => new Date(`2026-08-14T${time}:00.000Z`);
  const location = { id: "location_2026_abcdefgh", organizationId: "organization_2026_abcd", timezone: "Asia/Tbilisi" };
  const fakeDb = (rows: { hours?: unknown[]; extensions?: unknown[]; opening?: unknown[] }) => {
    const answers = new Map<unknown, unknown[]>([[workingHourRules, rows.hours ?? []], [scheduleExceptions, rows.extensions ?? []], [locationOpeningHours, rows.opening ?? []]]);
    return { select: () => ({ from: (table: unknown) => ({ where: () => Promise.resolve(answers.get(table) ?? []) }) }) } as never;
  };
  const hours = [{ startLocalTime: "10:00:00", endLocalTime: "19:00:00" }];

  it("counts the after-buffer against the end of the working day", async () => {
    expect(await fitsWorkingHours(fakeDb({ hours }), location, "staff_1", utc("13:45"), utc("14:45"), 15)).toBe(true);
    expect(await fitsWorkingHours(fakeDb({ hours }), location, "staff_1", utc("13:45"), utc("14:45"), 30)).toBe(false);
    expect(await fitsWorkingHours(fakeDb({ hours }), location, "staff_1", utc("05:45"), utc("06:45"), 0)).toBe(false);
  });

  it("applies location opening hours only when the location has them on record", async () => {
    const opening = [{ weekday: 4, startLocalTime: "10:00:00", endLocalTime: "18:00:00" }];
    expect(await fitsWorkingHours(fakeDb({ hours, opening }), location, "staff_1", utc("13:30"), utc("14:30"), 0)).toBe(false);
    expect(await fitsWorkingHours(fakeDb({ hours, opening: [{ ...opening[0], weekday: 3 }] }), location, "staff_1", utc("08:00"), utc("09:00"), 0)).toBe(false);
    expect(await fitsWorkingHours(fakeDb({ hours }), location, "staff_1", utc("13:30"), utc("14:30"), 0)).toBe(true);
  });

  it("accepts time covered by the staff member's extended-working-time exception", async () => {
    const extensions = [{ locationId: null, startsAt: utc("15:00"), endsAt: utc("17:00") }];
    expect(await fitsWorkingHours(fakeDb({ hours, extensions }), location, "staff_1", utc("15:00"), utc("16:00"), 0)).toBe(true);
    expect(await fitsWorkingHours(fakeDb({ hours, extensions: [{ ...extensions[0], locationId: "location_other_2026ab" }] }), location, "staff_1", utc("15:00"), utc("16:00"), 0)).toBe(false);
  });
});

describe("opening-hours switch", () => {
  it("reads no opening hours unless ENFORCE_OPENING_HOURS is true", async () => {
    const previous = process.env.ENFORCE_OPENING_HOURS;
    process.env.ENFORCE_OPENING_HOURS = "false";
    const select = () => { throw new Error("should not query"); };
    await expect(fetchOpeningHours({ select } as never, "loc")).resolves.toEqual([]);
    process.env.ENFORCE_OPENING_HOURS = previous;
  });
});
