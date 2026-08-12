import { and, asc, count, eq, like } from "drizzle-orm";
import { nanoid } from "nanoid";
import { clientConsents, clients } from "../../drizzle/schema";
import { requireOrganizationRole } from "../access";
import { requireDb } from "../db";
import { cleanSearch, normalizeEmail, normalizeGeorgianPhone } from "../lib/normalization";
import { clientCreateSchema, clientListSchema } from "../../shared/validation";
import { protectedProcedure, router } from "../_core/trpc";

export const clientsRouter = router({
  list: protectedProcedure.input(clientListSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST"]);
    const db = await requireDb();
    const search = cleanSearch(input.search);
    const conditions = [eq(clients.organizationId, input.organizationId)];
    if (input.status) conditions.push(eq(clients.status, input.status));
    if (search) conditions.push(like(clients.firstName, `%${search}%`));
    const where = and(...conditions);
    const [items, [{ total }]] = await Promise.all([
      db.select().from(clients).where(where).orderBy(asc(clients.lastName), asc(clients.firstName)).limit(input.limit).offset(input.offset),
      db.select({ total: count() }).from(clients).where(where),
    ]);
    return { items, total };
  }),

  create: protectedProcedure.input(clientCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST"]);
    if (!input.bookingTermsConsent) throw new Error("Booking terms consent is required");
    const db = await requireDb();
    const id = nanoid(21);
    const normalizedPhone = normalizeGeorgianPhone(input.phone);
    const normalizedEmail = normalizeEmail(input.email);
    await db.transaction(async tx => {
      await tx.insert(clients).values({
        id,
        organizationId: input.organizationId,
        firstName: input.firstName,
        lastName: input.lastName,
        normalizedPhone,
        email: input.email,
        normalizedEmail,
        notes: input.notes,
        preferences: input.preferences,
        createdByUserId: ctx.user.id,
        source: "INTERNAL",
      });
      await tx.insert(clientConsents).values([
        { id: nanoid(21), clientId: id, consentType: "BOOKING_TERMS", granted: true, source: "INTERNAL", grantedAt: new Date() },
        { id: nanoid(21), clientId: id, consentType: "MARKETING_SMS", granted: input.marketingSmsConsent, source: "INTERNAL", grantedAt: new Date() },
        { id: nanoid(21), clientId: id, consentType: "MARKETING_EMAIL", granted: input.marketingEmailConsent, source: "INTERNAL", grantedAt: new Date() },
      ]);
    });
    return { id };
  }),
});
