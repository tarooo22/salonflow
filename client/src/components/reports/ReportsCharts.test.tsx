import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./ReportsCharts.tsx", import.meta.url), "utf8");

describe("Reports financial chart surfaces", () => {
  it("renders a localized revenue trend chart from existing tetri data", () => {
    expect(source).toContain("RevenueTrendChart");
    expect(source).toContain("შემოსავლის დინამიკა");
    expect(source).toContain("dataKey=\"revenueTetri\"");
    expect(source).toContain("formatGelTetri(Number(value))");
  });

  it("renders a localized accrued-versus-paid commission chart", () => {
    expect(source).toContain("CommissionDistributionChart");
    expect(source).toContain("საკომისიო სპეციალისტების მიხედვით");
    expect(source).toContain("dataKey=\"amountTetri\"");
    expect(source).toContain("dataKey=\"paidTetri\"");
  });

  it("keeps chart context accessible without relying on color alone", () => {
    expect(source).toContain("aria-label=\"შემოსავლის დინამიკის გრაფიკი\"");
    expect(source).toContain("aria-label=\"სპეციალისტების საკომისიოების შედარებითი გრაფიკი\"");
    expect(source).toContain("ChartLegend");
  });
});
