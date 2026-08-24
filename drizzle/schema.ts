import {
  boolean,
  date,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  time,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const membershipRoleValues = ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"] as const;
export const membershipStatusValues = ["INVITED", "ACTIVE", "DISABLED"] as const;
export const recordStatusValues = ["ACTIVE", "ARCHIVED"] as const;
export const appointmentStatusValues = [
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "IN_SERVICE",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;
export const appointmentSourceValues = ["PUBLIC_WEB", "MANAGER", "RECEPTION", "STAFF", "WALK_IN", "IMPORT"] as const;
export const paymentMethodValues = ["CASH", "CARD_TERMINAL", "BANK_TRANSFER", "ONLINE", "OTHER"] as const;
export const paymentStatusValues = ["PENDING", "PAID", "PARTIALLY_REFUNDED", "REFUNDED", "FAILED"] as const;
export const commissionTypeValues = ["PERCENTAGE", "FIXED"] as const;
export const exceptionTypeValues = ["BREAK", "VACATION", "SICK_LEAVE", "CUSTOM_BLOCK", "EXTENDED_WORKING_TIME", "CLOSURE"] as const;
export const notificationChannelValues = ["SMS", "EMAIL", "WHATSAPP"] as const;
export const notificationStatusValues = ["PENDING", "PROCESSING", "SENT", "FAILED", "CANCELLED"] as const;
export const inviteStatusValues = ["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"] as const;
export const verificationPurposeValues = ["PUBLIC_BOOKING", "EMAIL_VERIFICATION", "PHONE_VERIFICATION", "PASSWORD_RESET"] as const;
export const waitlistStatusValues = ["PENDING", "CONTACTED", "FULFILLED", "CANCELLED", "EXPIRED"] as const;
export const retailSaleStatusValues = ["COMPLETED", "VOIDED"] as const;
export const stockMovementTypeValues = ["OPENING", "ADJUSTMENT", "SALE", "VOID"] as const;
export const clientMediaStageValues = ["BEFORE", "AFTER"] as const;
export const marketplaceListingStatusValues = ["DRAFT", "SUBMITTED", "APPROVED", "HIDDEN", "REJECTED"] as const;
export const marketplacePromotionTierValues = ["RECOMMENDED", "VIP"] as const;
export const marketplacePromotionStatusValues = ["SCHEDULED", "ACTIVE", "EXPIRED", "CANCELLED"] as const;
export const customerFeedbackStatusValues = ["PENDING", "APPROVED", "HIDDEN", "REJECTED"] as const;
export const trialAccessStatusValues = ["PENDING", "APPROVED", "REJECTED", "EXPIRED", "CANCELLED"] as const;

export const membershipRole = mysqlEnum("membership_role", membershipRoleValues);
export const membershipStatus = mysqlEnum("membership_status", membershipStatusValues);
export const recordStatus = mysqlEnum("record_status", recordStatusValues);
export const appointmentStatus = mysqlEnum("appointment_status", appointmentStatusValues);
export const appointmentSource = mysqlEnum("appointment_source", appointmentSourceValues);
export const paymentMethod = mysqlEnum("payment_method", paymentMethodValues);
export const paymentStatus = mysqlEnum("payment_status", paymentStatusValues);
export const commissionType = mysqlEnum("commission_type", commissionTypeValues);
export const exceptionType = mysqlEnum("exception_type", exceptionTypeValues);
export const notificationChannel = mysqlEnum("notification_channel", notificationChannelValues);
export const notificationStatus = mysqlEnum("notification_status", notificationStatusValues);
export const inviteStatus = mysqlEnum("invite_status", inviteStatusValues);
export const verificationPurpose = mysqlEnum("verification_purpose", verificationPurposeValues);
export const waitlistStatus = mysqlEnum("waitlist_status", waitlistStatusValues);
export const retailSaleStatus = mysqlEnum("retail_sale_status", retailSaleStatusValues);
export const stockMovementType = mysqlEnum("stock_movement_type", stockMovementTypeValues);
export const clientMediaStage = mysqlEnum("client_media_stage", clientMediaStageValues);
export const marketplaceListingStatus = mysqlEnum("marketplace_listing_status", marketplaceListingStatusValues);
export const marketplacePromotionTier = mysqlEnum("marketplace_promotion_tier", marketplacePromotionTierValues);
export const marketplacePromotionStatus = mysqlEnum("marketplace_promotion_status", marketplacePromotionStatusValues);
export const customerFeedbackStatus = mysqlEnum("customer_feedback_status", customerFeedbackStatusValues);
export const trialAccessStatus = mysqlEnum("trial_access_status", trialAccessStatusValues);

/**
 * Secure platform identity synchronized by Manus OAuth. Business roles live in
 * organizationMemberships so users can be safely scoped to many organizations.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  normalizedEmail: varchar("normalizedEmail", { length: 320 }),
  normalizedPhone: varchar("normalizedPhone", { length: 32 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  avatarKey: varchar("avatarKey", { length: 512 }),
  locale: varchar("locale", { length: 16 }).default("ka-GE").notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("platform_role", ["user", "admin"]).default("user").notNull(),
  accountStatus: mysqlEnum("account_status", ["ACTIVE", "DISABLED"]).default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, table => [
  uniqueIndex("users_normalized_email_uq").on(table.normalizedEmail),
  uniqueIndex("users_normalized_phone_uq").on(table.normalizedPhone),
]);

export const organizations = mysqlTable("organizations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 96 }).notNull(),
  logoKey: varchar("logoKey", { length: 512 }),
  defaultTimezone: varchar("defaultTimezone", { length: 64 }).default("Asia/Tbilisi").notNull(),
  defaultCurrency: varchar("defaultCurrency", { length: 3 }).default("GEL").notNull(),
  contactPhone: varchar("contactPhone", { length: 32 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  status: recordStatus.default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("organizations_slug_uq").on(table.slug)]);

/** A requested trial is not a workspace. A platform admin must approve it before the applicant can create one. */
export const trialAccessRequests = mysqlTable("trial_access_requests", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  requestedSalonName: varchar("requestedSalonName", { length: 160 }).notNull(),
  requestedSalonSlug: varchar("requestedSalonSlug", { length: 96 }).notNull(),
  status: trialAccessStatus.default("PENDING").notNull(),
  reviewNoteKa: varchar("reviewNoteKa", { length: 500 }),
  reviewedByUserId: int("reviewedByUserId").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  startsAt: timestamp("startsAt"),
  expiresAt: timestamp("expiresAt"),
  organizationId: varchar("organizationId", { length: 36 }).references(() => organizations.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("trial_requests_user_uq").on(table.userId),
  uniqueIndex("trial_requests_org_uq").on(table.organizationId),
  index("trial_requests_status_created_idx").on(table.status, table.createdAt),
  index("trial_requests_expiry_idx").on(table.expiresAt),
]);

/** Immutable lifecycle evidence for request, approval, expiry and later cancellation. */
export const trialAccessEvents = mysqlTable("trial_access_events", {
  id: varchar("id", { length: 36 }).primaryKey(),
  trialRequestId: varchar("trialRequestId", { length: 36 }).notNull().references(() => trialAccessRequests.id),
  eventType: varchar("eventType", { length: 80 }).notNull(),
  actorUserId: int("actorUserId").references(() => users.id),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("trial_events_request_created_idx").on(table.trialRequestId, table.createdAt)]);

export const locations = mysqlTable("locations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull().references(() => organizations.id),
  name: varchar("name", { length: 160 }).notNull(),
  publicSlug: varchar("publicSlug", { length: 96 }).notNull(),
  address: text("address"),
  latitudeE6: int("latitudeE6"),
  longitudeE6: int("longitudeE6"),
  timezone: varchar("timezone", { length: 64 }).default("Asia/Tbilisi").notNull(),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 320 }),
  socialLinks: json("socialLinks"),
  publicDescription: text("publicDescription"),
  coverImageKey: varchar("coverImageKey", { length: 512 }),
  coverImageAltKa: varchar("coverImageAltKa", { length: 255 }),
  bookingEnabled: boolean("bookingEnabled").default(true).notNull(),
  slotIntervalMinutes: int("slotIntervalMinutes").default(15).notNull(),
  minimumNoticeMinutes: int("minimumNoticeMinutes").default(60).notNull(),
  maximumAdvanceDays: int("maximumAdvanceDays").default(60).notNull(),
  cancellationCutoffMinutes: int("cancellationCutoffMinutes").default(120).notNull(),
  status: recordStatus.default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("locations_public_slug_uq").on(table.publicSlug),
  index("locations_organization_idx").on(table.organizationId),
]);

