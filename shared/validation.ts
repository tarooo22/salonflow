import { z } from "zod";

export const opaqueIdSchema = z.string().trim().min(12).max(36).regex(/^[A-Za-z0-9_-]+$/);

// Most services a customer can pick for one visit (profile picker and ?services= link).
export const MAX_SELECTED_SERVICES = 6;

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

export const marketplaceCategorySlugSchema = z.string().trim().toLowerCase().min(2).max(64).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const marketplaceListingStatusSchema = z.enum(["DRAFT", "SUBMITTED", "APPROVED", "HIDDEN", "REJECTED"]);
export const marketplacePromotionTierSchema = z.enum(["RECOMMENDED", "VIP"]);

export const marketplaceDirectorySchema = paginationSchema.extend({
  categorySlug: marketplaceCategorySlugSchema.optional(),
  search: z.string().trim().min(1).max(120).optional(),
  area: z.string().trim().min(1).max(160).optional(),
});

export const marketplaceOwnerListingScopeSchema = z.object({
  organizationId: opaqueIdSchema,
  locationId: opaqueIdSchema,
});

export const marketplaceOwnerListingUpdateSchema = marketplaceOwnerListingScopeSchema.extend({
  areaLabelKa: z.string().trim().max(160).nullable().optional(),
  mapVisibility: z.boolean().optional(),
  geocodeConfirmed: z.boolean().optional(),
  categoryServiceLinks: z.array(z.object({
    categoryId: opaqueIdSchema,
    serviceIds: z.array(opaqueIdSchema).min(1).max(100),
  })).max(8).optional(),
}).refine(input => input.areaLabelKa !== undefined || input.mapVisibility !== undefined || input.geocodeConfirmed !== undefined || input.categoryServiceLinks !== undefined, "Marketplace listing-ისთვის ერთი ცვლილება მაინც აირჩიეთ.");

export const marketplaceOwnerGeocodeSchema = marketplaceOwnerListingScopeSchema;

export const marketplaceOwnerMapPointConfirmSchema = marketplaceOwnerListingScopeSchema.extend({
  placeId: z.string().trim().min(1).max(255),
  latitudeE6: z.number().int().min(-90_000_000).max(90_000_000),
  longitudeE6: z.number().int().min(-180_000_000).max(180_000_000),
});

export const marketplaceOwnerSubmitSchema = marketplaceOwnerListingScopeSchema;

export const marketplaceAdminReviewSchema = z.object({
  locationId: opaqueIdSchema,
  status: z.enum(["APPROVED", "HIDDEN", "REJECTED"]),
  reviewNoteKa: z.string().trim().max(500).optional(),
});

export const marketplaceAdminQueueSchema = paginationSchema.extend({
  status: marketplaceListingStatusSchema.optional(),
});

export const marketplacePromotionScheduleSchema = z.object({
  locationId: opaqueIdSchema,
  tier: marketplacePromotionTierSchema,
  startsAt: z.date(),
  endsAt: z.date(),
  manualPriceTetri: z.number().int().min(0).max(10_000_000).optional(),
  billingReference: z.string().trim().max(160).optional(),
}).refine(input => input.startsAt < input.endsAt, "Promotion დასრულების დრო დაწყების დროზე გვიან უნდა იყოს.");

export const marketplacePromotionCancelSchema = z.object({
  promotionId: opaqueIdSchema,
});

export const publicFeedbackTokenSchema = z.object({ token: z.string().trim().min(24).max(256) });

export const publicFeedbackSubmitSchema = publicFeedbackTokenSchema.extend({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(4).max(1200),
  displayName: z.string().trim().min(1).max(100).optional(),
  publicNameConsent: z.boolean().default(false),
}).superRefine((input, ctx) => {
  if (input.publicNameConsent && !input.displayName) ctx.addIssue({ code: "custom", path: ["displayName"], message: "საჯარო სახელის გამოსაჩენად მიუთითეთ სახელი." });
});

