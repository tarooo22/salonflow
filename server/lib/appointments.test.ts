import { describe, expect, it } from "vitest";
import { appointmentBlocksInterval, canTransitionAppointment, deriveAppointmentBalance, intervalsOverlap, summarizeOperationalAppointments } from "./appointments";

describe("appointment lifecycle safeguards", () => {
  it("accepts only intended status transitions", () => {
    expect(canTransitionAppointment("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransitionAppointment("CONFIRMED", "CHECKED_IN")).toBe(true);
    expect(canTransitionAppointment("COMPLETED", "CONFIRMED")).toBe(false);
  });

  it("treats touching appointments as non-overlapping and cancelled appointments as non-blocking", () => {
    const start = new Date("2026-08-12T08:00:00.000Z");
    const end = new Date("2026-08-12T09:00:00.000Z");
    expect(intervalsOverlap(start, end, end, new Date("2026-08-12T10:00:00.000Z"))).toBe(false);
    expect(intervalsOverlap(start, end, new Date("2026-08-12T08:30:00.000Z"), new Date("2026-08-12T09:30:00.000Z"))).toBe(true);
    expect(appointmentBlocksInterval("CANCELLED")).toBe(false);
  });

  it("derives the balance from successful payments and refunds", () => {
    expect(deriveAppointmentBalance(10_000, [
      { amountTetri: 6_000, refundedTetri: 0, status: "PAID" },
      { amountTetri: 4_000, refundedTetri: 1_000, status: "PARTIALLY_REFUNDED" },
      { amountTetri: 2_000, refundedTetri: 0, status: "FAILED" },
    ])).toEqual({ collectedTetri: 9_000, balanceTetri: 1_000, overpaymentTetri: 0 });
  });

  it("summarizes a day queue using real balance status and excludes cancelled revenue", () => {
    const summary = summarizeOperationalAppointments([
      { id: "appt_confirmed", status: "CONFIRMED", startsAt: new Date("2026-08-13T08:00:00.000Z"), totalTetri: 12_000 },
      { id: "appt_pending", status: "PENDING", startsAt: new Date("2026-08-13T09:00:00.000Z"), totalTetri: 8_000 },
      { id: "appt_cancelled", status: "CANCELLED", startsAt: new Date("2026-08-13T10:00:00.000Z"), totalTetri: 20_000 },
    ], [
      { appointmentId: "appt_confirmed", amountTetri: 9_000, refundedTetri: 0, status: "PAID" },
      { appointmentId: "appt_pending", amountTetri: 8_000, refundedTetri: 0, status: "PENDING" },
    ]);

    expect(summary.counts).toMatchObject({ CONFIRMED: 1, PENDING: 1, CANCELLED: 1 });
    expect(summary.balances.find(balance => balance.appointmentId === "appt_confirmed")?.totals.balanceTetri).toBe(3_000);
    expect(summary.metrics).toEqual({ scheduledTetri: 20_000, collectedTetri: 9_000, outstandingTetri: 11_000 });
  });
});
