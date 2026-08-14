import { z } from "zod";

export const opaqueIdSchema = z.string().trim().min(12).max(36).regex(/^[A-Za-z0-9_-]+$/);
export const slugSchema = z.string().trim().toLowerCase().min(3).max(96).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const timezoneSchema = z.string().trim().min(3).max(64).refine(value => {
  try {
    Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}, "Invalid IANA timezone");
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(25),
  offset: z.number().int().min(0).default(0),
});

export const localRegistrationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320),
  password: z.string().min(10).max(128),
});

export const localLoginSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(128),
});

export const userProfileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(160),
});

export const legacyRecoveryCodeSchema = z.string().trim().toUpperCase().regex(/^SFRC-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);

export const legacyLocalAccountClaimSchema = z.object({
  recoveryCode: legacyRecoveryCodeSchema,
  email: z.string().trim().email().max(320),
  password: z.string().min(10).max(128),
});

export const organizationCreateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: slugSchema,
  timezone: timezoneSchema.default("Asia/Tbilisi"),
  contactPhone: z.string().trim().max(32).optional(),
  contactEmail: z.string().trim().email().max(320).optional(),
});

export const locationCreateSchema = z.object({
  organizationId: opaqueIdSchema,
  name: z.string().trim().min(2).max(160),
  publicSlug: slugSchema,
  timezone: timezoneSchema.default("Asia/Tbilisi"),
  address: z.string().trim().max(1200).optional(),
  phone: z.string().trim().max(32).optional(),
  email: z.string().trim().email().max(320).optional(),
  bookingEnabled: z.boolean().default(true),
  slotIntervalMinutes: z.number().int().min(5).max(120).default(15),
  minimumNoticeMinutes: z.number().int().min(0).max(10_080).default(60),
  maximumAdvanceDays: z.number().int().min(1).max(365).default(60),
  cancellationCutoffMinutes: z.number().int().min(0).max(10_080).default(120),
});

export const workspaceSetupSchema = z.object({
  organization: organizationCreateSchema,
  location: locationCreateSchema.omit({ organizationId: true }),
});

const onboardingHoursSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  enabled: z.boolean(),
  startLocalTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endLocalTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
}).refine(value => !value.enabled || value.startLocalTime < value.endLocalTime, "Working-hours end must follow start");

const onboardingServiceSchema = z.object({
  categoryNameKa: z.string().trim().min(2).max(160),
  nameKa: z.string().trim().min(2).max(160),
  defaultDurationMinutes: z.number().int().min(5).max(720),
  priceTetri: z.number().int().min(0).max(10_000_000),
  onlineBookingEnabled: z.boolean().default(true),
});

export const guidedOnboardingSchema = z.object({
  organization: organizationCreateSchema,
  location: locationCreateSchema.omit({ organizationId: true }),
  openingHours: z.array(onboardingHoursSchema).length(7).refine(hours => hours.some(hour => hour.enabled), "At least one open day is required"),
  owner: z.object({
    publicDisplayName: z.string().trim().min(2).max(160),
    jobTitle: z.string().trim().max(160).optional(),
    onlineBookingVisible: z.boolean().default(false),
  }),
  services: z.array(onboardingServiceSchema).min(1).max(12),
});

export const organizationScopeSchema = z.object({ organizationId: opaqueIdSchema });
export const locationScopeSchema = z.object({ organizationId: opaqueIdSchema, locationId: opaqueIdSchema.optional() });

export const serviceCategoryCreateSchema = z.object({
  organizationId: opaqueIdSchema,
  locationId: opaqueIdSchema.optional(),
  nameKa: z.string().trim().min(2).max(160),
  iconName: z.string().trim().max(64).optional(),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});

export const serviceCategoryUpdateSchema = serviceCategoryCreateSchema.omit({ organizationId: true }).partial().extend({
  organizationId: opaqueIdSchema,
  categoryId: opaqueIdSchema,
}).refine(input => Object.keys(input).some(key => !["organizationId", "categoryId"].includes(key)), "At least one category field is required");

export const serviceCreateSchema = z.object({
  organizationId: opaqueIdSchema,
  categoryId: opaqueIdSchema,
  nameKa: z.string().trim().min(2).max(160),
  publicDescriptionKa: z.string().trim().max(2_000).optional(),
  defaultDurationMinutes: z.number().int().min(5).max(720),
  bufferBeforeMinutes: z.number().int().min(0).max(240).default(0),
  bufferAfterMinutes: z.number().int().min(0).max(240).default(0),
  priceTetri: z.number().int().min(0).max(10_000_000),
  isFromPrice: z.boolean().default(false),
  onlineBookingEnabled: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});

