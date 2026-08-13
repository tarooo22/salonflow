import { and, asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { locations, organizationMemberships, scheduleExceptions, staffLocations, staffProfiles, workingHourRules } from "../../drizzle/schema";
import { requireOrganizationRole } from "../access";
import { requireDb } from "../db";
import { locationScopeSchema, scheduleExceptionCreateSchema, staffProfileCreateSchema, workingHourRuleCreateSchema } from "../../shared/validation";
import { protectedProcedure, router } from "../_core/trpc";

export const staffRouter = router({
  list: protectedProcedure.input(locationScopeSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const db = await requireDb();
    return db.select({ profile: staffProfiles, membership: organizationMemberships }).from(staffProfiles)
      .innerJoin(organizationMemberships, eq(staffProfiles.membershipId, organizationMemberships.id))
      .where(and(eq(organizationMemberships.organizationId, input.organizationId), eq(staffProfiles.status, "ACTIVE")))
      .orderBy(asc(staffProfiles.sortOrder), asc(staffProfiles.publicDisplayName));
  }),

  createProfile: protectedProcedure.input(staffProfileCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
    const db = await requireDb();
    const [membership] = await db.select().from(organizationMemberships).where(and(
      eq(organizationMemberships.id, input.membershipId),
      eq(organizationMemberships.organizationId, input.organizationId),
      eq(organizationMemberships.status, "ACTIVE"),
    )).limit(1);
    if (!membership) throw new Error("Membership is not active in this organization");
    const staffProfileId = nanoid(21);
    await db.transaction(async tx => {
      await tx.insert(staffProfiles).values({
        id: staffProfileId,
        membershipId: input.membershipId,
        publicDisplayName: input.publicDisplayName,
        jobTitle: input.jobTitle,
        specialty: input.specialty,
        onlineBookingVisible: input.onlineBookingVisible,
        color: input.color,
      });
      await tx.insert(staffLocations).values(input.locationIds.map(locationId => ({ staffProfileId, locationId })));
    });
    return { id: staffProfileId };
  }),

  addWorkingHours: protectedProcedure.input(workingHourRuleCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
    if (input.startLocalTime >= input.endLocalTime) throw new Error("Working hours must end after they start");
    const db = await requireDb();
    const [assignment] = await db.select({ staffProfileId: staffLocations.staffProfileId }).from(staffLocations)
      .innerJoin(staffProfiles, eq(staffLocations.staffProfileId, staffProfiles.id))
      .innerJoin(organizationMemberships, eq(staffProfiles.membershipId, organizationMemberships.id))
      .innerJoin(locations, eq(staffLocations.locationId, locations.id))
      .where(and(
        eq(staffLocations.staffProfileId, input.staffProfileId),
        eq(staffLocations.locationId, input.locationId),
        eq(organizationMemberships.organizationId, input.organizationId),
        eq(locations.organizationId, input.organizationId),
        eq(organizationMemberships.status, "ACTIVE"),
        eq(locations.status, "ACTIVE"),
      )).limit(1);
    if (!assignment) throw new Error("Staff profile is not assigned to this active location");
    const id = nanoid(21);
    await db.insert(workingHourRules).values({
      id,
      staffProfileId: input.staffProfileId,
      locationId: input.locationId,
      weekday: input.weekday,
      startLocalTime: input.startLocalTime,
      endLocalTime: input.endLocalTime,
    });
    return { id };
  }),

  addScheduleException: protectedProcedure.input(scheduleExceptionCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
    const db = await requireDb();
    if (input.staffProfileId && input.locationId) {
      const [assignment] = await db.select({ staffProfileId: staffLocations.staffProfileId }).from(staffLocations)
        .innerJoin(staffProfiles, eq(staffLocations.staffProfileId, staffProfiles.id))
        .innerJoin(organizationMemberships, eq(staffProfiles.membershipId, organizationMemberships.id))
        .innerJoin(locations, eq(staffLocations.locationId, locations.id))
        .where(and(eq(staffLocations.staffProfileId, input.staffProfileId), eq(staffLocations.locationId, input.locationId), eq(organizationMemberships.organizationId, input.organizationId), eq(locations.organizationId, input.organizationId), eq(organizationMemberships.status, "ACTIVE"), eq(locations.status, "ACTIVE"))).limit(1);
      if (!assignment) throw new Error("Staff profile is not assigned to this active location");
    } else if (input.locationId) {
      const [location] = await db.select({ id: locations.id }).from(locations).where(and(eq(locations.id, input.locationId), eq(locations.organizationId, input.organizationId), eq(locations.status, "ACTIVE"))).limit(1);
      if (!location) throw new Error("Location is not active in this organization");
    } else if (input.staffProfileId) {
      const [profile] = await db.select({ id: staffProfiles.id }).from(staffProfiles).innerJoin(organizationMemberships, eq(staffProfiles.membershipId, organizationMemberships.id)).where(and(eq(staffProfiles.id, input.staffProfileId), eq(organizationMemberships.organizationId, input.organizationId), eq(organizationMemberships.status, "ACTIVE"), eq(staffProfiles.status, "ACTIVE"))).limit(1);
      if (!profile) throw new Error("Staff profile is not active in this organization");
    }
    const id = nanoid(21);
    await db.insert(scheduleExceptions).values({ id, organizationId: input.organizationId, staffProfileId: input.staffProfileId, locationId: input.locationId, type: input.type, startsAt: input.startsAt, endsAt: input.endsAt, fullDay: input.fullDay, reason: input.reason, notes: input.notes, approvedByUserId: ctx.user.id });
    return { id };
  }),
});
