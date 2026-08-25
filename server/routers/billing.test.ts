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

  it("defends receipt upload on the server and only returns admin-scoped signed previews", () => {
    expect(source).toContain("hasReceiptSignature");
    expect(source).toContain("წინა ქვითარი უკვე შემოწმებას ელოდება");
    expect(source).toContain("storageGetSignedUrl(row.submission.receiptKey)");
    expect(source).not.toContain("receiptUrl: `/manus-storage/${row.submission.receiptKey}`");
  });

  it("uses conditional review-state updates before monthly grant or rejection audit writes", () => {
    expect(source).toContain("ეს ქვითარი უკვე დამუშავდა სხვა admin-ის მიერ.");
    expect(source).toContain("result[0]?.affectedRows !== 1");
    expect(source).toContain("or(eq(billingPaymentSubmissions.status, \"SUBMITTED\"), eq(billingPaymentSubmissions.status, \"UNDER_REVIEW\"))");
  });
});
