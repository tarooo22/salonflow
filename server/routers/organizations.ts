import { and, asc, eq } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { nanoid } from "nanoid";
import { locations, organizationMemberships, organizations, staffInvites } from "../../drizzle/schema";
import { requireOrganizationRole } from "../access";
import { requireDb } from "../db";
import { normalizeEmail, normalizeGeorgianPhone } from "../lib/normalization";
import { locationCreateSchema, organizationCreateSchema, organizationScopeSchema, staffInviteCreateSchema, staffInviteTokenSchema, workspaceSetupSchema } from "../../shared/validation";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const hashInviteToken = (token: string) => createHash("sha256").update(token).digest("hex");

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

  createStaffInvite: protectedProcedure.input(staffInviteCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
    const db = await requireDb();
    if (input.locationId) {
      const [location] = await db.select({ id: locations.id }).from(locations).where(and(
        eq(locations.id, input.locationId),
        eq(locations.organizationId, input.organizationId),
        eq(locations.status, "ACTIVE"),
      )).limit(1);
      if (!location) throw new Error("Active location not found in this organization");
    }
    const token = randomBytes(32).toString("base64url");
    const id = nanoid(21);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(staffInvites).values({
      id,
      organizationId: input.organizationId,
      locationId: input.locationId,
      email: normalizeEmail(input.email),
      role: input.role,
      tokenHash: hashInviteToken(token),
      status: "PENDING",
      expiresAt,
      invitedByUserId: ctx.user.id,
    });
    const inviteUrl = `${input.origin.replace(/\/$/, "")}/invite/${token}`;
    return { id, inviteUrl, expiresAt };
  }),

  previewStaffInvite: publicProcedure.input(staffInviteTokenSchema).query(async ({ input }) => {
    const db = await requireDb();
    const [invite] = await db.select({
      organizationName: organizations.name,
      role: staffInvites.role,
      status: staffInvites.status,
      expiresAt: staffInvites.expiresAt,
    }).from(staffInvites).innerJoin(organizations, eq(staffInvites.organizationId, organizations.id))
      .where(eq(staffInvites.tokenHash, hashInviteToken(input.token))).limit(1);
    if (!invite || invite.status !== "PENDING" || invite.expiresAt <= new Date()) {
      throw new Error("Invite is unavailable or expired");
    }
    return invite;
  }),

  acceptStaffInvite: protectedProcedure.input(staffInviteTokenSchema).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    return db.transaction(async tx => {
      const [invite] = await tx.select().from(staffInvites)
        .where(eq(staffInvites.tokenHash, hashInviteToken(input.token))).limit(1);
      if (!invite || invite.status !== "PENDING" || invite.expiresAt <= new Date()) {
        throw new Error("Invite is unavailable or expired");
      }
      const userEmail = normalizeEmail(ctx.user.email ?? undefined);
      if (!invite.email || !userEmail || invite.email !== userEmail) {
        throw new Error("Invite email does not match the signed-in account");
      }
      const [existingMembership] = await tx.select().from(organizationMemberships).where(and(
        eq(organizationMemberships.organizationId, invite.organizationId),
        eq(organizationMemberships.userId, ctx.user.id),
      )).limit(1);
      if (existingMembership?.status === "ACTIVE") {
        await tx.update(staffInvites).set({ status: "ACCEPTED", acceptedByUserId: ctx.user.id, acceptedAt: new Date() }).where(eq(staffInvites.id, invite.id));
        return { organizationId: invite.organizationId, membershipId: existingMembership.id, alreadyMember: true };
      }
      const membershipId = existingMembership?.id ?? nanoid(21);
      if (existingMembership) {
        await tx.update(organizationMemberships).set({ role: invite.role, status: "ACTIVE", invitedByUserId: invite.invitedByUserId, invitedAt: invite.createdAt, activatedAt: new Date() }).where(eq(organizationMemberships.id, membershipId));
      } else {
        await tx.insert(organizationMemberships).values({
          id: membershipId,
          organizationId: invite.organizationId,
          userId: ctx.user.id,
          role: invite.role,
          status: "ACTIVE",
          invitedByUserId: invite.invitedByUserId,
          invitedAt: invite.createdAt,
          activatedAt: new Date(),
        });
      }
      await tx.update(staffInvites).set({ status: "ACCEPTED", acceptedByUserId: ctx.user.id, acceptedAt: new Date() }).where(eq(staffInvites.id, invite.id));
      return { organizationId: invite.organizationId, membershipId, alreadyMember: false };
    });
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
