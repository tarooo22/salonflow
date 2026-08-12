import { and, asc, eq } from "drizzle-orm";
import { appointments, locations, serviceCategories, services, staffLocations, staffProfiles, staffServices } from "../../drizzle/schema";
import { requireDb } from "../db";
import { publicAvailabilityCheckSchema, slugSchema } from "../../shared/validation";
import { appointmentBlocksInterval, intervalsOverlap } from "../lib/appointments";
import { publicProcedure, router } from "../_core/trpc";

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
});
