import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BookingForecastPanel, PeakHourHeatmapPanel, RetentionCohortPanel, WeekComparisonPanel } from "./AdvancedAnalyticsPanels";

describe("advanced report analytics panels", () => {
  it("renders text-backed weekly trends, retention cohorts, accessible heatmap cells, and forecast limitation", () => {
    const markup = renderToStaticMarkup(<><WeekComparisonPanel data={{ current: { bookingCount: 4, bookedRevenueTetri: 23_000, completedCount: 2 }, previous: { bookingCount: 3, bookedRevenueTetri: 15_000, completedCount: 1 }, bookedRevenueDeltaTetri: 8_000, bookingCountDelta: 1, currentWeekStartDate: "2026-08-17", currentWeekEndDate: "2026-08-23" }} /><RetentionCohortPanel data={[{ cohortMonth: "2026-06", clients: 2, returningClients: 1, retentionBasisPoints: 5_000 }]} /><PeakHourHeatmapPanel data={{ hours: [12], maxBookingCount: 2, rows: [{ weekday: 1, counts: [2] }] }} /><BookingForecastPanel data={{ scheduledTetri: 12_000, expectedCollectionTetri: 8_000, days: [{ date: "2026-08-18", appointmentCount: 2, scheduledTetri: 12_000, expectedCollectionTetri: 8_000 }] }} /></>);
    expect(markup).toContain("ეს კვირა vs წინა");
    expect(markup).toContain("Retention");
    expect(markup).toContain("ორ, 12:00 — 2 ჯავშანი");
    expect(markup).toContain("არ არის გარანტირებული cash collection");
  });
});
