import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CalendarDays } from "lucide-react";
import { vi } from "vitest";

vi.mock("wouter", () => ({ Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a> }));

import { ActionTile, AttentionRow, CompactMetricRail, PriorityModule, WorkspaceContextBar } from "./DashboardModules";

describe("Dashboard modules", () => {
  it("renders semantic, labelled and keyboard-reachable decision modules", () => {
    const markup = renderToStaticMarkup(<><WorkspaceContextBar title="დღეს" detail="ფილიალი" /><PriorityModule label="ახლა" title="შემდეგი ვიზიტი" icon={CalendarDays} /><AttentionRow title="მოლოდინში" description="ერთი booking" href="/app/calendar" value="1" /><CompactMetricRail><span>Metric</span></CompactMetricRail><ActionTile icon={CalendarDays} label="კალენდარი" hint="დღის გეგმა" href="/app/calendar" /></>);
    expect(markup).toContain('aria-label="დღეს"');
    expect(markup).toContain('aria-label="დღის მოკლე მაჩვენებლები"');
    expect(markup).toContain('href="/app/calendar"');
    expect(markup).toContain("შემდეგი ვიზიტი");
  });
});
