import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ productivity: { preferences: { invalidate: vi.fn() }, dailyCloseState: { invalidate: vi.fn() } } }), productivity: { preferences: { useQuery: () => ({ data: { dismissedNotificationKeys: [] } }) }, savePreferences: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, dailyCloseState: { useQuery: () => ({ data: { completedKeys: [], closedAt: null }, isLoading: false }) }, saveDailyClose: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } } } }));
vi.mock("wouter", () => ({ Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock("@/components/ui/popover", () => ({ Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, PopoverTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>, PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

import { DayCloseChecklist, NotificationCenter } from "./DailyControl";

describe("DailyControl", () => {
  it("renders only actionable notices and a scoped four-step daily close list", () => {
    const markup = renderToStaticMarkup(<><NotificationCenter organizationId="org_1" notices={[{ key: "pending", title: "მომლოდინე booking", description: "ერთი ჩანაწერი", href: "/app/calendar", tone: "warning" }]} /><DayCloseChecklist organizationId="org_1" locationId="loc_1" businessDate="2026-08-25" locationName="ვაკე" timezone="Asia/Tbilisi" pendingCount={1} completedCount={2} outstandingLabel="25 ₾" outstandingTetri={2500} canClose /></>);
    expect(markup).toContain("მომლოდინე booking");
    expect(markup).toContain("დღის დახურვა");
    expect(markup).toContain("ხვალინდელი განრიგი");
    expect(markup).toContain("საბანკო reconciliation");
  });
});
