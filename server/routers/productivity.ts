import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { dashboardUserPreferences, locations, userDailyCloseChecklists, workspaceSavedViews } from "../../drizzle/schema";
import { requireOrganizationRole } from "../access";
import { protectedProcedure, router } from "../_core/trpc";
import { requireDb } from "../db";

const workspaceRoles = ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"] as const;
const closeRoles = ["OWNER", "MANAGER", "RECEPTIONIST"] as const;
const scopeSchema = z.object({ organizationId: z.string().min(1) });
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const preferenceSchema = scopeSchema.extend({
  metricKeys: z.array(z.enum(["BOOKINGS", "PENDING", "SCHEDULED", "OUTSTANDING", "UP_NEXT"])).min(2).max(4).optional(),
  dismissedNotificationKeys: z.array(z.string().min(1).max(120)).max(40).optional(),
});
const dailyCloseSchema = scopeSchema.extend({
  locationId: z.string().min(1),
  businessDate: dateKey,
  completedKeys: z.array(z.enum(["PENDING", "COMPLETED", "OUTSTANDING", "TOMORROW"])).max(4),
});
const savedViewRoute = z.enum(["/app/calendar", "/app/clients", "/app/reports"]);
const savedViewPayload = z.object({
  view: z.enum(["day", "week"]).optional(),
  locationId: z.string().min(1).max(36).optional(),
  staffFilter: z.string().min(1).max(36).optional(),
  period: z.enum(["7d", "30d", "90d"]).optional(),
  clientStatus: z.enum(["ACTIVE"]).optional(),
  clientSource: z.enum(["INTERNAL", "PUBLIC_WEB"]).optional(),
}).strict();
const savedViewSchema = scopeSchema.extend({
  route: savedViewRoute,
  name: z.string().trim().min(2).max(80),
  filterPayload: savedViewPayload,
  isDefault: z.boolean().default(false),
});

async function requireLocationInOrganization(organizationId: string, locationId: string) {
  const db = await requireDb();
  const [location] = await db.select({ id: locations.id }).from(locations).where(and(
    eq(locations.id, locationId),
    eq(locations.organizationId, organizationId),
    eq(locations.status, "ACTIVE"),
  )).limit(1);
  if (!location) throw new TRPCError({ code: "FORBIDDEN", message: "ფილიალი ამ სამუშაო სივრცეს არ ეკუთვნის" });
}

