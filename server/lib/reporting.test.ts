import { describe, expect, it } from "vitest";
import { buildCsv, sanitizeCsvCell } from "./csv";
import { summarizePaymentMethods, summarizeRevenue } from "./reporting";

describe("reporting summaries", () => {
  it("calculates revenue, balance, refund, and margin totals from persisted rows", () => {
    const summary = summarizeRevenue(
      [
        { id: "a1", totalTetri: 12000, discountTetri: 500, status: "COMPLETED" },
        { id: "a2", totalTetri: 8000, discountTetri: 0, status: "NO_SHOW" },
      ],
      [
        { appointmentId: "a1", amountTetri: 12000, refundedTetri: 2000, status: "PARTIALLY_REFUNDED", method: "CARD_TERMINAL" },
        { appointmentId: "a2", amountTetri: 3000, refundedTetri: 0, status: "PAID", method: "CASH" },
      ],
      [{ amountTetri: 1500 }],
    );

    expect(summary).toEqual({
      grossBookedRevenueTetri: 20000,
      collectedRevenueTetri: 13000,
      unpaidBalanceTetri: 7000,
      refundsTetri: 2000,
      discountsTetri: 500,
      expensesTetri: 1500,
      grossMarginTetri: 9500,
      appointmentCount: 2,
      completedAppointments: 1,
      cancelledAppointments: 0,
      noShowAppointments: 1,
      averageTicketTetri: 10000,
    });
  });

  it("summarizes successful payment methods only", () => {
    expect(
      summarizePaymentMethods([
        { appointmentId: "a1", amountTetri: 4000, refundedTetri: 0, status: "PAID", method: "CASH" },
        { appointmentId: "a2", amountTetri: 6000, refundedTetri: 1000, status: "PARTIALLY_REFUNDED", method: "ONLINE" },
        { appointmentId: "a3", amountTetri: 5000, refundedTetri: 0, status: "FAILED", method: "CARD_TERMINAL" },
      ]),
    ).toEqual({ CASH: 4000, CARD_TERMINAL: 0, BANK_TRANSFER: 0, ONLINE: 5000, OTHER: 0 });
  });
});

describe("csv injection protection", () => {
  it("prefixes dangerous spreadsheet formula cells", () => {
    expect(sanitizeCsvCell("=2+2")).toBe("'=2+2");
    expect(sanitizeCsvCell("@hidden")).toBe("'@hidden");
    expect(sanitizeCsvCell("safe value")).toBe("safe value");
  });

  it("builds escaped csv rows", () => {
    expect(buildCsv([{ name: "=cmd", note: 'He said "hi"' }])).toBe('name,note\n"\'=cmd","He said ""hi"""');
  });
});
