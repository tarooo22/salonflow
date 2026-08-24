import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { createHash, createHmac } from "node:crypto";
import { nanoid } from "nanoid";
import { appointmentServices, appointments, appointmentStatusHistory, clientConsents, clientMediaItems, clientMediaSets, clients, customerFeedback, customerFeedbackEvents, locationFeedPosts, locations, organizations, scheduleLocks, serviceCategories, services, staffLocations, staffProfiles, staffServices, waitlistEntries, workingHourRules } from "../../drizzle/schema";
import { requireDb } from "../db";
import { publicAvailabilityCheckSchema, publicAvailableSlotsSchema, publicBookingCancelSchema, publicBookingCommitSchema, publicBookingRescheduleSchema, publicBookingTokenSchema, publicFeedbackSubmitSchema, publicFeedbackTokenSchema, publicMultiAvailabilityCheckSchema, publicMultiAvailableSlotsSchema, publicMultiBookingCommitSchema, publicWaitlistCreateSchema, slugSchema } from "../../shared/validation";
import { appointmentBlocksInterval, intervalsOverlap } from "../lib/appointments";
import { generateAvailableSlots, type BusyInterval } from "../lib/availability";
import { formatTimeInTimeZone, zonedDateTimeToUtc } from "../../shared/timezones";
import { normalizeEmail, normalizeGeorgianPhone } from "../lib/normalization";
import { ENV } from "../_core/env";
import { mediaUrl } from "../lib/media";
import { publicProcedure, router } from "../_core/trpc";
import { isOrganizationTrialPublicBookingActive } from "../lib/trialAccess";

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

async function appointmentForPublicToken(db: Awaited<ReturnType<typeof requireDb>>, token: string) {
  const tokenHash = publicTokenHash(token);
  const [appointment] = await db.select().from(appointments).where(eq(appointments.publicTokenHash, tokenHash)).limit(1);
  if (!appointment || !appointment.publicTokenExpiresAt || appointment.publicTokenExpiresAt <= new Date()) throw new Error("ჯავშნის მართვის ბმული არასწორია ან ვადა გაუვიდა.");
  return appointment;
}

export function canCustomerManage(appointment: { status: string; startsAt: Date }, cutoffMinutes: number, now = Date.now()) {
  return (appointment.status === "PENDING" || appointment.status === "CONFIRMED") && appointment.startsAt.getTime() - now > cutoffMinutes * 60_000;
}

type MultiServiceSnapshot = { id: string; nameKa: string; durationMinutes: number; priceTetri: number; bufferBeforeMinutes: number; bufferAfterMinutes: number };
type MultiCandidate = { id: string; name: string; services: MultiServiceSnapshot[]; durationMinutes: number; totalTetri: number; bufferBeforeMinutes: number; bufferAfterMinutes: number };

async function resolveMultiCandidates(db: Awaited<ReturnType<typeof requireDb>>, location: typeof locations.$inferSelect, serviceIds: string[], requestedStaffId: string) {
  const serviceRows = await db.select().from(services).where(and(inArray(services.id, serviceIds), eq(services.organizationId, location.organizationId), eq(services.status, "ACTIVE"), eq(services.onlineBookingEnabled, true)));
  if (serviceRows.length !== serviceIds.length) throw new Error("არჩეული სერვისებიდან ერთი ან მეტი ონლაინ ჩაწერისთვის მიუწვდომელია.");
  const rows = await db.select({ id: staffProfiles.id, name: staffProfiles.publicDisplayName, serviceId: staffServices.serviceId, durationOverrideMinutes: staffServices.durationOverrideMinutes, priceOverrideTetri: staffServices.priceOverrideTetri }).from(staffProfiles)
    .innerJoin(staffLocations, eq(staffProfiles.id, staffLocations.staffProfileId))
    .innerJoin(staffServices, eq(staffProfiles.id, staffServices.staffProfileId))
    .where(and(eq(staffLocations.locationId, location.id), inArray(staffServices.serviceId, serviceIds), eq(staffServices.canPerform, true), eq(staffProfiles.status, "ACTIVE"), eq(staffProfiles.onlineBookingVisible, true), requestedStaffId === "ANY_AVAILABLE" ? undefined : eq(staffProfiles.id, requestedStaffId)));
  const serviceById = new Map(serviceRows.map(service => [service.id, service]));
  const byStaff = new Map<string, { id: string; name: string; eligibility: Map<string, { durationOverrideMinutes: number | null; priceOverrideTetri: number | null }> }>();
  for (const row of rows) {
    const candidate = byStaff.get(row.id) ?? { id: row.id, name: row.name, eligibility: new Map() };
    candidate.eligibility.set(row.serviceId, { durationOverrideMinutes: row.durationOverrideMinutes, priceOverrideTetri: row.priceOverrideTetri });
    byStaff.set(row.id, candidate);
  }
  return Array.from(byStaff.values()).filter(candidate => serviceIds.every(serviceId => candidate.eligibility.has(serviceId))).map(candidate => {
    const selected = serviceIds.map(serviceId => {
      const service = serviceById.get(serviceId)!;
      const eligibility = candidate.eligibility.get(serviceId)!;
      return { id: service.id, nameKa: service.nameKa, durationMinutes: eligibility.durationOverrideMinutes ?? service.defaultDurationMinutes, priceTetri: eligibility.priceOverrideTetri ?? service.priceTetri, bufferBeforeMinutes: service.bufferBeforeMinutes, bufferAfterMinutes: service.bufferAfterMinutes };
    });
    return { id: candidate.id, name: candidate.name, services: selected, durationMinutes: selected.reduce((sum, service) => sum + service.durationMinutes, 0), totalTetri: selected.reduce((sum, service) => sum + service.priceTetri, 0), bufferBeforeMinutes: selected[0]?.bufferBeforeMinutes ?? 0, bufferAfterMinutes: selected.at(-1)?.bufferAfterMinutes ?? 0 };
  });
}

