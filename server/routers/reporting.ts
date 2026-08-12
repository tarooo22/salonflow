import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { appointments, expenses, payments } from "../../drizzle/schema";
import { bookingHistorySchema, reportingRangeSchema } from "../../shared/validation";
import { requireOrganizationAction } from "../access";
import { requireDb } from "../db";
import { buildCsv } from "../lib/csv";
import { summarizePaymentMethods, summarizeRevenue } from "../lib/reporting";
import { protectedProcedure, router } from "../_core/trpc";

async function reportRows(organizationId: string, startsAt: Date, endsAt: Date) {
  const db = await requireDb();
  const appointmentRows = await db.select().from(appointments).where(and(
    eq(appointments.organizationId, organizationId),
    gte(appointments.startsAt, startsAt),
    lte(appointments.startsAt, endsAt),
  ));
  const ids = appointmentRows.map(row => row.id);
  const paymentRows = ids.length ? await db.select().from(payments).where(inArray(payments.appointmentId, ids)) : [];
  const expenseRows = await db.select().from(expenses).where(and(
    eq(expenses.organizationId, organizationId),
    gte(expenses.expenseDate, startsAt),
    lte(expenses.expenseDate, endsAt),
    eq(expenses.status, "ACTIVE"),
  ));
  return { appointmentRows, paymentRows, expenseRows };
}

export const reportingRouter = router({
  bookingHistory: protectedProcedure.input(bookingHistorySchema).query(async ({ ctx, input }) => {
    await requireOrganizationAction(ctx.user, input.organizationId, "reports:view");
    const db = await requireDb();
    const conditions = [
      eq(appointments.organizationId, input.organizationId),
      gte(appointments.startsAt, input.startsAt),
      lte(appointments.startsAt, input.endsAt),
    ];
    if (input.locationId) conditions.push(eq(appointments.locationId, input.locationId));
    if (input.status) conditions.push(eq(appointments.status, input.status));
    const where = and(...conditions);
    const [totalRow] = await db.select({ count: sql<number>`count(*)` }).from(appointments).where(where);
    const items = await db.select().from(appointments).where(where).orderBy(desc(appointments.startsAt)).limit(input.limit).offset(input.offset);
    return { items, total: Number(totalRow?.count ?? 0), limit: input.limit, offset: input.offset };
  }),

  revenueSummary: protectedProcedure.input(reportingRangeSchema).query(async ({ ctx, input }) => {
    await requireOrganizationAction(ctx.user, input.organizationId, "reports:view");
    const { appointmentRows, paymentRows, expenseRows } = await reportRows(input.organizationId, input.startsAt, input.endsAt);
    return { summary: summarizeRevenue(appointmentRows, paymentRows, expenseRows), paymentMethods: summarizePaymentMethods(paymentRows) };
  }),

  exportCsv: protectedProcedure.input(reportingRangeSchema).query(async ({ ctx, input }) => {
    await requireOrganizationAction(ctx.user, input.organizationId, "reports:view");
    const { appointmentRows } = await reportRows(input.organizationId, input.startsAt, input.endsAt);
    return {
      filename: `salonflow-bookings-${input.startsAt.toISOString().slice(0, 10)}-${input.endsAt.toISOString().slice(0, 10)}.csv`,
      csv: buildCsv(appointmentRows.map(row => ({
        appointmentReference: row.id,
        startsAt: row.startsAt.toISOString(),
        endsAt: row.endsAt.toISOString(),
        status: row.status,
        bookedGel: (row.totalTetri / 100).toFixed(2),
        discountGel: (row.discountTetri / 100).toFixed(2),
      }))),
    };
  }),
});
