import { and, asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { locations, organizationMemberships, organizations } from "../../drizzle/schema";
import { requireOrganizationRole } from "../access";
import { requireDb } from "../db";
import { normalizeEmail, normalizeGeorgianPhone } from "../lib/normalization";
import { locationCreateSchema, organizationCreateSchema, organizationScopeSchema, workspaceSetupSchema } from "../../shared/validation";
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
    const organizationId = nanoid(21);
    const membershipId = nanoid(21);
    await db.transaction(async tx => {
      await tx.insert(organizations).values({
        id: organizationId,
        name: input.name,
        slug: input.slug,
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
    });
    return { id: organizationId, membershipId };
  }),

  createWorkspace: protectedProcedure.input(workspaceSetupSchema).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const organizationId = nanoid(21);
    const membershipId = nanoid(21);
    const locationId = nanoid(21);
    await db.transaction(async tx => {
      await tx.insert(organizations).values({
        id: organizationId,
        name: input.organization.name,
        slug: input.organization.slug,
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
    });
    return { organizationId, membershipId, locationId };
  }),

  createLocation: protectedProcedure.input(locationCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
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

  listLocations: protectedProcedure.input(organizationScopeSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const db = await requireDb();
    return db.select().from(locations).where(and(
      eq(locations.organizationId, input.organizationId),
      eq(locations.status, "ACTIVE"),
    )).orderBy(asc(locations.name));
  }),
});
