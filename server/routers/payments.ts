import { and, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { appointments, payments } from "../../drizzle/schema";
import { requireOrganizationAction, requireOrganizationRole } from "../access";
import { requireDb } from "../db";
import { deriveAppointmentBalance } from "../lib/appointments";
import { organizationScopeSchema, paymentCreateSchema } from "../../shared/validation";
import { protectedProcedure, router } from "../_core/trpc";

export const paymentsRouter = router({
  listForOrganization: protectedProcedure.input(organizationScopeSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST"]);
    const db = await requireDb();
    return db.select({ payment: payments, appointment: appointments }).from(payments)
      .innerJoin(appointments, eq(payments.appointmentId, appointments.id))
      .where(eq(appointments.organizationId, input.organizationId));
  }),

  record: protectedProcedure.input(paymentCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationAction(ctx.user, input.organizationId, "finance:manage");
    if (input.refundedTetri > input.amountTetri) throw new Error("Refunded amount cannot exceed the payment amount");
    const db = await requireDb();
    const [appointment] = await db.select().from(appointments).where(and(
      eq(appointments.id, input.appointmentId),
      eq(appointments.organizationId, input.organizationId),
    )).limit(1);
    if (!appointment) throw new Error("Appointment not found");

    const paymentId = nanoid(21);
    await db.insert(payments).values({
      id: paymentId,
      appointmentId: appointment.id,
      amountTetri: input.amountTetri,
      refundedTetri: input.refundedTetri,
      method: input.method,
      status: input.status,
      externalReference: input.externalReference,
      notes: input.notes,
      collectedByUserId: ctx.user.id,
      collectedAt: new Date(),
    });

    const allPayments = await db.select().from(payments).where(eq(payments.appointmentId, appointment.id));
    return {
      id: paymentId,
      balance: deriveAppointmentBalance(appointment.totalTetri, allPayments.map(payment => ({
        amountTetri: payment.amountTetri,
        refundedTetri: payment.refundedTetri,
        status: payment.status,
      }))),
    };
  }),

  summarizeAppointments: protectedProcedure.input(organizationScopeSchema.extend({ appointmentIds: organizationScopeSchema.shape.organizationId.array().min(1).max(50) })).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST"]);
    const db = await requireDb();
    const rows = await db.select({ appointment: appointments, payment: payments }).from(appointments)
      .leftJoin(payments, eq(appointments.id, payments.appointmentId))
      .where(and(eq(appointments.organizationId, input.organizationId), inArray(appointments.id, input.appointmentIds)));

    const grouped = new Map<string, { totalTetri: number; payments: Array<{ amountTetri: number; refundedTetri: number; status: typeof payments.$inferSelect.status }> }>();
    for (const row of rows) {
      const current = grouped.get(row.appointment.id) ?? { totalTetri: row.appointment.totalTetri, payments: [] };
      if (row.payment) {
        current.payments.push({ amountTetri: row.payment.amountTetri, refundedTetri: row.payment.refundedTetri, status: row.payment.status });
      }
      grouped.set(row.appointment.id, current);
    }

    return Array.from(grouped.entries()).map(([appointmentId, payload]) => ({
      appointmentId,
      ...deriveAppointmentBalance(payload.totalTetri, payload.payments),
    }));
  }),
});
