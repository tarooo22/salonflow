import { describe, expect, it } from "vitest";
import { expensePressureBasisPoints, summarizeAdvancedReportingAnalytics, summarizeReportingAnalytics } from "./reportingAnalytics";

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

  it("separates future remaining booking balance from already-paid amounts, excludes cancelled bookings, and groups local demand", () => {
    const reference = new Date("2026-08-17T08:00:00.000Z");
    const result = summarizeAdvancedReportingAnalytics({
      timeZone: "Asia/Tbilisi",
      reference,
      selectedRangeAppointments: [
        { id: "heat-1", staffProfileId: "s1", startsAt: new Date("2026-08-17T08:00:00.000Z"), status: "CONFIRMED", totalTetri: 5_000 },
        { id: "heat-cancelled", staffProfileId: "s1", startsAt: new Date("2026-08-17T08:00:00.000Z"), status: "CANCELLED", totalTetri: 9_000 },
      ],
      weeklyAppointments: [
        { id: "current", staffProfileId: "s1", startsAt: new Date("2026-08-17T08:00:00.000Z"), status: "CONFIRMED", totalTetri: 5_000 },
        { id: "previous", staffProfileId: "s1", startsAt: new Date("2026-08-10T08:00:00.000Z"), status: "COMPLETED", totalTetri: 3_000 },
      ],
      cohortAppointments: [
        { id: "cohort-first", staffProfileId: "s1", clientId: "client_1", startsAt: new Date("2026-06-02T08:00:00.000Z"), status: "COMPLETED", totalTetri: 2_000 },
        { id: "cohort-return", staffProfileId: "s1", clientId: "client_1", startsAt: new Date("2026-07-02T08:00:00.000Z"), status: "COMPLETED", totalTetri: 2_000 },
        { id: "cohort-single", staffProfileId: "s1", clientId: "client_2", startsAt: new Date("2026-06-04T08:00:00.000Z"), status: "COMPLETED", totalTetri: 2_000 },
      ],
      futureAppointments: [
        { id: "future-paid", staffProfileId: "s1", startsAt: new Date("2026-08-18T08:00:00.000Z"), status: "CONFIRMED", totalTetri: 10_000 },
        { id: "future-cancelled", staffProfileId: "s1", startsAt: new Date("2026-08-19T08:00:00.000Z"), status: "CANCELLED", totalTetri: 7_000 },
      ],
      futurePayments: [{ appointmentId: "future-paid", amountTetri: 4_000, refundedTetri: 0, status: "PAID" }],
    });
    expect(result.weekComparison.current.bookedRevenueTetri).toBe(5_000);
    expect(result.weekComparison.previous.bookedRevenueTetri).toBe(3_000);
    expect(result.retentionCohorts.find(cohort => cohort.cohortMonth === "2026-06")).toMatchObject({ clients: 2, returningClients: 1, retentionBasisPoints: 5_000 });
    expect(result.peakHourHeatmap.maxBookingCount).toBe(1);
    expect(result.bookingForecast.scheduledTetri).toBe(10_000);
    expect(result.bookingForecast.expectedCollectionTetri).toBe(6_000);
  });
});
