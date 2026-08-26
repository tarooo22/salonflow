import { nanoid } from "nanoid";
import { z } from "zod";
import { publicConversionEvents } from "../../drizzle/schema";
import { requireDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";

const publicConversionEventSchema = z.object({
  eventName: z.enum([
    "PUBLIC_PAGE_VIEW",
    "DIRECTORY_VIEWED",
    "MAP_VIEWED",
    "SALON_PROFILE_VIEWED",
    "BOOKING_STARTED",
    "PARTNER_VIEWED",
    "OWNER_REGISTRATION_OPENED",
    "DISCOVERY_SEARCH_SUBMITTED",
    "DIRECTORY_MAP_OPENED",
    "OWNER_CTA_SELECTED",
    "BOOKING_SERVICE_SELECTED",
    "BOOKING_ANY_AVAILABLE_SELECTED",
    "BOOKING_SPECIALIST_SELECTED",
    "BOOKING_TIME_SELECTED",
    "BOOKING_SUBMIT_SELECTED",
    "BOOKING_WAITLIST_HANDOFF",
    "BOOKING_WAITLIST_SUBMIT",
  ]),
  routePath: z.string().trim().regex(/^\/[a-zA-Z0-9\-/_]*$/).max(180),
  consentVersion: z.literal("public-conversion-v1"),
});

export const publicAnalyticsRouter = router({
  record: publicProcedure.input(publicConversionEventSchema).mutation(async ({ input }) => {
    const db = await requireDb();
    await db.insert(publicConversionEvents).values({
      id: nanoid(21),
      eventName: input.eventName,
      routePath: input.routePath,
      consentVersion: input.consentVersion,
    });
    return { recorded: true };
  }),
});
