import { and, asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { organizationMemberships, staffLocations, staffProfiles, workingHourRules } from "../../drizzle/schema";
import { requireOrganizationRole } from "../access";
import { requireDb } from "../db";
import { locationScopeSchema, staffProfileCreateSchema, workingHourRuleCreateSchema } from "../../shared/validation";
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
});
