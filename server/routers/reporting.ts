import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { appointmentServices, appointments, clientConsents, clients, commissionEntries, customerFeedback, expenses, organizations, payments, staffProfiles } from "../../drizzle/schema";
import { bookingHistorySchema, reportingRangeSchema } from "../../shared/validation";
import { requireOrganizationAction } from "../access";
import { requireDb } from "../db";
import { buildCsv } from "../lib/csv";
import { summarizePaymentMethods, summarizeRevenue } from "../lib/reporting";
import { expensePressureBasisPoints, localWeekRange, nextSevenDaysRange, summarizeAdvancedReportingAnalytics, summarizeReportingAnalytics } from "../lib/reportingAnalytics";
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
    const [organization] = await db.select({ defaultTimezone: organizations.defaultTimezone }).from(organizations).where(eq(organizations.id, input.organizationId)).limit(1);
    if (!organization) throw new Error("ორგანიზაცია ვერ მოიძებნა");
    const now = new Date();
    const week = localWeekRange(organization.defaultTimezone, now);
    const forecast = nextSevenDaysRange(organization.defaultTimezone, now);
    const previousWeekStart = new Date(week.startsAt);
    previousWeekStart.setUTCDate(previousWeekStart.getUTCDate() - 7);
    const [weeklyAppointments, cohortAppointments, futureAppointments] = await Promise.all([
      db.select().from(appointments).where(and(eq(appointments.organizationId, input.organizationId), gte(appointments.startsAt, previousWeekStart), lte(appointments.startsAt, week.endsAt))),
      db.select().from(appointments).where(and(eq(appointments.organizationId, input.organizationId), lte(appointments.startsAt, now))),
      db.select().from(appointments).where(and(eq(appointments.organizationId, input.organizationId), gte(appointments.startsAt, now), lte(appointments.startsAt, forecast.endsAt))),
    ]);
    const futureIds = futureAppointments.map(appointment => appointment.id);
    const futurePayments = futureIds.length ? await db.select({ appointmentId: payments.appointmentId, amountTetri: payments.amountTetri, refundedTetri: payments.refundedTetri, status: payments.status }).from(payments).where(inArray(payments.appointmentId, futureIds)) : [];
    const advanced = summarizeAdvancedReportingAnalytics({ selectedRangeAppointments: appointmentRows, weeklyAppointments, cohortAppointments, futureAppointments, futurePayments, timeZone: organization.defaultTimezone, reference: now });
    return { ...analytics, ...advanced, bookedRevenueTetri, expensesTetri, expensePressureBasisPoints: expensePressureBasisPoints(expensesTetri, bookedRevenueTetri) };
  }),

  feedbackInsights: protectedProcedure.input(reportingRangeSchema).query(async ({ ctx, input }) => {
    await requireOrganizationAction(ctx.user, input.organizationId, "reports:view");
    const db = await requireDb();
    const [feedbackRows, consentRows] = await Promise.all([
      db.select({ rating: customerFeedback.rating, status: customerFeedback.status, submittedAt: customerFeedback.submittedAt }).from(customerFeedback).where(and(
        eq(customerFeedback.organizationId, input.organizationId),
        gte(customerFeedback.submittedAt, input.startsAt),
        lte(customerFeedback.submittedAt, input.endsAt),
      )),
      db.select({ clientId: clientConsents.clientId, consentType: clientConsents.consentType, granted: clientConsents.granted, withdrawnAt: clientConsents.withdrawnAt, createdAt: clientConsents.createdAt }).from(clientConsents)
        .innerJoin(clients, eq(clientConsents.clientId, clients.id))
        .where(and(eq(clients.organizationId, input.organizationId), lte(clientConsents.createdAt, input.endsAt))),
    ]);
    const ratings = [1, 2, 3, 4, 5].map(rating => ({ rating, count: feedbackRows.filter(row => row.rating === rating).length }));
    const statuses = ["PENDING", "APPROVED", "HIDDEN", "REJECTED"].map(status => ({ status, count: feedbackRows.filter(row => row.status === status).length }));
    const byDate = new Map<string, number>();
    for (const row of feedbackRows) {
      const day = row.submittedAt.toISOString().slice(0, 10);
      byDate.set(day, (byDate.get(day) ?? 0) + 1);
    }
    const latestConsent = new Map<string, { consentType: "MARKETING_SMS" | "MARKETING_EMAIL" | "BOOKING_TERMS"; granted: boolean; withdrawnAt: Date | null; createdAt: Date }>();
    const consentActivity = { granted: 0, withdrawn: 0 };
    for (const row of consentRows) {
      const occurredAt = row.createdAt ?? row.withdrawnAt;
      const createdAtMs = occurredAt instanceof Date ? occurredAt.getTime() : occurredAt ? Date.parse(String(occurredAt)) : Number.NaN;
      if (createdAtMs >= input.startsAt.getTime() && createdAtMs <= input.endsAt.getTime()) {
        if (row.granted && !row.withdrawnAt) consentActivity.granted += 1;
        else consentActivity.withdrawn += 1;
      }
      const key = `${row.clientId}:${row.consentType}`;
      const current = latestConsent.get(key);
      if (!current || current.createdAt < row.createdAt) latestConsent.set(key, row);
    }
    const currentOptIns = { marketingSms: 0, marketingEmail: 0, bookingTerms: 0 };
    for (const consent of Array.from(latestConsent.values())) {
      if (!consent.granted || consent.withdrawnAt) continue;
      if (consent.consentType === "MARKETING_SMS") currentOptIns.marketingSms += 1;
      if (consent.consentType === "MARKETING_EMAIL") currentOptIns.marketingEmail += 1;
      if (consent.consentType === "BOOKING_TERMS") currentOptIns.bookingTerms += 1;
    }
    const total = feedbackRows.length;
    return {
      feedback: {
        total,
        averageRating: total ? Math.round((feedbackRows.reduce((sum, row) => sum + row.rating, 0) / total) * 100) / 100 : null,
        ratings,
        statuses,
        trend: Array.from(byDate, ([date, count]) => ({ date, count })).sort((left, right) => left.date.localeCompare(right.date)),
      },
      consent: { currentOptIns, activity: consentActivity },
    };
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
