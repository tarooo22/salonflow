export const BLOCKING_APPOINTMENT_STATUSES = new Set(["PENDING", "CONFIRMED", "CHECKED_IN", "IN_SERVICE", "COMPLETED", "NO_SHOW"]);

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "CHECKED_IN" | "IN_SERVICE" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

const ALLOWED_TRANSITIONS: Record<AppointmentStatus, ReadonlySet<AppointmentStatus>> = {
  PENDING: new Set<AppointmentStatus>(["CONFIRMED", "CANCELLED"]),
  CONFIRMED: new Set<AppointmentStatus>(["CHECKED_IN", "CANCELLED", "NO_SHOW"]),
  CHECKED_IN: new Set<AppointmentStatus>(["IN_SERVICE", "CANCELLED", "NO_SHOW"]),
  IN_SERVICE: new Set<AppointmentStatus>(["COMPLETED"]),
  COMPLETED: new Set<AppointmentStatus>(),
  CANCELLED: new Set<AppointmentStatus>(),
  NO_SHOW: new Set<AppointmentStatus>(),
};

export function canTransitionAppointment(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return ALLOWED_TRANSITIONS[from].has(to);
}

export function intervalsOverlap(
  candidateStart: Date,
  candidateEnd: Date,
  existingStart: Date,
  existingEnd: Date,
): boolean {
  return candidateStart < existingEnd && candidateEnd > existingStart;
}

export function appointmentBlocksInterval(status: AppointmentStatus): boolean {
  return BLOCKING_APPOINTMENT_STATUSES.has(status);
}

export function deriveAppointmentBalance(totalTetri: number, payments: Array<{ amountTetri: number; refundedTetri: number; status: "PENDING" | "PAID" | "PARTIALLY_REFUNDED" | "REFUNDED" | "FAILED" }>) {
  const collectedTetri = payments.reduce((total, payment) => {
    if (payment.status === "FAILED" || payment.status === "PENDING") return total;
    return total + payment.amountTetri - payment.refundedTetri;
  }, 0);
  return {
    collectedTetri,
    balanceTetri: Math.max(0, totalTetri - collectedTetri),
    overpaymentTetri: Math.max(0, collectedTetri - totalTetri),
  };
}
