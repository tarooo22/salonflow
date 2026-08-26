import { and, desc, eq, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { clients, customerFeedback, customerFeedbackEvents, locations, organizations } from "../../drizzle/schema";
import { feedbackEscalateSchema, feedbackModerationListSchema, feedbackModerationSchema, feedbackPlatformDecisionSchema, feedbackPlatformListSchema } from "../../shared/validation";
import { requireOrganizationRole } from "../access";
import { requireDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const feedbackManagers: Array<"OWNER" | "MANAGER"> = ["OWNER", "MANAGER"];

function requirePlatformAdmin(role: string) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "ეს მოქმედება ხელმისაწვდომია მხოლოდ SalonFlow platform admin-ისთვის." });
}

export const feedbackRouter = router({
  listForModeration: protectedProcedure.input(feedbackModerationListSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, feedbackManagers);
    const db = await requireDb();
    const rows = await db.select({ feedback: customerFeedback, locationName: locations.name, clientFirstName: clients.firstName }).from(customerFeedback)
      .innerJoin(locations, eq(customerFeedback.locationId, locations.id))
      .innerJoin(clients, eq(customerFeedback.clientId, clients.id))
      .where(and(eq(customerFeedback.organizationId, input.organizationId), input.status ? eq(customerFeedback.status, input.status) : undefined))
      .orderBy(desc(customerFeedback.submittedAt)).limit(input.limit).offset(input.offset);
    return rows.map(row => ({ ...row.feedback, locationName: row.locationName, clientFirstName: row.clientFirstName }));
  }),

  publish: protectedProcedure.input(feedbackModerationSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, feedbackManagers);
    const db = await requireDb();
    const moderatedAt = new Date();
    await db.transaction(async tx => {
      const result = await tx.update(customerFeedback).set({ status: "APPROVED", moderationNote: null, moderatedByUserId: ctx.user.id, moderatedAt })
        .where(and(eq(customerFeedback.id, input.feedbackId), eq(customerFeedback.organizationId, input.organizationId), eq(customerFeedback.status, "PENDING")));
      if (result[0]?.affectedRows !== 1) throw new TRPCError({ code: "CONFLICT", message: "გამოსაქვეყნებელი შეფასება აღარ არის განხილვის მდგომარეობაში." });
      await tx.insert(customerFeedbackEvents).values({ id: nanoid(21), feedbackId: input.feedbackId, eventType: "PUBLISHED_BY_SALON", actorUserId: ctx.user.id, metadata: { policy: "verified-visit" } });
    });
    return { published: true };
  }),

  requestPlatformReview: protectedProcedure.input(feedbackEscalateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, feedbackManagers);
    const db = await requireDb();
    const requestedAt = new Date();
    await db.transaction(async tx => {
      const result = await tx.update(customerFeedback).set({
        platformReviewOpen: true,
        platformReviewReason: input.reason,
        platformReviewNote: input.note ?? null,
        platformReviewRequestedByUserId: ctx.user.id,
        platformReviewRequestedAt: requestedAt,
      }).where(and(
        eq(customerFeedback.id, input.feedbackId),
        eq(customerFeedback.organizationId, input.organizationId),
        eq(customerFeedback.platformReviewOpen, false),
        ne(customerFeedback.status, "REJECTED"),
      ));
      if (result[0]?.affectedRows !== 1) throw new TRPCError({ code: "CONFLICT", message: "ეს შეფასება უკვე platform review-ზეა ან მისი ხელახალი განხილვა შეუძლებელია." });
      await tx.insert(customerFeedbackEvents).values({ id: nanoid(21), feedbackId: input.feedbackId, eventType: "ESCALATED_TO_PLATFORM", actorUserId: ctx.user.id, metadata: { reason: input.reason, note: input.note ?? null } });
    });
    return { requested: true };
  }),

  listForPlatformModeration: protectedProcedure.input(feedbackPlatformListSchema).query(async ({ ctx, input }) => {
    requirePlatformAdmin(ctx.user.role);
    const db = await requireDb();
    const rows = await db.select({ feedback: customerFeedback, locationName: locations.name, organizationName: organizations.name }).from(customerFeedback)
      .innerJoin(locations, eq(customerFeedback.locationId, locations.id))
      .innerJoin(organizations, eq(customerFeedback.organizationId, organizations.id))
      .where(input.openOnly ? eq(customerFeedback.platformReviewOpen, true) : undefined)
      .orderBy(desc(customerFeedback.platformReviewRequestedAt)).limit(input.limit).offset(input.offset);
    return rows.map(row => ({ ...row.feedback, locationName: row.locationName, organizationName: row.organizationName }));
  }),

  platformDecide: protectedProcedure.input(feedbackPlatformDecisionSchema).mutation(async ({ ctx, input }) => {
    requirePlatformAdmin(ctx.user.role);
    const db = await requireDb();
    const moderatedAt = new Date();
    await db.transaction(async tx => {
      const result = await tx.update(customerFeedback).set({
        status: input.status,
        moderationNote: input.moderationNote ?? null,
        moderatedByUserId: ctx.user.id,
        moderatedAt,
        platformReviewOpen: false,
      }).where(and(eq(customerFeedback.id, input.feedbackId), eq(customerFeedback.platformReviewOpen, true)));
      if (result[0]?.affectedRows !== 1) throw new TRPCError({ code: "CONFLICT", message: "ეს platform review უკვე დასრულებულია ან ვერ მოიძებნა." });
      await tx.insert(customerFeedbackEvents).values({ id: nanoid(21), feedbackId: input.feedbackId, eventType: `PLATFORM_DECIDED_${input.status}`, actorUserId: ctx.user.id, metadata: { moderationNote: input.moderationNote ?? null } });
    });
    return { decided: true };
  }),
});
