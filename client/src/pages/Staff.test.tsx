import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ performance: null as unknown, workingHours: null as unknown, exceptions: null as unknown }));
const mutation = { mutate: vi.fn(), isPending: false, error: null };
const organization = { id: "organization_001", name: "სილამაზის სივრცე" };
const membership = { id: "membership_001", role: "OWNER" };
const profile = { id: "staff_profile_00001", publicDisplayName: "ლელა ბერიძე", onlineBookingVisible: true, color: "#17826A", jobTitle: "სტილისტი", specialty: null };
const query = (data: unknown) => ({ data, isLoading: false, isError: false, refetch: vi.fn() });

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ staff: { list: { invalidate: vi.fn() } }, finance: { listExpenses: { invalidate: vi.fn() } }, reporting: { revenueSummary: { invalidate: vi.fn() } } }),
    organizations: { listMine: { useQuery: () => query([{ organization, membership }]) }, listLocations: { useQuery: () => query([{ id: "location_00001", name: "ვაკე" }]) } },
    invitations: { list: { useQuery: () => query([]) }, create: { useMutation: () => mutation }, revoke: { useMutation: () => mutation } },
    media: { setStaffAvatar: { useMutation: () => ({ ...mutation, mutateAsync: vi.fn() }) } },
    staff: {
      list: { useQuery: () => query([{ profile, membership: { role: "OWNER", status: "ACTIVE", id: membership.id } }]) },
      listWorkingHours: { useQuery: () => state.workingHours },
      listScheduleExceptions: { useQuery: () => state.exceptions },
      performance: { useQuery: () => state.performance },
      createProfile: { useMutation: () => mutation }, createMember: { useMutation: () => mutation }, addWorkingHours: { useMutation: () => mutation }, updateWorkingHours: { useMutation: () => mutation }, addScheduleException: { useMutation: () => mutation }, updateScheduleException: { useMutation: () => mutation },
      deleteWorkingHours: { useMutation: () => mutation }, deleteScheduleException: { useMutation: () => mutation },
    },
  },
}));

import Staff from "./Staff";

describe("Staff performance panel", () => {
  beforeEach(() => { state.performance = query([]); state.workingHours = query([]); state.exceptions = query([]); });

  it("renders an accessible loading state", () => {
    state.performance = { data: undefined, isLoading: true, isError: false, refetch: vi.fn() };
    expect(renderToStaticMarkup(<Staff />)).toContain("მონაცემები იტვირთება…");
  });

  it("renders an empty-period explanation", () => {
    expect(renderToStaticMarkup(<Staff />)).toContain("არჩეულ პერიოდში სპეციალისტის მონაცემი ჯერ არ არის.");
  });

  it("renders completed appointments, service volume, and booked revenue from live metrics", () => {
    state.performance = query([{ profile, metrics: { completedAppointments: 2, serviceVolume: 3, bookedRevenueTetri: 25_000 } }]);
    const markup = renderToStaticMarkup(<Staff />);
    expect(markup).toContain("დასრულებული");
    expect(markup).toContain("მომსახურება");
    expect(markup).toContain("ჯავშნები");
    expect(markup).toContain("250,00 ₾");
  });

  it("renders edit controls for organization-scoped existing schedule records", () => {
    state.workingHours = query([{ rule: { id: "hours_rule_00001", staffProfileId: profile.id, locationId: "location_00001", weekday: 0, startLocalTime: "09:00", endLocalTime: "18:00" }, profile, location: { id: "location_00001", name: "ვაკე" } }]);
    state.exceptions = query([{ exception: { id: "exception_00001", staffProfileId: profile.id, locationId: "location_00001", type: "VACATION", startsAt: new Date("2026-08-15T09:00:00.000Z"), endsAt: new Date("2026-08-15T18:00:00.000Z"), reason: null }, profile, location: { id: "location_00001", name: "ვაკე" } }]);
    const markup = renderToStaticMarkup(<Staff />);
    expect(markup).toContain("სამუშაო საათების შეცვლა");
    expect(markup).toContain("კალენდრის ბლოკის შეცვლა");
  });
});
