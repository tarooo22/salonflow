import { and, asc, eq } from "drizzle-orm";
import { clients, locations, services, staffProfiles, waitlistEntries } from "../../drizzle/schema";
import { waitlistListSchema, waitlistStatusUpdateSchema } from "../../shared/validation";
import { requireOrganizationAction, requireOrganizationRole } from "../access";
import { requireDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const waitlistRouter = router({
  list: protectedProcedure.input(waitlistListSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST"]);
    const db = await requireDb();
    const conditions = [eq(waitlistEntries.organizationId, input.organizationId)];
    if (input.locationId) conditions.push(eq(waitlistEntries.locationId, input.locationId));
    if (input.status) conditions.push(eq(waitlistEntries.status, input.status));
    return db.select({ entry: waitlistEntries, client: clients, location: locations, service: services, staff: staffProfiles }).from(waitlistEntries)
      .innerJoin(clients, eq(waitlistEntries.clientId, clients.id))
      .innerJoin(locations, eq(waitlistEntries.locationId, locations.id))
      .innerJoin(services, eq(waitlistEntries.serviceId, services.id))
      .leftJoin(staffProfiles, eq(waitlistEntries.staffProfileId, staffProfiles.id))
      .where(and(...conditions)).orderBy(asc(waitlistEntries.requestedDate), asc(waitlistEntries.createdAt));
  }),
  updateStatus: protectedProcedure.input(waitlistStatusUpdateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationAction(ctx.user, input.organizationId, "calendar:manage");
    const db = await requireDb();
    const [entry] = await db.select({ id: waitlistEntries.id }).from(waitlistEntries).where(and(eq(waitlistEntries.id, input.id), eq(waitlistEntries.organizationId, input.organizationId))).limit(1);
    if (!entry) throw new Error("მოლოდინის მოთხოვნა ვერ მოიძებნა.");
    await db.update(waitlistEntries).set({ status: input.status }).where(eq(waitlistEntries.id, entry.id));
    return { success: true } as const;
  }),
});