export const productivityRouter = router({
  preferences: protectedProcedure.input(scopeSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...workspaceRoles]);
    const db = await requireDb();
    const [record] = await db.select().from(dashboardUserPreferences).where(and(
      eq(dashboardUserPreferences.organizationId, input.organizationId),
      eq(dashboardUserPreferences.userId, ctx.user.id),
    )).limit(1);
    return {
      metricKeys: Array.isArray(record?.metricKeys) ? record.metricKeys.filter((key): key is string => typeof key === "string") : null,
      dismissedNotificationKeys: Array.isArray(record?.dismissedNotificationKeys) ? record.dismissedNotificationKeys.filter((key): key is string => typeof key === "string") : [],
    };
  }),

  savePreferences: protectedProcedure.input(preferenceSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...workspaceRoles]);
    const db = await requireDb();
    const [existing] = await db.select().from(dashboardUserPreferences).where(and(
      eq(dashboardUserPreferences.organizationId, input.organizationId),
      eq(dashboardUserPreferences.userId, ctx.user.id),
    )).limit(1);
    const metricKeys = input.metricKeys ?? (Array.isArray(existing?.metricKeys) ? existing.metricKeys : null);
    const dismissedNotificationKeys = input.dismissedNotificationKeys ?? (Array.isArray(existing?.dismissedNotificationKeys) ? existing.dismissedNotificationKeys : []);
    await db.insert(dashboardUserPreferences).values({
      id: nanoid(21),
      organizationId: input.organizationId,
      userId: ctx.user.id,
      metricKeys,
      dismissedNotificationKeys,
    }).onDuplicateKeyUpdate({ set: { metricKeys, dismissedNotificationKeys, updatedAt: new Date() } });
    return { success: true };
  }),

  dailyCloseState: protectedProcedure.input(dailyCloseSchema.pick({ organizationId: true, locationId: true, businessDate: true })).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...closeRoles]);
    await requireLocationInOrganization(input.organizationId, input.locationId);
    const db = await requireDb();
    const businessDate = new Date(`${input.businessDate}T00:00:00.000Z`);
    const [record] = await db.select().from(userDailyCloseChecklists).where(and(
      eq(userDailyCloseChecklists.organizationId, input.organizationId),
      eq(userDailyCloseChecklists.locationId, input.locationId),
      eq(userDailyCloseChecklists.userId, ctx.user.id),
      eq(userDailyCloseChecklists.businessDate, businessDate),
    )).limit(1);
    return { completedKeys: Array.isArray(record?.completedKeys) ? record.completedKeys.filter((key): key is string => typeof key === "string") : [], closedAt: record?.closedAt ?? null };
  }),

  saveDailyClose: protectedProcedure.input(dailyCloseSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...closeRoles]);
    await requireLocationInOrganization(input.organizationId, input.locationId);
    const db = await requireDb();
    const businessDate = new Date(`${input.businessDate}T00:00:00.000Z`);
    const closedAt = input.completedKeys.length === 4 ? new Date() : null;
    await db.insert(userDailyCloseChecklists).values({
      id: nanoid(21),
      organizationId: input.organizationId,
      locationId: input.locationId,
      userId: ctx.user.id,
      businessDate,
      completedKeys: input.completedKeys,
      closedAt,
    }).onDuplicateKeyUpdate({ set: { completedKeys: input.completedKeys, closedAt, updatedAt: new Date() } });
    return { success: true, closedAt };
  }),

  listSavedViews: protectedProcedure.input(scopeSchema.extend({ route: savedViewRoute })).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...workspaceRoles]);
    const db = await requireDb();
    return db.select({ id: workspaceSavedViews.id, name: workspaceSavedViews.name, route: workspaceSavedViews.route, filterPayload: workspaceSavedViews.filterPayload, schemaVersion: workspaceSavedViews.schemaVersion, isDefault: workspaceSavedViews.isDefault, updatedAt: workspaceSavedViews.updatedAt }).from(workspaceSavedViews).where(and(
      eq(workspaceSavedViews.organizationId, input.organizationId),
      eq(workspaceSavedViews.userId, ctx.user.id),
      eq(workspaceSavedViews.route, input.route),
    )).orderBy(desc(workspaceSavedViews.isDefault), desc(workspaceSavedViews.updatedAt));
  }),

  saveSavedView: protectedProcedure.input(savedViewSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...workspaceRoles]);
    const db = await requireDb();
    await db.transaction(async tx => {
      if (input.isDefault) await tx.update(workspaceSavedViews).set({ isDefault: false, updatedAt: new Date() }).where(and(
        eq(workspaceSavedViews.organizationId, input.organizationId),
        eq(workspaceSavedViews.userId, ctx.user.id),
        eq(workspaceSavedViews.route, input.route),
      ));
      await tx.insert(workspaceSavedViews).values({ id: nanoid(21), organizationId: input.organizationId, userId: ctx.user.id, route: input.route, name: input.name, filterPayload: input.filterPayload, schemaVersion: 1, isDefault: input.isDefault }).onDuplicateKeyUpdate({ set: { filterPayload: input.filterPayload, schemaVersion: 1, isDefault: input.isDefault, updatedAt: new Date() } });
    });
    return { success: true };
  }),

  deleteSavedView: protectedProcedure.input(scopeSchema.extend({ id: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, [...workspaceRoles]);
    const db = await requireDb();
    const result = await db.delete(workspaceSavedViews).where(and(
      eq(workspaceSavedViews.id, input.id),
      eq(workspaceSavedViews.organizationId, input.organizationId),
      eq(workspaceSavedViews.userId, ctx.user.id),
    ));
    if (!result[0]?.affectedRows) throw new TRPCError({ code: "NOT_FOUND", message: "შენახული ხედი ვერ მოიძებნა" });
    return { success: true };
  }),
});
