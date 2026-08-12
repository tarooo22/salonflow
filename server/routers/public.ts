import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { createHash, createHmac } from "node:crypto";
import { nanoid } from "nanoid";
import { appointmentServices, appointments, appointmentStatusHistory, clientConsents, clients, locations, scheduleLocks, serviceCategories, services, staffLocations, staffProfiles, staffServices } from "../../drizzle/schema";
import { requireDb } from "../db";
import { publicAvailabilityCheckSchema, publicBookingCommitSchema, slugSchema } from "../../shared/validation";
import { appointmentBlocksInterval, intervalsOverlap } from "../lib/appointments";
import { normalizeEmail, normalizeGeorgianPhone } from "../lib/normalization";
import { ENV } from "../_core/env";
import { publicProcedure, router } from "../_core/trpc";

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

function publicTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function confirmationTokenForAppointment(appointmentId: string) {
  if (!ENV.cookieSecret) throw new Error("Confirmation token secret is not configured");
  return createHmac("sha256", ENV.cookieSecret).update(`public-booking:${appointmentId}`).digest("base64url");
}

export const publicRouter = router({
  locations: publicProcedure.query(async () => {
    const db = await requireDb();
    return db.select({
      publicSlug: locations.publicSlug,
      name: locations.name,
      publicDescription: locations.publicDescription,
      timezone: locations.timezone,
      address: locations.address,
    }).from(locations).where(and(eq(locations.status, "ACTIVE"), eq(locations.bookingEnabled, true))).orderBy(asc(locations.name));
  }),

  bookingCatalog: publicProcedure.input(slugSchema).query(async ({ input: slug }) => {
    const db = await requireDb();
    const [location] = await db.select().from(locations).where(and(
      eq(locations.publicSlug, slug),
      eq(locations.status, "ACTIVE"),
      eq(locations.bookingEnabled, true),
    )).limit(1);
    if (!location) return null;
    const catalog = await db.select({ service: services, category: serviceCategories }).from(services)
      .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(and(eq(services.organizationId, location.organizationId), eq(services.status, "ACTIVE"), eq(services.onlineBookingEnabled, true)))
      .orderBy(asc(serviceCategories.sortOrder), asc(services.sortOrder));
    const team = await db.select({ id: staffProfiles.id, name: staffProfiles.publicDisplayName, specialty: staffProfiles.specialty, bio: staffProfiles.publicBio }).from(staffProfiles)
      .innerJoin(staffLocations, eq(staffProfiles.id, staffLocations.staffProfileId))
      .where(and(eq(staffLocations.locationId, location.id), eq(staffProfiles.status, "ACTIVE"), eq(staffProfiles.onlineBookingVisible, true)))
      .orderBy(asc(staffProfiles.sortOrder));
    return { location: { publicSlug: location.publicSlug, name: location.name, timezone: location.timezone, address: location.address }, catalog, team };
  }),

  checkAvailability: publicProcedure.input(publicAvailabilityCheckSchema).query(async ({ input }) => {
    const db = await requireDb();
    const [location] = await db.select().from(locations).where(and(
      eq(locations.publicSlug, input.slug),
      eq(locations.status, "ACTIVE"),
      eq(locations.bookingEnabled, true),
    )).limit(1);
    if (!location) return { available: false, reason: "LOCATION_UNAVAILABLE" as const };

    const [service] = await db.select().from(services).where(and(
      eq(services.id, input.serviceId),
      eq(services.organizationId, location.organizationId),
      eq(services.status, "ACTIVE"),
      eq(services.onlineBookingEnabled, true),
    )).limit(1);
    if (!service) return { available: false, reason: "SERVICE_UNAVAILABLE" as const };

    const [staffAtLocation] = await db.select().from(staffLocations).where(and(
      eq(staffLocations.staffProfileId, input.staffProfileId),
      eq(staffLocations.locationId, location.id),
    )).limit(1);
    const [staff] = await db.select().from(staffProfiles).where(and(
      eq(staffProfiles.id, input.staffProfileId),
      eq(staffProfiles.status, "ACTIVE"),
      eq(staffProfiles.onlineBookingVisible, true),
    )).limit(1);
    const [eligibility] = await db.select().from(staffServices).where(and(
      eq(staffServices.staffProfileId, input.staffProfileId),
      eq(staffServices.serviceId, service.id),
      eq(staffServices.canPerform, true),
    )).limit(1);
    if (!staffAtLocation || !staff || !eligibility) return { available: false, reason: "STAFF_UNAVAILABLE" as const };

    const now = new Date();
    const minimumStart = new Date(now.getTime() + location.minimumNoticeMinutes * 60_000);
    const maximumStart = new Date(now.getTime() + location.maximumAdvanceDays * 86_400_000);
    if (input.startsAt < minimumStart || input.startsAt > maximumStart) return { available: false, reason: "OUTSIDE_BOOKING_WINDOW" as const };

    const durationMinutes = eligibility.durationOverrideMinutes ?? service.defaultDurationMinutes;
    const endsAt = new Date(input.startsAt.getTime() + durationMinutes * 60_000);
    const protectedStart = new Date(input.startsAt.getTime() - service.bufferBeforeMinutes * 60_000);
    const protectedEnd = new Date(endsAt.getTime() + service.bufferAfterMinutes * 60_000);
    const existing = await db.select().from(appointments).where(and(
      eq(appointments.staffProfileId, staff.id),
      eq(appointments.locationId, location.id),
    ));
    const conflict = existing.some(appointment => appointmentBlocksInterval(appointment.status) && intervalsOverlap(
      protectedStart,
      protectedEnd,
      new Date(appointment.startsAt.getTime() - appointment.bufferBeforeMinutes * 60_000),
      new Date(appointment.endsAt.getTime() + appointment.bufferAfterMinutes * 60_000),
    ));
    return conflict
      ? { available: false, reason: "SLOT_UNAVAILABLE" as const }
      : { available: true, startsAt: input.startsAt, endsAt };
  }),

  commitBooking: publicProcedure.input(publicBookingCommitSchema).mutation(async ({ input }) => {
    const db = await requireDb();
    const normalizedPhone = normalizeGeorgianPhone(input.phone);
    if (!normalizedPhone) throw new Error("A valid Georgian mobile phone number is required");
    const normalizedEmail = normalizeEmail(input.email);

    const [previousAttempt] = await db.select({ id: appointments.id }).from(appointments)
      .where(eq(appointments.idempotencyKey, input.idempotencyKey)).limit(1);
    if (previousAttempt) return { confirmed: true, replayed: true, confirmationToken: confirmationTokenForAppointment(previousAttempt.id) };

    const [location] = await db.select().from(locations).where(and(
      eq(locations.publicSlug, input.slug),
      eq(locations.status, "ACTIVE"),
      eq(locations.bookingEnabled, true),
    )).limit(1);
    if (!location) throw new Error("This booking link is unavailable");

    const [service] = await db.select().from(services).where(and(
      eq(services.id, input.serviceId),
      eq(services.organizationId, location.organizationId),
      eq(services.status, "ACTIVE"),
      eq(services.onlineBookingEnabled, true),
    )).limit(1);
    if (!service) throw new Error("This service is unavailable for online booking");

    const [staff] = await db.select().from(staffProfiles).where(and(
      eq(staffProfiles.id, input.staffProfileId),
      eq(staffProfiles.status, "ACTIVE"),
      eq(staffProfiles.onlineBookingVisible, true),
    )).limit(1);
    const [staffAtLocation] = await db.select().from(staffLocations).where(and(
      eq(staffLocations.staffProfileId, input.staffProfileId),
      eq(staffLocations.locationId, location.id),
    )).limit(1);
    const [eligibility] = await db.select().from(staffServices).where(and(
      eq(staffServices.staffProfileId, input.staffProfileId),
      eq(staffServices.serviceId, service.id),
      eq(staffServices.canPerform, true),
    )).limit(1);
    if (!staff || !staffAtLocation || !eligibility) throw new Error("This specialist is unavailable for the selected service");

    const now = new Date();
    const minimumStart = new Date(now.getTime() + location.minimumNoticeMinutes * 60_000);
    const maximumStart = new Date(now.getTime() + location.maximumAdvanceDays * 86_400_000);
    if (input.startsAt < minimumStart || input.startsAt > maximumStart) throw new Error("The selected time falls outside the booking window");

    const durationMinutes = eligibility.durationOverrideMinutes ?? service.defaultDurationMinutes;
    const endsAt = new Date(input.startsAt.getTime() + durationMinutes * 60_000);
    const protectedStart = new Date(input.startsAt.getTime() - service.bufferBeforeMinutes * 60_000);
    const protectedEnd = new Date(endsAt.getTime() + service.bufferAfterMinutes * 60_000);
    const appointmentId = nanoid(21);
    const confirmationToken = confirmationTokenForAppointment(appointmentId);
    const tokenHash = publicTokenHash(confirmationToken);

    await db.transaction(async tx => {
      const [existingIdempotency] = await tx.select({ id: appointments.id }).from(appointments)
        .where(eq(appointments.idempotencyKey, input.idempotencyKey)).limit(1);
      if (existingIdempotency) return;

      for (const dateKey of enumerateUtcDates(protectedStart, protectedEnd)) {
        await tx.insert(scheduleLocks).values({
          id: `${staff.id}:${dateKey}`,
          staffProfileId: staff.id,
          localDate: new Date(`${dateKey}T00:00:00.000Z`),
        }).onDuplicateKeyUpdate({ set: { createdAt: new Date() } });
      }

      const concurrent = await tx.select().from(appointments).where(and(
        eq(appointments.staffProfileId, staff.id),
        eq(appointments.locationId, location.id),
        inArray(appointments.status, ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_SERVICE", "COMPLETED", "NO_SHOW"]),
      ));
      const conflict = concurrent.some(appointment => intervalsOverlap(
        protectedStart,
        protectedEnd,
        new Date(appointment.startsAt.getTime() - appointment.bufferBeforeMinutes * 60_000),
        new Date(appointment.endsAt.getTime() + appointment.bufferAfterMinutes * 60_000),
      ));
      if (conflict) throw new Error("The selected time is no longer available");

      const [matchedClient] = await tx.select().from(clients).where(and(
        eq(clients.organizationId, location.organizationId),
        eq(clients.normalizedPhone, normalizedPhone),
        eq(clients.status, "ACTIVE"),
      )).limit(1);
      const clientId = matchedClient?.id ?? nanoid(21);
      if (!matchedClient) {
        await tx.insert(clients).values({
          id: clientId,
          organizationId: location.organizationId,
          firstName: input.firstName,
          lastName: input.lastName,
          normalizedPhone,
          email: input.email,
          normalizedEmail,
          source: "PUBLIC_WEB",
        });
      }

      await tx.insert(appointments).values({
        id: appointmentId,
        organizationId: location.organizationId,
        locationId: location.id,
        clientId,
        staffProfileId: staff.id,
        startsAt: input.startsAt,
        endsAt,
        bufferBeforeMinutes: service.bufferBeforeMinutes,
        bufferAfterMinutes: service.bufferAfterMinutes,
        source: "PUBLIC_WEB",
        status: "PENDING",
        customerNote: input.customerNote,
        subtotalTetri: service.priceTetri,
        discountTetri: 0,
        totalTetri: service.priceTetri,
        publicTokenHash: tokenHash,
        publicTokenExpiresAt: new Date(input.startsAt.getTime() + 90 * 86_400_000),
        idempotencyKey: input.idempotencyKey,
      });
      await tx.insert(appointmentServices).values({
        id: nanoid(21),
        appointmentId,
        serviceId: service.id,
        staffProfileId: staff.id,
        serviceNameSnapshot: service.nameKa,
        durationMinutesSnapshot: durationMinutes,
        bufferBeforeMinutesSnapshot: service.bufferBeforeMinutes,
        bufferAfterMinutesSnapshot: service.bufferAfterMinutes,
        priceTetriSnapshot: service.priceTetri,
      });
      await tx.insert(appointmentStatusHistory).values({
        id: nanoid(21),
        appointmentId,
        oldStatus: null,
        newStatus: "PENDING",
        metadata: { source: "PUBLIC_WEB", idempotencyKey: input.idempotencyKey },
      });
      await tx.insert(clientConsents).values({
        id: nanoid(21),
        clientId,
        consentType: "BOOKING_TERMS",
        granted: true,
        source: "PUBLIC_WEB",
        grantedAt: new Date(),
      });
    });

    const [persistedAppointment] = await db.select({ id: appointments.id }).from(appointments)
      .where(eq(appointments.idempotencyKey, input.idempotencyKey)).limit(1);
    if (!persistedAppointment) throw new Error("Booking confirmation could not be persisted");
    return {
      confirmed: true,
      replayed: persistedAppointment.id !== appointmentId,
      confirmationToken: confirmationTokenForAppointment(persistedAppointment.id),
    };
  }),
});
