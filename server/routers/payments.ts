import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { appointments, auditLogs, payments } from "../../drizzle/schema";
import { requireOrganizationAction, requireOrganizationRole } from "../access";
import { requireDb } from "../db";
import { deriveAppointmentBalance } from "../lib/appointments";
import { appointmentPaymentRecordSchema, organizationScopeSchema } from "../../shared/validation";
import { protectedProcedure, router } from "../_core/trpc";

/**
 * The payments table has no idempotency column, so the client key is kept in `externalReference`
 * with this prefix. Uniqueness is enforced by the appointment row lock: every write for an
 * appointment holds `SELECT ... FOR UPDATE` on it, so two requests with the same key run one
 * after the other and the second one finds the first one's row.
 */
const IDEMPOTENCY_PREFIX = "idem:";

export const paymentsRouter = router({
  listForOrganization: protectedProcedure.input(organizationScopeSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST"]);
    const db = await requireDb();
    return db.select({ payment: payments, appointment: appointments }).from(payments)
      .innerJoin(appointments, eq(payments.appointmentId, appointments.id))
      .where(eq(appointments.organizationId, input.organizationId));
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

  /** Front desk records money received for a visit. Only amount, method and note come from the client. */
  recordForAppointment: protectedProcedure.input(appointmentPaymentRecordSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationAction(ctx.user, input.organizationId, "payments:record");
    const db = await requireDb();
    const reference = `${IDEMPOTENCY_PREFIX}${input.idempotencyKey}`;

    return db.transaction(async tx => {
      const [appointment] = await tx.select().from(appointments).where(and(
        eq(appointments.id, input.appointmentId),
        eq(appointments.organizationId, input.organizationId),
      )).limit(1).for("update");
      if (!appointment) throw new TRPCError({ code: "NOT_FOUND", message: "ვიზიტი ვერ მოიძებნა." });

      // Locking read: always sees rows committed by a request that held the lock before us.
      const existingPayments = await tx.select().from(payments).where(eq(payments.appointmentId, appointment.id)).for("update");
      const replay = existingPayments.find(payment => payment.externalReference === reference);
      if (replay) {
        return { paymentId: replay.id, amountTetri: replay.amountTetri, method: replay.method, replayed: true, ...deriveAppointmentBalance(appointment.totalTetri, existingPayments) };
      }

      if (appointment.status === "CANCELLED" || appointment.status === "NO_SHOW") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "გაუქმებულ ან გამოუცხადებელ ვიზიტზე გადახდის მიღება შეუძლებელია." });
      }

      const before = deriveAppointmentBalance(appointment.totalTetri, existingPayments);
      if (before.balanceTetri <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ეს ვიზიტი უკვე სრულად არის გადახდილი." });
      }
      if (input.amountTetri > before.balanceTetri) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "თანხა აღემატება დარჩენილ დავალიანებას." });
      }

      const now = new Date();
      const payment: typeof payments.$inferInsert = {
        id: nanoid(21),
        appointmentId: appointment.id,
        amountTetri: input.amountTetri,
        refundedTetri: 0,
        method: input.method,
        status: "PAID",
        externalReference: reference,
        collectedByUserId: ctx.user.id,
        collectedAt: now,
        notes: input.note || null,
      };
      await tx.insert(payments).values(payment);
      await tx.insert(auditLogs).values({
        id: nanoid(21),
        organizationId: input.organizationId,
        actorUserId: ctx.user.id,
        action: "APPOINTMENT_PAYMENT_RECORDED",
        entityType: "payment",
        entityId: payment.id,
        beforeState: { appointmentId: appointment.id, balanceTetri: before.balanceTetri },
        afterState: { appointmentId: appointment.id, amountTetri: input.amountTetri, method: input.method, balanceTetri: before.balanceTetri - input.amountTetri },
      });

      const after = deriveAppointmentBalance(appointment.totalTetri, [...existingPayments, { amountTetri: input.amountTetri, refundedTetri: 0, status: "PAID" }]);
      return { paymentId: payment.id, amountTetri: input.amountTetri, method: input.method, replayed: false, ...after };
    });
  }),
});
