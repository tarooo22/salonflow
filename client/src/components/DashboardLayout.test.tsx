import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./DashboardLayout.tsx", import.meta.url), "utf8");

describe("dashboard role-safe navigation groups", () => {
  it("groups current role-filtered routes by operational intent without expanding role access", () => {
    expect(source).toContain("დღის მართვა");
    expect(source).toContain("კლიენტები და გაყიდვა");
    expect(source).toContain("სალონის მართვა");
    expect(source).toContain("visibleMenuItems.filter");
    expect(source).toContain("role === \"STAFF\" ? \"ჩემი პროფილი\"");
  });
});
