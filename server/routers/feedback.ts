import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { clients, customerFeedback, customerFeedbackEvents, locations } from "../../drizzle/schema";
import { feedbackModerationListSchema, feedbackModerationSchema } from "../../shared/validation";
import { requireOrganizationRole } from "../access";
import { requireDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const feedbackManagers: Array<"OWNER" | "MANAGER"> = ["OWNER", "MANAGER"];

export const feedbackRouter = router({
  listForModeration: protectedProcedure.input(feedbackModerationListSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, feedbackManagers);
    const db = await requireDb();
    const rows = await db.select({
      feedback: customerFeedback,
      locationName: locations.name,
      clientFirstName: clients.firstName,
    }).from(customerFeedback)
      .innerJoin(locations, eq(customerFeedback.locationId, locations.id))
      .innerJoin(clients, eq(customerFeedback.clientId, clients.id))
      .where(and(eq(customerFeedback.organizationId, input.organizationId), input.status ? eq(customerFeedback.status, input.status) : undefined))
      .orderBy(desc(customerFeedback.submittedAt)).limit(input.limit).offset(input.offset);
    return rows.map(row => ({ ...row.feedback, locationName: row.locationName, clientFirstName: row.clientFirstName }));
  }),

  moderate: protectedProcedure.input(feedbackModerationSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, feedbackManagers);
    const db = await requireDb();
    const [feedback] = await db.select({ id: customerFeedback.id, status: customerFeedback.status }).from(customerFeedback)
      .where(and(eq(customerFeedback.id, input.feedbackId), eq(customerFeedback.organizationId, input.organizationId))).limit(1);
    if (!feedback) throw new Error("შეფასება ვერ მოიძებნა.");
    await db.transaction(async tx => {
      await tx.update(customerFeedback).set({ status: input.status, moderationNote: input.moderationNote ?? null, moderatedByUserId: ctx.user.id, moderatedAt: new Date() }).where(eq(customerFeedback.id, feedback.id));
      await tx.insert(customerFeedbackEvents).values({ id: nanoid(21), feedbackId: feedback.id, eventType: `MODERATED_${input.status}`, actorUserId: ctx.user.id, metadata: { previousStatus: feedback.status, moderationNote: input.moderationNote ?? null } });
    });
    return { success: true };
  }),
});