export const feedbackModerationListSchema = paginationSchema.extend({
  organizationId: opaqueIdSchema,
  status: z.enum(["PENDING", "APPROVED", "HIDDEN", "REJECTED"]).optional(),
});

export const feedbackEscalationReasonSchema = z.enum([
  "HARASSMENT_OR_HATE",
  "PERSONAL_DATA",
  "SPAM_OR_PROMOTION",
  "CONFLICT_OF_INTEREST",
  "LEGAL_OR_SAFETY",
  "OTHER",
]);

export const feedbackModerationSchema = z.object({
  organizationId: opaqueIdSchema,
  feedbackId: opaqueIdSchema,
});

export const feedbackEscalateSchema = feedbackModerationSchema.extend({
  reason: feedbackEscalationReasonSchema,
  note: z.string().trim().max(500).optional(),
}).superRefine((input, ctx) => {
  if (input.reason === "OTHER" && !input.note) ctx.addIssue({ code: "custom", path: ["note"], message: "სხვა მიზეზისთვის მიუთითეთ მოკლე განმარტება." });
});

export const feedbackPlatformListSchema = paginationSchema.extend({
  openOnly: z.boolean().default(true),
  status: z.enum(["PENDING", "APPROVED", "HIDDEN", "REJECTED"]).optional(),
});

export const feedbackPlatformAuditSchema = z.object({ feedbackId: opaqueIdSchema });

export const feedbackPlatformDecisionSchema = z.object({
  feedbackId: opaqueIdSchema,
  status: z.enum(["APPROVED", "HIDDEN", "REJECTED"]),
  moderationNote: z.string().trim().max(500).optional(),
}).superRefine((input, ctx) => {
  if (input.status !== "APPROVED" && !input.moderationNote) ctx.addIssue({ code: "custom", path: ["moderationNote"], message: "დამალვის ან უარყოფისას საჭიროა მოკლე დასაბუთება." });
});

