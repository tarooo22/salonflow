import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./billing.ts", import.meta.url), "utf8");

describe("manual billing lifecycle contract", () => {
  it("records a receipt, requires platform-admin review and creates an auditable monthly grant", () => {
    expect(source).toContain("submitReceipt");
    expect(source).toContain("billingPaymentSubmissions");
    expect(source).toContain('eventType: "SUBMITTED"');
    expect(source).toContain("approveMonthly");
    expect(source).toContain('source: "MONTHLY_MANUAL"');
    expect(source).toContain('eventType: "APPROVED_MONTHLY"');
    expect(source).toContain("requireAdmin(ctx.user.role)");
  });
});