export const serviceUpdateSchema = serviceCreateSchema.omit({ organizationId: true }).partial().extend({
  organizationId: opaqueIdSchema,
  serviceId: opaqueIdSchema,
}).refine(input => Object.keys(input).some(key => !["organizationId", "serviceId"].includes(key)), "At least one service field is required");

export const clientCreateSchema = z.object({
  organizationId: opaqueIdSchema,
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(32).optional(),
  email: z.string().trim().email().max(320).optional(),
  notes: z.string().trim().max(5_000).optional(),
  preferences: z.string().trim().max(5_000).optional(),
  marketingSmsConsent: z.boolean().default(false),
  marketingEmailConsent: z.boolean().default(false),
  bookingTermsConsent: z.boolean(),
});

export const clientListSchema = paginationSchema.extend({
  organizationId: opaqueIdSchema,
  search: z.string().trim().max(120).optional(),
  status: z.enum(["ACTIVE", "MERGED", "ARCHIVED"]).optional(),
});

export const clientBookingHistorySchema = organizationScopeSchema.extend({
  clientId: opaqueIdSchema,
  limit: z.number().int().min(1).max(100).default(25),
});

export const clientDetailSchema = organizationScopeSchema.extend({
  clientId: opaqueIdSchema,
});

export const clientCareUpdateSchema = clientDetailSchema.extend({
  notes: z.string().trim().max(5_000).optional(),
  preferences: z.string().trim().max(5_000).optional(),
  sensitivityNote: z.string().trim().max(5_000).optional(),
}).refine(input => input.notes !== undefined || input.preferences !== undefined || input.sensitivityNote !== undefined, "At least one client-care field is required");

export const clientConsentSchema = organizationScopeSchema.extend({
  clientId: opaqueIdSchema,
  consentType: z.enum(["MARKETING_SMS", "MARKETING_EMAIL", "BOOKING_TERMS"]),
  granted: z.boolean(),
});

export const clientMergeSchema = organizationScopeSchema.extend({
  sourceClientId: opaqueIdSchema,
  targetClientId: opaqueIdSchema,
  reason: z.string().trim().max(255).optional(),
}).refine(input => input.sourceClientId !== input.targetClientId, "Source and target clients must differ");

export const staffProfileCreateSchema = z.object({
  organizationId: opaqueIdSchema,
  membershipId: opaqueIdSchema,
  publicDisplayName: z.string().trim().min(2).max(160),
  jobTitle: z.string().trim().max(160).optional(),
  specialty: z.string().trim().max(255).optional(),
  onlineBookingVisible: z.boolean().default(true),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).default("#17826A"),
  locationIds: z.array(opaqueIdSchema).min(1).max(20),
});

