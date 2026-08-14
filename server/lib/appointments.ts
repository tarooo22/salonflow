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

export type PaymentDisplayState = "UNPAID" | "PARTIAL" | "PAID" | "REFUNDED" | "OVERPAID";

/** Gives operational UIs a labelled payment state from persisted payment rows and server-derived totals. */
export function derivePaymentDisplayState(totalTetri: number, payments: Array<{ amountTetri: number; refundedTetri: number; status: "PENDING" | "PAID" | "PARTIALLY_REFUNDED" | "REFUNDED" | "FAILED" }>) {
  const totals = deriveAppointmentBalance(totalTetri, payments);
  if (totals.overpaymentTetri > 0) return { state: "OVERPAID" as const, totals };
  if (totals.balanceTetri === 0) return { state: "PAID" as const, totals };
  if (totals.collectedTetri > 0) return { state: "PARTIAL" as const, totals };
  if (payments.some(payment => payment.status === "REFUNDED" || payment.status === "PARTIALLY_REFUNDED")) return { state: "REFUNDED" as const, totals };
  return { state: "UNPAID" as const, totals };
}

export type OperationalAppointment = {
  id: string;
  status: AppointmentStatus;
  startsAt: Date;
  totalTetri: number;
};

export type OperationalPayment = {
  appointmentId: string;
  amountTetri: number;
  refundedTetri: number;
  status: "PENDING" | "PAID" | "PARTIALLY_REFUNDED" | "REFUNDED" | "FAILED";
};

/** Produces day-queue totals from persisted appointments and server-side payment state. */
export function summarizeOperationalAppointments(appointmentRows: OperationalAppointment[], paymentRows: OperationalPayment[]) {
  const balances = appointmentRows.map(appointment => ({
    appointmentId: appointment.id,
    status: appointment.status,
    startsAt: appointment.startsAt,
    totals: deriveAppointmentBalance(appointment.totalTetri, paymentRows.filter(payment => payment.appointmentId === appointment.id)),
  }));
  const balanceByAppointment = new Map(balances.map(balance => [balance.appointmentId, balance]));
  const counts = appointmentRows.reduce<Record<string, number>>((acc, appointment) => {
    acc[appointment.status] = (acc[appointment.status] ?? 0) + 1;
    return acc;
  }, {});
  const metrics = appointmentRows.reduce((metrics, appointment) => {
    if (appointment.status === "CANCELLED") return metrics;
    const balance = balanceByAppointment.get(appointment.id)?.totals;
    return {
      scheduledTetri: metrics.scheduledTetri + appointment.totalTetri,
      collectedTetri: metrics.collectedTetri + (balance?.collectedTetri ?? 0),
      outstandingTetri: metrics.outstandingTetri + (balance?.balanceTetri ?? appointment.totalTetri),
    };
  }, { scheduledTetri: 0, collectedTetri: 0, outstandingTetri: 0 });

  return { balances, counts, metrics };
}
