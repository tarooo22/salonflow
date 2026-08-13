import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  appointmentStatusHistory,
  appointmentServices,
  appointments,
  clients,
  locations,
  organizationMemberships,
  payments,
  scheduleLocks,
  staffProfiles,
} from "../../drizzle/schema";
import { requireOrganizationAction, requireOrganizationRole } from "../access";
import { requireDb } from "../db";
import { appointmentBlocksInterval, canTransitionAppointment, intervalsOverlap, summarizeOperationalAppointments } from "../lib/appointments";
import { appointmentCreateSchema, appointmentStatusUpdateSchema, calendarRangeSchema, organizationScopeSchema, todayDashboardSchema } from "../../shared/validation";
import { protectedProcedure, router } from "../_core/trpc";
import { businessDayRange } from "@shared/timezones";

function enumerateUtcDates(start: Date, end: Date) {
  const dates: string[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export const appointmentsRouter = router({
  listToday: protectedProcedure.input(organizationScopeSchema).query(async ({ ctx, input }) => {
    const membership = await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const db = await requireDb();
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const where = membership.role === "STAFF"
      ? and(
          eq(appointments.organizationId, input.organizationId),
          eq(appointments.createdByUserId, ctx.user.id),
          sql`${appointments.startsAt} >= ${start}`,
          sql`${appointments.startsAt} < ${end}`,
        )
      : and(
          eq(appointments.organizationId, input.organizationId),
          sql`${appointments.startsAt} >= ${start}`,
          sql`${appointments.startsAt} < ${end}`,
        );

    return db.select().from(appointments).where(where).orderBy(asc(appointments.startsAt));
  }),

  listRange: protectedProcedure.input(calendarRangeSchema).query(async ({ ctx, input }) => {
    const membership = await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const db = await requireDb();
    const conditions = [
      eq(appointments.organizationId, input.organizationId),
      sql`${appointments.startsAt} >= ${input.startsAt}`,
      sql`${appointments.startsAt} < ${input.endsAt}`,
    ];
    if (input.locationId) conditions.push(eq(appointments.locationId, input.locationId));
    if (membership.role === "STAFF") {
      const profiles = await db.select({ id: staffProfiles.id }).from(staffProfiles).where(eq(staffProfiles.membershipId, membership.id));
      const profileIds = profiles.map(profile => profile.id);
      if (!profileIds.length) return [];
      conditions.push(inArray(appointments.staffProfileId, profileIds));
    } else if (input.staffProfileId) {
      conditions.push(eq(appointments.staffProfileId, input.staffProfileId));
    }
    const rows = await db.select({
      appointment: appointments,
      clientFirstName: clients.firstName,
      clientLastName: clients.lastName,
      staffName: staffProfiles.publicDisplayName,
      staffColor: staffProfiles.color,
    }).from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .innerJoin(staffProfiles, eq(appointments.staffProfileId, staffProfiles.id))
      .where(and(...conditions))
      .orderBy(asc(appointments.startsAt));
    const appointmentIds = rows.map(row => row.appointment.id);
    const serviceRows = appointmentIds.length
      ? await db.select().from(appointmentServices).where(inArray(appointmentServices.appointmentId, appointmentIds)).orderBy(asc(appointmentServices.sortOrder))
      : [];

    return rows.map(row => ({
      ...row.appointment,
      client: row.clientFirstName ? { firstName: row.clientFirstName, lastName: row.clientLastName } : null,
      staff: { id: row.appointment.staffProfileId, publicDisplayName: row.staffName, color: row.staffColor },
      services: serviceRows.filter(service => service.appointmentId === row.appointment.id).map(service => ({
        id: service.id,
        serviceNameSnapshot: service.serviceNameSnapshot,
        durationMinutesSnapshot: service.durationMinutesSnapshot,
        priceTetriSnapshot: service.priceTetriSnapshot,
      })),
    }));
  }),

  create: protectedProcedure.input(appointmentCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationAction(ctx.user, input.organizationId, "calendar:manage");
    if (input.startsAt >= input.endsAt) throw new Error("Appointment end must be after its start");
    if (input.totalTetri !== input.subtotalTetri - input.discountTetri) throw new Error("Appointment total must be derived server-side from subtotal minus discount");

    const db = await requireDb();
    const id = nanoid(21);
    const lockDates = enumerateUtcDates(input.startsAt, input.endsAt);

    await db.transaction(async tx => {
      for (const dateKey of lockDates) {
        await tx.insert(scheduleLocks).values({
          id: `${input.staffProfileId}:${dateKey}`,
          staffProfileId: input.staffProfileId,
          localDate: new Date(`${dateKey}T00:00:00.000Z`),
        }).onDuplicateKeyUpdate({ set: { createdAt: new Date() } });
      }

      const existing = await tx.select().from(appointments).where(and(
        eq(appointments.organizationId, input.organizationId),
        eq(appointments.staffProfileId, input.staffProfileId),
        inArray(appointments.status, ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_SERVICE", "COMPLETED", "NO_SHOW"]),
      ));

      const conflict = existing.find(item => intervalsOverlap(input.startsAt, input.endsAt, item.startsAt, item.endsAt));
      if (conflict) throw new Error("Selected slot is no longer available");

      await tx.insert(appointments).values({
        id,
        organizationId: input.organizationId,
        locationId: input.locationId,
        clientId: input.clientId,
        staffProfileId: input.staffProfileId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        source: input.source,
        customerNote: input.customerNote,
        internalNote: input.internalNote,
        subtotalTetri: input.subtotalTetri,
        discountTetri: input.discountTetri,
        totalTetri: input.totalTetri,
        createdByUserId: ctx.user.id,
        status: input.source === "PUBLIC_WEB" ? "PENDING" : "CONFIRMED",
      });

      await tx.insert(appointmentStatusHistory).values({
        id: nanoid(21),
        appointmentId: id,
        oldStatus: null,
        newStatus: input.source === "PUBLIC_WEB" ? "PENDING" : "CONFIRMED",
        actorUserId: ctx.user.id,
        metadata: { source: input.source },
      });
    });

    return { id };
  }),

  updateStatus: protectedProcedure.input(appointmentStatusUpdateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationAction(ctx.user, input.organizationId, "calendar:manage");
    const db = await requireDb();
    const [appointment] = await db.select().from(appointments).where(and(
      eq(appointments.id, input.appointmentId),
      eq(appointments.organizationId, input.organizationId),
    )).limit(1);
    if (!appointment) throw new Error("Appointment not found");
    if (!canTransitionAppointment(appointment.status, input.nextStatus)) throw new Error("Invalid appointment status transition");

    await db.transaction(async tx => {
      await tx.update(appointments).set({
        status: input.nextStatus,
        cancellationReason: input.nextStatus === "CANCELLED" ? input.reason ?? null : appointment.cancellationReason,
        cancelledByUserId: input.nextStatus === "CANCELLED" ? ctx.user.id : appointment.cancelledByUserId,
        cancelledAt: input.nextStatus === "CANCELLED" ? new Date() : appointment.cancelledAt,
      }).where(eq(appointments.id, appointment.id));

      await tx.insert(appointmentStatusHistory).values({
        id: nanoid(21),
        appointmentId: appointment.id,
        oldStatus: appointment.status,
        newStatus: input.nextStatus,
        actorUserId: ctx.user.id,
        reason: input.reason,
      });
    });

    return { success: true };
  }),

  dashboard: protectedProcedure.input(todayDashboardSchema).query(async ({ ctx, input }) => {
    const membership = await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const db = await requireDb();
    const activeLocations = await db.select().from(locations).where(and(
      eq(locations.organizationId, input.organizationId),
      eq(locations.status, "ACTIVE"),
    )).orderBy(asc(locations.name));
    const location = input.locationId
      ? activeLocations.find(item => item.id === input.locationId)
      : activeLocations[0];
    if (input.locationId && !location) throw new Error("Selected location does not belong to this organization");
    if (!location) return {
      location: null,
      dateKey: null,
      appointments: [],
      balances: [],
      counts: {},
      metrics: { scheduledTetri: 0, collectedTetri: 0, outstandingTetri: 0 },
    };

    const { startsAt, endsAt, dateKey } = businessDayRange(location.timezone);
    const conditions = [
      eq(appointments.organizationId, input.organizationId),
      eq(appointments.locationId, location.id),
      sql`${appointments.startsAt} >= ${startsAt}`,
      sql`${appointments.startsAt} < ${endsAt}`,
    ];
    if (membership.role === "STAFF") {
      const profiles = await db.select({ id: staffProfiles.id }).from(staffProfiles).where(eq(staffProfiles.membershipId, membership.id));
      if (!profiles.length) return {
        location: { id: location.id, name: location.name, timezone: location.timezone },
        dateKey,
        appointments: [],
        balances: [],
        counts: {},
        metrics: { scheduledTetri: 0, collectedTetri: 0, outstandingTetri: 0 },
      };
      conditions.push(inArray(appointments.staffProfileId, profiles.map(profile => profile.id)));
    }

    const appointmentRows = await db.select({
      appointment: appointments,
      clientFirstName: clients.firstName,
      clientLastName: clients.lastName,
      staffName: staffProfiles.publicDisplayName,
      staffColor: staffProfiles.color,
    }).from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .innerJoin(staffProfiles, eq(appointments.staffProfileId, staffProfiles.id))
      .where(and(...conditions))
      .orderBy(asc(appointments.startsAt));

    const appointmentIds = appointmentRows.map(item => item.appointment.id);
    const paymentRows = appointmentIds.length
      ? await db.select().from(payments).where(inArray(payments.appointmentId, appointmentIds))
      : [];
    const serviceRows = appointmentIds.length
      ? await db.select().from(appointmentServices).where(inArray(appointmentServices.appointmentId, appointmentIds)).orderBy(asc(appointmentServices.sortOrder))
      : [];

    const summary = summarizeOperationalAppointments(
      appointmentRows.map(row => row.appointment),
      paymentRows.map(payment => ({
        appointmentId: payment.appointmentId,
        amountTetri: payment.amountTetri,
        refundedTetri: payment.refundedTetri,
        status: payment.status,
      })),
    );

    return {
      location: { id: location.id, name: location.name, timezone: location.timezone },
      dateKey,
      appointments: appointmentRows.map(row => ({
        ...row.appointment,
        client: row.clientFirstName ? { firstName: row.clientFirstName, lastName: row.clientLastName } : null,
        staff: { id: row.appointment.staffProfileId, publicDisplayName: row.staffName, color: row.staffColor },
        services: serviceRows.filter(service => service.appointmentId === row.appointment.id).map(service => ({
          id: service.id,
          serviceNameSnapshot: service.serviceNameSnapshot,
          durationMinutesSnapshot: service.durationMinutesSnapshot,
          priceTetriSnapshot: service.priceTetriSnapshot,
        })),
      })),
      balances: summary.balances,
      counts: summary.counts,
      metrics: summary.metrics,
    };
  }),
});
