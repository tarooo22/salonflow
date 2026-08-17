import { and, asc, count, desc, eq, inArray, like } from "drizzle-orm";
import { nanoid } from "nanoid";
import { appointmentServices, appointments, clientConsents, clientMediaSets, clientMerges, clients } from "../../drizzle/schema";
import { requireOrganizationRole } from "../access";
import { requireDb } from "../db";
import { cleanSearch, normalizeEmail, normalizeGeorgianPhone } from "../lib/normalization";
import { clientBookingHistorySchema, clientCareUpdateSchema, clientConsentSchema, clientCreateSchema, clientDetailSchema, clientListSchema, clientMergeSchema } from "../../shared/validation";
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

  detail: protectedProcedure.input(clientDetailSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST"]);
    const db = await requireDb();
    const [client] = await db.select().from(clients).where(and(
      eq(clients.id, input.clientId),
      eq(clients.organizationId, input.organizationId),
      eq(clients.status, "ACTIVE"),
    )).limit(1);
    if (!client) throw new Error("Client is not available in this organization");
    return client;
  }),

  updateCare: protectedProcedure.input(clientCareUpdateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST"]);
    const db = await requireDb();
    const update = {
      ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
      ...(input.preferences !== undefined ? { preferences: input.preferences || null } : {}),
      ...(input.sensitivityNote !== undefined ? { sensitivityNote: input.sensitivityNote || null } : {}),
    };
    const result = await db.update(clients).set(update).where(and(
      eq(clients.id, input.clientId),
      eq(clients.organizationId, input.organizationId),
      eq(clients.status, "ACTIVE"),
    ));
    if (!result[0]?.affectedRows) throw new Error("Client is not available in this organization");
    return { success: true };
  }),

  bookingHistory: protectedProcedure.input(clientBookingHistorySchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST"]);
    const db = await requireDb();
    const appointmentRows = await db.select().from(appointments).where(and(
      eq(appointments.organizationId, input.organizationId),
      eq(appointments.clientId, input.clientId),
    )).orderBy(desc(appointments.startsAt)).limit(input.limit);
    const appointmentIds = appointmentRows.map(appointment => appointment.id);
    const serviceRows = appointmentIds.length ? await db.select().from(appointmentServices).where(
      inArray(appointmentServices.appointmentId, appointmentIds),
    ) : [];
    return appointmentRows.map(appointment => ({
      appointment,
      services: serviceRows.filter(service => service.appointmentId === appointment.id),
    }));
  }),

  listConsents: protectedProcedure.input(clientConsentSchema.pick({ organizationId: true, clientId: true })).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST"]);
    const db = await requireDb();
    const [client] = await db.select({ id: clients.id }).from(clients).where(and(
      eq(clients.id, input.clientId),
      eq(clients.organizationId, input.organizationId),
    )).limit(1);
    if (!client) throw new Error("Client is not available in this organization");
    return db.select().from(clientConsents).where(eq(clientConsents.clientId, input.clientId)).orderBy(desc(clientConsents.grantedAt));
  }),

  setConsent: protectedProcedure.input(clientConsentSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST"]);
    const db = await requireDb();
    const [client] = await db.select({ id: clients.id }).from(clients).where(and(
      eq(clients.id, input.clientId),
      eq(clients.organizationId, input.organizationId),
    )).limit(1);
    if (!client) throw new Error("Client is not available in this organization");
    const now = new Date();
    await db.insert(clientConsents).values({
      id: nanoid(21),
      clientId: input.clientId,
      consentType: input.consentType,
      granted: input.granted,
      source: "INTERNAL",
      grantedAt: now,
      withdrawnAt: input.granted ? null : now,
    });
    return { success: true };
  }),

  merge: protectedProcedure.input(clientMergeSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST"]);
    const db = await requireDb();
    return db.transaction(async tx => {
      const records = await tx.select().from(clients).where(and(eq(clients.organizationId, input.organizationId), inArray(clients.id, [input.sourceClientId, input.targetClientId])));
      const source = records.find(client => client.id === input.sourceClientId);
      const target = records.find(client => client.id === input.targetClientId);
      if (!source || !target || source.status !== "ACTIVE" || target.status !== "ACTIVE") throw new Error("Both active clients must belong to this organization");
      await tx.update(appointments).set({ clientId: target.id }).where(and(eq(appointments.organizationId, input.organizationId), eq(appointments.clientId, source.id)));
      await tx.update(clientMediaSets).set({ clientId: target.id }).where(and(eq(clientMediaSets.organizationId, input.organizationId), eq(clientMediaSets.clientId, source.id)));
      await tx.update(clients).set({ status: "MERGED", mergedIntoClientId: target.id }).where(eq(clients.id, source.id));
      const id = nanoid(21);
      await tx.insert(clientMerges).values({ id, organizationId: input.organizationId, sourceClientId: source.id, targetClientId: target.id, mergedByUserId: ctx.user.id, reason: input.reason });
      return { id };
    });
  }),
});
