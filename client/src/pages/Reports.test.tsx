import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const query = (data: unknown) => ({ data, isLoading: false, isError: false, isFetching: false, refetch: vi.fn() });
const state = vi.hoisted(() => ({ summary: undefined as unknown, search: "" }));

vi.mock("wouter", () => ({ useSearch: () => state.search, useLocation: () => ["/app/reports", vi.fn()] }));
vi.mock("@/components/ui/collapsible", () => ({ Collapsible: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CollapsibleTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>, CollapsibleContent: ({ children }: { children: React.ReactNode }) => (state.search.includes("details=1") ? <div>{children}</div> : null) }));
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/reports/ReportsCharts", () => ({ RevenueTrendChart: () => <div>trend-chart</div>, CommissionDistributionChart: () => <div /> }));
vi.mock("@/components/reports/AdvancedAnalyticsPanels", () => ({ BookingForecastPanel: () => <div />, PeakHourHeatmapPanel: () => <div />, RetentionCohortPanel: () => <div />, WeekComparisonPanel: () => <div /> }));
vi.mock("@/components/reports/FeedbackConsentInsights", () => ({ FeedbackConsentInsights: () => <div /> }));
vi.mock("@/components/workspace/SavedViewMenu", () => ({ SavedViewMenu: () => <span /> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({}),
    organizations: {
      listMine: { useQuery: () => query([{ organization: { id: "organization_001" }, membership: { role: "OWNER" } }]) },
      listLocations: { useQuery: () => query([{ id: "location_001", name: "ვაკე", timezone: "Asia/Tbilisi" }]) },
    },
    staff: { list: { useQuery: () => query([]) } },
    services: { list: { useQuery: () => query([]) } },
    finance: {
      listCommissionRules: { useQuery: () => query([]) },
      listExpenses: { useQuery: () => query([]) },
      createCommissionRule: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      deleteCommissionRule: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      runCommissionBackfill: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      createExpense: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    reporting: {
      revenueSummary: { useQuery: () => query({ summary: state.summary, paymentMethods: {} }) },
      analytics: { useQuery: () => query({ revenueTrend: [{ date: "2026-10-20", revenueTetri: 5000 }], staffMetrics: [], serviceMix: [], weekComparison: {}, bookingForecast: {}, retentionCohorts: [], peakHourHeatmap: {}, expensesTetri: 0, bookedRevenueTetri: 0, expensePressureBasisPoints: null }) },
      feedbackInsights: { useQuery: () => query(undefined) },
      bookingHistory: { useQuery: () => query({ items: [], total: 0 }) },
      commissionSummary: { useQuery: () => query({ specialists: [], totalTetri: 0, paidTetri: 0 }) },
      exportCsv: { useQuery: () => query(undefined) },
    },
  },
}));

import Reports, { reportHasData } from "./Reports";

const summary = (overrides: Record<string, number> = {}) => ({ collectedRevenueTetri: 12000, unpaidBalanceTetri: 0, expensesTetri: 0, appointmentCount: 4, completedAppointments: 3, averageTicketTetri: 4000, ...overrides });

describe("Reports progressive disclosure", () => {
  beforeEach(() => { state.search = ""; state.summary = summary(); });

  it("shows the hint, three tiles and one chart, with details collapsed", () => {
    const markup = renderToStaticMarkup(<Reports />);
    expect(markup).toContain("შემოსავალი და ჯავშნები არჩეული პერიოდისთვის.");
    expect(markup).toContain("შემოსავალი");
    expect(markup).toContain("ჯავშნები");
    expect(markup).toContain("საშუალო ჩეკი");
    expect(markup).toContain("trend-chart");
    expect(markup).toContain("დეტალური ანალიზი");
    expect(markup).not.toContain("ექსპორტი");
    expect(markup).not.toContain("გადახდის მეთოდები");
  });

  it("opens the details from ?details=1", () => {
    state.search = "details=1";
    const markup = renderToStaticMarkup(<Reports />);
    expect(markup).toContain("გადახდის მეთოდები");
    expect(markup).toContain("ექსპორტი");
  });

  it("skips the average ticket tile when there is no average", () => {
    state.summary = summary({ averageTicketTetri: 0 });
    expect(renderToStaticMarkup(<Reports />)).not.toContain("საშუალო ჩეკი");
  });

  it("teaches what happens before the first completed visit", () => {
    state.summary = summary({ completedAppointments: 0, collectedRevenueTetri: 0, appointmentCount: 0, averageTicketTetri: 0 });
    const markup = renderToStaticMarkup(<Reports />);
    expect(markup).toContain("ანგარიში პირველი დასრულებული ვიზიტის შემდეგ გამოჩნდება.");
    expect(markup).toContain("კალენდრის გახსნა");
    expect(markup).not.toContain("trend-chart");
  });

  it("treats completed visits or collected money as data", () => {
    expect(reportHasData(undefined)).toBe(false);
    expect(reportHasData({ completedAppointments: 0, collectedRevenueTetri: 0 })).toBe(false);
    expect(reportHasData({ completedAppointments: 1, collectedRevenueTetri: 0 })).toBe(true);
    expect(reportHasData({ completedAppointments: 0, collectedRevenueTetri: 500 })).toBe(true);
  });
});
