import { and, asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { organizationMemberships, serviceCategories, services, staffProfiles, staffServices } from "../../drizzle/schema";
import { requireOrganizationRole } from "../access";
import { requireDb } from "../db";
import { locationScopeSchema, opaqueIdSchema, organizationScopeSchema, serviceCategoryCreateSchema, serviceCreateSchema } from "../../shared/validation";
import { protectedProcedure, router } from "../_core/trpc";

export const servicesRouter = router({
  listCategories: protectedProcedure.input(locationScopeSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const db = await requireDb();
    return db.select().from(serviceCategories).where(and(
      eq(serviceCategories.organizationId, input.organizationId),
      eq(serviceCategories.status, "ACTIVE"),
    )).orderBy(asc(serviceCategories.sortOrder), asc(serviceCategories.nameKa));
  }),

  createCategory: protectedProcedure.input(serviceCategoryCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
    const db = await requireDb();
    const id = nanoid(21);
    await db.insert(serviceCategories).values({ id, ...input });
    return { id };
  }),

  list: protectedProcedure.input(locationScopeSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const db = await requireDb();
    return db.select({ service: services, category: serviceCategories }).from(services)
      .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(and(eq(services.organizationId, input.organizationId), eq(services.status, "ACTIVE")))
      .orderBy(asc(serviceCategories.sortOrder), asc(services.sortOrder), asc(services.nameKa));
  }),

  create: protectedProcedure.input(serviceCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
    const db = await requireDb();
    const [category] = await db.select({ id: serviceCategories.id }).from(serviceCategories).where(and(
      eq(serviceCategories.id, input.categoryId),
      eq(serviceCategories.organizationId, input.organizationId),
      eq(serviceCategories.status, "ACTIVE"),
    )).limit(1);
    if (!category) throw new Error("Service category is not available in this organization");
    const id = nanoid(21);
    await db.insert(services).values({ id, ...input });
    return { id };
  }),

  archive: protectedProcedure.input(organizationScopeSchema.extend({ serviceId: opaqueIdSchema })).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
    const db = await requireDb();
    await db.update(services).set({ status: "ARCHIVED" }).where(and(eq(services.id, input.serviceId), eq(services.organizationId, input.organizationId)));
    return { success: true };
  }),

  listStaffEligibility: protectedProcedure.input(organizationScopeSchema.extend({ serviceId: opaqueIdSchema })).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
    const db = await requireDb();
    const [service] = await db.select({ id: services.id }).from(services).where(and(
      eq(services.id, input.serviceId),
      eq(services.organizationId, input.organizationId),
    )).limit(1);
    if (!service) throw new Error("Service is not available in this organization");
    return db.select({ staffProfileId: staffServices.staffProfileId, canPerform: staffServices.canPerform })
      .from(staffServices).where(eq(staffServices.serviceId, input.serviceId));
  }),

  setStaffEligibility: protectedProcedure.input(organizationScopeSchema.extend({ staffProfileId: opaqueIdSchema, serviceId: opaqueIdSchema, canPerform: serviceCreateSchema.shape.onlineBookingEnabled })).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER"]);
    const db = await requireDb();
    const [service] = await db.select({ id: services.id }).from(services).where(and(
      eq(services.id, input.serviceId),
      eq(services.organizationId, input.organizationId),
      eq(services.status, "ACTIVE"),
    )).limit(1);
    if (!service) throw new Error("Service is not available in this organization");
    const [profile] = await db.select({ id: staffProfiles.id }).from(staffProfiles)
      .innerJoin(organizationMemberships, eq(staffProfiles.membershipId, organizationMemberships.id))
      .where(and(
        eq(staffProfiles.id, input.staffProfileId),
        eq(organizationMemberships.organizationId, input.organizationId),
        eq(organizationMemberships.status, "ACTIVE"),
        eq(staffProfiles.status, "ACTIVE"),
      )).limit(1);
    if (!profile) throw new Error("Staff profile is not active in this organization");
    await db.insert(staffServices).values({ staffProfileId: input.staffProfileId, serviceId: input.serviceId, canPerform: input.canPerform }).onDuplicateKeyUpdate({ set: { canPerform: input.canPerform } });
    return { success: true };
  }),
});
