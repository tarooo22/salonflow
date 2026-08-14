import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { createHash, createHmac } from "node:crypto";
import { nanoid } from "nanoid";
import { appointmentServices, appointments, appointmentStatusHistory, clientConsents, clients, locations, scheduleLocks, serviceCategories, services, staffLocations, staffProfiles, staffServices, workingHourRules } from "../../drizzle/schema";
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
    const locationRows = await db.select({
      organizationId: locations.organizationId,
      publicSlug: locations.publicSlug,
      name: locations.name,
      publicDescription: locations.publicDescription,
      timezone: locations.timezone,
      address: locations.address,
    }).from(locations).where(and(eq(locations.status, "ACTIVE"), eq(locations.bookingEnabled, true))).orderBy(asc(locations.name));
    const organizationIds = Array.from(new Set(locationRows.map(location => location.organizationId)));
    const categoryRows = organizationIds.length ? await db.select({ organizationId: services.organizationId, nameKa: serviceCategories.nameKa }).from(services)
      .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(and(inArray(services.organizationId, organizationIds), eq(services.status, "ACTIVE"), eq(services.onlineBookingEnabled, true))) : [];
    const categoriesByOrganization = new Map<string, string[]>();
    for (const category of categoryRows) categoriesByOrganization.set(category.organizationId, Array.from(new Set([...(categoriesByOrganization.get(category.organizationId) ?? []), category.nameKa])));
    return locationRows.map(({ organizationId, ...location }) => ({ ...location, categories: categoriesByOrganization.get(organizationId) ?? [] }));
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
    const teamRows = await db.select({ id: staffProfiles.id, name: staffProfiles.publicDisplayName, specialty: staffProfiles.specialty, bio: staffProfiles.publicBio, serviceId: staffServices.serviceId }).from(staffProfiles)
      .innerJoin(staffLocations, eq(staffProfiles.id, staffLocations.staffProfileId))
      .innerJoin(staffServices, eq(staffProfiles.id, staffServices.staffProfileId))
      .where(and(eq(staffLocations.locationId, location.id), eq(staffProfiles.status, "ACTIVE"), eq(staffProfiles.onlineBookingVisible, true), eq(staffServices.canPerform, true)))
      .orderBy(asc(staffProfiles.sortOrder));
    const team = Array.from(teamRows.reduce((acc, row) => {
      const existing = acc.get(row.id);
      if (existing) existing.eligibleServiceIds.push(row.serviceId);
      else acc.set(row.id, { id: row.id, name: row.name, specialty: row.specialty, bio: row.bio, eligibleServiceIds: [row.serviceId] });
      return acc;
    }, new Map<string, { id: string; name: string; specialty: string | null; bio: string | null; eligibleServiceIds: string[] }>()).values());
    const hourRows = await db.select({ weekday: workingHourRules.weekday, startLocalTime: workingHourRules.startLocalTime, endLocalTime: workingHourRules.endLocalTime }).from(workingHourRules)
      .innerJoin(staffProfiles, eq(workingHourRules.staffProfileId, staffProfiles.id))
      .where(and(eq(workingHourRules.locationId, location.id), eq(staffProfiles.status, "ACTIVE")));
    const workingHours = Array.from(hourRows.reduce((hours, rule) => {
      const existing = hours.get(rule.weekday);
      if (!existing) hours.set(rule.weekday, { weekday: rule.weekday, startLocalTime: rule.startLocalTime, endLocalTime: rule.endLocalTime });
      else hours.set(rule.weekday, { weekday: rule.weekday, startLocalTime: existing.startLocalTime < rule.startLocalTime ? existing.startLocalTime : rule.startLocalTime, endLocalTime: existing.endLocalTime > rule.endLocalTime ? existing.endLocalTime : rule.endLocalTime });
      return hours;
    }, new Map<number, { weekday: number; startLocalTime: string; endLocalTime: string }>()).values()).sort((a, b) => a.weekday - b.weekday);
    return { location: { publicSlug: location.publicSlug, name: location.name, timezone: location.timezone, address: location.address, phone: location.phone, email: location.email, publicDescription: location.publicDescription, workingHours }, catalog, team };
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

    if (input.staffProfileId === "ANY_AVAILABLE") {
      const candidates = await db.select({ id: staffProfiles.id, name: staffProfiles.publicDisplayName, durationOverrideMinutes: staffServices.durationOverrideMinutes }).from(staffProfiles)
        .innerJoin(staffLocations, eq(staffProfiles.id, staffLocations.staffProfileId))
        .innerJoin(staffServices, eq(staffProfiles.id, staffServices.staffProfileId))
        .where(and(eq(staffLocations.locationId, location.id), eq(staffServices.serviceId, service.id), eq(staffServices.canPerform, true), eq(staffProfiles.status, "ACTIVE"), eq(staffProfiles.onlineBookingVisible, true)))
        .orderBy(asc(staffProfiles.sortOrder));
      if (!candidates.length) return { available: false, reason: "STAFF_UNAVAILABLE" as const };
      const now = new Date();
      const minimumStart = new Date(now.getTime() + location.minimumNoticeMinutes * 60_000);
      const maximumStart = new Date(now.getTime() + location.maximumAdvanceDays * 86_400_000);
      if (input.startsAt < minimumStart || input.startsAt > maximumStart) return { available: false, reason: "OUTSIDE_BOOKING_WINDOW" as const };
      for (const candidate of candidates) {
        const durationMinutes = candidate.durationOverrideMinutes ?? service.defaultDurationMinutes;
        const endsAt = new Date(input.startsAt.getTime() + durationMinutes * 60_000);
        const protectedStart = new Date(input.startsAt.getTime() - service.bufferBeforeMinutes * 60_000);
        const protectedEnd = new Date(endsAt.getTime() + service.bufferAfterMinutes * 60_000);
        const existing = await db.select().from(appointments).where(and(eq(appointments.staffProfileId, candidate.id), eq(appointments.locationId, location.id)));
        const conflict = existing.some(appointment => appointmentBlocksInterval(appointment.status) && intervalsOverlap(protectedStart, protectedEnd, new Date(appointment.startsAt.getTime() - appointment.bufferBeforeMinutes * 60_000), new Date(appointment.endsAt.getTime() + appointment.bufferAfterMinutes * 60_000)));
        if (!conflict) return { available: true, startsAt: input.startsAt, endsAt, staffProfileId: candidate.id, staffName: candidate.name };
      }
      return { available: false, reason: "SLOT_UNAVAILABLE" as const };
    }

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
    if (previousAttempt) {
      const [assignment] = await db.select({ name: staffProfiles.publicDisplayName }).from(appointments)
        .innerJoin(staffProfiles, eq(appointments.staffProfileId, staffProfiles.id))
        .where(eq(appointments.id, previousAttempt.id)).limit(1);
      return { confirmed: true, replayed: true, confirmationToken: confirmationTokenForAppointment(previousAttempt.id), assignedStaffName: assignment?.name };
    }

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

    const candidates = input.staffProfileId === "ANY_AVAILABLE"
      ? await db.select({ id: staffProfiles.id, name: staffProfiles.publicDisplayName, durationOverrideMinutes: staffServices.durationOverrideMinutes }).from(staffProfiles)
        .innerJoin(staffLocations, eq(staffProfiles.id, staffLocations.staffProfileId))
        .innerJoin(staffServices, eq(staffProfiles.id, staffServices.staffProfileId))
        .where(and(eq(staffLocations.locationId, location.id), eq(staffServices.serviceId, service.id), eq(staffServices.canPerform, true), eq(staffProfiles.status, "ACTIVE"), eq(staffProfiles.onlineBookingVisible, true)))
        .orderBy(asc(staffProfiles.sortOrder))
      : await (async () => {
        const [staff] = await db.select().from(staffProfiles).where(and(eq(staffProfiles.id, input.staffProfileId), eq(staffProfiles.status, "ACTIVE"), eq(staffProfiles.onlineBookingVisible, true))).limit(1);
        const [staffAtLocation] = await db.select().from(staffLocations).where(and(eq(staffLocations.staffProfileId, input.staffProfileId), eq(staffLocations.locationId, location.id))).limit(1);
        const [eligibility] = await db.select().from(staffServices).where(and(eq(staffServices.staffProfileId, input.staffProfileId), eq(staffServices.serviceId, service.id), eq(staffServices.canPerform, true))).limit(1);
        return staff && staffAtLocation && eligibility ? [{ id: staff.id, name: staff.publicDisplayName, durationOverrideMinutes: eligibility.durationOverrideMinutes }] : [];
      })();
    if (!candidates.length) throw new Error("This specialist is unavailable for the selected service");

    const now = new Date();
    const minimumStart = new Date(now.getTime() + location.minimumNoticeMinutes * 60_000);
    const maximumStart = new Date(now.getTime() + location.maximumAdvanceDays * 86_400_000);
    if (input.startsAt < minimumStart || input.startsAt > maximumStart) throw new Error("The selected time falls outside the booking window");

    const appointmentId = nanoid(21);
    const confirmationToken = confirmationTokenForAppointment(appointmentId);
    const tokenHash = publicTokenHash(confirmationToken);

    let assigned: { id: string; name: string; durationMinutes: number; endsAt: Date } | undefined;
    await db.transaction(async tx => {
      const [existingIdempotency] = await tx.select({ id: appointments.id }).from(appointments)
        .where(eq(appointments.idempotencyKey, input.idempotencyKey)).limit(1);
      if (existingIdempotency) return;

      for (const candidate of candidates) {
        const durationMinutes = candidate.durationOverrideMinutes ?? service.defaultDurationMinutes;
        const endsAt = new Date(input.startsAt.getTime() + durationMinutes * 60_000);
        const protectedStart = new Date(input.startsAt.getTime() - service.bufferBeforeMinutes * 60_000);
        const protectedEnd = new Date(endsAt.getTime() + service.bufferAfterMinutes * 60_000);
        for (const dateKey of enumerateUtcDates(protectedStart, protectedEnd)) await tx.insert(scheduleLocks).values({ id: `${candidate.id}:${dateKey}`, staffProfileId: candidate.id, localDate: new Date(`${dateKey}T00:00:00.000Z`) }).onDuplicateKeyUpdate({ set: { createdAt: new Date() } });
        const concurrent = await tx.select().from(appointments).where(and(eq(appointments.staffProfileId, candidate.id), eq(appointments.locationId, location.id), inArray(appointments.status, ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_SERVICE", "COMPLETED", "NO_SHOW"])));
        const conflict = concurrent.some(appointment => intervalsOverlap(protectedStart, protectedEnd, new Date(appointment.startsAt.getTime() - appointment.bufferBeforeMinutes * 60_000), new Date(appointment.endsAt.getTime() + appointment.bufferAfterMinutes * 60_000)));
        if (!conflict) { assigned = { id: candidate.id, name: candidate.name, durationMinutes, endsAt }; break; }
      }
      if (!assigned) throw new Error("The selected time is no longer available");

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
        staffProfileId: assigned.id,
        startsAt: input.startsAt,
        endsAt: assigned.endsAt,
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
        staffProfileId: assigned.id,
        serviceNameSnapshot: service.nameKa,
        durationMinutesSnapshot: assigned.durationMinutes,
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
      assignedStaffName: assigned?.name,
    };
  }),
});
