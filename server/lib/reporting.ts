import { deriveAppointmentBalance } from "./appointments";

export type ReportAppointment = {
  totalTetri: number;
  discountTetri: number;
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "IN_SERVICE" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
};

export type ReportPayment = {
  appointmentId: string;
  amountTetri: number;
  refundedTetri: number;
  status: "PENDING" | "PAID" | "PARTIALLY_REFUNDED" | "REFUNDED" | "FAILED";
  method: "CASH" | "CARD_TERMINAL" | "BANK_TRANSFER" | "ONLINE" | "OTHER";
};

export type ReportExpense = {
  amountTetri: number;
};

export function summarizeRevenue(
  appointments: Array<ReportAppointment & { id: string }>,
  payments: ReportPayment[],
  expenses: ReportExpense[],
) {
  const collectedByAppointment = new Map(
    appointments.map(appointment => {
      const balance = deriveAppointmentBalance(
        appointment.totalTetri,
        payments.filter(payment => payment.appointmentId === appointment.id).map(payment => ({
          amountTetri: payment.amountTetri,
          refundedTetri: payment.refundedTetri,
          status: payment.status,
        })),
      );
      return [appointment.id, balance] as const;
    }),
  );

  const grossBookedRevenueTetri = appointments.reduce((sum, appointment) => sum + appointment.totalTetri, 0);
  const collectedRevenueTetri = Array.from(collectedByAppointment.values()).reduce((sum, item) => sum + item.collectedTetri, 0);
  const unpaidBalanceTetri = Array.from(collectedByAppointment.values()).reduce((sum, item) => sum + item.balanceTetri, 0);
  const refundsTetri = payments.reduce((sum, payment) => sum + payment.refundedTetri, 0);
  const discountsTetri = appointments.reduce((sum, appointment) => sum + appointment.discountTetri, 0);
  const expensesTetri = expenses.reduce((sum, expense) => sum + expense.amountTetri, 0);
  const completedAppointments = appointments.filter(appointment => appointment.status === "COMPLETED").length;
  const cancelledAppointments = appointments.filter(appointment => appointment.status === "CANCELLED").length;
  const noShowAppointments = appointments.filter(appointment => appointment.status === "NO_SHOW").length;

  return {
    grossBookedRevenueTetri,
    collectedRevenueTetri,
    unpaidBalanceTetri,
    refundsTetri,
    discountsTetri,
    expensesTetri,
    grossMarginTetri: collectedRevenueTetri - refundsTetri - expensesTetri,
    appointmentCount: appointments.length,
    completedAppointments,
    cancelledAppointments,
    noShowAppointments,
    averageTicketTetri: appointments.length > 0 ? Math.round(grossBookedRevenueTetri / appointments.length) : 0,
  };
}

export function summarizePaymentMethods(payments: ReportPayment[]) {
  return payments.reduce<Record<ReportPayment["method"], number>>(
    (acc, payment) => {
      if (payment.status === "FAILED" || payment.status === "PENDING") return acc;
      acc[payment.method] += payment.amountTetri - payment.refundedTetri;
      return acc;
    },
    { CASH: 0, CARD_TERMINAL: 0, BANK_TRANSFER: 0, ONLINE: 0, OTHER: 0 },
  );
}
