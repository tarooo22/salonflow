import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./DashboardLayout.tsx", import.meta.url), "utf8");

describe("dashboard role-safe navigation groups", () => {
  it("groups current role-filtered routes by operational intent without expanding role access", () => {
    expect(source).toContain("დღის მართვა");
    expect(source).toContain("კლიენტები და გაყიდვა");
    expect(source).toContain("სალონის მართვა");
    expect(source).toContain("Trial requests");
    expect(source).toContain("platformAdminItems");
    expect(source).toContain('user?.role === "admin"');
    expect(source).toContain("visibleMenuItems.filter");
    expect(source).toContain("role === \"STAFF\" ? \"ჩემი პროფილი\"");
    expect(source).toContain("lockedOwnerItems");
    expect(source).toContain("managementOpen");
    expect(source).toContain('aria-expanded={managementOpen}');
    expect(source).toContain('managementItems.some(item => item.path === location)');
    expect(source).toContain("mobileQuickItems");
    expect(source).toContain('aria-label="სწრაფი ნავიგაცია"');
    expect(source).toContain("workspaceRestricted\n    ? visibleMenuItems.slice(0, 3)");
    expect(source).toContain("onClick={toggleSidebar}");
    expect(source).toContain('item.path === "/app/today"');
    expect(source).toContain('location !== "/app/billing"');
    expect(source).toContain("პაკეტის გააქტიურება");
  });
});
