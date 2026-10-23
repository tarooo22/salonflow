import { describe, expect, it } from "vitest";
import { canUseCalendarSpecialistFilter, placeTickets } from "./Calendar";

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