export const feedbackPlatformRestoreSchema = z.object({
  feedbackId: opaqueIdSchema,
  moderationNote: z.string().trim().min(2).max(500),
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

export const trialRequestSchema = z.object({
  salonName: z.string().trim().min(2).max(160),
  salonSlug: slugSchema,
});

export const trialAdminQueueSchema = paginationSchema.extend({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED", "CANCELLED"]).optional(),
  search: z.string().trim().min(1).max(160).optional(),
});

export const trialAdminDecisionSchema = z.object({
  trialRequestId: opaqueIdSchema,
  decision: z.enum(["APPROVE", "REJECT"]),
  reviewNoteKa: z.string().trim().max(500).optional(),
});

export const legacyLocalAccountClaimSchema = z.union([
  z.object({
    recoveryCode: z.string().trim().min(10).max(32),
    email: z.string().trim().email().max(320),
    password: z.string().min(10).max(128),
  }),
  z.object({
    openId: z.string().trim().regex(/^local_[A-Za-z0-9_-]{12,64}$/),
    email: z.string().trim().email().max(320),
    password: z.string().min(10).max(128),
  }),
]);

export const organizationVerticalSchema = z.enum(["SALON", "AESTHETICS", "DENTAL"]);

export const organizationCreateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: slugSchema,
  vertical: organizationVerticalSchema.default("SALON"),
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

export const locationSettingsUpdateSchema = z.object({
  organizationId: opaqueIdSchema,
  locationId: opaqueIdSchema,
  name: z.string().trim().min(2).max(160).optional(),
  timezone: timezoneSchema.optional(),
  address: z.string().trim().max(1200).optional(),
  phone: z.string().trim().max(32).optional(),
  email: z.string().trim().email().max(320).optional(),
  bookingEnabled: z.boolean().optional(),
  slotIntervalMinutes: z.number().int().min(5).max(120).optional(),
  minimumNoticeMinutes: z.number().int().min(0).max(10_080).optional(),
  maximumAdvanceDays: z.number().int().min(1).max(365).optional(),
  cancellationCutoffMinutes: z.number().int().min(0).max(10_080).optional(),
}).refine(input => Object.entries(input).some(([key, value]) => !["organizationId", "locationId"].includes(key) && value !== undefined), "ერთი პარამეტრი მაინც უნდა შეიცვალოს.");

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

export const guidedTourScopeSchema = organizationScopeSchema.extend({
  tourKey: z.literal("workspace-foundation"),
});

export const guidedTourProgressSchema = guidedTourScopeSchema.extend({
  currentStep: z.number().int().min(0).max(12),
  completed: z.boolean(),
  autoShowDisabled: z.boolean(),
});

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
  source: z.enum(["INTERNAL", "PUBLIC_WEB"]).optional(),
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

const imageDataUrlSchema = z.string().max(7_000_000).regex(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "მხოლოდ JPEG, PNG ან WebP ფოტო შეიძლება აიტვირთოს");
const imageAltTextSchema = z.string().trim().min(3).max(255);

export const locationCoverUploadSchema = organizationScopeSchema.extend({
  locationId: opaqueIdSchema,
  imageDataUrl: imageDataUrlSchema,
  altTextKa: imageAltTextSchema,
});

export const staffAvatarUploadSchema = organizationScopeSchema.extend({
  staffProfileId: opaqueIdSchema,
  imageDataUrl: imageDataUrlSchema,
  altTextKa: imageAltTextSchema,
});

export const publicLocationProfileUpdateSchema = organizationScopeSchema.extend({
  locationId: opaqueIdSchema,
  publicDescription: z.string().trim().max(2_000).optional(),
  socialLinks: z.object({ instagram: z.string().url().max(500).optional(), facebook: z.string().url().max(500).optional(), website: z.string().url().max(500).optional() }).partial().optional(),
}).refine(input => input.publicDescription !== undefined || input.socialLinks !== undefined, "საჯარო პროფილის მინიმუმ ერთი ველი უნდა შეიცვალოს");

export const clientBeforeAfterCreateSchema = organizationScopeSchema.extend({
  clientId: opaqueIdSchema,
  appointmentId: opaqueIdSchema,
  beforeImageDataUrl: imageDataUrlSchema,
  afterImageDataUrl: imageDataUrlSchema,
  beforeAltTextKa: imageAltTextSchema,
  afterAltTextKa: imageAltTextSchema,
  internalNote: z.string().trim().max(2_000).optional(),
  clientPublicationConsent: z.boolean().default(false),
  requestPublicVisibility: z.boolean().default(false),
}).refine(input => !input.requestPublicVisibility || input.clientPublicationConsent, "საჯარო გამოჩენას სჭირდება კლიენტის ცალკე თანხმობა");

export const clientMediaListSchema = organizationScopeSchema.extend({ clientId: opaqueIdSchema });
export const clientMediaVisibilitySchema = organizationScopeSchema.extend({ setId: opaqueIdSchema, publicVisible: z.boolean() });
export const clientMediaDeleteSchema = organizationScopeSchema.extend({ setId: opaqueIdSchema });

export const locationFeedCreateSchema = organizationScopeSchema.extend({
  locationId: opaqueIdSchema,
  imageDataUrl: imageDataUrlSchema,
  altTextKa: imageAltTextSchema,
  titleKa: z.string().trim().max(160).optional(),
  captionKa: z.string().trim().max(2_000).optional(),
  publicVisible: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});

export const locationFeedListSchema = organizationScopeSchema.extend({ locationId: opaqueIdSchema });
export const locationFeedVisibilitySchema = organizationScopeSchema.extend({ postId: opaqueIdSchema, publicVisible: z.boolean() });
export const locationFeedDeleteSchema = organizationScopeSchema.extend({ postId: opaqueIdSchema });

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

export const staffSelfProfileUpdateSchema = organizationScopeSchema.extend({
  staffProfileId: opaqueIdSchema,
  publicDisplayName: z.string().trim().min(2).max(160).optional(),
  publicBio: z.string().trim().max(2_000).nullable().optional(),
  jobTitle: z.string().trim().max(160).nullable().optional(),
  specialty: z.string().trim().max(255).nullable().optional(),
  experienceYears: z.number().int().min(0).max(80).nullable().optional(),
  avatarAltKa: imageAltTextSchema.nullable().optional(),
}).strict().refine(input => input.publicDisplayName !== undefined || input.publicBio !== undefined || input.jobTitle !== undefined || input.specialty !== undefined || input.experienceYears !== undefined || input.avatarAltKa !== undefined, "პროფილის მინიმუმ ერთი ველი უნდა შეიცვალოს");

export const staffMemberCreateSchema = z.object({
  organizationId: opaqueIdSchema,
  fullName: z.string().trim().min(2).max(160),
  role: z.enum(["MANAGER", "RECEPTIONIST", "STAFF"]),
  publicDisplayName: z.string().trim().min(2).max(160),
  jobTitle: z.string().trim().max(160).optional(),
  specialty: z.string().trim().max(255).optional(),
  onlineBookingVisible: z.boolean().default(true),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).default("#7C3AED"),
  locationIds: z.array(opaqueIdSchema).min(1).max(20),
  email: z.string().trim().email().max(320).optional().or(z.literal("")).transform(value => value || undefined),
  password: z.string().min(8).max(200).optional().or(z.literal("")).transform(value => value || undefined),
}).refine(input => !input.email || Boolean(input.password), { message: "პაროლი აუცილებელია, თუ ელფოსტა მითითებულია", path: ["password"] });

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
  staffProfileId: opaqueIdSchema.optional(),
  reason: z.string().trim().max(255).optional(),
});

