import { and, asc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { auditLogs, locationOpeningHours, locations, organizationMemberships, organizations, staffLocations, staffProfiles, trialAccessEvents } from "../../drizzle/schema";
import { requireOrganizationRole } from "../access";
import { requireDb } from "../db";
import { normalizeEmail, normalizeGeorgianPhone } from "../lib/normalization";
import { claimTrialForOrganization, requireApprovedTrialForWorkspaceCreation } from "../lib/trialAccess";
import { locationCreateSchema, locationOpeningHoursSetSchema, locationSettingsUpdateSchema, opaqueIdSchema, organizationCreateSchema, organizationScopeSchema, organizationSetVerticalSchema, workspaceSetupSchema } from "../../shared/validation";
import { protectedProcedure, router } from "../_core/trpc";

export const organizationRouter = router({
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    return db.select({
      organization: organizations,
      membership: organizationMemberships,
    }).from(organizationMemberships)
      .innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id))
      .where(and(eq(organizationMemberships.userId, ctx.user.id), eq(organizationMemberships.status, "ACTIVE")))
      .orderBy(asc(organizations.name));
  }),

  create: protectedProcedure.input(organizationCreateSchema).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const trial = await requireApprovedTrialForWorkspaceCreation(ctx.user.id);
    const organizationId = nanoid(21);
    const membershipId = nanoid(21);
    await db.transaction(async tx => {
      await tx.insert(organizations).values({
        id: organizationId,
        name: input.name,
        slug: input.slug,
        vertical: input.vertical,
        billingCode: `SF-${organizationId.slice(-8).toUpperCase()}`,
        defaultTimezone: input.timezone,
        contactPhone: normalizeGeorgianPhone(input.contactPhone),
        contactEmail: normalizeEmail(input.contactEmail),
      });
      await tx.insert(organizationMemberships).values({
        id: membershipId,
        organizationId,
        userId: ctx.user.id,
        role: "OWNER",
        status: "ACTIVE",
        invitedByUserId: ctx.user.id,
        invitedAt: new Date(),
        activatedAt: new Date(),
      });
      await claimTrialForOrganization(tx, trial.id, organizationId);
      await tx.insert(trialAccessEvents).values({ id: nanoid(21), trialRequestId: trial.id, eventType: "WORKSPACE_CREATED_LEGACY", actorUserId: ctx.user.id, metadata: { organizationId } });
    });
    return { id: organizationId, membershipId };
  }),

  createWorkspace: protectedProcedure.input(workspaceSetupSchema).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const trial = await requireApprovedTrialForWorkspaceCreation(ctx.user.id);
    const organizationId = nanoid(21);
    const membershipId = nanoid(21);
    const locationId = nanoid(21);
    await db.transaction(async tx => {
      await tx.insert(organizations).values({
        id: organizationId,
        name: input.organization.name,
        slug: input.organization.slug,
        vertical: input.organization.vertical,
        billingCode: `SF-${organizationId.slice(-8).toUpperCase()}`,
        defaultTimezone: input.organization.timezone,
        contactPhone: normalizeGeorgianPhone(input.organization.contactPhone),
        contactEmail: normalizeEmail(input.organization.contactEmail),
      });
      await tx.insert(organizationMemberships).values({
        id: membershipId,
        organizationId,
        userId: ctx.user.id,
        role: "OWNER",
        status: "ACTIVE",
        invitedByUserId: ctx.user.id,
        invitedAt: new Date(),
        activatedAt: new Date(),
      });
      await tx.insert(locations).values({
        id: locationId,
        organizationId,
        name: input.location.name,
        publicSlug: input.location.publicSlug,
        timezone: input.location.timezone,
        address: input.location.address,
        phone: normalizeGeorgianPhone(input.location.phone),
        email: normalizeEmail(input.location.email),
        bookingEnabled: input.location.bookingEnabled,
        slotIntervalMinutes: input.location.slotIntervalMinutes,
        minimumNoticeMinutes: input.location.minimumNoticeMinutes,
        maximumAdvanceDays: input.location.maximumAdvanceDays,
        cancellationCutoffMinutes: input.location.cancellationCutoffMinutes,
      });
      await claimTrialForOrganization(tx, trial.id, organizationId);
      await tx.insert(trialAccessEvents).values({ id: nanoid(21), trialRequestId: trial.id, eventType: "WORKSPACE_CREATED_LEGACY", actorUserId: ctx.user.id, metadata: { organizationId, locationId } });
    });
    return { organizationId, membershipId, locationId };
  }),

  /** Business type (salon / aesthetic clinic / dental clinic). OWNER only; existing clinical records are kept but hidden while the type does not match. */
  setVertical: protectedProcedure.input(organizationSetVerticalSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER"]);
    const db = await requireDb();
    const [current] = await db.select({ vertical: organizations.vertical }).from(organizations).where(eq(organizations.id, input.organizationId)).limit(1);
    if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "სამუშაო სივრცე ვერ მოიძებნა." });
    if (current.vertical === input.vertical) return { vertical: input.vertical };
    await db.transaction(async tx => {
      await tx.update(organizations).set({ vertical: input.vertical }).where(eq(organizations.id, input.organizationId));
      await tx.insert(auditLogs).values({ id: nanoid(21), organizationId: input.organizationId, actorUserId: ctx.user.id, action: "ORGANIZATION_VERTICAL_CHANGED", entityType: "organization", entityId: input.organizationId, beforeState: { vertical: current.vertical }, afterState: { vertical: input.vertical } });
    });
    return { vertical: input.vertical };
  }),

  createLocation: protectedProcedure.input(locationCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER"]);
    const db = await requireDb();
    const locationId = nanoid(21);
    await db.insert(locations).values({
      id: locationId,
      organizationId: input.organizationId,
      name: input.name,
      publicSlug: input.publicSlug,
      timezone: input.timezone,
      address: input.address,
      phone: normalizeGeorgianPhone(input.phone),
      email: normalizeEmail(input.email),
      bookingEnabled: input.bookingEnabled,
      slotIntervalMinutes: input.slotIntervalMinutes,
      minimumNoticeMinutes: input.minimumNoticeMinutes,
      maximumAdvanceDays: input.maximumAdvanceDays,
      cancellationCutoffMinutes: input.cancellationCutoffMinutes,
    });
    return { id: locationId };
  }),

  updateLocationSettings: protectedProcedure.input(locationSettingsUpdateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER"]);
    const db = await requireDb();
    const { organizationId, locationId, phone, email, ...changes } = input;
    const result = await db.update(locations).set({
      ...changes,
      ...(phone !== undefined ? { phone: normalizeGeorgianPhone(phone) } : {}),
      ...(email !== undefined ? { email: normalizeEmail(email) } : {}),
      updatedAt: new Date(),
    }).where(and(eq(locations.id, locationId), eq(locations.organizationId, organizationId), eq(locations.status, "ACTIVE")));
    if (result[0]?.affectedRows !== 1) throw new Error("ფილიალი ვერ მოიძებნა ან აქტიური არ არის.");
    return { success: true };
  }),

  listLocations: protectedProcedure.input(organizationScopeSchema).query(async ({ ctx, input }) => {
    const membership = await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const db = await requireDb();
    if (membership.role === "STAFF") {
      const rows = await db.select({ location: locations }).from(staffProfiles)
        .innerJoin(staffLocations, eq(staffLocations.staffProfileId, staffProfiles.id))
        .innerJoin(locations, eq(locations.id, staffLocations.locationId))
        .where(and(eq(staffProfiles.membershipId, membership.id), eq(locations.organizationId, input.organizationId), eq(locations.status, "ACTIVE")))
        .orderBy(asc(locations.name));
      return rows.map(row => row.location);
    }
    return db.select().from(locations).where(and(
      eq(locations.organizationId, input.organizationId),
      eq(locations.status, "ACTIVE"),
    )).orderBy(asc(locations.name));
  }),

  // Weekday follows the availability engine (0 = Monday); times are "HH:mm:ss" local to the location.
  listLocationOpeningHours: protectedProcedure.input(organizationScopeSchema.extend({ locationId: opaqueIdSchema })).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const db = await requireDb();
    return db.select({ weekday: locationOpeningHours.weekday, opensAt: locationOpeningHours.startLocalTime, closesAt: locationOpeningHours.endLocalTime }).from(locationOpeningHours)
      .innerJoin(locations, eq(locations.id, locationOpeningHours.locationId))
      .where(and(eq(locationOpeningHours.locationId, input.locationId), eq(locations.organizationId, input.organizationId)))
      .orderBy(asc(locationOpeningHours.weekday));
  }),

  /** Replaces the location's weekly opening hours (closed days have no row). OWNER/MANAGER; the location must belong to the organization and be ACTIVE. */
  setLocationOpeningHours: protectedProcedure.input(locationOpeningHoursSetSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
    const db = await requireDb();
    const openDays = input.days.filter(day => day.open).sort((a, b) => a.weekday - b.weekday);
    await db.transaction(async tx => {
      // Locking the location row serialises two editors saving at once.
      const [location] = await tx.select({ id: locations.id }).from(locations)
        .where(and(eq(locations.id, input.locationId), eq(locations.organizationId, input.organizationId), eq(locations.status, "ACTIVE"))).limit(1).for("update");
      if (!location) throw new TRPCError({ code: "NOT_FOUND", message: "ფილიალი ვერ მოიძებნა ან აქტიური არ არის." });
      const before = await tx.select({ weekday: locationOpeningHours.weekday, opensAt: locationOpeningHours.startLocalTime, closesAt: locationOpeningHours.endLocalTime }).from(locationOpeningHours)
        .where(eq(locationOpeningHours.locationId, input.locationId)).orderBy(asc(locationOpeningHours.weekday));
      await tx.delete(locationOpeningHours).where(eq(locationOpeningHours.locationId, input.locationId));
      await tx.insert(locationOpeningHours).values(openDays.map(day => ({ id: nanoid(21), locationId: input.locationId, weekday: day.weekday, startLocalTime: `${day.startLocalTime}:00`, endLocalTime: `${day.endLocalTime}:00` })));
      await tx.insert(auditLogs).values({
        id: nanoid(21), organizationId: input.organizationId, actorUserId: ctx.user.id,
        action: "LOCATION_OPENING_HOURS_CHANGED", entityType: "location", entityId: input.locationId,
        beforeState: { days: before }, afterState: { days: openDays.map(day => ({ weekday: day.weekday, opensAt: day.startLocalTime, closesAt: day.endLocalTime })) },
      });
    });
    return { success: true, openDays: openDays.length };
  }),
});
