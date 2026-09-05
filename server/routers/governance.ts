import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, like, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  organizationAccessGrants,
  organizationGovernance,
  organizationGovernanceEvents,
  organizationMemberships,
  organizations,
  locations,
  users,
} from "../../drizzle/schema";
import {
  organizationGovernanceActionSchema,
  organizationGovernanceAuditSchema,
  organizationGovernanceListSchema,
} from "../../shared/validation";
import { requireDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

function requirePlatformAdmin(role: string) {
  if (role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "ეს მოქმედება ხელმისაწვდომია მხოლოდ SalonFlow platform admin-ისთვის." });
  }
}

const accessStatusLabel = (status: "ACTIVE" | "SUSPENDED") => status === "SUSPENDED" ? "შეჩერებული" : "აქტიური";

export const governanceRouter = router({
  listOrganizations: protectedProcedure.input(organizationGovernanceListSchema).query(async ({ ctx, input }) => {
    requirePlatformAdmin(ctx.user.role);
    const db = await requireDb();
    const search = input.search ? `%${input.search}%` : undefined;
    const rows = await db.select({ organization: organizations, governance: organizationGovernance, location: locations })
      .from(organizations)
      .leftJoin(organizationGovernance, eq(organizationGovernance.organizationId, organizations.id))
      .leftJoin(locations, eq(locations.organizationId, organizations.id))
      .where(and(
        input.accessStatus ? eq(organizationGovernance.accessStatus, input.accessStatus) : undefined,
        input.publicVisible !== undefined ? eq(organizationGovernance.publicVisible, input.publicVisible) : undefined,
        search ? or(
          like(organizations.name, search),
          like(organizations.slug, search),
          like(organizations.billingCode, search),
        ) : undefined,
      ))
      .orderBy(asc(organizations.name), asc(locations.name));

    const grouped = new Map<string, {
      organization: typeof organizations.$inferSelect;
      governance: typeof organizationGovernance.$inferSelect | null;
      locations: Array<{ id: string; name: string; publicSlug: string; status: "ACTIVE" | "ARCHIVED"; bookingEnabled: boolean }>;
    }>();
    for (const row of rows) {
      const existing = grouped.get(row.organization.id) ?? { organization: row.organization, governance: row.governance, locations: [] };
      if (row.location && !existing.locations.some(location => location.id === row.location!.id)) {
        existing.locations.push({ id: row.location.id, name: row.location.name, publicSlug: row.location.publicSlug, status: row.location.status, bookingEnabled: row.location.bookingEnabled });
      }
      grouped.set(row.organization.id, existing);
    }

    const all = await Promise.all(Array.from(grouped.values()).map(async item => {
      const [owner] = await db.select({ name: users.name, email: users.email })
        .from(organizationMemberships)
        .innerJoin(users, eq(users.id, organizationMemberships.userId))
        .where(and(eq(organizationMemberships.organizationId, item.organization.id), eq(organizationMemberships.role, "OWNER"), eq(organizationMemberships.status, "ACTIVE")))
        .limit(1);
      const [grant] = await db.select({ endsAt: organizationAccessGrants.endsAt })
        .from(organizationAccessGrants)
        .where(and(eq(organizationAccessGrants.organizationId, item.organization.id), eq(organizationAccessGrants.status, "ACTIVE")))
        .orderBy(desc(organizationAccessGrants.endsAt))
        .limit(1);
      return {
        id: item.organization.id,
        name: item.organization.name,
        slug: item.organization.slug,
        billingCode: item.organization.billingCode,
        organizationStatus: item.organization.status,
        accessStatus: item.governance?.accessStatus ?? "ACTIVE",
        publicVisible: item.governance?.publicVisible ?? true,
        controlNoteKa: item.governance?.controlNoteKa ?? null,
        ownerName: owner?.name ?? null,
        ownerEmail: owner?.email ?? null,
        activeGrantEndsAt: grant?.endsAt ?? null,
        locations: item.locations,
        createdAt: item.organization.createdAt,
        updatedAt: item.organization.updatedAt,
      };
    }));
    return { items: all.slice(input.offset, input.offset + input.limit), total: all.length, accessStatusLabel };
  }),

  audit: protectedProcedure.input(organizationGovernanceAuditSchema).query(async ({ ctx, input }) => {
    requirePlatformAdmin(ctx.user.role);
    const db = await requireDb();
    return db.select({ event: organizationGovernanceEvents, actorName: users.name, actorEmail: users.email })
      .from(organizationGovernanceEvents)
      .innerJoin(users, eq(users.id, organizationGovernanceEvents.actorUserId))
      .where(eq(organizationGovernanceEvents.organizationId, input.organizationId))
      .orderBy(desc(organizationGovernanceEvents.createdAt))
      .limit(input.limit);
  }),

  act: protectedProcedure.input(organizationGovernanceActionSchema).mutation(async ({ ctx, input }) => {
    requirePlatformAdmin(ctx.user.role);
    const db = await requireDb();
    const [organization] = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.id, input.organizationId)).limit(1);
    if (!organization) throw new TRPCError({ code: "NOT_FOUND", message: "სალონი ვერ მოიძებნა." });
    const now = new Date();

    return db.transaction(async tx => {
      const [existing] = await tx.select().from(organizationGovernance).where(eq(organizationGovernance.organizationId, input.organizationId)).limit(1);
      const nextStatus = input.action === "SUSPEND" ? "SUSPENDED" : input.action === "RESTORE" ? "ACTIVE" : existing?.accessStatus ?? "ACTIVE";
      const nextPublicVisible = input.action === "HIDE_PUBLIC" ? false : input.action === "SHOW_PUBLIC" ? true : existing?.publicVisible ?? true;
      if (existing) {
        await tx.update(organizationGovernance).set({ accessStatus: nextStatus, publicVisible: nextPublicVisible, controlNoteKa: input.reasonKa, updatedByUserId: ctx.user.id }).where(eq(organizationGovernance.organizationId, input.organizationId));
      } else {
        await tx.insert(organizationGovernance).values({ organizationId: input.organizationId, accessStatus: nextStatus, publicVisible: nextPublicVisible, controlNoteKa: input.reasonKa, updatedByUserId: ctx.user.id });
      }

      let grantEndsAt: Date | null = null;
      if (input.action === "GRANT_DAYS") {
        const [currentGrant] = await tx.select({ endsAt: organizationAccessGrants.endsAt })
          .from(organizationAccessGrants)
          .where(and(eq(organizationAccessGrants.organizationId, input.organizationId), eq(organizationAccessGrants.status, "ACTIVE")))
          .orderBy(desc(organizationAccessGrants.endsAt))
          .limit(1);
        const startsAt = currentGrant && currentGrant.endsAt > now ? currentGrant.endsAt : now;
        grantEndsAt = new Date(startsAt.getTime() + (input.days ?? 0) * 24 * 60 * 60 * 1000);
        await tx.insert(organizationAccessGrants).values({ id: nanoid(21), organizationId: input.organizationId, source: "BONUS_DAYS", startsAt, endsAt: grantEndsAt, status: "ACTIVE", grantReasonKa: input.reasonKa, grantedByUserId: ctx.user.id, metadata: { days: input.days, governanceAction: true } });
      }

      await tx.insert(organizationGovernanceEvents).values({ id: nanoid(21), organizationId: input.organizationId, eventType: input.action, actorUserId: ctx.user.id, metadata: { reasonKa: input.reasonKa, days: input.days ?? null, accessStatus: nextStatus, publicVisible: nextPublicVisible, grantEndsAt: grantEndsAt?.toISOString() ?? null } });
      return { action: input.action, accessStatus: nextStatus, publicVisible: nextPublicVisible, grantEndsAt };
    });
  }),
});