function multiCandidateAvailability(candidate: MultiCandidate, startsAt: Date) {
  const endsAt = new Date(startsAt.getTime() + candidate.durationMinutes * 60_000);
  return { endsAt, protectedStart: new Date(startsAt.getTime() - candidate.bufferBeforeMinutes * 60_000), protectedEnd: new Date(endsAt.getTime() + candidate.bufferAfterMinutes * 60_000) };
}

export const publicRouter = router({
  locations: publicProcedure.query(async () => {
    const db = await requireDb();
    const locationRows = await db.select({
      id: locations.id,
      organizationId: locations.organizationId,
      publicSlug: locations.publicSlug,
      name: locations.name,
      publicDescription: locations.publicDescription,
      timezone: locations.timezone,
      address: locations.address,
      phone: locations.phone,
      email: locations.email,
    }).from(locations).where(and(eq(locations.status, "ACTIVE"), eq(locations.bookingEnabled, true))).orderBy(asc(locations.name));
    const bookingLocations = (await Promise.all(locationRows.map(async location => ({ location, bookingActive: await isOrganizationTrialPublicBookingActive(location.organizationId) })))).filter(item => item.bookingActive).map(item => item.location);
    const organizationIds = Array.from(new Set(bookingLocations.map(location => location.organizationId)));
    const categoryRows = organizationIds.length ? await db.select({ organizationId: services.organizationId, nameKa: serviceCategories.nameKa }).from(services)
      .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(and(inArray(services.organizationId, organizationIds), eq(services.status, "ACTIVE"), eq(services.onlineBookingEnabled, true))) : [];
    const categoriesByOrganization = new Map<string, string[]>();
    for (const category of categoryRows) categoriesByOrganization.set(category.organizationId, Array.from(new Set([...(categoriesByOrganization.get(category.organizationId) ?? []), category.nameKa])));
    const locationIds = bookingLocations.map(location => location.id);
    const hourRows = locationIds.length ? await db.select({
      locationId: workingHourRules.locationId,
      weekday: workingHourRules.weekday,
      startLocalTime: workingHourRules.startLocalTime,
      endLocalTime: workingHourRules.endLocalTime,
    }).from(workingHourRules)
      .innerJoin(staffProfiles, eq(workingHourRules.staffProfileId, staffProfiles.id))
      .where(and(inArray(workingHourRules.locationId, locationIds), eq(staffProfiles.status, "ACTIVE"))) : [];
    const hoursByLocation = new Map<string, Map<number, { startLocalTime: string; endLocalTime: string }>>();
    for (const row of hourRows) {
      const byWeekday = hoursByLocation.get(row.locationId) ?? new Map<number, { startLocalTime: string; endLocalTime: string }>();
      const previous = byWeekday.get(row.weekday);
      byWeekday.set(row.weekday, previous ? {
        startLocalTime: previous.startLocalTime < row.startLocalTime ? previous.startLocalTime : row.startLocalTime,
        endLocalTime: previous.endLocalTime > row.endLocalTime ? previous.endLocalTime : row.endLocalTime,
      } : { startLocalTime: row.startLocalTime, endLocalTime: row.endLocalTime });
      hoursByLocation.set(row.locationId, byWeekday);
    }
    return bookingLocations.map(({ id, organizationId, ...location }) => ({
      ...location,
      categories: categoriesByOrganization.get(organizationId) ?? [],
      workingHours: Array.from(hoursByLocation.get(id)?.entries() ?? []).map(([weekday, hours]) => ({ weekday, ...hours })).sort((a, b) => a.weekday - b.weekday),
    }));
  }),

  bookingCatalog: publicProcedure.input(slugSchema).query(async ({ input: slug }) => {
    const db = await requireDb();
    const [location] = await db.select().from(locations).where(and(
      eq(locations.publicSlug, slug),
      eq(locations.status, "ACTIVE"),
      eq(locations.bookingEnabled, true),
    )).limit(1);
    if (!location) return null;
    const onlineBookingAvailable = await isOrganizationTrialPublicBookingActive(location.organizationId);
    if (!onlineBookingAvailable) return { location: { publicSlug: location.publicSlug, name: location.name, timezone: location.timezone, address: location.address, phone: location.phone, email: location.email, publicDescription: location.publicDescription, workingHours: [] }, catalog: [], team: [], onlineBookingAvailable: false as const, bookingUnavailableReason: "TRIAL_EXPIRED" as const };
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
    return { location: { publicSlug: location.publicSlug, name: location.name, timezone: location.timezone, address: location.address, phone: location.phone, email: location.email, publicDescription: location.publicDescription, workingHours }, catalog, team, onlineBookingAvailable: true as const, bookingUnavailableReason: null };
  }),

  salonProfile: publicProcedure.input(slugSchema).query(async ({ input: slug }) => {
    const db = await requireDb();
    const [record] = await db.select({ location: locations, organizationName: organizations.name }).from(locations)
      .innerJoin(organizations, eq(locations.organizationId, organizations.id))
      .where(and(eq(locations.publicSlug, slug), eq(locations.status, "ACTIVE"))).limit(1);
    if (!record) return null;
    const location = record.location;
    const onlineBookingAvailable = location.bookingEnabled && await isOrganizationTrialPublicBookingActive(location.organizationId);
    const [serviceRows, teamRows, feedRows, gallerySets, feedbackRows] = await Promise.all([
      db.select({ id: services.id, nameKa: services.nameKa, description: services.publicDescriptionKa, durationMinutes: services.defaultDurationMinutes, priceTetri: services.priceTetri, isFromPrice: services.isFromPrice, categoryNameKa: serviceCategories.nameKa, categorySortOrder: serviceCategories.sortOrder, sortOrder: services.sortOrder }).from(services)
        .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
        .where(and(eq(services.organizationId, location.organizationId), eq(services.status, "ACTIVE"), eq(services.onlineBookingEnabled, true))).orderBy(asc(serviceCategories.sortOrder), asc(services.sortOrder)),
      db.select({ id: staffProfiles.id, name: staffProfiles.publicDisplayName, bio: staffProfiles.publicBio, jobTitle: staffProfiles.jobTitle, specialty: staffProfiles.specialty, experienceYears: staffProfiles.experienceYears, avatarKey: staffProfiles.avatarKey, avatarAltKa: staffProfiles.avatarAltKa, sortOrder: staffProfiles.sortOrder }).from(staffProfiles)
        .innerJoin(staffLocations, eq(staffProfiles.id, staffLocations.staffProfileId))
        .where(and(eq(staffLocations.locationId, location.id), eq(staffProfiles.status, "ACTIVE"), eq(staffProfiles.onlineBookingVisible, true))).orderBy(asc(staffProfiles.sortOrder)),
      db.select().from(locationFeedPosts).where(and(eq(locationFeedPosts.locationId, location.id), eq(locationFeedPosts.publicVisible, true))).orderBy(desc(locationFeedPosts.publishedAt), asc(locationFeedPosts.sortOrder)).limit(24),
      db.select().from(clientMediaSets).where(and(eq(clientMediaSets.locationId, location.id), eq(clientMediaSets.publicVisible, true), eq(clientMediaSets.clientPublicationConsent, true))).orderBy(desc(clientMediaSets.createdAt)).limit(12),
      db.select({ id: customerFeedback.id, rating: customerFeedback.rating, comment: customerFeedback.comment, displayName: customerFeedback.displayName, publicNameConsent: customerFeedback.publicNameConsent, submittedAt: customerFeedback.submittedAt }).from(customerFeedback)
        .where(and(eq(customerFeedback.locationId, location.id), eq(customerFeedback.status, "APPROVED"))).orderBy(desc(customerFeedback.submittedAt)).limit(30),
    ]);
    const gallerySetIds = gallerySets.map(set => set.id);
    const galleryItems = gallerySetIds.length ? await db.select().from(clientMediaItems).where(inArray(clientMediaItems.setId, gallerySetIds)) : [];
    return {
      salon: {
        organizationName: record.organizationName,
        publicSlug: location.publicSlug,
        name: location.name,
        address: location.address,
        phone: location.phone,
        email: location.email,
        publicDescription: location.publicDescription,
        socialLinks: location.socialLinks as { instagram?: string; facebook?: string; website?: string } | null,
        bookingEnabled: onlineBookingAvailable,
        bookingUnavailableReason: location.bookingEnabled && !onlineBookingAvailable ? "TRIAL_EXPIRED" as const : null,
        coverImageUrl: location.coverImageKey ? mediaUrl(location.coverImageKey) : null,
        coverImageAltKa: location.coverImageAltKa,
      },
      services: serviceRows,
      team: teamRows.map(member => ({ ...member, avatarUrl: member.avatarKey ? mediaUrl(member.avatarKey) : null })),
      feed: feedRows.map(post => ({ id: post.id, titleKa: post.titleKa, captionKa: post.captionKa, altTextKa: post.altTextKa, mediaUrl: mediaUrl(post.mediaKey), publishedAt: post.publishedAt })),
      gallery: gallerySets.map(set => ({
        id: set.id,
        before: galleryItems.find(item => item.setId === set.id && item.stage === "BEFORE") ? (() => { const item = galleryItems.find(entry => entry.setId === set.id && entry.stage === "BEFORE")!; return { mediaUrl: mediaUrl(item.mediaKey), altTextKa: item.altTextKa }; })() : null,
        after: galleryItems.find(item => item.setId === set.id && item.stage === "AFTER") ? (() => { const item = galleryItems.find(entry => entry.setId === set.id && entry.stage === "AFTER")!; return { mediaUrl: mediaUrl(item.mediaKey), altTextKa: item.altTextKa }; })() : null,
      })).filter(set => set.before && set.after),
      feedback: feedbackRows.map(item => ({ id: item.id, rating: item.rating, comment: item.comment, authorName: item.publicNameConsent && item.displayName ? item.displayName : "დადასტურებული კლიენტი", submittedAt: item.submittedAt })),
    };
  }),

  feedbackEligibility: publicProcedure.input(publicFeedbackTokenSchema).query(async ({ input }) => {
    const db = await requireDb();
    const appointment = await appointmentForPublicToken(db, input.token);
    if (appointment.status !== "COMPLETED" || !appointment.clientId) return { eligible: false, submitted: false, reason: "დასრულებული ვიზიტის შემდეგ შეძლებთ უკუკავშირის დატოვებას." };
    const [existing] = await db.select({ id: customerFeedback.id, status: customerFeedback.status }).from(customerFeedback).where(eq(customerFeedback.appointmentId, appointment.id)).limit(1);
    if (existing) return { eligible: false, submitted: true, status: existing.status, reason: "ამ ვიზიტისთვის უკუკავშირი უკვე დატოვებულია." };
    const [location] = await db.select({ name: locations.name, publicSlug: locations.publicSlug }).from(locations).where(eq(locations.id, appointment.locationId)).limit(1);
    return { eligible: true, submitted: false, locationName: location?.name ?? "SalonFlow", publicSlug: location?.publicSlug ?? null };
  }),

  submitFeedback: publicProcedure.input(publicFeedbackSubmitSchema).mutation(async ({ input }) => {
    const db = await requireDb();
    const appointment = await appointmentForPublicToken(db, input.token);
    if (appointment.status !== "COMPLETED" || !appointment.clientId) throw new Error("უკუკავშირი ხელმისაწვდომია მხოლოდ დასრულებული ვიზიტის შემდეგ.");
    const [existing] = await db.select({ id: customerFeedback.id }).from(customerFeedback).where(eq(customerFeedback.appointmentId, appointment.id)).limit(1);
    if (existing) throw new Error("ამ ვიზიტისთვის უკუკავშირი უკვე დატოვებულია.");
    const feedbackId = nanoid(21);
    await db.transaction(async tx => {
      await tx.insert(customerFeedback).values({ id: feedbackId, organizationId: appointment.organizationId, locationId: appointment.locationId, appointmentId: appointment.id, clientId: appointment.clientId!, rating: input.rating, comment: input.comment, displayName: input.publicNameConsent ? input.displayName ?? null : null, publicNameConsent: input.publicNameConsent, status: "PENDING" });
      await tx.insert(customerFeedbackEvents).values({ id: nanoid(21), feedbackId, eventType: "SUBMITTED_BY_BOOKING_TOKEN", metadata: { rating: input.rating, publicNameConsent: input.publicNameConsent } });
    });
    return { submitted: true, status: "PENDING" as const };
  }),

  checkAvailability: publicProcedure.input(publicAvailabilityCheckSchema).query(async ({ input }) => {
    const db = await requireDb();
    const [location] = await db.select().from(locations).where(and(
      eq(locations.publicSlug, input.slug),
      eq(locations.status, "ACTIVE"),
      eq(locations.bookingEnabled, true),
    )).limit(1);
    if (!location) return { available: false, reason: "LOCATION_UNAVAILABLE" as const };
    if (!await isOrganizationTrialPublicBookingActive(location.organizationId)) return { available: false, reason: "TRIAL_EXPIRED" as const };

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

  availableSlots: publicProcedure.input(publicAvailableSlotsSchema).query(async ({ input }) => {
    const empty = { timezone: "Asia/Tbilisi", slots: [] as Array<{ startsAt: string; label: string }> };
    const db = await requireDb();
    const [location] = await db.select().from(locations).where(and(
      eq(locations.publicSlug, input.slug),
      eq(locations.status, "ACTIVE"),
      eq(locations.bookingEnabled, true),
    )).limit(1);
    if (!location) return empty;
    if (!await isOrganizationTrialPublicBookingActive(location.organizationId)) return { ...empty, timezone: location.timezone };

    const [service] = await db.select().from(services).where(and(
      eq(services.id, input.serviceId),
      eq(services.organizationId, location.organizationId),
      eq(services.status, "ACTIVE"),
      eq(services.onlineBookingEnabled, true),
    )).limit(1);
    if (!service) return { ...empty, timezone: location.timezone };

    // Resolve candidate specialists (a specific one, or all eligible for ANY_AVAILABLE).
    let candidates: Array<{ id: string; durationMinutes: number }> = [];
    if (input.staffProfileId === "ANY_AVAILABLE") {
      const rows = await db.select({ id: staffProfiles.id, durationOverrideMinutes: staffServices.durationOverrideMinutes }).from(staffProfiles)
        .innerJoin(staffLocations, eq(staffProfiles.id, staffLocations.staffProfileId))
        .innerJoin(staffServices, eq(staffProfiles.id, staffServices.staffProfileId))
        .where(and(eq(staffLocations.locationId, location.id), eq(staffServices.serviceId, service.id), eq(staffServices.canPerform, true), eq(staffProfiles.status, "ACTIVE"), eq(staffProfiles.onlineBookingVisible, true)));
      candidates = rows.map(row => ({ id: row.id, durationMinutes: row.durationOverrideMinutes ?? service.defaultDurationMinutes }));
    } else {
      const [staffAtLocation] = await db.select().from(staffLocations).where(and(eq(staffLocations.staffProfileId, input.staffProfileId), eq(staffLocations.locationId, location.id))).limit(1);
      const [staff] = await db.select().from(staffProfiles).where(and(eq(staffProfiles.id, input.staffProfileId), eq(staffProfiles.status, "ACTIVE"), eq(staffProfiles.onlineBookingVisible, true))).limit(1);
      const [eligibility] = await db.select().from(staffServices).where(and(eq(staffServices.staffProfileId, input.staffProfileId), eq(staffServices.serviceId, service.id), eq(staffServices.canPerform, true))).limit(1);
      if (staffAtLocation && staff && eligibility) candidates = [{ id: staff.id, durationMinutes: eligibility.durationOverrideMinutes ?? service.defaultDurationMinutes }];
    }
    if (!candidates.length) return { ...empty, timezone: location.timezone };

    const now = new Date();
    const minimumStart = new Date(now.getTime() + location.minimumNoticeMinutes * 60_000);
    const maximumStart = new Date(now.getTime() + location.maximumAdvanceDays * 86_400_000);

    // Weekday of the requested local date (schema weekday: 0=Monday … 6=Sunday).
    const [year, month, day] = input.date.split("-").map(Number) as [number, number, number];
    const weekday = (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;

    const staffIds = candidates.map(candidate => candidate.id);
    const hourRows = await db.select({ staffProfileId: workingHourRules.staffProfileId, startLocalTime: workingHourRules.startLocalTime, endLocalTime: workingHourRules.endLocalTime }).from(workingHourRules)
      .where(and(eq(workingHourRules.locationId, location.id), eq(workingHourRules.weekday, weekday), inArray(workingHourRules.staffProfileId, staffIds)));
    if (!hourRows.length) return { ...empty, timezone: location.timezone };

    const existing = await db.select({ staffProfileId: appointments.staffProfileId, startsAt: appointments.startsAt, endsAt: appointments.endsAt, bufferBeforeMinutes: appointments.bufferBeforeMinutes, bufferAfterMinutes: appointments.bufferAfterMinutes, status: appointments.status }).from(appointments)
      .where(and(eq(appointments.locationId, location.id), inArray(appointments.staffProfileId, staffIds)));
    const busyByStaff = new Map<string, BusyInterval[]>();
    for (const appointment of existing) {
      if (!appointmentBlocksInterval(appointment.status)) continue;
      const intervals = busyByStaff.get(appointment.staffProfileId) ?? [];
      intervals.push({ startsAt: new Date(appointment.startsAt.getTime() - appointment.bufferBeforeMinutes * 60_000), endsAt: new Date(appointment.endsAt.getTime() + appointment.bufferAfterMinutes * 60_000) });
      busyByStaff.set(appointment.staffProfileId, intervals);
    }

    const parseTime = (value: string) => { const [h, m] = value.split(":").map(Number); return { hour: h ?? 0, minute: m ?? 0 }; };
    const timeZone = location.timezone;
    // A start time is offered if at least one eligible specialist is free for it.
    const offered = new Set<number>();
    for (const candidate of candidates) {
      for (const rule of hourRows.filter(row => row.staffProfileId === candidate.id)) {
        const start = parseTime(rule.startLocalTime);
        const end = parseTime(rule.endLocalTime);
        const openingStart = zonedDateTimeToUtc({ year, month, day, hour: start.hour, minute: start.minute, second: 0 }, timeZone);
        const openingEnd = zonedDateTimeToUtc({ year, month, day, hour: end.hour, minute: end.minute, second: 0 }, timeZone);
        const slots = generateAvailableSlots({
          openingStart,
          openingEnd,
          durationMinutes: candidate.durationMinutes,
          slotIntervalMinutes: location.slotIntervalMinutes,
          bufferBeforeMinutes: service.bufferBeforeMinutes,
          bufferAfterMinutes: service.bufferAfterMinutes,
          minimumStart,
          busyIntervals: busyByStaff.get(candidate.id) ?? [],
        });
        for (const slot of slots) {
          if (slot.startsAt > maximumStart) continue;
          offered.add(slot.startsAt.getTime());
        }
      }
    }

    const slots = Array.from(offered).sort((a, b) => a - b).map(timestamp => {
      const value = new Date(timestamp);
      return { startsAt: value.toISOString(), label: formatTimeInTimeZone(value, timeZone) };
    });
    return { timezone: timeZone, slots };
  }),

  checkMultiAvailability: publicProcedure.input(publicMultiAvailabilityCheckSchema).query(async ({ input }) => {
    const db = await requireDb();
    const [location] = await db.select().from(locations).where(and(eq(locations.publicSlug, input.slug), eq(locations.status, "ACTIVE"), eq(locations.bookingEnabled, true))).limit(1);
    if (!location) return { available: false, reason: "LOCATION_UNAVAILABLE" as const };
    if (!await isOrganizationTrialPublicBookingActive(location.organizationId)) return { available: false, reason: "TRIAL_EXPIRED" as const };
    const minimumStart = new Date(Date.now() + location.minimumNoticeMinutes * 60_000);
    const maximumStart = new Date(Date.now() + location.maximumAdvanceDays * 86_400_000);
    if (input.startsAt < minimumStart || input.startsAt > maximumStart) return { available: false, reason: "OUTSIDE_BOOKING_WINDOW" as const };
    const candidates = await resolveMultiCandidates(db, location, input.serviceIds, input.staffProfileId);
    if (!candidates.length) return { available: false, reason: "STAFF_UNAVAILABLE" as const };
    for (const candidate of candidates) {
      const { endsAt, protectedStart, protectedEnd } = multiCandidateAvailability(candidate, input.startsAt);
      const existing = await db.select().from(appointments).where(and(eq(appointments.staffProfileId, candidate.id), eq(appointments.locationId, location.id)));
      const conflict = existing.some(appointment => appointmentBlocksInterval(appointment.status) && intervalsOverlap(protectedStart, protectedEnd, new Date(appointment.startsAt.getTime() - appointment.bufferBeforeMinutes * 60_000), new Date(appointment.endsAt.getTime() + appointment.bufferAfterMinutes * 60_000)));
      if (!conflict) return { available: true, startsAt: input.startsAt, endsAt, staffProfileId: candidate.id, staffName: candidate.name, totalTetri: candidate.totalTetri };
    }
    return { available: false, reason: "SLOT_UNAVAILABLE" as const };
  }),

  multiAvailableSlots: publicProcedure.input(publicMultiAvailableSlotsSchema).query(async ({ input }) => {
    const empty = { timezone: "Asia/Tbilisi", slots: [] as Array<{ startsAt: string; label: string }> };
    const db = await requireDb();
    const [location] = await db.select().from(locations).where(and(eq(locations.publicSlug, input.slug), eq(locations.status, "ACTIVE"), eq(locations.bookingEnabled, true))).limit(1);
    if (!location) return empty;
    if (!await isOrganizationTrialPublicBookingActive(location.organizationId)) return { ...empty, timezone: location.timezone };
    const candidates = await resolveMultiCandidates(db, location, input.serviceIds, input.staffProfileId);
    if (!candidates.length) return { ...empty, timezone: location.timezone };
    const now = new Date();
    const minimumStart = new Date(now.getTime() + location.minimumNoticeMinutes * 60_000);
    const maximumStart = new Date(now.getTime() + location.maximumAdvanceDays * 86_400_000);
    const [year, month, day] = input.date.split("-").map(Number) as [number, number, number];
    const weekday = (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
    const staffIds = candidates.map(candidate => candidate.id);
    const hourRows = await db.select({ staffProfileId: workingHourRules.staffProfileId, startLocalTime: workingHourRules.startLocalTime, endLocalTime: workingHourRules.endLocalTime }).from(workingHourRules).where(and(eq(workingHourRules.locationId, location.id), eq(workingHourRules.weekday, weekday), inArray(workingHourRules.staffProfileId, staffIds)));
    if (!hourRows.length) return { ...empty, timezone: location.timezone };
    const existing = await db.select({ staffProfileId: appointments.staffProfileId, startsAt: appointments.startsAt, endsAt: appointments.endsAt, bufferBeforeMinutes: appointments.bufferBeforeMinutes, bufferAfterMinutes: appointments.bufferAfterMinutes, status: appointments.status }).from(appointments).where(and(eq(appointments.locationId, location.id), inArray(appointments.staffProfileId, staffIds)));
    const busyByStaff = new Map<string, BusyInterval[]>();
    for (const appointment of existing) {
      if (!appointmentBlocksInterval(appointment.status)) continue;
      const intervals = busyByStaff.get(appointment.staffProfileId) ?? [];
      intervals.push({ startsAt: new Date(appointment.startsAt.getTime() - appointment.bufferBeforeMinutes * 60_000), endsAt: new Date(appointment.endsAt.getTime() + appointment.bufferAfterMinutes * 60_000) });
      busyByStaff.set(appointment.staffProfileId, intervals);
    }
    const parseTime = (value: string) => { const [h, m] = value.split(":").map(Number); return { hour: h ?? 0, minute: m ?? 0 }; };
    const offered = new Set<number>();
    for (const candidate of candidates) {
      for (const rule of hourRows.filter(row => row.staffProfileId === candidate.id)) {
        const start = parseTime(rule.startLocalTime); const end = parseTime(rule.endLocalTime);
        const openingStart = zonedDateTimeToUtc({ year, month, day, hour: start.hour, minute: start.minute, second: 0 }, location.timezone);
        const openingEnd = zonedDateTimeToUtc({ year, month, day, hour: end.hour, minute: end.minute, second: 0 }, location.timezone);
        const generated = generateAvailableSlots({ openingStart, openingEnd, durationMinutes: candidate.durationMinutes, slotIntervalMinutes: location.slotIntervalMinutes, bufferBeforeMinutes: candidate.bufferBeforeMinutes, bufferAfterMinutes: candidate.bufferAfterMinutes, minimumStart, busyIntervals: busyByStaff.get(candidate.id) ?? [] });
        for (const slot of generated) if (slot.startsAt <= maximumStart) offered.add(slot.startsAt.getTime());
      }
    }
    return { timezone: location.timezone, slots: Array.from(offered).sort((a, b) => a - b).map(timestamp => { const startsAt = new Date(timestamp); return { startsAt: startsAt.toISOString(), label: formatTimeInTimeZone(startsAt, location.timezone) }; }) };
  }),

  commitMultiBooking: publicProcedure.input(publicMultiBookingCommitSchema).mutation(async ({ input }) => {
    const db = await requireDb();
    const normalizedPhone = normalizeGeorgianPhone(input.phone);
    if (!normalizedPhone) throw new Error("მიუთითეთ სწორი ქართული მობილურის ნომერი.");
    const normalizedEmail = normalizeEmail(input.email);
    const [previous] = await db.select({ id: appointments.id, endsAt: appointments.endsAt }).from(appointments).where(eq(appointments.idempotencyKey, input.idempotencyKey)).limit(1);
    if (previous) return { confirmed: true, replayed: true, confirmationToken: confirmationTokenForAppointment(previous.id), endsAt: previous.endsAt };
    const [location] = await db.select().from(locations).where(and(eq(locations.publicSlug, input.slug), eq(locations.status, "ACTIVE"), eq(locations.bookingEnabled, true))).limit(1);
    if (!location) throw new Error("ეს ჩაწერის ბმული აღარ არის აქტიური.");
    if (!await isOrganizationTrialPublicBookingActive(location.organizationId)) throw new Error("ონლაინ ჩაწერა ამ სალონისთვის დროებით მიუწვდომელია.");
    const minimumStart = new Date(Date.now() + location.minimumNoticeMinutes * 60_000);
    const maximumStart = new Date(Date.now() + location.maximumAdvanceDays * 86_400_000);
    if (input.startsAt < minimumStart || input.startsAt > maximumStart) throw new Error("არჩეული დრო ჩაწერის დაშვებულ დიაპაზონში არ არის.");
    const candidates = await resolveMultiCandidates(db, location, input.serviceIds, input.staffProfileId);
    if (!candidates.length) throw new Error("არცერთი სპეციალისტი ვერ ასრულებს ყველა არჩეულ სერვისს.");
    const appointmentId = nanoid(21);
    const confirmationToken = confirmationTokenForAppointment(appointmentId);
    let assigned: MultiCandidate | undefined;
    let endsAt: Date | undefined;
    await db.transaction(async tx => {
      for (const candidate of candidates) {
        const interval = multiCandidateAvailability(candidate, input.startsAt);
        for (const dateKey of enumerateUtcDates(input.startsAt, interval.endsAt)) await tx.insert(scheduleLocks).values({ id: `${candidate.id}:${dateKey}`, staffProfileId: candidate.id, localDate: new Date(`${dateKey}T00:00:00.000Z`) }).onDuplicateKeyUpdate({ set: { createdAt: new Date() } });
        const existing = await tx.select().from(appointments).where(and(eq(appointments.staffProfileId, candidate.id), eq(appointments.locationId, location.id)));
        if (!existing.some(appointment => appointmentBlocksInterval(appointment.status) && intervalsOverlap(interval.protectedStart, interval.protectedEnd, new Date(appointment.startsAt.getTime() - appointment.bufferBeforeMinutes * 60_000), new Date(appointment.endsAt.getTime() + appointment.bufferAfterMinutes * 60_000)))) { assigned = candidate; endsAt = interval.endsAt; break; }
      }
      if (!assigned || !endsAt) throw new Error("ეს დრო ახლახან დაიკავეს. აირჩიეთ სხვა თავისუფალი დრო.");
      const [matchedClient] = await tx.select({ id: clients.id }).from(clients).where(and(eq(clients.organizationId, location.organizationId), eq(clients.normalizedPhone, normalizedPhone), eq(clients.status, "ACTIVE"))).limit(1);
      const clientId = matchedClient?.id ?? nanoid(21);
      if (!matchedClient) await tx.insert(clients).values({ id: clientId, organizationId: location.organizationId, firstName: input.firstName, lastName: input.lastName, normalizedPhone, email: input.email, normalizedEmail, source: "PUBLIC_WEB" });
      await tx.insert(appointments).values({ id: appointmentId, organizationId: location.organizationId, locationId: location.id, clientId, staffProfileId: assigned.id, startsAt: input.startsAt, endsAt, bufferBeforeMinutes: assigned.bufferBeforeMinutes, bufferAfterMinutes: assigned.bufferAfterMinutes, source: "PUBLIC_WEB", status: "PENDING", customerNote: input.customerNote, subtotalTetri: assigned.totalTetri, discountTetri: 0, totalTetri: assigned.totalTetri, publicTokenHash: publicTokenHash(confirmationToken), publicTokenExpiresAt: new Date(input.startsAt.getTime() + 90 * 86_400_000), idempotencyKey: input.idempotencyKey });
      await tx.insert(appointmentServices).values(assigned.services.map((service, sortOrder) => ({ id: nanoid(21), appointmentId, serviceId: service.id, staffProfileId: assigned!.id, serviceNameSnapshot: service.nameKa, durationMinutesSnapshot: service.durationMinutes, bufferBeforeMinutesSnapshot: service.bufferBeforeMinutes, bufferAfterMinutesSnapshot: service.bufferAfterMinutes, priceTetriSnapshot: service.priceTetri, sortOrder })));
      await tx.insert(appointmentStatusHistory).values({ id: nanoid(21), appointmentId, oldStatus: null, newStatus: "PENDING", metadata: { source: "PUBLIC_WEB", idempotencyKey: input.idempotencyKey, serviceCount: assigned.services.length } });
      await tx.insert(clientConsents).values({ id: nanoid(21), clientId, consentType: "BOOKING_TERMS", granted: true, source: "PUBLIC_WEB", grantedAt: new Date() });
    });
    return { confirmed: true, replayed: false, confirmationToken, assignedStaffName: assigned?.name, endsAt: endsAt! };
  }),

  commitBooking: publicProcedure.input(publicBookingCommitSchema).mutation(async ({ input }) => {
    const db = await requireDb();
    const normalizedPhone = normalizeGeorgianPhone(input.phone);
    if (!normalizedPhone) throw new Error("A valid Georgian mobile phone number is required");
    const normalizedEmail = normalizeEmail(input.email);

    const [previousAttempt] = await db.select({ id: appointments.id, endsAt: appointments.endsAt }).from(appointments)
      .where(eq(appointments.idempotencyKey, input.idempotencyKey)).limit(1);
    if (previousAttempt) {
      const [assignment] = await db.select({ name: staffProfiles.publicDisplayName }).from(appointments)
        .innerJoin(staffProfiles, eq(appointments.staffProfileId, staffProfiles.id))
        .where(eq(appointments.id, previousAttempt.id)).limit(1);
      return { confirmed: true, replayed: true, confirmationToken: confirmationTokenForAppointment(previousAttempt.id), assignedStaffName: assignment?.name, endsAt: previousAttempt.endsAt };
    }

    const [location] = await db.select().from(locations).where(and(
      eq(locations.publicSlug, input.slug),
      eq(locations.status, "ACTIVE"),
      eq(locations.bookingEnabled, true),
    )).limit(1);
    if (!location) throw new Error("This booking link is unavailable");
    if (!await isOrganizationTrialPublicBookingActive(location.organizationId)) throw new Error("Online booking is temporarily unavailable for this salon");

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

    const [persistedAppointment] = await db.select({ id: appointments.id, endsAt: appointments.endsAt }).from(appointments)
      .where(eq(appointments.idempotencyKey, input.idempotencyKey)).limit(1);
    if (!persistedAppointment) throw new Error("Booking confirmation could not be persisted");
    return {
      confirmed: true,
      replayed: persistedAppointment.id !== appointmentId,
      confirmationToken: confirmationTokenForAppointment(persistedAppointment.id),
      assignedStaffName: assigned?.name,
      endsAt: persistedAppointment.endsAt,
    };
  }),

  bookingByToken: publicProcedure.input(publicBookingTokenSchema).query(async ({ input }) => {
    const db = await requireDb();
    const appointment = await appointmentForPublicToken(db, input.token);
    const [location] = await db.select({ publicSlug: locations.publicSlug, name: locations.name, timezone: locations.timezone, address: locations.address, cancellationCutoffMinutes: locations.cancellationCutoffMinutes }).from(locations).where(eq(locations.id, appointment.locationId)).limit(1);
    const [staff] = await db.select({ name: staffProfiles.publicDisplayName }).from(staffProfiles).where(eq(staffProfiles.id, appointment.staffProfileId)).limit(1);
    const servicesForAppointment = await db.select({ id: appointmentServices.id, serviceId: appointmentServices.serviceId, name: appointmentServices.serviceNameSnapshot, durationMinutes: appointmentServices.durationMinutesSnapshot, priceTetri: appointmentServices.priceTetriSnapshot }).from(appointmentServices).where(eq(appointmentServices.appointmentId, appointment.id)).orderBy(asc(appointmentServices.sortOrder));
    if (!location) throw new Error("ჯავშნის ფილიალი აღარ არის ხელმისაწვდომი.");
    return {
      location: { publicSlug: location.publicSlug, name: location.name, timezone: location.timezone, address: location.address },
      appointment: { staffProfileId: appointment.staffProfileId, status: appointment.status, startsAt: appointment.startsAt, endsAt: appointment.endsAt, totalTetri: appointment.totalTetri, canManage: canCustomerManage(appointment, location.cancellationCutoffMinutes), cancellationCutoffMinutes: location.cancellationCutoffMinutes },
      staffName: staff?.name ?? null,
      services: servicesForAppointment,
    };
  }),

  cancelBookingByToken: publicProcedure.input(publicBookingCancelSchema).mutation(async ({ input }) => {
    const db = await requireDb();
    const appointment = await appointmentForPublicToken(db, input.token);
    const [location] = await db.select({ cancellationCutoffMinutes: locations.cancellationCutoffMinutes }).from(locations).where(eq(locations.id, appointment.locationId)).limit(1);
    if (!location || !canCustomerManage(appointment, location.cancellationCutoffMinutes)) throw new Error("ამ ჯავშნის გაუქმების ვადა უკვე გასულია ან სტატუსი აღარ იძლევა ცვლილების უფლებას.");
    await db.transaction(async tx => {
      await tx.update(appointments).set({ status: "CANCELLED", cancellationReason: input.reason ?? "CUSTOMER_CANCELLED", cancelledAt: new Date() }).where(eq(appointments.id, appointment.id));
      await tx.insert(appointmentStatusHistory).values({ id: nanoid(21), appointmentId: appointment.id, oldStatus: appointment.status, newStatus: "CANCELLED", reason: input.reason, metadata: { source: "PUBLIC_TOKEN", event: "CUSTOMER_CANCELLED" } });
    });
    return { success: true };
  }),

  rescheduleBookingByToken: publicProcedure.input(publicBookingRescheduleSchema).mutation(async ({ input }) => {
    const db = await requireDb();
    const appointment = await appointmentForPublicToken(db, input.token);
    const [location] = await db.select().from(locations).where(and(eq(locations.id, appointment.locationId), eq(locations.status, "ACTIVE"), eq(locations.bookingEnabled, true))).limit(1);
    if (!location || !canCustomerManage(appointment, location.cancellationCutoffMinutes)) throw new Error("ამ ჯავშნის გადატანის ვადა უკვე გასულია ან სტატუსი აღარ იძლევა ცვლილების უფლებას.");
    const minimumStart = new Date(Date.now() + location.minimumNoticeMinutes * 60_000);
    const maximumStart = new Date(Date.now() + location.maximumAdvanceDays * 86_400_000);
    if (input.startsAt < minimumStart || input.startsAt > maximumStart) throw new Error("არჩეული დრო ჩაწერის დაშვებულ დიაპაზონში არ არის.");
    const durationMs = appointment.endsAt.getTime() - appointment.startsAt.getTime();
    const endsAt = new Date(input.startsAt.getTime() + durationMs);
    const protectedStart = new Date(input.startsAt.getTime() - appointment.bufferBeforeMinutes * 60_000);
    const protectedEnd = new Date(endsAt.getTime() + appointment.bufferAfterMinutes * 60_000);
    await db.transaction(async tx => {
      for (const dateKey of enumerateUtcDates(input.startsAt, endsAt)) await tx.insert(scheduleLocks).values({ id: `${appointment.staffProfileId}:${dateKey}`, staffProfileId: appointment.staffProfileId, localDate: new Date(`${dateKey}T00:00:00.000Z`) }).onDuplicateKeyUpdate({ set: { createdAt: new Date() } });
      const existing = await tx.select().from(appointments).where(and(eq(appointments.staffProfileId, appointment.staffProfileId), eq(appointments.locationId, appointment.locationId)));
      if (existing.some(item => item.id !== appointment.id && appointmentBlocksInterval(item.status) && intervalsOverlap(protectedStart, protectedEnd, new Date(item.startsAt.getTime() - item.bufferBeforeMinutes * 60_000), new Date(item.endsAt.getTime() + item.bufferAfterMinutes * 60_000)))) throw new Error("ეს დრო ახლახან დაიკავეს. აირჩიეთ სხვა თავისუფალი დრო.");
      await tx.update(appointments).set({ startsAt: input.startsAt, endsAt }).where(eq(appointments.id, appointment.id));
      await tx.insert(appointmentStatusHistory).values({ id: nanoid(21), appointmentId: appointment.id, oldStatus: appointment.status, newStatus: appointment.status, reason: "CUSTOMER_RESCHEDULED", metadata: { source: "PUBLIC_TOKEN", event: "CUSTOMER_RESCHEDULED", previousStartsAt: appointment.startsAt.toISOString(), previousEndsAt: appointment.endsAt.toISOString(), startsAt: input.startsAt.toISOString(), endsAt: endsAt.toISOString() } });
    });
    return { startsAt: input.startsAt, endsAt };
  }),

  joinWaitlist: publicProcedure.input(publicWaitlistCreateSchema).mutation(async ({ input }) => {
    const db = await requireDb();
    const normalizedPhone = normalizeGeorgianPhone(input.phone);
    if (!normalizedPhone) throw new Error("მიუთითეთ სწორი ქართული მობილურის ნომერი.");
    const normalizedEmail = normalizeEmail(input.email);
    const [existingRequest] = await db.select({ id: waitlistEntries.id }).from(waitlistEntries).where(eq(waitlistEntries.idempotencyKey, input.idempotencyKey)).limit(1);
    if (existingRequest) return { id: existingRequest.id, replayed: true };
    const [location] = await db.select().from(locations).where(and(eq(locations.publicSlug, input.slug), eq(locations.status, "ACTIVE"), eq(locations.bookingEnabled, true))).limit(1);
    if (!location) throw new Error("ეს ჩაწერის ბმული აღარ არის აქტიური.");
    const [service] = await db.select().from(services).where(and(eq(services.id, input.serviceId), eq(services.organizationId, location.organizationId), eq(services.status, "ACTIVE"), eq(services.onlineBookingEnabled, true))).limit(1);
    if (!service) throw new Error("არჩეული სერვისი ონლაინ ჩაწერისთვის მიუწვდომელია.");
    if (input.staffProfileId) {
      const [eligible] = await db.select({ id: staffProfiles.id }).from(staffProfiles).innerJoin(staffLocations, eq(staffProfiles.id, staffLocations.staffProfileId)).innerJoin(staffServices, eq(staffProfiles.id, staffServices.staffProfileId)).where(and(eq(staffProfiles.id, input.staffProfileId), eq(staffProfiles.status, "ACTIVE"), eq(staffProfiles.onlineBookingVisible, true), eq(staffLocations.locationId, location.id), eq(staffServices.serviceId, service.id), eq(staffServices.canPerform, true))).limit(1);
      if (!eligible) throw new Error("არჩეული სპეციალისტი ამ სერვისისთვის მიუწვდომელია.");
    }
    const id = nanoid(21);
    await db.transaction(async tx => {
      const [matchedClient] = await tx.select({ id: clients.id }).from(clients).where(and(eq(clients.organizationId, location.organizationId), eq(clients.normalizedPhone, normalizedPhone), eq(clients.status, "ACTIVE"))).limit(1);
      const clientId = matchedClient?.id ?? nanoid(21);
      if (!matchedClient) await tx.insert(clients).values({ id: clientId, organizationId: location.organizationId, firstName: input.firstName, lastName: input.lastName, normalizedPhone, email: input.email, normalizedEmail, source: "PUBLIC_WEB" });
      await tx.insert(waitlistEntries).values({ id, organizationId: location.organizationId, locationId: location.id, clientId, serviceId: service.id, staffProfileId: input.staffProfileId, requestedDate: new Date(`${input.requestedDate}T00:00:00.000Z`), preferredStartLocalTime: input.preferredStartLocalTime, customerNote: input.customerNote, idempotencyKey: input.idempotencyKey });
      await tx.insert(clientConsents).values({ id: nanoid(21), clientId, consentType: "BOOKING_TERMS", granted: true, source: "PUBLIC_WAITLIST", grantedAt: new Date() });
    });
    return { id, replayed: false };
  }),
});
