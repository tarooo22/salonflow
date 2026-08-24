import { and, asc, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { locations, organizationMemberships, organizations, trialAccessEvents, trialAccessRequests, users } from "../../drizzle/schema";
import { SALONFLOW_FACEBOOK_CONTACT_URL, TRIAL_DURATION_DAYS } from "../../shared/const";
import { trialAdminDecisionSchema, trialAdminQueueSchema, trialRequestSchema } from "../../shared/validation";
import { requireDb } from "../db";
import { getTrialRequestForUser } from "../lib/trialAccess";
import { protectedProcedure, router } from "../_core/trpc";

function requirePlatformAdmin(role: string) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "ეს მოქმედება ხელმისაწვდომია მხოლოდ SalonFlow platform admin-ისთვის." });
}

function trialEndsAt(start: Date) {
  return new Date(start.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
}

export const trialAccessRouter = router({
  mine: protectedProcedure.query(async ({ ctx }) => {
    const request = await getTrialRequestForUser(ctx.user.id);
    return { request, facebookContactUrl: SALONFLOW_FACEBOOK_CONTACT_URL, trialDurationDays: TRIAL_DURATION_DAYS };
  }),

  request: protectedProcedure.input(trialRequestSchema).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [existingMembership] = await db.select({ id: organizationMemberships.id }).from(organizationMemberships).where(and(eq(organizationMemberships.userId, ctx.user.id), eq(organizationMemberships.status, "ACTIVE"))).limit(1);
    if (existingMembership) throw new TRPCError({ code: "CONFLICT", message: "ამ ანგარიშს უკვე აქვს აქტიური სამუშაო სივრცე." });
    const [slugConflict, publicSlugConflict] = await Promise.all([
      db.select({ id: organizations.id }).from(organizations).where(eq(organizations.slug, input.salonSlug)).limit(1),
      db.select({ id: locations.id }).from(locations).where(eq(locations.publicSlug, input.salonSlug)).limit(1),
    ]);
    if (slugConflict.length > 0 || publicSlugConflict.length > 0) throw new TRPCError({ code: "CONFLICT", message: "სალონის ეს კოდი უკვე გამოყენებულია. აირჩიეთ სხვა კოდი." });
    const existing = await getTrialRequestForUser(ctx.user.id);
    if (existing?.status === "APPROVED" && existing.expiresAt && existing.expiresAt > new Date()) return { request: existing, alreadyApproved: true };
    const now = new Date();
    if (existing) {
      await db.transaction(async tx => {
        await tx.update(trialAccessRequests).set({ requestedSalonName: input.salonName, requestedSalonSlug: input.salonSlug, status: "PENDING", reviewNoteKa: null, reviewedByUserId: null, reviewedAt: null, startsAt: null, expiresAt: null, organizationId: null }).where(eq(trialAccessRequests.id, existing.id));
        await tx.insert(trialAccessEvents).values({ id: nanoid(21), trialRequestId: existing.id, eventType: "RESUBMITTED", actorUserId: ctx.user.id, metadata: { requestedSalonSlug: input.salonSlug } });
      });
      return { request: { ...existing, requestedSalonName: input.salonName, requestedSalonSlug: input.salonSlug, status: "PENDING" as const, createdAt: existing.createdAt, updatedAt: now }, alreadyApproved: false };
    }
    const requestId = nanoid(21);
    await db.transaction(async tx => {
      await tx.insert(trialAccessRequests).values({ id: requestId, userId: ctx.user.id, requestedSalonName: input.salonName, requestedSalonSlug: input.salonSlug, status: "PENDING" });
      await tx.insert(trialAccessEvents).values({ id: nanoid(21), trialRequestId: requestId, eventType: "REQUESTED", actorUserId: ctx.user.id, metadata: { requestedSalonSlug: input.salonSlug } });
    });
    return { requestId, alreadyApproved: false };
  }),

  adminList: protectedProcedure.input(trialAdminQueueSchema).query(async ({ ctx, input }) => {
    requirePlatformAdmin(ctx.user.role);
    const db = await requireDb();
    const rows = await db.select({ request: trialAccessRequests, applicantName: users.name, applicantEmail: users.email }).from(trialAccessRequests)
      .innerJoin(users, eq(trialAccessRequests.userId, users.id))
      .where(input.status ? eq(trialAccessRequests.status, input.status) : undefined)
      .orderBy(asc(trialAccessRequests.status), desc(trialAccessRequests.createdAt)).limit(input.limit).offset(input.offset);
    return { items: rows.map(row => ({ ...row.request, applicantName: row.applicantName, applicantEmail: row.applicantEmail })), facebookContactUrl: SALONFLOW_FACEBOOK_CONTACT_URL, trialDurationDays: TRIAL_DURATION_DAYS };
  }),

  adminDecide: protectedProcedure.input(trialAdminDecisionSchema).mutation(async ({ ctx, input }) => {
    requirePlatformAdmin(ctx.user.role);
    const db = await requireDb();
    const [request] = await db.select().from(trialAccessRequests).where(eq(trialAccessRequests.id, input.trialRequestId)).limit(1);
    if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "საცდელი წვდომის მოთხოვნა ვერ მოიძებნა." });
    if (request.status !== "PENDING") throw new TRPCError({ code: "CONFLICT", message: "ეს მოთხოვნა უკვე დამუშავებულია." });
    const now = new Date();
    const approved = input.decision === "APPROVE";
    const expiresAt = approved ? trialEndsAt(now) : null;
    await db.transaction(async tx => {
      await tx.update(trialAccessRequests).set({ status: approved ? "APPROVED" : "REJECTED", reviewNoteKa: input.reviewNoteKa ?? null, reviewedByUserId: ctx.user.id, reviewedAt: now, startsAt: approved ? now : null, expiresAt }).where(eq(trialAccessRequests.id, request.id));
      await tx.insert(trialAccessEvents).values({ id: nanoid(21), trialRequestId: request.id, eventType: approved ? "APPROVED_7_DAY_TRIAL" : "REJECTED", actorUserId: ctx.user.id, metadata: { expiresAt: expiresAt?.toISOString() ?? null } });
    });
    return { status: approved ? "APPROVED" as const : "REJECTED" as const, expiresAt };
  }),
});
