import { describe, expect, it } from "vitest";
import { expensePressureBasisPoints, summarizeReportingAnalytics } from "./reportingAnalytics";

describe("reporting analytics", () => {
  it("uses historical snapshots, excludes cancelled rows, and keeps integer tetri totals", () => {
    const result = summarizeReportingAnalytics([
      { id: "a1", staffProfileId: "s1", startsAt: new Date("2026-08-01T10:00:00.000Z"), status: "COMPLETED", totalTetri: 12_500 },
      { id: "a2", staffProfileId: "s1", startsAt: new Date("2026-08-01T12:00:00.000Z"), status: "CONFIRMED", totalTetri: 8_000 },
      { id: "a3", staffProfileId: "s2", startsAt: new Date("2026-08-02T10:00:00.000Z"), status: "CANCELLED", totalTetri: 7_000 },
    ], [
      { appointmentId: "a1", serviceNameSnapshot: "თმის შეჭრა", priceTetriSnapshot: 12_500 },
      { appointmentId: "a2", serviceNameSnapshot: "ფენი", priceTetriSnapshot: 8_000 },
      { appointmentId: "a3", serviceNameSnapshot: "მასაჟი", priceTetriSnapshot: 7_000 },
    ], [{ id: "s1", publicDisplayName: "ლელა" }, { id: "s2", publicDisplayName: "ნინო" }]);

    expect(result.revenueTrend).toEqual([{ date: "2026-08-01", revenueTetri: 20_500 }]);
    expect(result.serviceMix).toEqual([{ serviceName: "თმის შეჭრა", bookingCount: 1, revenueTetri: 12_500 }, { serviceName: "ფენი", bookingCount: 1, revenueTetri: 8_000 }]);
    expect(result.staffMetrics[0]).toMatchObject({ staffProfileId: "s1", completedAppointments: 1, bookingCount: 2, bookedRevenueTetri: 20_500 });
  });

  it("expresses expense pressure in integer basis points without currency float arithmetic", () => {
    expect(expensePressureBasisPoints(12_500, 50_000)).toBe(2_500);
    expect(expensePressureBasisPoints(1, 0)).toBeNull();
  });
});
