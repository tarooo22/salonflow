import { describe, expect, it } from "vitest";
import { boardScrollTargetMinute, canUseCalendarSpecialistFilter, isOutsideHoursError, nextQuarterHour, openingStartMinute, placeTickets } from "./Calendar";

describe("Calendar specialist filter access", () => {
  it("shows the team filter to owners and managers", () => {
    expect(canUseCalendarSpecialistFilter("OWNER")).toBe(true);
    expect(canUseCalendarSpecialistFilter("MANAGER")).toBe(true);
  });

  it("does not expose a cross-specialist filter to receptionists or staff", () => {
    expect(canUseCalendarSpecialistFilter("RECEPTIONIST")).toBe(false);
    expect(canUseCalendarSpecialistFilter("STAFF")).toBe(false);
    expect(canUseCalendarSpecialistFilter()).toBe(false);
  });
});

describe("Calendar ticket lanes", () => {
  const item = (id: string, start: number, end: number) => ({ appointment: { id } as never, start, end });

  it("puts overlapping bookings side by side and lets later ones reuse the full width", () => {
    const placed = placeTickets([item("a", 600, 660), item("b", 630, 690), item("c", 720, 780)]);
    const byId = Object.fromEntries(placed.map(ticket => [(ticket.appointment as { id: string }).id, ticket]));
    expect([byId.a.lane, byId.a.lanes]).toEqual([0, 2]);
    expect([byId.b.lane, byId.b.lanes]).toEqual([1, 2]);
    expect([byId.c.lane, byId.c.lanes]).toEqual([0, 1]);
  });
});

describe("Calendar opening hours", () => {
  const hours = [{ weekday: 0, opensAt: "10:00:00" }, { weekday: 5, opensAt: "11:30:00" }];

  it("starts the board at the earliest opening time of the shown weekdays", () => {
    expect(openingStartMinute(hours, [5])).toBe(11 * 60 + 30);
    expect(openingStartMinute(hours, [0, 1, 2, 3, 4, 5, 6])).toBe(10 * 60);
  });

  it("falls back to 09:00 when no opening hours are known for the shown days", () => {
    expect(openingStartMinute(hours, [6])).toBe(9 * 60);
    expect(openingStartMinute(undefined, [0])).toBe(9 * 60);
  });
});

describe("Calendar reschedule hours override", () => {
  it("offers the override only for the server's outside-hours rejection", () => {
    expect(isOutsideHoursError({ data: { code: "PRECONDITION_FAILED" } })).toBe(true);
    expect(isOutsideHoursError({ data: { code: "CONFLICT" } })).toBe(false);
    expect(isOutsideHoursError({ data: null })).toBe(false);
    expect(isOutsideHoursError(null)).toBe(false);
  });
});

describe("Calendar board scroll target", () => {
  const base = { isToday: true, nowMinute: 14 * 60, workStartMinute: 10 * 60 };

  it("opens 30 minutes before the first booking, even when now is later", () => {
    expect(boardScrollTargetMinute({ ...base, earliestBooking: 10 * 60 + 15 })).toBe(9 * 60 + 45);
  });

  it("without bookings opens an hour before now, but only today and inside hours", () => {
    expect(boardScrollTargetMinute({ ...base, earliestBooking: Infinity })).toBe(13 * 60);
    expect(boardScrollTargetMinute({ ...base, earliestBooking: Infinity, isToday: false })).toBe(9 * 60 + 45);
    expect(boardScrollTargetMinute({ ...base, earliestBooking: Infinity, nowMinute: 8 * 60 })).toBe(9 * 60 + 45);
    expect(boardScrollTargetMinute({ ...base, earliestBooking: Infinity, nowMinute: 22 * 60 })).toBe(9 * 60 + 45);
  });
});

describe("Calendar ?create=1 preset", () => {
  it("rounds up to the next quarter hour and never returns the current instant", () => {
    expect(nextQuarterHour(new Date("2026-10-25T10:07:00.000Z")).toISOString()).toBe("2026-10-25T10:15:00.000Z");
    expect(nextQuarterHour(new Date("2026-10-25T10:15:00.000Z")).toISOString()).toBe("2026-10-25T10:30:00.000Z");
  });
});
