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
  staffLocations,
  staffServices,
  services,
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { requireOrganizationAction, requireOrganizationRole, type SalonRole } from "../access";
import { requireDb } from "../db";
import { appointmentBlocksInterval, canTransitionAppointment, derivePaymentDisplayState, intervalsOverlap, summarizeOperationalAppointments } from "../lib/appointments";
import { exceptionBlocks, fetchBlockingExceptions, fitsWorkingHours } from "../lib/availability";
import { appointmentRescheduleSchema, appointmentStatusUpdateSchema, calendarRangeSchema, opaqueIdSchema, organizationScopeSchema, todayDashboardSchema, walkInCreateSchema } from "../../shared/validation";
import { protectedProcedure, router } from "../_core/trpc";
import { businessDayRange } from "@shared/timezones";

type Db = Awaited<ReturnType<typeof requireDb>>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

// A move may not land in the past; a walk-in is often entered after the client has already sat down, so it gets more slack.
const RESCHEDULE_PAST_GRACE_MS = 5 * 60_000;
const WALK_IN_PAST_GRACE_MS = 30 * 60_000;
const OUTSIDE_HOURS_MESSAGE = "არჩეული დრო სპეციალისტის სამუშაო საათებს სცდება.";

function assertNotPast(startsAt: Date, graceMs: number) {
  if (startsAt.getTime() < Date.now() - graceMs) throw new TRPCError({ code: "BAD_REQUEST", message: "გასულ დროზე ჩაწერა შეუძლებელია. აირჩიეთ მიმდინარე ან მომავალი დრო." });
}

function assertOverrideAllowed(role: SalonRole | undefined, allowOutsideHours: boolean | undefined) {
  if (allowOutsideHours && role !== "OWNER" && role !== "MANAGER") throw new TRPCError({ code: "FORBIDDEN", message: "სამუშაო საათების გარეთ ჩაწერა მხოლოდ მფლობელს ან მენეჯერს შეუძლია." });
}

/**
 * Runs inside the booking transaction, after the scheduleLocks upserts. Working/opening hours (skipped only by the
 * owner/manager override), blocking exceptions, then the buffered overlap the public booking path uses.
 */