export const workingHourRuleCreateSchema = z.object({
  organizationId: opaqueIdSchema,
  staffProfileId: opaqueIdSchema,
  locationId: opaqueIdSchema,
  weekday: z.number().int().min(0).max(6),
  startLocalTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/),
  endLocalTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export const staffScheduleListSchema = organizationScopeSchema.extend({
  staffProfileId: opaqueIdSchema.optional(),
  locationId: opaqueIdSchema.optional(),
});

export const staffScheduleRecordDeleteSchema = organizationScopeSchema.extend({
  id: opaqueIdSchema,
});

export const workingHourRuleUpdateSchema = workingHourRuleCreateSchema.extend({
  id: opaqueIdSchema,
});

export const staffPerformanceSchema = organizationScopeSchema.extend({
  locationId: opaqueIdSchema.optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
}).refine(input => input.startsAt <= input.endsAt, "Start date must not follow end date");

export const scheduleExceptionCreateSchema = z.object({
  organizationId: opaqueIdSchema,
  staffProfileId: opaqueIdSchema.optional(),
  locationId: opaqueIdSchema.optional(),
  type: z.enum(["BREAK", "VACATION", "SICK_LEAVE", "CUSTOM_BLOCK", "EXTENDED_WORKING_TIME", "CLOSURE"]),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  fullDay: z.boolean().default(false),
  reason: z.string().trim().max(255).optional(),
  notes: z.string().trim().max(5_000).optional(),
}).refine(input => input.staffProfileId || input.locationId, "A staff profile or location is required")
  .refine(input => input.startsAt < input.endsAt, "Exception end must follow start");

export const scheduleExceptionUpdateSchema = scheduleExceptionCreateSchema.safeExtend({
  id: opaqueIdSchema,
});

export const appointmentCreateSchema = z.object({
  organizationId: opaqueIdSchema,
  locationId: opaqueIdSchema,
  clientId: opaqueIdSchema.optional(),
  staffProfileId: opaqueIdSchema,
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  source: z.enum(["PUBLIC_WEB", "MANAGER", "RECEPTION", "STAFF", "WALK_IN", "IMPORT"]),
  customerNote: z.string().trim().max(2000).optional(),
  internalNote: z.string().trim().max(2000).optional(),
  subtotalTetri: z.number().int().min(0),
  discountTetri: z.number().int().min(0).default(0),
  totalTetri: z.number().int().min(0),
});

export const walkInCreateSchema = z.object({
  organizationId: opaqueIdSchema,
  locationId: opaqueIdSchema,
  clientId: opaqueIdSchema.optional(),
  staffProfileId: opaqueIdSchema,
  serviceId: opaqueIdSchema,
  startsAt: z.coerce.date(),
  internalNote: z.string().trim().max(2_000).optional(),
});

export const appointmentRescheduleSchema = z.object({
  organizationId: opaqueIdSchema,
  appointmentId: opaqueIdSchema,
  startsAt: z.coerce.date(),
  reason: z.string().trim().max(255).optional(),
});

export const appointmentStatusUpdateSchema = z.object({
  organizationId: opaqueIdSchema,
  appointmentId: opaqueIdSchema,
  nextStatus: z.enum(["PENDING", "CONFIRMED", "CHECKED_IN", "IN_SERVICE", "COMPLETED", "CANCELLED", "NO_SHOW"]),
  reason: z.string().trim().max(255).optional(),
});

export const calendarRangeSchema = z.object({
  organizationId: opaqueIdSchema,
  locationId: opaqueIdSchema.optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  staffProfileId: opaqueIdSchema.optional(),
}).refine(input => input.startsAt <= input.endsAt, "Start date must not follow end date")
  .refine(input => input.endsAt.getTime() - input.startsAt.getTime() <= 14 * 24 * 60 * 60 * 1000, "Calendar range must be 14 days or fewer");

export const todayDashboardSchema = organizationScopeSchema.extend({
  locationId: opaqueIdSchema.optional(),
});

export const paymentCreateSchema = z.object({
  organizationId: opaqueIdSchema,
  appointmentId: opaqueIdSchema,
  amountTetri: z.number().int().positive(),
  refundedTetri: z.number().int().min(0).default(0),
  method: z.enum(["CASH", "CARD_TERMINAL", "BANK_TRANSFER", "ONLINE", "OTHER"]),
  status: z.enum(["PENDING", "PAID", "PARTIALLY_REFUNDED", "REFUNDED", "FAILED"]).default("PAID"),
  externalReference: z.string().trim().max(160).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const expenseCreateSchema = z.object({
  organizationId: opaqueIdSchema,
  locationId: opaqueIdSchema,
  category: z.string().trim().min(2).max(100),
  amountTetri: z.number().int().positive().max(100_000_000),
  expenseDate: z.coerce.date(),
  description: z.string().trim().max(5_000).optional(),
  receiptKey: z.string().trim().max(512).optional(),
});

export const commissionEntryCreateSchema = z.object({
  organizationId: opaqueIdSchema,
  appointmentId: opaqueIdSchema,
  appointmentServiceId: opaqueIdSchema,
  ruleId: opaqueIdSchema,
});

export const publicAvailabilityCheckSchema = z.object({
  slug: slugSchema,
  serviceId: opaqueIdSchema,
  staffProfileId: z.union([opaqueIdSchema, z.literal("ANY_AVAILABLE")]),
  startsAt: z.coerce.date(),
});

export const publicBookingCommitSchema = publicAvailabilityCheckSchema.extend({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional(),
  phone: z.string().trim().min(6).max(32),
  email: z.string().trim().email().max(320).optional(),
  customerNote: z.string().trim().max(2_000).optional(),
  bookingTermsConsent: z.literal(true),
  idempotencyKey: z.string().trim().min(16).max(128).regex(/^[A-Za-z0-9_-]+$/),
});

export const reportingRangeSchema = z.object({
  organizationId: opaqueIdSchema,
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
}).refine(input => input.startsAt <= input.endsAt, "Start date must not follow end date");

export const bookingHistorySchema = reportingRangeSchema.merge(paginationSchema).extend({
  locationId: opaqueIdSchema.optional(),
  status: z.enum(["PENDING", "CONFIRMED", "CHECKED_IN", "IN_SERVICE", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
});
