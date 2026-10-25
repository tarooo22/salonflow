import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const state = vi.hoisted(() => ({ listingStatus: null as string | null, role: "OWNER", dashboard: null as unknown, services: [] as unknown[], team: [] as unknown[], hours: [] as unknown[], activeEndsAt: null as Date | null }));
const mutation = { mutate: vi.fn(), isPending: false, error: null };
const organization = { id: "organization_001", name: "სილამაზის სივრცე" };
const query = (data: unknown) => ({ data, isLoading: false, isError: false, refetch: vi.fn() });

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/AppointmentQuickAction", () => ({ AppointmentQuickAction: () => <span>სტატუსის მოქმედება</span> }));
vi.mock("@/components/WalkInQuickEntry", () => ({ WalkInQuickEntry: () => <span>Walk-in ჩაწერა</span> }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("wouter", () => ({ Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ organizations: { listLocations: { invalidate: vi.fn() } }, appointments: { dashboard: { invalidate: vi.fn() }, listRange: { invalidate: vi.fn() } }, productivity: { preferences: { invalidate: vi.fn() }, dailyCloseState: { invalidate: vi.fn() } } }),
    organizations: {
      listMine: { useQuery: () => query([{ organization, membership: { id: "membership_001", role: state.role } }]) },
      listLocations: { useQuery: () => query([{ id: "location_001", name: "ვაკე", publicSlug: "vake-salon" }]) },
      createLocation: { useMutation: () => mutation },
    },
    appointments: { dashboard: { useQuery: () => query(state.dashboard) }, updateStatus: { useMutation: () => mutation } },
    billing: { ownerStatus: { useQuery: () => query({ activeEndsAt: state.activeEndsAt, trialEndsAt: null, organization: { billingCode: "SF-TEST" }, config: null, submission: null }) }, workspaceStatus: { useQuery: () => query({ locked: false, endsAt: state.activeEndsAt }) } },
    marketplace: { getOwnListing: { useQuery: () => query({ profile: state.listingStatus ? { status: state.listingStatus } : null }) } },
    services: { list: { useQuery: () => query(state.services) } },
    staff: { list: { useQuery: () => query(state.team) }, listWorkingHours: { useQuery: () => query(state.hours) } },
    productivity: { preferences: { useQuery: () => query({ dismissedNotificationKeys: [] }) }, savePreferences: { useMutation: () => mutation }, dailyCloseState: { useQuery: () => query({ completedKeys: [], closedAt: null }) }, saveDailyClose: { useMutation: () => mutation } },
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
    state.listingStatus = null;
    state.services = [];
    state.team = [];
    state.hours = [];
    state.activeEndsAt = null;
    state.dashboard = { appointments: [appointment], balances: [{ appointmentId: appointment.id, totals: { balanceTetri: 7_500 } }], metrics: { scheduledTetri: 7_500, collectedTetri: 0, outstandingTetri: 7_500 }, counts: { PENDING: 2 }, location: { id: "location_001", name: "ვაკე", timezone: "Asia/Tbilisi" }, dateKey: "2030-08-22" };
  });

  it("gives an owner the head row, the five-step checklist, focus and a collapsed day close", () => {
    const markup = renderToStaticMarkup(<Today />);
    expect(markup).toContain("დღის ჯავშნები, გადასახდელი და ის, რასაც ყურადღება სჭირდება.");
    expect(markup).toContain("/app/calendar?create=1");
    expect(markup).toContain("ადგილზე მოსულის ჩაწერა");
    expect(markup).toContain("დაიწყეთ აქ");
    expect(markup).toContain("0 / 5");
    for (const step of ["დაამატეთ სერვისები და ფასები", "დაამატეთ გუნდი", "მიუთითეთ სამუშაო საათები", "გახსენით ჩაწერის გვერდი და სცადეთ", "გამოჩნდით კატალოგში"]) expect(markup).toContain(step);
    expect(markup).toContain("/book/vake-salon");
    expect(markup).toContain("ახლა და შემდეგი");
    expect(markup).toContain("ნინო ბერიძე");
    expect(markup).toContain("დღის ჯავშნები");
    expect(markup).not.toContain("დღის რიგი");
    expect(markup).not.toContain("სწრაფი მოქმედებები");
    expect(markup).toContain('aria-expanded="false"');
    expect(markup.indexOf("დაიწყეთ აქ")).toBeLessThan(markup.indexOf("ახლა და შემდეგი"));
    expect(markup.indexOf("ახლა და შემდეგი")).toBeLessThan(markup.indexOf("დღის დახურვა"));
  });

  it("marks finished steps and shows the catalog review state", () => {
    state.services = [{ id: "s1" }];
    state.team = [{ id: "t1" }];
    state.hours = [{ id: "h1" }];
    state.listingStatus = "SUBMITTED";
    const markup = renderToStaticMarkup(<Today />);
    expect(markup).toContain("3 / 5");
    expect(markup).toContain("მზადაა");
    expect(markup).toContain("განხილვაშია");
  });

  it("collapses to one line once every step is done", () => {
    state.services = [{ id: "s1" }];
    state.team = [{ id: "t1" }];
    state.hours = [{ id: "h1" }];
    state.listingStatus = "APPROVED";
    const originalStorage = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (key: string) => key.includes("tried") ? "1" : null, setItem: vi.fn() } });
    try {
      const markup = renderToStaticMarkup(<Today />);
      expect(markup).toContain("ყველაფერი მზადაა. კლიენტებს უკვე შეუძლიათ ონლაინ ჩაწერა.");
      expect(markup).toContain("დამალვა");
      expect(markup).not.toContain("0 / 5");
    } finally {
      Object.defineProperty(globalThis, "localStorage", { configurable: true, value: originalStorage });
    }
  });

  it("keeps the staff dashboard to own-day context, no money and no owner checklist", () => {
    state.role = "STAFF";
    const markup = renderToStaticMarkup(<Today />);
    expect(markup).toContain("ჩემი დღე");
    expect(markup).toContain("ახლა და შემდეგი");
    expect(markup).toContain("აქ ჩანს თქვენი დღევანდელი ჯავშნები. სტატუსის შესაცვლელად დააჭირეთ ჯავშანს.");
    expect(markup).toContain("გასაგებია");
    expect(markup).not.toContain("დაიწყეთ აქ");
    expect(markup).not.toContain("/app/calendar?create=1");
    expect(markup).not.toContain("დაგეგმილი თანხა");
    expect(markup).not.toContain("დარჩენილი ბალანსი");
  });

  it("warns the owner before an active trial or manual package expires and links to package activation", () => {
    state.activeEndsAt = new Date(Date.now() + 2 * 86_400_000);
    const markup = renderToStaticMarkup(<Today />);
    expect(markup).toContain("პაკეტის წვდომა იწურება");
    expect(markup).toContain("პაკეტის ნახვა");
    expect(markup).toContain("/app/billing");
  });
});