export const appointmentStatusUpdateSchema = z.object({
  organizationId: opaqueIdSchema,
  appointmentId: opaqueIdSchema,
  nextStatus: z.enum(["PENDING", "CONFIRMED", "CHECKED_IN", "IN_SERVICE", "COMPLETED", "CANCELLED", "NO_SHOW"]),
  reason: z.string().trim().max(255).optional(),
});

export const attendanceClockSchema = organizationScopeSchema.extend({
  locationId: opaqueIdSchema,
  note: z.string().trim().max(2_000).optional(),
});

export const attendanceListSchema = organizationScopeSchema.extend({
  locationId: opaqueIdSchema.optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});

export const tipCreateSchema = organizationScopeSchema.extend({
  locationId: opaqueIdSchema,
  staffProfileId: opaqueIdSchema,
  appointmentId: opaqueIdSchema.optional(),
  amountTetri: z.number().int().positive(),
  method: z.enum(["CASH", "CARD_TERMINAL", "BANK_TRANSFER", "ONLINE", "OTHER"]),
  note: z.string().trim().max(2_000).optional(),
});

export const retailProductCreateSchema = organizationScopeSchema.extend({
  locationId: opaqueIdSchema,
  nameKa: z.string().trim().min(2).max(160),
  sku: z.string().trim().min(1).max(96).optional(),
  retailPriceTetri: z.number().int().positive(),
  costTetri: z.number().int().min(0).optional(),
  openingQuantity: z.number().int().min(0).max(1_000_000),
  reorderLevel: z.number().int().min(0).max(1_000_000).default(0),
});

export const inventoryAdjustSchema = organizationScopeSchema.extend({
  locationId: opaqueIdSchema,
  productId: opaqueIdSchema,
  quantityDelta: z.number().int().refine(value => value !== 0, "Quantity change must not be zero"),
  reason: z.string().trim().min(2).max(255),
});

