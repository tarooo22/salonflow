import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { userGuidedTourProgress } from "../../drizzle/schema";
import { guidedTourProgressSchema, guidedTourScopeSchema } from "../../shared/validation";
import { protectedProcedure, router } from "../_core/trpc";
import { requireDb } from "../db";
import { requireOrganizationRole } from "../access";

const workspaceRoles: ("OWNER" | "MANAGER" | "RECEPTIONIST" | "STAFF")[] = ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"];

export const guidedTourRouter = router({
  getState: protectedProcedure.input(guidedTourScopeSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, workspaceRoles);
    const db = await requireDb();
    const [record] = await db.select({
      currentStep: userGuidedTourProgress.currentStep,
      completed: userGuidedTourProgress.completed,
      autoShowDisabled: userGuidedTourProgress.autoShowDisabled,
      version: userGuidedTourProgress.version,
    }).from(userGuidedTourProgress).where(and(
      eq(userGuidedTourProgress.userId, ctx.user.id),
      eq(userGuidedTourProgress.organizationId, input.organizationId),
      eq(userGuidedTourProgress.tourKey, input.tourKey),
    )).limit(1);

    return record ?? { currentStep: 0, completed: false, autoShowDisabled: false, version: 1 };
  }),

  saveProgress: protectedProcedure.input(guidedTourProgressSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, workspaceRoles);
    const db = await requireDb();
    const completedAt = input.completed ? new Date() : null;
    await db.insert(userGuidedTourProgress).values({
      id: nanoid(21),
      organizationId: input.organizationId,
      userId: ctx.user.id,
      tourKey: input.tourKey,
      version: 1,
      currentStep: input.currentStep,
      completed: input.completed,
      autoShowDisabled: input.autoShowDisabled,
      completedAt,
    }).onDuplicateKeyUpdate({
      set: {
        version: 1,
        currentStep: input.currentStep,
        completed: input.completed,
        autoShowDisabled: input.autoShowDisabled,
        completedAt,
        updatedAt: new Date(),
      },
    });
    return { success: true };
  }),
});