/** Controlled platform-wide discovery taxonomy; it is never derived from arbitrary free text. */
export const marketplaceCategories = mysqlTable("marketplace_categories", {
  id: varchar("id", { length: 36 }).primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull(),
  nameKa: varchar("nameKa", { length: 120 }).notNull(),
  nameEn: varchar("nameEn", { length: 120 }),
  nameRu: varchar("nameRu", { length: 120 }),
  iconKey: varchar("iconKey", { length: 64 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("marketplace_categories_slug_uq").on(table.slug),
  index("marketplace_categories_active_sort_idx").on(table.isActive, table.sortOrder),
]);

/** One moderated Marketplace listing per branch; point coordinates remain in locations and require explicit visibility consent. */
export const locationMarketplaceProfiles = mysqlTable("location_marketplace_profiles", {
  locationId: varchar("locationId", { length: 36 }).primaryKey().references(() => locations.id),
  status: marketplaceListingStatus.default("DRAFT").notNull(),
  areaLabelKa: varchar("areaLabelKa", { length: 160 }),
  mapVisibility: boolean("mapVisibility").default(false).notNull(),
  geocodeConfirmedAt: timestamp("geocodeConfirmedAt"),
  ownerSubmittedAt: timestamp("ownerSubmittedAt"),
  approvedAt: timestamp("approvedAt"),
  approvedByUserId: int("approvedByUserId").references(() => users.id),
  reviewNoteKa: varchar("reviewNoteKa", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("marketplace_profiles_status_idx").on(table.status),
  index("marketplace_profiles_map_idx").on(table.mapVisibility, table.status),
]);

/** Explicit owner-selected Marketplace categories for a location. */
export const marketplaceLocationCategories = mysqlTable("marketplace_location_categories", {
  locationId: varchar("locationId", { length: 36 }).notNull().references(() => locations.id),
  categoryId: varchar("categoryId", { length: 36 }).notNull().references(() => marketplaceCategories.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  primaryKey({ columns: [table.locationId, table.categoryId] }),
  index("marketplace_location_categories_category_idx").on(table.categoryId),
]);

/** A public discovery category is valid only when linked to an active online-bookable service. */
export const marketplaceLocationCategoryServices = mysqlTable("marketplace_location_category_services", {
  locationId: varchar("locationId", { length: 36 }).notNull().references(() => locations.id),
  categoryId: varchar("categoryId", { length: 36 }).notNull().references(() => marketplaceCategories.id),
  serviceId: varchar("serviceId", { length: 36 }).notNull().references(() => services.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  primaryKey({ columns: [table.locationId, table.categoryId, table.serviceId] }),
  index("marketplace_category_services_service_idx").on(table.serviceId),
]);

/** Admin-managed promoted placement only; no checkout, charge or provider state is modeled here. */
export const marketplacePromotions = mysqlTable("marketplace_promotions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  locationId: varchar("locationId", { length: 36 }).notNull().references(() => locations.id),
  tier: marketplacePromotionTier.notNull(),
  status: marketplacePromotionStatus.default("SCHEDULED").notNull(),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  displayDisclosure: varchar("displayDisclosure", { length: 80 }).notNull(),
  manualPriceTetri: int("manualPriceTetri"),
  billingReference: varchar("billingReference", { length: 160 }),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  approvedByUserId: int("approvedByUserId").references(() => users.id),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("marketplace_promotions_location_status_idx").on(table.locationId, table.status),
  index("marketplace_promotions_active_range_idx").on(table.status, table.startsAt, table.endsAt),
]);

/** Immutable moderation and placement audit trail. */
export const marketplaceListingEvents = mysqlTable("marketplace_listing_events", {
  id: varchar("id", { length: 36 }).primaryKey(),
  locationId: varchar("locationId", { length: 36 }).notNull().references(() => locations.id),
  eventType: varchar("eventType", { length: 80 }).notNull(),
  actorUserId: int("actorUserId").references(() => users.id),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("marketplace_events_location_created_idx").on(table.locationId, table.createdAt),
]);

export const organizationMemberships = mysqlTable("organization_memberships", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull().references(() => organizations.id),
  userId: int("userId").notNull().references(() => users.id),
  role: membershipRole.notNull(),
  status: membershipStatus.default("INVITED").notNull(),
  permissionOverrides: json("permissionOverrides"),
  invitedByUserId: int("invitedByUserId").references(() => users.id),
  invitedAt: timestamp("invitedAt"),
  activatedAt: timestamp("activatedAt"),
  disabledAt: timestamp("disabledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("memberships_org_user_uq").on(table.organizationId, table.userId),
  index("memberships_user_status_idx").on(table.userId, table.status),
]);

/** User-specific guided help state. Content is never stored here; only tour progress. */
export const userGuidedTourProgress = mysqlTable("user_guided_tour_progress", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull().references(() => organizations.id),
  userId: int("userId").notNull().references(() => users.id),
  tourKey: varchar("tourKey", { length: 64 }).notNull(),
  version: int("version").default(1).notNull(),
  currentStep: int("currentStep").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
  autoShowDisabled: boolean("autoShowDisabled").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("guided_tour_progress_user_org_key_uq").on(table.userId, table.organizationId, table.tourKey),
  index("guided_tour_progress_organization_idx").on(table.organizationId),
]);

export const staffProfiles = mysqlTable("staff_profiles", {
  id: varchar("id", { length: 36 }).primaryKey(),
  membershipId: varchar("membershipId", { length: 36 }).notNull().references(() => organizationMemberships.id),
  publicDisplayName: varchar("publicDisplayName", { length: 160 }).notNull(),
  publicBio: text("publicBio"),
  color: varchar("color", { length: 16 }).default("#17826A").notNull(),
  jobTitle: varchar("jobTitle", { length: 160 }),
  specialty: varchar("specialty", { length: 255 }),
  experienceYears: int("experienceYears"),
  avatarKey: varchar("avatarKey", { length: 512 }),
  avatarAltKa: varchar("avatarAltKa", { length: 255 }),
  phoneVisible: boolean("phoneVisible").default(false).notNull(),
  onlineBookingVisible: boolean("onlineBookingVisible").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  employmentStartDate: date("employmentStartDate"),
  employmentEndDate: date("employmentEndDate"),
  defaultCommissionType: commissionType,
  defaultCommissionValueTetri: int("defaultCommissionValueTetri"),
  status: recordStatus.default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("staff_profiles_membership_uq").on(table.membershipId),
  index("staff_profiles_booking_idx").on(table.onlineBookingVisible, table.status),
]);

export const staffLocations = mysqlTable("staff_locations", {
  staffProfileId: varchar("staffProfileId", { length: 36 }).notNull().references(() => staffProfiles.id),
  locationId: varchar("locationId", { length: 36 }).notNull().references(() => locations.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [primaryKey({ columns: [table.staffProfileId, table.locationId] })]);

export const serviceCategories = mysqlTable("service_categories", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull().references(() => organizations.id),
  locationId: varchar("locationId", { length: 36 }).references(() => locations.id),
  nameKa: varchar("nameKa", { length: 160 }).notNull(),
  iconName: varchar("iconName", { length: 64 }),
  color: varchar("color", { length: 16 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  status: recordStatus.default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("service_categories_org_status_idx").on(table.organizationId, table.status)]);

export const services = mysqlTable("services", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull().references(() => organizations.id),
  categoryId: varchar("categoryId", { length: 36 }).notNull().references(() => serviceCategories.id),
  nameKa: varchar("nameKa", { length: 160 }).notNull(),
  publicDescriptionKa: text("publicDescriptionKa"),
  defaultDurationMinutes: int("defaultDurationMinutes").notNull(),
  bufferBeforeMinutes: int("bufferBeforeMinutes").default(0).notNull(),
  bufferAfterMinutes: int("bufferAfterMinutes").default(0).notNull(),
  priceTetri: int("priceTetri").notNull(),
  isFromPrice: boolean("isFromPrice").default(false).notNull(),
  onlineBookingEnabled: boolean("onlineBookingEnabled").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  status: recordStatus.default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("services_org_status_idx").on(table.organizationId, table.status),
  index("services_category_idx").on(table.categoryId),
]);

export const staffServices = mysqlTable("staff_services", {
  staffProfileId: varchar("staffProfileId", { length: 36 }).notNull().references(() => staffProfiles.id),
  serviceId: varchar("serviceId", { length: 36 }).notNull().references(() => services.id),
  canPerform: boolean("canPerform").default(true).notNull(),
  durationOverrideMinutes: int("durationOverrideMinutes"),
  priceOverrideTetri: int("priceOverrideTetri"),
  commissionType: commissionType,
  commissionValueTetri: int("commissionValueTetri"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [primaryKey({ columns: [table.staffProfileId, table.serviceId] })]);

export const locationOpeningHours = mysqlTable("location_opening_hours", {
  id: varchar("id", { length: 36 }).primaryKey(),
  locationId: varchar("locationId", { length: 36 }).notNull().references(() => locations.id),
  weekday: int("weekday").notNull(),
  startLocalTime: time("startLocalTime").notNull(),
  endLocalTime: time("endLocalTime").notNull(),
  effectiveFrom: date("effectiveFrom"),
  effectiveUntil: date("effectiveUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("opening_hours_location_weekday_idx").on(table.locationId, table.weekday)]);

export const workingHourRules = mysqlTable("working_hour_rules", {
  id: varchar("id", { length: 36 }).primaryKey(),
  staffProfileId: varchar("staffProfileId", { length: 36 }).notNull().references(() => staffProfiles.id),
  locationId: varchar("locationId", { length: 36 }).notNull().references(() => locations.id),
  weekday: int("weekday").notNull(),
  startLocalTime: time("startLocalTime").notNull(),
  endLocalTime: time("endLocalTime").notNull(),
  effectiveFrom: date("effectiveFrom"),
  effectiveUntil: date("effectiveUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("working_hours_staff_location_weekday_idx").on(table.staffProfileId, table.locationId, table.weekday)]);

export const scheduleExceptions = mysqlTable("schedule_exceptions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull().references(() => organizations.id),
  locationId: varchar("locationId", { length: 36 }).references(() => locations.id),
  staffProfileId: varchar("staffProfileId", { length: 36 }).references(() => staffProfiles.id),
  type: exceptionType.notNull(),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  fullDay: boolean("fullDay").default(false).notNull(),
  reason: varchar("reason", { length: 255 }),
  notes: text("notes"),
  approvedByUserId: int("approvedByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("schedule_exceptions_staff_time_idx").on(table.staffProfileId, table.startsAt, table.endsAt),
  index("schedule_exceptions_location_time_idx").on(table.locationId, table.startsAt, table.endsAt),
]);

export const timeOffRequests = mysqlTable("time_off_requests", {
  id: varchar("id", { length: 36 }).primaryKey(),
  staffProfileId: varchar("staffProfileId", { length: 36 }).notNull().references(() => staffProfiles.id),
  locationId: varchar("locationId", { length: 36 }).notNull().references(() => locations.id),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  reason: varchar("reason", { length: 255 }),
  status: mysqlEnum("time_off_request_status", ["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).default("PENDING").notNull(),
  reviewedByUserId: int("reviewedByUserId").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("time_off_staff_status_idx").on(table.staffProfileId, table.status, table.startsAt)]);

export const clients = mysqlTable("clients", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull().references(() => organizations.id),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }),
  normalizedPhone: varchar("normalizedPhone", { length: 32 }),
  email: varchar("email", { length: 320 }),
  normalizedEmail: varchar("normalizedEmail", { length: 320 }),
  birthDate: date("birthDate"),
  gender: varchar("gender", { length: 32 }),
  notes: text("notes"),
  preferences: text("preferences"),
  sensitivityNote: text("sensitivityNote"),
  status: mysqlEnum("client_status", ["ACTIVE", "MERGED", "ARCHIVED"]).default("ACTIVE").notNull(),
  mergedIntoClientId: varchar("mergedIntoClientId", { length: 36 }),
  createdByUserId: int("createdByUserId").references(() => users.id),
  source: varchar("source", { length: 32 }).default("INTERNAL").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("clients_org_phone_uq").on(table.organizationId, table.normalizedPhone),
  index("clients_org_email_idx").on(table.organizationId, table.normalizedEmail),
  index("clients_org_name_idx").on(table.organizationId, table.lastName, table.firstName),
]);

export const clientConsents = mysqlTable("client_consents", {
  id: varchar("id", { length: 36 }).primaryKey(),
  clientId: varchar("clientId", { length: 36 }).notNull().references(() => clients.id),
  consentType: mysqlEnum("client_consent_type", ["MARKETING_SMS", "MARKETING_EMAIL", "BOOKING_TERMS"]).notNull(),
  granted: boolean("granted").notNull(),
  source: varchar("source", { length: 64 }).notNull(),
  grantedAt: timestamp("grantedAt").notNull(),
  withdrawnAt: timestamp("withdrawnAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("client_consents_client_type_idx").on(table.clientId, table.consentType)]);

/** One truthful feedback submission per completed appointment, submitted through its opaque customer booking token. */
export const customerFeedback = mysqlTable("customer_feedback", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull().references(() => organizations.id),
  locationId: varchar("locationId", { length: 36 }).notNull().references(() => locations.id),
  appointmentId: varchar("appointmentId", { length: 36 }).notNull().references(() => appointments.id),
  clientId: varchar("clientId", { length: 36 }).notNull().references(() => clients.id),
  rating: int("rating").notNull(),
  comment: varchar("comment", { length: 1200 }).notNull(),
  displayName: varchar("displayName", { length: 100 }),
  publicNameConsent: boolean("publicNameConsent").default(false).notNull(),
  status: customerFeedbackStatus.default("PENDING").notNull(),
  moderationNote: varchar("moderationNote", { length: 500 }),
  moderatedByUserId: int("moderatedByUserId").references(() => users.id),
  moderatedAt: timestamp("moderatedAt"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("customer_feedback_appointment_uq").on(table.appointmentId),
  index("customer_feedback_public_location_idx").on(table.locationId, table.status, table.submittedAt),
  index("customer_feedback_org_status_idx").on(table.organizationId, table.status, table.submittedAt),
]);

/** Immutable audit trail for feedback submission and salon-side moderation. */
export const customerFeedbackEvents = mysqlTable("customer_feedback_events", {
  id: varchar("id", { length: 36 }).primaryKey(),
  feedbackId: varchar("feedbackId", { length: 36 }).notNull().references(() => customerFeedback.id),
  eventType: varchar("eventType", { length: 80 }).notNull(),
  actorUserId: int("actorUserId").references(() => users.id),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("customer_feedback_events_feedback_created_idx").on(table.feedbackId, table.createdAt)]);

export const clientMerges = mysqlTable("client_merges", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull().references(() => organizations.id),
  sourceClientId: varchar("sourceClientId", { length: 36 }).notNull().references(() => clients.id),
  targetClientId: varchar("targetClientId", { length: 36 }).notNull().references(() => clients.id),
  mergedByUserId: int("mergedByUserId").notNull().references(() => users.id),
  reason: varchar("reason", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("client_merges_org_created_idx").on(table.organizationId, table.createdAt)]);

export const clientMediaSets = mysqlTable("client_media_sets", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull().references(() => organizations.id),
  clientId: varchar("clientId", { length: 36 }).notNull().references(() => clients.id),
  appointmentId: varchar("appointmentId", { length: 36 }).notNull().references(() => appointments.id),
  locationId: varchar("locationId", { length: 36 }).notNull().references(() => locations.id),
  publicVisible: boolean("publicVisible").default(false).notNull(),
  clientPublicationConsent: boolean("clientPublicationConsent").default(false).notNull(),
  clientPublicationConsentAt: timestamp("clientPublicationConsentAt"),
  internalNote: text("internalNote"),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("client_media_sets_org_client_created_idx").on(table.organizationId, table.clientId, table.createdAt),
  index("client_media_sets_appointment_idx").on(table.appointmentId),
  index("client_media_sets_public_location_idx").on(table.publicVisible, table.locationId, table.createdAt),
]);

export const clientMediaItems = mysqlTable("client_media_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  setId: varchar("setId", { length: 36 }).notNull().references(() => clientMediaSets.id),
  stage: clientMediaStage.notNull(),
  mediaKey: varchar("mediaKey", { length: 512 }).notNull(),
  contentType: varchar("contentType", { length: 64 }).notNull(),
  byteSize: int("byteSize").notNull(),
  altTextKa: varchar("altTextKa", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("client_media_items_set_stage_uq").on(table.setId, table.stage),
  index("client_media_items_set_idx").on(table.setId, table.stage),
]);

export const locationFeedPosts = mysqlTable("location_feed_posts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull().references(() => organizations.id),
  locationId: varchar("locationId", { length: 36 }).notNull().references(() => locations.id),
  mediaKey: varchar("mediaKey", { length: 512 }).notNull(),
  contentType: varchar("contentType", { length: 64 }).notNull(),
  byteSize: int("byteSize").notNull(),
  titleKa: varchar("titleKa", { length: 160 }),
  captionKa: text("captionKa"),
  altTextKa: varchar("altTextKa", { length: 255 }).notNull(),
  publicVisible: boolean("publicVisible").default(false).notNull(),
  publishedAt: timestamp("publishedAt"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("location_feed_posts_public_idx").on(table.locationId, table.publicVisible, table.publishedAt, table.sortOrder),
  index("location_feed_posts_org_created_idx").on(table.organizationId, table.createdAt),
]);

export const scheduleLocks = mysqlTable("schedule_locks", {
  id: varchar("id", { length: 80 }).primaryKey(),
  staffProfileId: varchar("staffProfileId", { length: 36 }).notNull().references(() => staffProfiles.id),
  localDate: date("localDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("schedule_locks_staff_date_uq").on(table.staffProfileId, table.localDate)]);

export const appointments = mysqlTable("appointments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull().references(() => organizations.id),
  locationId: varchar("locationId", { length: 36 }).notNull().references(() => locations.id),
  clientId: varchar("clientId", { length: 36 }).references(() => clients.id),
  staffProfileId: varchar("staffProfileId", { length: 36 }).notNull().references(() => staffProfiles.id),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  bufferBeforeMinutes: int("bufferBeforeMinutes").default(0).notNull(),
  bufferAfterMinutes: int("bufferAfterMinutes").default(0).notNull(),
  status: appointmentStatus.default("PENDING").notNull(),
  source: appointmentSource.notNull(),
  customerNote: text("customerNote"),
  internalNote: text("internalNote"),
  subtotalTetri: int("subtotalTetri").notNull(),
  discountTetri: int("discountTetri").default(0).notNull(),
  totalTetri: int("totalTetri").notNull(),
  cancellationReason: varchar("cancellationReason", { length: 255 }),
  cancelledByUserId: int("cancelledByUserId").references(() => users.id),
  cancelledAt: timestamp("cancelledAt"),
  publicTokenHash: varchar("publicTokenHash", { length: 128 }),
  publicTokenExpiresAt: timestamp("publicTokenExpiresAt"),
  createdByUserId: int("createdByUserId").references(() => users.id),
  idempotencyKey: varchar("idempotencyKey", { length: 96 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("appointments_staff_time_status_idx").on(table.staffProfileId, table.startsAt, table.endsAt, table.status),
  index("appointments_org_location_start_idx").on(table.organizationId, table.locationId, table.startsAt),
  index("appointments_client_start_idx").on(table.clientId, table.startsAt),
  uniqueIndex("appointments_public_token_hash_uq").on(table.publicTokenHash),
  uniqueIndex("appointments_idempotency_key_uq").on(table.idempotencyKey),
]);

export const appointmentServices = mysqlTable("appointment_services", {
  id: varchar("id", { length: 36 }).primaryKey(),
  appointmentId: varchar("appointmentId", { length: 36 }).notNull().references(() => appointments.id),
  serviceId: varchar("serviceId", { length: 36 }).references(() => services.id),
  staffProfileId: varchar("staffProfileId", { length: 36 }).references(() => staffProfiles.id),
  serviceNameSnapshot: varchar("serviceNameSnapshot", { length: 160 }).notNull(),
  durationMinutesSnapshot: int("durationMinutesSnapshot").notNull(),
  bufferBeforeMinutesSnapshot: int("bufferBeforeMinutesSnapshot").default(0).notNull(),
  bufferAfterMinutesSnapshot: int("bufferAfterMinutesSnapshot").default(0).notNull(),
  priceTetriSnapshot: int("priceTetriSnapshot").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("appointment_services_appointment_idx").on(table.appointmentId, table.sortOrder)]);

export const appointmentStatusHistory = mysqlTable("appointment_status_history", {
  id: varchar("id", { length: 36 }).primaryKey(),
  appointmentId: varchar("appointmentId", { length: 36 }).notNull().references(() => appointments.id),
  oldStatus: mysqlEnum("oldStatus", appointmentStatusValues),
  newStatus: mysqlEnum("newStatus", appointmentStatusValues).notNull(),
  actorUserId: int("actorUserId").references(() => users.id),
  reason: varchar("reason", { length: 255 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("appointment_status_history_appointment_idx").on(table.appointmentId, table.createdAt)]);

export const payments = mysqlTable("payments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  appointmentId: varchar("appointmentId", { length: 36 }).notNull().references(() => appointments.id),
  amountTetri: int("amountTetri").notNull(),
  refundedTetri: int("refundedTetri").default(0).notNull(),
  method: paymentMethod.notNull(),
  status: paymentStatus.default("PENDING").notNull(),
  externalReference: varchar("externalReference", { length: 160 }),
  collectedByUserId: int("collectedByUserId").references(() => users.id),
  collectedAt: timestamp("collectedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("payments_appointment_status_idx").on(table.appointmentId, table.status)]);

export const attendanceEntries = mysqlTable("attendance_entries", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull().references(() => organizations.id),
  locationId: varchar("locationId", { length: 36 }).notNull().references(() => locations.id),
  staffProfileId: varchar("staffProfileId", { length: 36 }).notNull().references(() => staffProfiles.id),
  clockInAt: timestamp("clockInAt").notNull(),
  clockOutAt: timestamp("clockOutAt"),
  note: text("note"),
  recordedByUserId: int("recordedByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("attendance_org_location_clockin_idx").on(table.organizationId, table.locationId, table.clockInAt),
  index("attendance_staff_clockin_idx").on(table.staffProfileId, table.clockInAt),
]);

export const tips = mysqlTable("tips", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull().references(() => organizations.id),
  locationId: varchar("locationId", { length: 36 }).notNull().references(() => locations.id),
  appointmentId: varchar("appointmentId", { length: 36 }).references(() => appointments.id),
  staffProfileId: varchar("staffProfileId", { length: 36 }).notNull().references(() => staffProfiles.id),
  amountTetri: int("amountTetri").notNull(),
  method: paymentMethod.notNull(),
  collectedByUserId: int("collectedByUserId").notNull().references(() => users.id),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("tips_org_location_created_idx").on(table.organizationId, table.locationId, table.createdAt),
  index("tips_staff_created_idx").on(table.staffProfileId, table.createdAt),
  index("tips_appointment_idx").on(table.appointmentId),
]);

export const retailProducts = mysqlTable("retail_products", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull().references(() => organizations.id),
  nameKa: varchar("nameKa", { length: 160 }).notNull(),
  sku: varchar("sku", { length: 96 }),
  retailPriceTetri: int("retailPriceTetri").notNull(),
  costTetri: int("costTetri"),
  status: recordStatus.default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("retail_products_org_sku_uq").on(table.organizationId, table.sku), index("retail_products_org_status_idx").on(table.organizationId, table.status)]);

export const inventoryStocks = mysqlTable("inventory_stocks", {
  id: varchar("id", { length: 36 }).primaryKey(),
  productId: varchar("productId", { length: 36 }).notNull().references(() => retailProducts.id),
  locationId: varchar("locationId", { length: 36 }).notNull().references(() => locations.id),
  currentQuantity: int("currentQuantity").default(0).notNull(),
  reorderLevel: int("reorderLevel").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("inventory_stocks_product_location_uq").on(table.productId, table.locationId), index("inventory_stocks_location_quantity_idx").on(table.locationId, table.currentQuantity)]);

export const retailSales = mysqlTable("retail_sales", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull().references(() => organizations.id),
  locationId: varchar("locationId", { length: 36 }).notNull().references(() => locations.id),
  clientId: varchar("clientId", { length: 36 }).references(() => clients.id),
  subtotalTetri: int("subtotalTetri").notNull(),
  totalTetri: int("totalTetri").notNull(),
  method: paymentMethod.notNull(),
  status: retailSaleStatus.default("COMPLETED").notNull(),
  collectedByUserId: int("collectedByUserId").notNull().references(() => users.id),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("retail_sales_org_location_created_idx").on(table.organizationId, table.locationId, table.createdAt), index("retail_sales_client_created_idx").on(table.clientId, table.createdAt)]);

export const retailSaleLines = mysqlTable("retail_sale_lines", {
  id: varchar("id", { length: 36 }).primaryKey(),
  saleId: varchar("saleId", { length: 36 }).notNull().references(() => retailSales.id),
  productId: varchar("productId", { length: 36 }).references(() => retailProducts.id),
  productNameSnapshot: varchar("productNameSnapshot", { length: 160 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPriceTetri: int("unitPriceTetri").notNull(),
  lineTotalTetri: int("lineTotalTetri").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("retail_sale_lines_sale_idx").on(table.saleId)]);

export const inventoryMovements = mysqlTable("inventory_movements", {
  id: varchar("id", { length: 36 }).primaryKey(),
  productId: varchar("productId", { length: 36 }).notNull().references(() => retailProducts.id),
  locationId: varchar("locationId", { length: 36 }).notNull().references(() => locations.id),
  saleId: varchar("saleId", { length: 36 }).references(() => retailSales.id),
  changeQuantity: int("changeQuantity").notNull(),
  type: stockMovementType.notNull(),
  reason: varchar("reason", { length: 255 }),
  recordedByUserId: int("recordedByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("inventory_movements_product_location_created_idx").on(table.productId, table.locationId, table.createdAt), index("inventory_movements_sale_idx").on(table.saleId)]);

export const commissionRules = mysqlTable("commission_rules", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull().references(() => organizations.id),
  locationId: varchar("locationId", { length: 36 }).references(() => locations.id),
  staffProfileId: varchar("staffProfileId", { length: 36 }).references(() => staffProfiles.id),
  serviceId: varchar("serviceId", { length: 36 }).references(() => services.id),
  type: commissionType.notNull(),
  valueTetri: int("valueTetri").notNull(),
  status: recordStatus.default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("commission_rules_scope_idx").on(table.organizationId, table.staffProfileId, table.serviceId, table.status)]);

export const commissionEntries = mysqlTable("commission_entries", {
  id: varchar("id", { length: 36 }).primaryKey(),
  appointmentId: varchar("appointmentId", { length: 36 }).notNull().references(() => appointments.id),
  appointmentServiceId: varchar("appointmentServiceId", { length: 36 }).references(() => appointmentServices.id),
  staffProfileId: varchar("staffProfileId", { length: 36 }).notNull().references(() => staffProfiles.id),
  ruleId: varchar("ruleId", { length: 36 }).references(() => commissionRules.id),
  amountTetri: int("amountTetri").notNull(),
  calculationSnapshot: json("calculationSnapshot").notNull(),
  adjustmentReason: varchar("adjustmentReason", { length: 255 }),
  adjustedByUserId: int("adjustedByUserId").references(() => users.id),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("commission_entries_appointment_service_uq").on(table.appointmentServiceId),
  index("commission_entries_staff_created_idx").on(table.staffProfileId, table.createdAt),
]);

export const expenses = mysqlTable("expenses", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull().references(() => organizations.id),
  locationId: varchar("locationId", { length: 36 }).notNull().references(() => locations.id),
  category: varchar("category", { length: 100 }).notNull(),
  amountTetri: int("amountTetri").notNull(),
  expenseDate: date("expenseDate").notNull(),
  description: text("description"),
  receiptKey: varchar("receiptKey", { length: 512 }),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  status: recordStatus.default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("expenses_location_date_idx").on(table.locationId, table.expenseDate, table.status)]);

export const notificationJobs = mysqlTable("notification_jobs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull().references(() => organizations.id),
  appointmentId: varchar("appointmentId", { length: 36 }).references(() => appointments.id),
  clientId: varchar("clientId", { length: 36 }).references(() => clients.id),
  channel: notificationChannel.notNull(),
  templateKey: varchar("templateKey", { length: 96 }).notNull(),
  locale: varchar("locale", { length: 16 }).default("ka-GE").notNull(),
  payload: json("payload").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  status: notificationStatus.default("PENDING").notNull(),
  attemptCount: int("attemptCount").default(0).notNull(),
  lastError: varchar("lastError", { length: 512 }),
  providerMessageId: varchar("providerMessageId", { length: 160 }),
  idempotencyKey: varchar("idempotencyKey", { length: 160 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("notification_jobs_idempotency_uq").on(table.idempotencyKey),
  index("notification_jobs_due_idx").on(table.status, table.scheduledAt),
]);

export const waitlistEntries = mysqlTable("waitlist_entries", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull().references(() => organizations.id),
  locationId: varchar("locationId", { length: 36 }).notNull().references(() => locations.id),
  clientId: varchar("clientId", { length: 36 }).notNull().references(() => clients.id),
  serviceId: varchar("serviceId", { length: 36 }).notNull().references(() => services.id),
  staffProfileId: varchar("staffProfileId", { length: 36 }).references(() => staffProfiles.id),
  requestedDate: date("requestedDate").notNull(),
  preferredStartLocalTime: time("preferredStartLocalTime"),
  customerNote: text("customerNote"),
  status: waitlistStatus.default("PENDING").notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("waitlist_entries_idempotency_uq").on(table.idempotencyKey),
  index("waitlist_entries_location_date_status_idx").on(table.locationId, table.requestedDate, table.status),
  index("waitlist_entries_client_status_idx").on(table.clientId, table.status),
]);

export const staffInvites = mysqlTable("staff_invites", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull().references(() => organizations.id),
  locationId: varchar("locationId", { length: 36 }).references(() => locations.id),
  email: varchar("email", { length: 320 }),
  normalizedPhone: varchar("normalizedPhone", { length: 32 }),
  role: membershipRole.notNull(),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull(),
  status: inviteStatus.default("PENDING").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  invitedByUserId: int("invitedByUserId").notNull().references(() => users.id),
  acceptedByUserId: int("acceptedByUserId").references(() => users.id),
  acceptedAt: timestamp("acceptedAt"),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("staff_invites_token_hash_uq").on(table.tokenHash),
  index("staff_invites_org_status_idx").on(table.organizationId, table.status),
]);

export const verificationCodes = mysqlTable("verification_codes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  destination: varchar("destination", { length: 320 }).notNull(),
  purpose: verificationPurpose.notNull(),
  codeHash: varchar("codeHash", { length: 128 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  consumedAt: timestamp("consumedAt"),
  attemptCount: int("attemptCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("verification_codes_destination_purpose_idx").on(table.destination, table.purpose, table.expiresAt)]);

export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  consumedAt: timestamp("consumedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("password_reset_tokens_hash_uq").on(table.tokenHash)]);

export const auditLogs = mysqlTable("audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull().references(() => organizations.id),
  actorUserId: int("actorUserId").references(() => users.id),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: varchar("entityId", { length: 36 }).notNull(),
  beforeState: json("beforeState"),
  afterState: json("afterState"),
  metadata: json("metadata"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: varchar("userAgent", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("audit_logs_org_entity_created_idx").on(table.organizationId, table.entityType, table.createdAt)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type OrganizationMembership = typeof organizationMemberships.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
