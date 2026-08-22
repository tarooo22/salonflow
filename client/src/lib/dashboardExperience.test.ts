import { describe, expect, it } from "vitest";
import { dashboardMetricKeys, dashboardQuickActions, nextOperationalAppointment } from "./dashboardExperience";

describe("dashboard experience policy", () => {
  it("keeps owner-only setup actions out of non-owner primary actions", () => {
    expect(dashboardQuickActions("OWNER", true)).toEqual(["CALENDAR", "WALK_IN", "TEAM", "SERVICES", "BOOKING_LINK"]);
    expect(dashboardQuickActions("MANAGER", true)).toEqual(["CALENDAR", "WALK_IN", "CLIENTS"]);
    expect(dashboardQuickActions("RECEPTIONIST", false)).toEqual(["CALENDAR", "CLIENTS"]);
    expect(dashboardQuickActions("STAFF", true)).toEqual(["CALENDAR", "MY_PROFILE"]);
  });

  it("removes organization-wide financial metrics from the staff priority surface", () => {
    expect(dashboardMetricKeys("OWNER")).toEqual(["BOOKINGS", "PENDING", "SCHEDULED", "OUTSTANDING"]);
    expect(dashboardMetricKeys("STAFF")).toEqual(["BOOKINGS", "UP_NEXT"]);
  });

  it("prioritizes an in-service appointment before the next future appointment", () => {
    const now = new Date("2026-08-22T10:00:00.000Z").getTime();
    const result = nextOperationalAppointment([
      { status: "CONFIRMED", startsAt: new Date("2026-08-22T11:00:00.000Z"), endsAt: new Date("2026-08-22T12:00:00.000Z") },
      { status: "IN_SERVICE", startsAt: new Date("2026-08-22T09:30:00.000Z"), endsAt: new Date("2026-08-22T10:30:00.000Z") },
    ], now);
    expect(result).toMatchObject({ kind: "NOW", appointment: { status: "IN_SERVICE" } });
  });
});
