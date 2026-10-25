import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./DashboardLayout.tsx", import.meta.url), "utf8");

describe("dashboard rail is built from panelNav", () => {
  it("renders groups, footer and tab bar from the role-safe navigation data", () => {
    expect(source).toContain("panelNav(role,");
    expect(source).toContain("panelTabBar(role, vertical)");
    expect(source).toContain('isPlatformAdmin: user?.role === "admin"');
    expect(source).toContain("isBillingVisible(workspaceStatus.data)");
    expect(source).toContain("railGroups.map(");
    expect(source).toContain("railFooter.map(");
    // old hard-coded captions and menu are gone
    expect(source).not.toContain("menuItems");
    expect(source).not.toContain("დღის მართვა");
    expect(source).not.toContain("სალონის მართვა");
  });

  it("keeps the collapsible groups accessible, remembered on the device and auto-opened on an active child", () => {
    expect(source).toContain("aria-expanded={open}");
    expect(source).toContain("aria-controls={listId}");
    expect(source).toContain("activeCollapsibleKeys");
    expect(source).toMatch(/try \{[\s\S]*localStorage\.getItem\(RAIL_OPEN_KEY\)[\s\S]*catch/);
    expect(source).toMatch(/try \{[\s\S]*localStorage\.setItem\(RAIL_OPEN_KEY[\s\S]*catch/);
  });

  it("locks the rail to today and billing while the workspace is restricted", () => {
    expect(source).toContain("workspaceRestricted");
    expect(source).toContain('item.href === "/app/today"');
    expect(source).toContain('location !== "/app/billing"');
    expect(source).toContain("const railFooter = workspaceRestricted ? [] : nav.footer");
  });

  it("puts a phone tab bar with a more sheet on small screens", () => {
    expect(source).toContain('aria-label="სწრაფი ნავიგაცია"');
    expect(source).toContain("<Sheet open={moreSheetOpen}");
    expect(source).toContain("<SheetTitle>მეტი</SheetTitle>");
  });

  it("keeps search, help and the on-demand tour", () => {
    expect(source).toContain("setCommandOpen(true)");
    expect(source).toContain("restricted={workspaceRestricted}");
    expect(source).toContain("{helpOpen && organizations.data?.[0]?.organization.id ? <GuidedHelpTour");
  });
});