export const retailSaleCreateSchema = organizationScopeSchema.extend({
  locationId: opaqueIdSchema,
  clientId: opaqueIdSchema.optional(),
  lines: z.array(z.object({ productId: opaqueIdSchema, quantity: z.number().int().positive().max(99) })).min(1).max(20).refine(lines => new Set(lines.map(line => line.productId)).size === lines.length, "Products must be unique"),
  method: z.enum(["CASH", "CARD_TERMINAL", "BANK_TRANSFER", "ONLINE", "OTHER"]),
  note: z.string().trim().max(2_000).optional(),
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

export const commissionRuleCreateSchema = z.object({
  organizationId: opaqueIdSchema,
  locationId: opaqueIdSchema.optional(),
  staffProfileId: opaqueIdSchema.optional(),
  serviceId: opaqueIdSchema.optional(),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  /** For PERCENTAGE this is basis points (0–10000); for FIXED it is tetri (0–100_000_000). */
  valueTetri: z.number().int().min(0).max(100_000_000),
});

export const commissionRuleDeleteSchema = z.object({
  organizationId: opaqueIdSchema,
  id: opaqueIdSchema,
});

export const commissionListRangeSchema = z.object({
  organizationId: opaqueIdSchema,
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  staffProfileId: opaqueIdSchema.optional(),
});

export const publicAvailabilityCheckSchema = z.object({
  slug: slugSchema,
  serviceId: opaqueIdSchema,
  staffProfileId: z.union([opaqueIdSchema, z.literal("ANY_AVAILABLE")]),
  startsAt: z.coerce.date(),
});

export const staffInviteCreateSchema = z.object({
  organizationId: opaqueIdSchema,
  email: z.string().trim().email().max(320),
  role: z.enum(["MANAGER", "RECEPTIONIST", "STAFF"]),
  locationId: opaqueIdSchema.optional(),
  publicDisplayName: z.string().trim().min(2).max(160),
  jobTitle: z.string().trim().max(160).optional().or(z.literal("")).transform(value => value || undefined),
  specialty: z.string().trim().max(255).optional().or(z.literal("")).transform(value => value || undefined),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).default("#7C3AED"),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

export const staffInviteRevokeSchema = z.object({
  organizationId: opaqueIdSchema,
  id: opaqueIdSchema,
});

export const staffInviteAcceptSchema = z.object({
  token: z.string().trim().min(24).max(512),
  password: z.string().min(10).max(128),
  fullName: z.string().trim().min(2).max(160).optional(),
});

export const publicAvailableSlotsSchema = z.object({
  slug: slugSchema,
  serviceId: opaqueIdSchema,
  staffProfileId: z.union([opaqueIdSchema, z.literal("ANY_AVAILABLE")]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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

export const publicBookingTokenSchema = z.object({
  token: z.string().trim().min(32).max(128).regex(/^[A-Za-z0-9_-]+$/),
});

export const publicBookingCancelSchema = publicBookingTokenSchema.extend({
  reason: z.string().trim().min(2).max(255).optional(),
});

export const publicRescheduleSlotsSchema = publicBookingTokenSchema.extend({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const publicBookingRescheduleSchema = publicBookingTokenSchema.extend({
  startsAt: z.coerce.date(),
});

export const publicWaitlistCreateSchema = z.object({
  slug: slugSchema,
  serviceId: opaqueIdSchema,
  staffProfileId: opaqueIdSchema.optional(),
  requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferredStartLocalTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional(),
  phone: z.string().trim().min(6).max(32),
  email: z.string().trim().email().max(320).optional(),
  customerNote: z.string().trim().max(2_000).optional(),
  bookingTermsConsent: z.literal(true),
  idempotencyKey: z.string().trim().min(16).max(128).regex(/^[A-Za-z0-9_-]+$/),
});

const publicMultiServiceSelectionSchema = z.object({
  slug: slugSchema,
  serviceIds: z.array(opaqueIdSchema).min(2).max(6).refine(ids => new Set(ids).size === ids.length, "Services must be unique"),
  staffProfileId: z.union([opaqueIdSchema, z.literal("ANY_AVAILABLE")]),
});

export const publicMultiAvailabilityCheckSchema = publicMultiServiceSelectionSchema.extend({
  startsAt: z.coerce.date(),
});

export const publicMultiAvailableSlotsSchema = publicMultiServiceSelectionSchema.extend({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const publicMultiBookingCommitSchema = publicMultiAvailabilityCheckSchema.extend({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional(),
  phone: z.string().trim().min(6).max(32),
  email: z.string().trim().email().max(320).optional(),
  customerNote: z.string().trim().max(2_000).optional(),
  bookingTermsConsent: z.literal(true),
  idempotencyKey: z.string().trim().min(16).max(128).regex(/^[A-Za-z0-9_-]+$/),
});

export const waitlistListSchema = organizationScopeSchema.extend({
  locationId: opaqueIdSchema.optional(),
  status: z.enum(["PENDING", "CONTACTED", "FULFILLED", "CANCELLED", "EXPIRED"]).optional(),
});

export const waitlistStatusUpdateSchema = organizationScopeSchema.extend({
  id: opaqueIdSchema,
  status: z.enum(["PENDING", "CONTACTED", "FULFILLED", "CANCELLED", "EXPIRED"]),
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


export const organizationGovernanceListSchema = paginationSchema.extend({
  search: z.string().trim().min(1).max(160).optional(),
  accessStatus: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  publicVisible: z.boolean().optional(),
});

export const organizationGovernanceActionSchema = z.object({
  organizationId: opaqueIdSchema,
  action: z.enum(["SUSPEND", "RESTORE", "HIDE_PUBLIC", "SHOW_PUBLIC", "GRANT_DAYS"]),
  reasonKa: z.string().trim().min(2).max(500),
  days: z.number().int().min(1).max(365).optional(),
}).superRefine((input, ctx) => {
  if (input.action === "GRANT_DAYS" && input.days === undefined) {
    ctx.addIssue({ code: "custom", path: ["days"], message: "დღეების რაოდენობა აუცილებელია." });
  }
  if (input.action !== "GRANT_DAYS" && input.days !== undefined) {
    ctx.addIssue({ code: "custom", path: ["days"], message: "დღეები მხოლოდ ვადის დამატებისთვის გამოიყენება." });
  }
});

export const organizationGovernanceAuditSchema = z.object({
  organizationId: opaqueIdSchema,
  limit: z.number().int().min(1).max(100).default(50),
});

// ---- Vacancies and products catalog ----
export const vacancyEmploymentTypeSchema = z.enum(["FULL_TIME", "PART_TIME", "CHAIR_RENTAL", "FREELANCE"]);
export const catalogVerticalSchema = z.enum(["beauty", "dental", "aesthetics"]);
export const DEFAULT_VACANCY_DAYS = 30;

const vacancyFieldsShape = {
  title: z.string().trim().min(3).max(160),
  roleCategory: marketplaceCategorySlugSchema.nullable().optional(),
  employmentType: vacancyEmploymentTypeSchema,
  salaryFromTetri: z.number().int().min(0).max(100_000_000).nullable().optional(),
  salaryToTetri: z.number().int().min(0).max(100_000_000).nullable().optional(),
  description: z.string().trim().min(10).max(4000),
  contactPhone: z.string().trim().min(6).max(32).nullable().optional(),
  contactEmail: z.string().trim().toLowerCase().email().max(320).nullable().optional(),
};

export const vacancyCreateSchema = organizationScopeSchema.extend({
  locationId: opaqueIdSchema,
  ...vacancyFieldsShape,
  publish: z.boolean().default(false),
  durationDays: z.number().int().min(1).max(90).default(DEFAULT_VACANCY_DAYS),
}).superRefine((input, ctx) => {
  if (!input.contactPhone && !input.contactEmail) ctx.addIssue({ code: "custom", path: ["contactPhone"], message: "მიუთითეთ ტელეფონი ან ელფოსტა." });
  if (input.salaryFromTetri != null && input.salaryToTetri != null && input.salaryFromTetri > input.salaryToTetri) ctx.addIssue({ code: "custom", path: ["salaryToTetri"], message: "მაქსიმალური ანაზღაურება მინიმალურზე ნაკლები ვერ იქნება." });
});

/** Partial update; the server re-checks the merged contact and salary rules. */
export const vacancyUpdateSchema = organizationScopeSchema.extend({
  id: opaqueIdSchema,
  locationId: opaqueIdSchema.optional(),
  title: vacancyFieldsShape.title.optional(),
  roleCategory: vacancyFieldsShape.roleCategory,
  employmentType: vacancyEmploymentTypeSchema.optional(),
  salaryFromTetri: vacancyFieldsShape.salaryFromTetri,
  salaryToTetri: vacancyFieldsShape.salaryToTetri,
  description: vacancyFieldsShape.description.optional(),
  contactPhone: vacancyFieldsShape.contactPhone,
  contactEmail: vacancyFieldsShape.contactEmail,
});

export const vacancyPublishSchema = organizationScopeSchema.extend({
  id: opaqueIdSchema,
  durationDays: z.number().int().min(1).max(90).default(DEFAULT_VACANCY_DAYS),
});
export const vacancyCloseSchema = organizationScopeSchema.extend({ id: opaqueIdSchema });

export const vacancyOwnerListSchema = paginationSchema.extend({
  organizationId: opaqueIdSchema,
  locationId: opaqueIdSchema.optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).optional(),
});

export const vacancyPublicListSchema = z.object({
  vertical: catalogVerticalSchema.optional(),
  category: marketplaceCategorySlugSchema.optional(),
  area: z.string().trim().min(1).max(160).optional(),
  limit: z.number().int().min(1).max(60).default(24),
  offset: z.number().int().min(0).default(0),
});
export const vacancyPublicVipListSchema = z.object({
  vertical: catalogVerticalSchema.optional(),
  limit: z.number().int().min(1).max(12).default(6),
});
export const vacancyPublicDetailSchema = z.object({ id: opaqueIdSchema });

export const vacancyAdminListSchema = paginationSchema.extend({
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).optional(),
  vipOnly: z.boolean().optional(),
});
// Capped at a year: VIP is a paid placement, and MySQL TIMESTAMP overflows in 2038.
export const vacancyVipSchema = z.object({ id: opaqueIdSchema, vipUntil: z.date().refine(date => date.getTime() <= Date.now() + 366 * 86_400_000, "VIP ვადა მაქსიმუმ ერთი წელია.").nullable() });

const productFieldsShape = {
  name: z.string().trim().min(2).max(160),
  brand: z.string().trim().max(120).nullable().optional(),
  description: z.string().trim().max(600).nullable().optional(),
  priceTetri: z.number().int().min(0).max(100_000_000),
  inStock: z.boolean(),
  sortOrder: z.number().int().min(0).max(10_000),
  imageDataUrl: imageDataUrlSchema.optional(),
  imageAltKa: imageAltTextSchema.optional(),
};

export const productCreateSchema = organizationScopeSchema.extend({
  locationId: opaqueIdSchema,
  ...productFieldsShape,
  inStock: productFieldsShape.inStock.default(true),
  sortOrder: productFieldsShape.sortOrder.default(0),
}).refine(input => !input.imageDataUrl || !!input.imageAltKa, { path: ["imageAltKa"], message: "ფოტოს მოკლე აღწერა აუცილებელია." });

export const productUpdateSchema = organizationScopeSchema.extend({
  id: opaqueIdSchema,
  locationId: opaqueIdSchema.optional(),
  name: productFieldsShape.name.optional(),
  brand: productFieldsShape.brand,
  description: productFieldsShape.description,
  priceTetri: productFieldsShape.priceTetri.optional(),
  inStock: productFieldsShape.inStock.optional(),
  sortOrder: productFieldsShape.sortOrder.optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  imageDataUrl: productFieldsShape.imageDataUrl,
  imageAltKa: productFieldsShape.imageAltKa,
  removeImage: z.boolean().optional(),
}).refine(input => !input.imageDataUrl || !!input.imageAltKa, { path: ["imageAltKa"], message: "ფოტოს მოკლე აღწერა აუცილებელია." });

export const productOwnerListSchema = z.object({
  organizationId: opaqueIdSchema,
  locationId: opaqueIdSchema.optional(),
  includeArchived: z.boolean().default(false),
});
export const productPublicListSchema = z.object({
  vertical: catalogVerticalSchema.optional(),
  category: marketplaceCategorySlugSchema.optional(),
  area: z.string().trim().min(1).max(160).optional(),
  limit: z.number().int().min(1).max(60).default(24),
  offset: z.number().int().min(0).default(0),
});
export const productByLocationSchema = z.object({ publicSlug: slugSchema });

// ---- Clinical records (dental chart / aesthetic procedures) ----
export const organizationSetVerticalSchema = organizationScopeSchema.extend({ vertical: organizationVerticalSchema });

/** FDI two-digit notation: permanent 11-18, 21-28, 31-38, 41-48; primary 51-55, 61-65, 71-75, 81-85. */
export function isValidToothCode(code: string): boolean {
  if (!/^[1-8][1-8]$/.test(code)) return false;
  const quadrant = Number(code[0]);
  const position = Number(code[1]);
  return quadrant <= 4 ? true : position <= 5;
}
export const toothCodeSchema = z.string().trim().refine(isValidToothCode, "კბილის კოდი არასწორია (FDI: 11-48 ან 51-85).");

export const TOOTH_SURFACES = ["M", "O", "D", "B", "L"] as const;
/** Any subset of M,O,D,B,L (no duplicates); normalised to canonical MODBL order, empty means none. */
export const toothSurfacesSchema = z.string().trim().toUpperCase().refine(
  value => /^[MODBL]*$/.test(value) && new Set(value).size === value.length,
  "ზედაპირები უნდა იყოს M, O, D, B, L-ის ქვესიმრავლე განმეორების გარეშე.",
).transform(value => TOOTH_SURFACES.filter(surface => value.includes(surface)).join("") || undefined);

export const dentalConditionSchema = z.enum(["HEALTHY", "CARIES", "FILLED", "CROWN", "ROOT_CANAL", "IMPLANT", "BRIDGE", "MISSING", "EXTRACTION_NEEDED", "OTHER"]);

export const dentalChartSchema = organizationScopeSchema.extend({ clientId: opaqueIdSchema });
export const dentalToothHistorySchema = dentalChartSchema.extend({ toothCode: toothCodeSchema });
export const dentalRecordSchema = dentalToothHistorySchema.extend({
  surfaces: toothSurfacesSchema.optional(),
  condition: dentalConditionSchema,
  note: z.string().trim().max(1000).optional(),
  appointmentId: opaqueIdSchema.optional(),
});

export const aestheticDoseUnitSchema = z.enum(["UNITS", "ML", "MG", "OTHER"]);
const calendarDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "თარიღი არასწორია.");

export const aestheticListSchema = dentalChartSchema;
export const aestheticCreateSchema = dentalChartSchema.extend({
  appointmentId: opaqueIdSchema.optional(),
  staffProfileId: opaqueIdSchema.optional(),
  // TIMESTAMP range, and no procedures dated more than a day ahead.
  performedAt: z.coerce.date().refine(date => date.getTime() >= Date.UTC(2000, 0, 1) && date.getTime() <= Date.now() + 86_400_000, "პროცედურის თარიღი არასწორია.").optional(),
  procedureName: z.string().trim().min(2).max(160),
  productName: z.string().trim().min(1).max(160).optional(),
  batchNumber: z.string().trim().min(1).max(80).optional(),
  productExpiry: calendarDateSchema.optional(),
  /** Integer hundredths of the unit: 12.50 units = 1250. */
  doseHundredths: z.number().int().min(1).max(10_000_000).optional(),
  doseUnit: aestheticDoseUnitSchema.optional(),
  treatmentAreas: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
}).refine(input => (input.doseHundredths === undefined) === (input.doseUnit === undefined), { path: ["doseUnit"], message: "დოზა და საზომი ერთეული ერთად უნდა იყოს მითითებული." });
export const aestheticVoidSchema = organizationScopeSchema.extend({
  id: opaqueIdSchema,
  reason: z.string().trim().min(3, "ბათილობის მიზეზი აუცილებელია.").max(300),
});
