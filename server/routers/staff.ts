import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { appointments, locations, organizationMemberships, scheduleExceptions, staffLocations, staffProfiles, workingHourRules } from "../../drizzle/schema";
import { requireOrganizationRole } from "../access";
import { requireDb } from "../db";
import { locationScopeSchema, scheduleExceptionCreateSchema, scheduleExceptionUpdateSchema, staffPerformanceSchema, staffProfileCreateSchema, staffScheduleListSchema, staffScheduleRecordDeleteSchema, workingHourRuleCreateSchema, workingHourRuleUpdateSchema } from "../../shared/validation";
import { protectedProcedure, router } from "../_core/trpc";
import { summarizeStaffPerformance } from "../lib/staffPerformance";

export const staffRouter = router({
  list: protectedProcedure.input(locationScopeSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const db = await requireDb();
    const conditions = [eq(organizationMemberships.organizationId, input.organizationId), eq(staffProfiles.status, "ACTIVE")];
    if (input.locationId) conditions.push(eq(staffLocations.locationId, input.locationId));
    const query = db.select({ profile: staffProfiles, membership: organizationMemberships }).from(staffProfiles)
      .innerJoin(organizationMemberships, eq(staffProfiles.membershipId, organizationMemberships.id)).$dynamic();
    if (input.locationId) query.innerJoin(staffLocations, eq(staffLocations.staffProfileId, staffProfiles.id));
    return query.where(and(...conditions)).orderBy(asc(staffProfiles.sortOrder), asc(staffProfiles.publicDisplayName));
  }),

  createProfile: protectedProcedure.input(staffProfileCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
    const db = await requireDb();
    const [membership] = await db.select().from(organizationMemberships).where(and(eq(organizationMemberships.id, input.membershipId), eq(organizationMemberships.organizationId, input.organizationId), eq(organizationMemberships.status, "ACTIVE"))).limit(1);
    if (!membership) throw new Error("Membership is not active in this organization");
    const staffProfileId = nanoid(21);
    await db.transaction(async tx => {
      await tx.insert(staffProfiles).values({ id: staffProfileId, membershipId: input.membershipId, publicDisplayName: input.publicDisplayName, jobTitle: input.jobTitle, specialty: input.specialty, onlineBookingVisible: input.onlineBookingVisible, color: input.color });
      await tx.insert(staffLocations).values(input.locationIds.map(locationId => ({ staffProfileId, locationId })));
    });
    return { id: staffProfileId };
  }),

  addWorkingHours: protectedProcedure.input(workingHourRuleCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
    if (input.startLocalTime >= input.endLocalTime) throw new Error("Working hours must end after they start");
    const db = await requireDb();
    const [assignment] = await db.select({ staffProfileId: staffLocations.staffProfileId }).from(staffLocations)
      .innerJoin(staffProfiles, eq(staffLocations.staffProfileId, staffProfiles.id)).innerJoin(organizationMemberships, eq(staffProfiles.membershipId, organizationMemberships.id)).innerJoin(locations, eq(staffLocations.locationId, locations.id))
      .where(and(eq(staffLocations.staffProfileId, input.staffProfileId), eq(staffLocations.locationId, input.locationId), eq(organizationMemberships.organizationId, input.organizationId), eq(locations.organizationId, input.organizationId), eq(organizationMemberships.status, "ACTIVE"), eq(locations.status, "ACTIVE"))).limit(1);
    if (!assignment) throw new Error("Staff profile is not assigned to this active location");
    const id = nanoid(21);
    await db.insert(workingHourRules).values({ id, staffProfileId: input.staffProfileId, locationId: input.locationId, weekday: input.weekday, startLocalTime: input.startLocalTime, endLocalTime: input.endLocalTime });
    return { id };
  }),

  listWorkingHours: protectedProcedure.input(staffScheduleListSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
    const db = await requireDb();
    const conditions = [eq(organizationMemberships.organizationId, input.organizationId), eq(organizationMemberships.status, "ACTIVE"), eq(staffProfiles.status, "ACTIVE")];
    if (input.staffProfileId) conditions.push(eq(workingHourRules.staffProfileId, input.staffProfileId));
    if (input.locationId) conditions.push(eq(workingHourRules.locationId, input.locationId));
    return db.select({ rule: workingHourRules, profile: staffProfiles, location: locations }).from(workingHourRules)
      .innerJoin(staffProfiles, eq(workingHourRules.staffProfileId, staffProfiles.id)).innerJoin(organizationMemberships, eq(staffProfiles.membershipId, organizationMemberships.id)).innerJoin(locations, eq(workingHourRules.locationId, locations.id))
      .where(and(...conditions)).orderBy(asc(workingHourRules.weekday), asc(workingHourRules.startLocalTime));
  }),

  deleteWorkingHours: protectedProcedure.input(staffScheduleRecordDeleteSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
    const db = await requireDb();
    const [record] = await db.select({ id: workingHourRules.id }).from(workingHourRules)
      .innerJoin(staffProfiles, eq(workingHourRules.staffProfileId, staffProfiles.id)).innerJoin(organizationMemberships, eq(staffProfiles.membershipId, organizationMemberships.id)).innerJoin(locations, eq(workingHourRules.locationId, locations.id))
      .where(and(eq(workingHourRules.id, input.id), eq(organizationMemberships.organizationId, input.organizationId), eq(locations.organizationId, input.organizationId))).limit(1);
    if (!record) throw new Error("Working hours are not available in this organization");
    await db.delete(workingHourRules).where(eq(workingHourRules.id, input.id));
    return { success: true };
  }),

  updateWorkingHours: protectedProcedure.input(workingHourRuleUpdateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
    if (input.startLocalTime >= input.endLocalTime) throw new Error("Working hours must end after they start");
    const db = await requireDb();
    const [record] = await db.select({ id: workingHourRules.id }).from(workingHourRules)
      .innerJoin(staffProfiles, eq(workingHourRules.staffProfileId, staffProfiles.id)).innerJoin(organizationMemberships, eq(staffProfiles.membershipId, organizationMemberships.id)).innerJoin(locations, eq(workingHourRules.locationId, locations.id))
      .where(and(eq(workingHourRules.id, input.id), eq(workingHourRules.staffProfileId, input.staffProfileId), eq(workingHourRules.locationId, input.locationId), eq(organizationMemberships.organizationId, input.organizationId), eq(locations.organizationId, input.organizationId), eq(organizationMemberships.status, "ACTIVE"), eq(locations.status, "ACTIVE"))).limit(1);
    if (!record) throw new Error("Working hours are not available in this active organization location");
    await db.update(workingHourRules).set({ weekday: input.weekday, startLocalTime: input.startLocalTime, endLocalTime: input.endLocalTime }).where(eq(workingHourRules.id, input.id));
    return { success: true };
  }),

  addScheduleException: protectedProcedure.input(scheduleExceptionCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
    const db = await requireDb();
    if (input.staffProfileId && input.locationId) {
      const [assignment] = await db.select({ staffProfileId: staffLocations.staffProfileId }).from(staffLocations).innerJoin(staffProfiles, eq(staffLocations.staffProfileId, staffProfiles.id)).innerJoin(organizationMemberships, eq(staffProfiles.membershipId, organizationMemberships.id)).innerJoin(locations, eq(staffLocations.locationId, locations.id))
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

  listScheduleExceptions: protectedProcedure.input(staffScheduleListSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
    const db = await requireDb();
    const conditions = [eq(scheduleExceptions.organizationId, input.organizationId)];
    if (input.staffProfileId) conditions.push(eq(scheduleExceptions.staffProfileId, input.staffProfileId));
    if (input.locationId) conditions.push(eq(scheduleExceptions.locationId, input.locationId));
    return db.select({ exception: scheduleExceptions, profile: staffProfiles, location: locations }).from(scheduleExceptions)
      .leftJoin(staffProfiles, eq(scheduleExceptions.staffProfileId, staffProfiles.id)).leftJoin(locations, eq(scheduleExceptions.locationId, locations.id))
      .where(and(...conditions)).orderBy(desc(scheduleExceptions.startsAt));
  }),

  deleteScheduleException: protectedProcedure.input(staffScheduleRecordDeleteSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
    const db = await requireDb();
    const [record] = await db.select({ id: scheduleExceptions.id }).from(scheduleExceptions).where(and(eq(scheduleExceptions.id, input.id), eq(scheduleExceptions.organizationId, input.organizationId))).limit(1);
    if (!record) throw new Error("Schedule exception is not available in this organization");
    await db.delete(scheduleExceptions).where(eq(scheduleExceptions.id, input.id));
    return { success: true };
  }),

  updateScheduleException: protectedProcedure.input(scheduleExceptionUpdateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
    const db = await requireDb();
    const [record] = await db.select({ id: scheduleExceptions.id, staffProfileId: scheduleExceptions.staffProfileId, locationId: scheduleExceptions.locationId }).from(scheduleExceptions).where(and(eq(scheduleExceptions.id, input.id), eq(scheduleExceptions.organizationId, input.organizationId))).limit(1);
    if (!record) throw new Error("Schedule exception is not available in this organization");
    if (record.staffProfileId !== input.staffProfileId || record.locationId !== input.locationId) throw new Error("Schedule exception staff and location cannot be changed");
    const [assignment] = await db.select({ staffProfileId: staffLocations.staffProfileId }).from(staffLocations).innerJoin(staffProfiles, eq(staffLocations.staffProfileId, staffProfiles.id)).innerJoin(organizationMemberships, eq(staffProfiles.membershipId, organizationMemberships.id)).innerJoin(locations, eq(staffLocations.locationId, locations.id))
      .where(and(eq(staffLocations.staffProfileId, input.staffProfileId), eq(staffLocations.locationId, input.locationId), eq(organizationMemberships.organizationId, input.organizationId), eq(organizationMemberships.status, "ACTIVE"), eq(staffProfiles.status, "ACTIVE"), eq(locations.organizationId, input.organizationId), eq(locations.status, "ACTIVE"))).limit(1);
    if (!assignment) throw new Error("Schedule exception staff profile is not assigned to this active location");
    await db.update(scheduleExceptions).set({ type: input.type, startsAt: input.startsAt, endsAt: input.endsAt, fullDay: input.fullDay, reason: input.reason, notes: input.notes, approvedByUserId: ctx.user.id }).where(eq(scheduleExceptions.id, input.id));
    return { success: true };
  }),

  performance: protectedProcedure.input(staffPerformanceSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
    const db = await requireDb();
    const profileRows = await db.select({ profile: staffProfiles }).from(staffProfiles)
      .innerJoin(organizationMemberships, eq(staffProfiles.membershipId, organizationMemberships.id))
      .where(and(eq(organizationMemberships.organizationId, input.organizationId), eq(organizationMemberships.status, "ACTIVE"), eq(staffProfiles.status, "ACTIVE")))
      .orderBy(asc(staffProfiles.sortOrder), asc(staffProfiles.publicDisplayName));
    const conditions = [eq(appointments.organizationId, input.organizationId), gte(appointments.startsAt, input.startsAt), lt(appointments.startsAt, input.endsAt)];
    if (input.locationId) conditions.push(eq(appointments.locationId, input.locationId));
    const appointmentRows = await db.select({ staffProfileId: appointments.staffProfileId, status: appointments.status, totalTetri: appointments.totalTetri }).from(appointments).where(and(...conditions));
    const metrics = new Map(summarizeStaffPerformance(profileRows.map(row => row.profile.id), appointmentRows).map(metric => [metric.staffProfileId, metric]));
    return profileRows.map(row => ({ profile: row.profile, metrics: metrics.get(row.profile.id)! }));
  }),
});