async function assertStaffSlotFree(tx: Tx, slot: {
  organizationId: string;
  location: { id: string; organizationId: string; timezone: string };
  staffProfileId: string;
  startsAt: Date;
  endsAt: Date;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  ignoreAppointmentId?: string;
  allowOutsideHours?: boolean;
}) {
  const { location, staffProfileId, startsAt, endsAt } = slot;
  if (!slot.allowOutsideHours && !await fitsWorkingHours(tx, location, staffProfileId, startsAt, endsAt, slot.bufferAfterMinutes)) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: OUTSIDE_HOURS_MESSAGE });
  }
  const exceptions = await fetchBlockingExceptions(tx, location, startsAt, endsAt);
  if (exceptions.some(exception => exceptionBlocks(exception, location.id, staffProfileId, startsAt, endsAt))) {
    throw new TRPCError({ code: "CONFLICT", message: "ამ დროს სპეციალისტი ან ფილიალი მიუწვდომელია (შვებულება, შესვენება ან დახურვა)." });
  }
  const protectedStart = new Date(startsAt.getTime() - slot.bufferBeforeMinutes * 60_000);
  const protectedEnd = new Date(endsAt.getTime() + slot.bufferAfterMinutes * 60_000);
  const existing = await tx.select().from(appointments).where(and(eq(appointments.organizationId, slot.organizationId), eq(appointments.staffProfileId, staffProfileId)));
  if (existing.some(item => item.id !== slot.ignoreAppointmentId && appointmentBlocksInterval(item.status) && intervalsOverlap(protectedStart, protectedEnd, new Date(item.startsAt.getTime() - item.bufferBeforeMinutes * 60_000), new Date(item.endsAt.getTime() + item.bufferAfterMinutes * 60_000)))) {
    throw new TRPCError({ code: "CONFLICT", message: "არჩეული დრო უკვე დაკავებულია." });
  }
}

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
  walkInOptions: protectedProcedure.input(organizationScopeSchema.extend({ locationId: opaqueIdSchema })).query(async ({ ctx, input }) => {
    await requireOrganizationAction(ctx.user, input.organizationId, "calendar:manage");
    const db = await requireDb();
    return db.select({
      staffProfileId: staffProfiles.id,
      staffName: staffProfiles.publicDisplayName,
      serviceId: services.id,
      serviceName: services.nameKa,
      durationMinutes: staffServices.durationOverrideMinutes,
      defaultDurationMinutes: services.defaultDurationMinutes,
      priceTetri: staffServices.priceOverrideTetri,
      defaultPriceTetri: services.priceTetri,
    }).from(staffProfiles)
      .innerJoin(organizationMemberships, eq(staffProfiles.membershipId, organizationMemberships.id))
      .innerJoin(staffLocations, and(eq(staffLocations.staffProfileId, staffProfiles.id), eq(staffLocations.locationId, input.locationId)))
      .innerJoin(staffServices, and(eq(staffServices.staffProfileId, staffProfiles.id), eq(staffServices.canPerform, true)))
      .innerJoin(services, and(eq(services.id, staffServices.serviceId), eq(services.organizationId, input.organizationId), eq(services.status, "ACTIVE")))
      .where(and(eq(staffProfiles.status, "ACTIVE"), eq(organizationMemberships.organizationId, input.organizationId), eq(organizationMemberships.status, "ACTIVE")))
      .orderBy(asc(staffProfiles.publicDisplayName), asc(services.nameKa));
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
      const assignments = await db.select({ locationId: staffLocations.locationId }).from(staffLocations).where(inArray(staffLocations.staffProfileId, profileIds));
      const locationIds = assignments.map(assignment => assignment.locationId);
      if (!locationIds.length || (input.locationId && !locationIds.includes(input.locationId))) return [];
      conditions.push(inArray(appointments.staffProfileId, profileIds));
      conditions.push(inArray(appointments.locationId, locationIds));
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
    const paymentRows = appointmentIds.length
      ? await db.select().from(payments).where(inArray(payments.appointmentId, appointmentIds))
      : [];
    const paymentByAppointment = new Map(rows.map(row => [
      row.appointment.id,
      derivePaymentDisplayState(row.appointment.totalTetri, paymentRows.filter(payment => payment.appointmentId === row.appointment.id)),
    ]));

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
      payment: paymentByAppointment.get(row.appointment.id),
    }));
  }),

  createWalkIn: protectedProcedure.input(walkInCreateSchema).mutation(async ({ ctx, input }) => {
    const membership = await requireOrganizationAction(ctx.user, input.organizationId, "calendar:manage");
    assertOverrideAllowed(membership?.role, input.allowOutsideHours);
    assertNotPast(input.startsAt, WALK_IN_PAST_GRACE_MS);
    const db = await requireDb();
    const [location] = await db.select({ id: locations.id, organizationId: locations.organizationId, timezone: locations.timezone }).from(locations).where(and(
      eq(locations.id, input.locationId),
      eq(locations.organizationId, input.organizationId),
      eq(locations.status, "ACTIVE"),
    )).limit(1);
    if (!location) throw new Error("არჩეული ფილიალი მიუწვდომელია.");
    if (input.clientId) {
      const [client] = await db.select({ id: clients.id }).from(clients).where(and(
        eq(clients.id, input.clientId),
        eq(clients.organizationId, input.organizationId),
        eq(clients.status, "ACTIVE"),
      )).limit(1);
      if (!client) throw new Error("არჩეული კლიენტი მიუწვდომელია.");
    }
    const [assignment] = await db.select({
      staffProfileId: staffProfiles.id,
      serviceId: services.id,
      serviceName: services.nameKa,
      serviceDurationMinutes: services.defaultDurationMinutes,
      serviceBufferBeforeMinutes: services.bufferBeforeMinutes,
      serviceBufferAfterMinutes: services.bufferAfterMinutes,
      servicePriceTetri: services.priceTetri,
      durationOverrideMinutes: staffServices.durationOverrideMinutes,
      priceOverrideTetri: staffServices.priceOverrideTetri,
    }).from(staffProfiles)
      .innerJoin(organizationMemberships, eq(staffProfiles.membershipId, organizationMemberships.id))
      .innerJoin(staffLocations, and(eq(staffLocations.staffProfileId, staffProfiles.id), eq(staffLocations.locationId, input.locationId)))
      .innerJoin(staffServices, and(eq(staffServices.staffProfileId, staffProfiles.id), eq(staffServices.serviceId, input.serviceId), eq(staffServices.canPerform, true)))
      .innerJoin(services, and(eq(services.id, staffServices.serviceId), eq(services.organizationId, input.organizationId), eq(services.status, "ACTIVE")))
      .where(and(
        eq(staffProfiles.id, input.staffProfileId),
        eq(staffProfiles.status, "ACTIVE"),
        eq(organizationMemberships.organizationId, input.organizationId),
        eq(organizationMemberships.status, "ACTIVE"),
      )).limit(1);
    if (!assignment) throw new Error("არჩეული სპეციალისტი ამ სერვისისთვის ან ფილიალისთვის მიუწვდომელია.");
    const durationMinutes = assignment.durationOverrideMinutes ?? assignment.serviceDurationMinutes;
    const priceTetri = assignment.priceOverrideTetri ?? assignment.servicePriceTetri;
    const startsAt = input.startsAt;
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
    const id = nanoid(21);
    const bufferBeforeMinutes = assignment.serviceBufferBeforeMinutes;
    const bufferAfterMinutes = assignment.serviceBufferAfterMinutes;
    await db.transaction(async tx => {
      // Lock every UTC day the buffered interval touches, so buffer-only overlaps across midnight still serialize.
      for (const dateKey of enumerateUtcDates(new Date(startsAt.getTime() - bufferBeforeMinutes * 60_000), new Date(endsAt.getTime() + bufferAfterMinutes * 60_000))) {
        await tx.insert(scheduleLocks).values({ id: `${input.staffProfileId}:${dateKey}`, staffProfileId: input.staffProfileId, localDate: new Date(`${dateKey}T00:00:00.000Z`) }).onDuplicateKeyUpdate({ set: { createdAt: new Date() } });
      }
      await assertStaffSlotFree(tx, { organizationId: input.organizationId, location, staffProfileId: input.staffProfileId, startsAt, endsAt, bufferBeforeMinutes, bufferAfterMinutes, allowOutsideHours: input.allowOutsideHours });
      await tx.insert(appointments).values({
        id, organizationId: input.organizationId, locationId: input.locationId, clientId: input.clientId,
        staffProfileId: input.staffProfileId, startsAt, endsAt,
        bufferBeforeMinutes: assignment.serviceBufferBeforeMinutes, bufferAfterMinutes: assignment.serviceBufferAfterMinutes,
        source: "WALK_IN", internalNote: input.internalNote, subtotalTetri: priceTetri, discountTetri: 0, totalTetri: priceTetri,
        createdByUserId: ctx.user.id, status: "CONFIRMED",
      });
      await tx.insert(appointmentServices).values({
        id: nanoid(21), appointmentId: id, serviceId: assignment.serviceId, staffProfileId: assignment.staffProfileId,
        serviceNameSnapshot: assignment.serviceName, durationMinutesSnapshot: durationMinutes,
        bufferBeforeMinutesSnapshot: assignment.serviceBufferBeforeMinutes, bufferAfterMinutesSnapshot: assignment.serviceBufferAfterMinutes,
        priceTetriSnapshot: priceTetri, sortOrder: 0,
      });
      await tx.insert(appointmentStatusHistory).values({ id: nanoid(21), appointmentId: id, oldStatus: null, newStatus: "CONFIRMED", actorUserId: ctx.user.id, metadata: { source: "WALK_IN", ...(input.allowOutsideHours ? { allowOutsideHours: true } : {}) } });
    });
    return { id, startsAt, endsAt, totalTetri: priceTetri };
  }),

  reschedule: protectedProcedure.input(appointmentRescheduleSchema).mutation(async ({ ctx, input }) => {
    const membership = await requireOrganizationAction(ctx.user, input.organizationId, "calendar:manage");
    assertOverrideAllowed(membership?.role, input.allowOutsideHours);
    const db = await requireDb();
    const [appointment] = await db.select().from(appointments).where(and(eq(appointments.id, input.appointmentId), eq(appointments.organizationId, input.organizationId))).limit(1);
    if (!appointment) throw new Error("ჯავშანი ვერ მოიძებნა.");
    if (!(appointment.status === "PENDING" || appointment.status === "CONFIRMED")) throw new Error("ამ სტატუსის ჯავშნის გადატანა აღარ შეიძლება.");
    assertNotPast(input.startsAt, RESCHEDULE_PAST_GRACE_MS);
    const [location] = await db.select({ id: locations.id, organizationId: locations.organizationId, timezone: locations.timezone }).from(locations).where(and(eq(locations.id, appointment.locationId), eq(locations.organizationId, input.organizationId))).limit(1);
    if (!location) throw new TRPCError({ code: "NOT_FOUND", message: "ჯავშნის ფილიალი ვერ მოიძებნა." });
    const targetStaffProfileId = input.staffProfileId ?? appointment.staffProfileId;
    if (targetStaffProfileId !== appointment.staffProfileId) {
      const bookedServices = await db.select({ serviceId: appointmentServices.serviceId }).from(appointmentServices).where(eq(appointmentServices.appointmentId, appointment.id));
      const serviceIds = bookedServices.flatMap(item => item.serviceId ? [item.serviceId] : []);
      if (!serviceIds.length) throw new Error("ამ ჩანაწერის სპეციალისტის შეცვლა ვერ მოხერხდა, რადგან სერვისის მონაცემი არასრულია.");
      const eligibleRows = await db.select({ serviceId: staffServices.serviceId }).from(staffProfiles)
        .innerJoin(organizationMemberships, eq(staffProfiles.membershipId, organizationMemberships.id))
        .innerJoin(staffLocations, and(eq(staffLocations.staffProfileId, staffProfiles.id), eq(staffLocations.locationId, appointment.locationId)))
        .innerJoin(staffServices, and(eq(staffServices.staffProfileId, staffProfiles.id), eq(staffServices.canPerform, true), inArray(staffServices.serviceId, serviceIds)))
        .where(and(eq(staffProfiles.id, targetStaffProfileId), eq(staffProfiles.status, "ACTIVE"), eq(organizationMemberships.organizationId, input.organizationId), eq(organizationMemberships.status, "ACTIVE")));
      if (new Set(eligibleRows.map(row => row.serviceId)).size !== new Set(serviceIds).size) throw new Error("არჩეული სპეციალისტი ამ ფილიალში ყველა სერვისისთვის ხელმისაწვდომი არ არის.");
    }
    const endsAt = new Date(input.startsAt.getTime() + appointment.endsAt.getTime() - appointment.startsAt.getTime());
    const { bufferBeforeMinutes, bufferAfterMinutes } = appointment;
    await db.transaction(async tx => {
      // Lock every UTC day the buffered interval touches, so buffer-only overlaps across midnight still serialize.
      for (const dateKey of enumerateUtcDates(new Date(input.startsAt.getTime() - bufferBeforeMinutes * 60_000), new Date(endsAt.getTime() + bufferAfterMinutes * 60_000))) {
        await tx.insert(scheduleLocks).values({ id: `${targetStaffProfileId}:${dateKey}`, staffProfileId: targetStaffProfileId, localDate: new Date(`${dateKey}T00:00:00.000Z`) }).onDuplicateKeyUpdate({ set: { createdAt: new Date() } });
      }
      await assertStaffSlotFree(tx, { organizationId: input.organizationId, location, staffProfileId: targetStaffProfileId, startsAt: input.startsAt, endsAt, bufferBeforeMinutes, bufferAfterMinutes, ignoreAppointmentId: appointment.id, allowOutsideHours: input.allowOutsideHours });
      await tx.update(appointments).set({ staffProfileId: targetStaffProfileId, startsAt: input.startsAt, endsAt }).where(eq(appointments.id, appointment.id));
      await tx.insert(appointmentStatusHistory).values({
        id: nanoid(21), appointmentId: appointment.id, oldStatus: appointment.status, newStatus: appointment.status, actorUserId: ctx.user.id,
        reason: input.reason, metadata: { event: "RESCHEDULED", previousStartsAt: appointment.startsAt.toISOString(), previousEndsAt: appointment.endsAt.toISOString(), previousStaffProfileId: appointment.staffProfileId, staffProfileId: targetStaffProfileId, startsAt: input.startsAt.toISOString(), endsAt: endsAt.toISOString(), ...(input.allowOutsideHours ? { allowOutsideHours: true } : {}) },
      });
    });
    return { id: appointment.id, startsAt: input.startsAt, endsAt };
  }),

  updateStatus: protectedProcedure.input(appointmentStatusUpdateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationAction(ctx.user, input.organizationId, "appointments:confirm");
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
    const ownProfiles = membership.role === "STAFF"
      ? await db.select({ id: staffProfiles.id }).from(staffProfiles).where(eq(staffProfiles.membershipId, membership.id))
      : [];
    const ownProfileIds = ownProfiles.map(profile => profile.id);
    const ownLocationIds = membership.role === "STAFF" && ownProfileIds.length
      ? (await db.select({ locationId: staffLocations.locationId }).from(staffLocations).where(inArray(staffLocations.staffProfileId, ownProfileIds))).map(row => row.locationId)
      : [];
    const visibleLocations = membership.role === "STAFF"
      ? activeLocations.filter(item => ownLocationIds.includes(item.id))
      : activeLocations;
    const location = input.locationId
      ? visibleLocations.find(item => item.id === input.locationId)
      : visibleLocations[0];
    if (input.locationId && !location && membership.role === "STAFF") return {
      location: null,
      dateKey: null,
      appointments: [],
      balances: [],
      counts: {},
      metrics: { scheduledTetri: 0, collectedTetri: 0, outstandingTetri: 0 },
    };
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
      if (!ownProfileIds.length) return {
        location: { id: location.id, name: location.name, timezone: location.timezone },
        dateKey,
        appointments: [],
        balances: [],
        counts: {},
        metrics: { scheduledTetri: 0, collectedTetri: 0, outstandingTetri: 0 },
      };
      conditions.push(inArray(appointments.staffProfileId, ownProfileIds));
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
    const paymentByAppointment = new Map(appointmentRows.map(row => [
      row.appointment.id,
      derivePaymentDisplayState(row.appointment.totalTetri, paymentRows.filter(payment => payment.appointmentId === row.appointment.id)),
    ]));

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
        payment: paymentByAppointment.get(row.appointment.id),
      })),
      balances: summary.balances,
      counts: summary.counts,
      metrics: summary.metrics,
    };
  }),
});
