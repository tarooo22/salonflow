import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { locations, locationOpeningHours, organizationMemberships, organizations, serviceCategories, services, staffLocations, staffProfiles, staffServices, workingHourRules } from "../../drizzle/schema";
import { guidedOnboardingSchema } from "../../shared/validation";
import { protectedProcedure, router } from "../_core/trpc";
import { requireDb } from "../db";
import { normalizeEmail, normalizeGeorgianPhone } from "../lib/normalization";

export const onboardingRouter = router({
  complete: protectedProcedure.input(guidedOnboardingSchema).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const existing = await db.select({ id: organizationMemberships.id }).from(organizationMemberships).where(and(
      eq(organizationMemberships.userId, ctx.user.id),
      eq(organizationMemberships.status, "ACTIVE"),
    )).limit(1);
    if (existing[0]) throw new Error("ამ ანგარიშისთვის სამუშაო სივრცე უკვე არსებობს.");

    const organizationId = nanoid(21);
    const membershipId = nanoid(21);
    const locationId = nanoid(21);
    const staffProfileId = nanoid(21);
    const categoryIds = new Map<string, string>();

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
    });

    return {
      organizationId,
      locationId,
      staffProfileId,
      publicBookingPath: `/book/${input.location.publicSlug}`,
    };
  }),
});
