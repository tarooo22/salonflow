import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { appointmentServices, appointments, commissionEntries, expenses, payments, staffProfiles } from "../../drizzle/schema";
import { bookingHistorySchema, reportingRangeSchema } from "../../shared/validation";
import { requireOrganizationAction } from "../access";
import { requireDb } from "../db";
import { buildCsv } from "../lib/csv";
import { summarizePaymentMethods, summarizeRevenue } from "../lib/reporting";
import { expensePressureBasisPoints, summarizeReportingAnalytics } from "../lib/reportingAnalytics";
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

  analytics: protectedProcedure.input(reportingRangeSchema).query(async ({ ctx, input }) => {
    await requireOrganizationAction(ctx.user, input.organizationId, "reports:view");
    const { appointmentRows, expenseRows } = await reportRows(input.organizationId, input.startsAt, input.endsAt);
    const db = await requireDb();
    const appointmentIds = appointmentRows.map(appointment => appointment.id);
    const staffIds = Array.from(new Set(appointmentRows.map(appointment => appointment.staffProfileId)));
    const serviceRows = appointmentIds.length ? await db.select({ appointmentId: appointmentServices.appointmentId, serviceNameSnapshot: appointmentServices.serviceNameSnapshot, priceTetriSnapshot: appointmentServices.priceTetriSnapshot }).from(appointmentServices).where(inArray(appointmentServices.appointmentId, appointmentIds)) : [];
    const staffRows = staffIds.length ? await db.select({ id: staffProfiles.id, publicDisplayName: staffProfiles.publicDisplayName }).from(staffProfiles).where(inArray(staffProfiles.id, staffIds)) : [];
    const analytics = summarizeReportingAnalytics(appointmentRows, serviceRows, staffRows);
    const bookedRevenueTetri = analytics.staffMetrics.reduce((total, metric) => total + metric.bookedRevenueTetri, 0);
    const expensesTetri = expenseRows.reduce((total, expense) => total + expense.amountTetri, 0);
    return { ...analytics, bookedRevenueTetri, expensesTetri, expensePressureBasisPoints: expensePressureBasisPoints(expensesTetri, bookedRevenueTetri) };
  }),

  commissionSummary: protectedProcedure.input(reportingRangeSchema).query(async ({ ctx, input }) => {
    await requireOrganizationAction(ctx.user, input.organizationId, "finance:view");
    const db = await requireDb();
    const rows = await db.select({
      staffProfileId: commissionEntries.staffProfileId,
      publicDisplayName: staffProfiles.publicDisplayName,
      amountTetri: commissionEntries.amountTetri,
      paidAt: commissionEntries.paidAt,
    }).from(commissionEntries)
      .innerJoin(appointments, eq(commissionEntries.appointmentId, appointments.id))
      .innerJoin(staffProfiles, eq(commissionEntries.staffProfileId, staffProfiles.id))
      .where(and(
        eq(appointments.organizationId, input.organizationId),
        gte(commissionEntries.createdAt, input.startsAt),
        lte(commissionEntries.createdAt, input.endsAt),
      ));
    const byStaff = new Map<string, { staffProfileId: string; publicDisplayName: string; amountTetri: number; entryCount: number; paidTetri: number }>();
    for (const row of rows) {
      const current = byStaff.get(row.staffProfileId) ?? { staffProfileId: row.staffProfileId, publicDisplayName: row.publicDisplayName, amountTetri: 0, entryCount: 0, paidTetri: 0 };
      current.amountTetri += row.amountTetri;
      current.entryCount += 1;
      if (row.paidAt) current.paidTetri += row.amountTetri;
      byStaff.set(row.staffProfileId, current);
    }
    const specialists = Array.from(byStaff.values()).sort((left, right) => right.amountTetri - left.amountTetri);
    return {
      totalTetri: specialists.reduce((sum, specialist) => sum + specialist.amountTetri, 0),
      paidTetri: specialists.reduce((sum, specialist) => sum + specialist.paidTetri, 0),
      specialists,
    };
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
