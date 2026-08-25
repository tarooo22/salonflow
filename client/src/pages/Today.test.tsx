import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const state = vi.hoisted(() => ({ role: "OWNER", dashboard: null as unknown, services: [] as unknown[], team: [] as unknown[], hours: [] as unknown[], trialEndsAt: null as Date | null }));
const mutation = { mutate: vi.fn(), isPending: false, error: null };
const organization = { id: "organization_001", name: "სილამაზის სივრცე" };
const query = (data: unknown) => ({ data, isLoading: false, isError: false, refetch: vi.fn() });

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/AppointmentQuickAction", () => ({ AppointmentQuickAction: () => <span>სტატუსის მოქმედება</span> }));
vi.mock("@/components/WalkInQuickEntry", () => ({ WalkInQuickEntry: () => <span>Walk-in ჩაწერა</span> }));
vi.mock("wouter", () => ({ Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ organizations: { listLocations: { invalidate: vi.fn() } }, appointments: { dashboard: { invalidate: vi.fn() }, listRange: { invalidate: vi.fn() } } }),
    organizations: {
      listMine: { useQuery: () => query([{ organization, membership: { id: "membership_001", role: state.role } }]) },
      listLocations: { useQuery: () => query([{ id: "location_001", name: "ვაკე", publicSlug: "vake-salon" }]) },
      createLocation: { useMutation: () => mutation },
    },
    appointments: { dashboard: { useQuery: () => query(state.dashboard) }, updateStatus: { useMutation: () => mutation } },
    billing: { ownerStatus: { useQuery: () => query({ activeEndsAt: new Date("2030-09-22T00:00:00.000Z"), trialEndsAt: state.trialEndsAt, organization: { billingCode: "SF-TEST" }, config: null, submission: null }) }, workspaceStatus: { useQuery: () => query({ locked: false, endsAt: new Date("2030-09-22T00:00:00.000Z") }) } },
    services: { list: { useQuery: () => query(state.services) } },
    staff: { list: { useQuery: () => query(state.team) }, listWorkingHours: { useQuery: () => query(state.hours) } },
  },
}));

import Today from "./Today";

const appointment = {
  id: "appointment_001",
  status: "CONFIRMED",
  startsAt: new Date("2030-08-22T11:00:00.000Z"),
  endsAt: new Date("2030-08-22T12:00:00.000Z"),
  client: { firstName: "ნინო", lastName: "ბერიძე" },
  services: [{ serviceNameSnapshot: "თმის შეჭრა" }],
  staff: { publicDisplayName: "ლელა" },
  payment: { state: "UNPAID" },
  totalTetri: 7_500,
};

describe("Today dashboard experience", () => {
  beforeEach(() => {
    state.role = "OWNER";
    state.services = [];
    state.team = [];
    state.hours = [];
    state.trialEndsAt = null;
    state.dashboard = { appointments: [appointment], balances: [{ appointmentId: appointment.id, totals: { balanceTetri: 7_500 } }], metrics: { scheduledTetri: 7_500, collectedTetri: 0, outstandingTetri: 7_500 }, counts: { PENDING: 2 }, location: { id: "location_001", name: "ვაკე", timezone: "Asia/Tbilisi" }, dateKey: "2030-08-22" };
  });

  it("gives an owner operational focus, attention queue and only incomplete readiness steps", () => {
    const markup = renderToStaticMarkup(<Today />);
    expect(markup).toContain("შემდეგი კლიენტი");
    expect(markup).toContain("ნინო ბერიძე");
    expect(markup).toContain("საჭირო ყურადღება");
    expect(markup).toContain("სალონის მზადყოფნა");
    expect(markup).toContain("სერვისები");
    expect(markup).toContain("Booking ბმული");
  });

  it("keeps the staff dashboard limited to own-day context and profile/calendar actions", () => {
    state.role = "STAFF";
    const markup = renderToStaticMarkup(<Today />);
    expect(markup).toContain("ჩემი დღე");
    expect(markup).toContain("ჩემი პროფილი");
    expect(markup).not.toContain("სალონის მზადყოფნა");
    expect(markup).not.toContain("დაგეგმილი თანხა");
    expect(markup).not.toContain("დარჩენილი ბალანსი");
  });

  it("warns the owner before an active trial expires and links to package activation", () => {
    state.trialEndsAt = new Date(Date.now() + 2 * 86_400_000);
    const markup = renderToStaticMarkup(<Today />);
    expect(markup).toContain("საცდელი წვდომა იწურება");
    expect(markup).toContain("პაკეტის ნახვა");
    expect(markup).toContain("/app/billing");
  });
});
