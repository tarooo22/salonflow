import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { locations, locationOpeningHours, organizationMemberships, organizations, serviceCategories, services, staffLocations, staffProfiles, staffServices, trialAccessEvents, trialAccessRequests, workingHourRules } from "../../drizzle/schema";
import { guidedOnboardingSchema } from "../../shared/validation";
import { protectedProcedure, router } from "../_core/trpc";
import { requireDb } from "../db";
import { normalizeEmail, normalizeGeorgianPhone } from "../lib/normalization";
import { requireApprovedTrialForWorkspaceCreation } from "../lib/trialAccess";

function duplicateCodeMessage(kind: "organization" | "location", value: string) {
  return kind === "location"
    ? `საჯარო დაჯავშნის მისამართი \`/book/${value}\` უკვე დაკავებულია. შეცვალეთ საჯარო კოდი და სცადეთ ხელახლა.`
    : `სამუშაო სივრცის კოდი \`${value}\` უკვე დაკავებულია. შეცვალეთ კოდი და სცადეთ ხელახლა.`;
}

function databaseDuplicateKind(error: unknown): "organization" | "location" | null {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (message.includes("locations_public_slug_uq") || message.includes("publicSlug")) return "location";
  if (message.includes("organizations_slug_uq") || message.includes("organizations.slug")) return "organization";
  return null;
}

export const onboardingRouter = router({
  complete: protectedProcedure.input(guidedOnboardingSchema).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const trial = await requireApprovedTrialForWorkspaceCreation(ctx.user.id);
    const existing = await db.select({ id: organizationMemberships.id }).from(organizationMemberships).where(and(
      eq(organizationMemberships.userId, ctx.user.id),
      eq(organizationMemberships.status, "ACTIVE"),
    )).limit(1);
    if (existing[0]) throw new Error("ამ ანგარიშისთვის სამუშაო სივრცე უკვე არსებობს.");

    const existingOrganizationSlug = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.slug, input.organization.slug)).limit(1);
    if (existingOrganizationSlug[0]) throw new TRPCError({ code: "CONFLICT", message: duplicateCodeMessage("organization", input.organization.slug) });
    const existingPublicSlug = await db.select({ id: locations.id }).from(locations).where(eq(locations.publicSlug, input.location.publicSlug)).limit(1);
    if (existingPublicSlug[0]) throw new TRPCError({ code: "CONFLICT", message: duplicateCodeMessage("location", input.location.publicSlug) });

    const organizationId = nanoid(21);
    const membershipId = nanoid(21);
    const locationId = nanoid(21);
    const staffProfileId = nanoid(21);
    const categoryIds = new Map<string, string>();

    try {
      await db.transaction(async tx => {
      await tx.insert(organizations).values({
        id: organizationId,
        name: input.organization.name,
        slug: input.organization.slug,
        defaultTimezone: input.organization.timezone,
        contactPhone: normalizeGeorgianPhone(input.organization.contactPhone),
        contactEmail: normalizeEmail(input.organization.contactEmail),
      });
      await tx.insert(organizationMemberships).values({
        id: membershipId,
        organizationId,
        userId: ctx.user.id,
        role: "OWNER",
        status: "ACTIVE",
        invitedByUserId: ctx.user.id,
        invitedAt: new Date(),
        activatedAt: new Date(),
      });
      await tx.insert(locations).values({
        id: locationId,
        organizationId,
        name: input.location.name,
        publicSlug: input.location.publicSlug,
        timezone: input.location.timezone,
        address: input.location.address,
        phone: normalizeGeorgianPhone(input.location.phone),
        email: normalizeEmail(input.location.email),
        bookingEnabled: input.location.bookingEnabled,
        slotIntervalMinutes: input.location.slotIntervalMinutes,
        minimumNoticeMinutes: input.location.minimumNoticeMinutes,
        maximumAdvanceDays: input.location.maximumAdvanceDays,
        cancellationCutoffMinutes: input.location.cancellationCutoffMinutes,
      });
      await tx.insert(staffProfiles).values({
        id: staffProfileId,
        membershipId,
        publicDisplayName: input.owner.publicDisplayName,
        jobTitle: input.owner.jobTitle,
        onlineBookingVisible: input.owner.onlineBookingVisible,
        color: "#15806D",
      });
      await tx.insert(staffLocations).values({ staffProfileId, locationId });

      for (const hour of input.openingHours.filter(hour => hour.enabled)) {
        await tx.insert(locationOpeningHours).values({
          id: nanoid(21),
          locationId,
          weekday: hour.weekday,
          startLocalTime: hour.startLocalTime,
          endLocalTime: hour.endLocalTime,
        });
        await tx.insert(workingHourRules).values({
          id: nanoid(21),
          staffProfileId,
          locationId,
          weekday: hour.weekday,
          startLocalTime: hour.startLocalTime,
          endLocalTime: hour.endLocalTime,
        });
      }

      for (let index = 0; index < input.services.length; index += 1) {
        const service = input.services[index]!;
        const key = service.categoryNameKa.trim().toLocaleLowerCase("ka-GE");
        let categoryId = categoryIds.get(key);
        if (!categoryId) {
          categoryId = nanoid(21);
          categoryIds.set(key, categoryId);
          await tx.insert(serviceCategories).values({
            id: categoryId,
            organizationId,
            nameKa: service.categoryNameKa,
            color: "#C4623F",
            sortOrder: categoryIds.size - 1,
          });
        }
        const serviceId = nanoid(21);
        await tx.insert(services).values({
          id: serviceId,
          organizationId,
          categoryId,
          nameKa: service.nameKa,
          defaultDurationMinutes: service.defaultDurationMinutes,
          priceTetri: service.priceTetri,
          onlineBookingEnabled: service.onlineBookingEnabled,
          sortOrder: index,
        });
        await tx.insert(staffServices).values({ staffProfileId, serviceId, canPerform: true });
      }
      await tx.update(trialAccessRequests).set({ organizationId }).where(and(eq(trialAccessRequests.id, trial.id), eq(trialAccessRequests.status, "APPROVED")));
      await tx.insert(trialAccessEvents).values({ id: nanoid(21), trialRequestId: trial.id, eventType: "WORKSPACE_CREATED", actorUserId: ctx.user.id, metadata: { organizationId, locationId } });
      });
    } catch (error) {
      const duplicateKind = databaseDuplicateKind(error);
      if (duplicateKind) {
        throw new TRPCError({ code: "CONFLICT", message: duplicateCodeMessage(duplicateKind, duplicateKind === "location" ? input.location.publicSlug : input.organization.slug) });
      }
      throw error;
    }

    return {
      organizationId,
      locationId,
      staffProfileId,
      publicBookingPath: `/book/${input.location.publicSlug}`,
    };
  }),
});
