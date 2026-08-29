
CREATE TABLE `appointment_services` (
	`id` varchar(36) NOT NULL,
	`appointmentId` varchar(36) NOT NULL,
	`serviceId` varchar(36),
	`staffProfileId` varchar(36),
	`serviceNameSnapshot` varchar(160) NOT NULL,
	`durationMinutesSnapshot` int NOT NULL,
	`bufferBeforeMinutesSnapshot` int NOT NULL DEFAULT 0,
	`bufferAfterMinutesSnapshot` int NOT NULL DEFAULT 0,
	`priceTetriSnapshot` int NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `appointment_services_id` PRIMARY KEY(`id`)
);

CREATE TABLE `appointment_status_history` (
	`id` varchar(36) NOT NULL,
	`appointmentId` varchar(36) NOT NULL,
	`oldStatus` enum('PENDING','CONFIRMED','CHECKED_IN','IN_SERVICE','COMPLETED','CANCELLED','NO_SHOW'),
	`newStatus` enum('PENDING','CONFIRMED','CHECKED_IN','IN_SERVICE','COMPLETED','CANCELLED','NO_SHOW') NOT NULL,
	`actorUserId` int,
	`reason` varchar(255),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `appointment_status_history_id` PRIMARY KEY(`id`)
);

CREATE TABLE `appointments` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`clientId` varchar(36),
	`staffProfileId` varchar(36) NOT NULL,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`bufferBeforeMinutes` int NOT NULL DEFAULT 0,
	`bufferAfterMinutes` int NOT NULL DEFAULT 0,
	`appointment_status` enum('PENDING','CONFIRMED','CHECKED_IN','IN_SERVICE','COMPLETED','CANCELLED','NO_SHOW') NOT NULL DEFAULT 'PENDING',
	`appointment_source` enum('PUBLIC_WEB','MANAGER','RECEPTION','STAFF','WALK_IN','IMPORT') NOT NULL,
	`customerNote` text,
	`internalNote` text,
	`subtotalTetri` int NOT NULL,
	`discountTetri` int NOT NULL DEFAULT 0,
	`totalTetri` int NOT NULL,
	`cancellationReason` varchar(255),
	`cancelledByUserId` int,
	`cancelledAt` timestamp,
	`publicTokenHash` varchar(128),
	`publicTokenExpiresAt` timestamp,
	`createdByUserId` int,
	`idempotencyKey` varchar(96),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`),
	CONSTRAINT `appointments_public_token_hash_uq` UNIQUE(`publicTokenHash`),
	CONSTRAINT `appointments_idempotency_key_uq` UNIQUE(`idempotencyKey`)
);

CREATE TABLE `attendance_entries` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`staffProfileId` varchar(36) NOT NULL,
	`clockInAt` timestamp NOT NULL,
	`clockOutAt` timestamp,
	`note` text,
	`recordedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendance_entries_id` PRIMARY KEY(`id`)
);

CREATE TABLE `audit_logs` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`actorUserId` int,
	`action` varchar(120) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` varchar(36) NOT NULL,
	`beforeState` json,
	`afterState` json,
	`metadata` json,
	`ipAddress` varchar(64),
	`userAgent` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);

CREATE TABLE `billing_configurations` (
	`id` int NOT NULL,
	`beneficiaryName` varchar(160),
	`personalNumber` varchar(32),
	`accountNumber` varchar(64),
	`monthlyPriceTetri` int,
	`transferCommentPrefix` varchar(32) NOT NULL DEFAULT 'SF',
	`privacyNoticeKa` text,
	`updatedByUserId` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `billing_configurations_id` PRIMARY KEY(`id`)
);

CREATE TABLE `billing_payment_events` (
	`id` varchar(36) NOT NULL,
	`billingPaymentSubmissionId` varchar(36) NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`actorUserId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `billing_payment_events_id` PRIMARY KEY(`id`)
);

CREATE TABLE `billing_payment_submissions` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`submittedByUserId` int NOT NULL,
	`billingCodeSnapshot` varchar(24) NOT NULL,
	`planCode` varchar(48) NOT NULL DEFAULT 'MONTHLY_MANUAL',
	`amountTetri` int,
	`transferComment` varchar(160) NOT NULL,
	`receiptKey` varchar(512) NOT NULL,
	`receiptMimeType` varchar(120) NOT NULL,
	`receiptOriginalName` varchar(255) NOT NULL,
	`receiptSizeBytes` int NOT NULL,
	`billing_submission_status` enum('DRAFT','SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'SUBMITTED',
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`reviewNoteKa` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `billing_payment_submissions_id` PRIMARY KEY(`id`)
);

CREATE TABLE `client_consents` (
	`id` varchar(36) NOT NULL,
	`clientId` varchar(36) NOT NULL,
	`client_consent_type` enum('MARKETING_SMS','MARKETING_EMAIL','BOOKING_TERMS') NOT NULL,
	`granted` boolean NOT NULL,
	`source` varchar(64) NOT NULL,
	`grantedAt` timestamp NOT NULL,
	`withdrawnAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_consents_id` PRIMARY KEY(`id`)
);

CREATE TABLE `client_media_items` (
	`id` varchar(36) NOT NULL,
	`setId` varchar(36) NOT NULL,
	`client_media_stage` enum('BEFORE','AFTER') NOT NULL,
	`mediaKey` varchar(512) NOT NULL,
	`contentType` varchar(64) NOT NULL,
	`byteSize` int NOT NULL,
	`altTextKa` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_media_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_media_items_set_stage_uq` UNIQUE(`setId`,`client_media_stage`)
);

CREATE TABLE `client_media_sets` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`clientId` varchar(36) NOT NULL,
	`appointmentId` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`publicVisible` boolean NOT NULL DEFAULT false,
	`clientPublicationConsent` boolean NOT NULL DEFAULT false,
	`clientPublicationConsentAt` timestamp,
	`internalNote` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_media_sets_id` PRIMARY KEY(`id`)
);

CREATE TABLE `client_merges` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`sourceClientId` varchar(36) NOT NULL,
	`targetClientId` varchar(36) NOT NULL,
	`mergedByUserId` int NOT NULL,
	`reason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_merges_id` PRIMARY KEY(`id`)
);

CREATE TABLE `clients` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100),
	`normalizedPhone` varchar(32),
	`email` varchar(320),
	`normalizedEmail` varchar(320),
	`birthDate` date,
	`gender` varchar(32),
	`notes` text,
	`preferences` text,
	`sensitivityNote` text,
	`client_status` enum('ACTIVE','MERGED','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
	`mergedIntoClientId` varchar(36),
	`createdByUserId` int,
	`source` varchar(32) NOT NULL DEFAULT 'INTERNAL',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`),
	CONSTRAINT `clients_org_phone_uq` UNIQUE(`organizationId`,`normalizedPhone`)
);

CREATE TABLE `commission_entries` (
	`id` varchar(36) NOT NULL,
	`appointmentId` varchar(36) NOT NULL,
	`appointmentServiceId` varchar(36),
	`staffProfileId` varchar(36) NOT NULL,
	`ruleId` varchar(36),
	`amountTetri` int NOT NULL,
	`calculationSnapshot` json NOT NULL,
	`adjustmentReason` varchar(255),
	`adjustedByUserId` int,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commission_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `commission_entries_appointment_service_uq` UNIQUE(`appointmentServiceId`)
);

CREATE TABLE `commission_rules` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`locationId` varchar(36),
	`staffProfileId` varchar(36),
	`serviceId` varchar(36),
	`commission_type` enum('PERCENTAGE','FIXED') NOT NULL,
	`valueTetri` int NOT NULL,
	`record_status` enum('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commission_rules_id` PRIMARY KEY(`id`)
);

CREATE TABLE `customer_feedback` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`appointmentId` varchar(36) NOT NULL,
	`clientId` varchar(36) NOT NULL,
	`rating` int NOT NULL,
	`comment` varchar(1200) NOT NULL,
	`displayName` varchar(100),
	`publicNameConsent` boolean NOT NULL DEFAULT false,
	`customer_feedback_status` enum('PENDING','APPROVED','HIDDEN','REJECTED') NOT NULL DEFAULT 'PENDING',
	`moderationNote` varchar(500),
	`moderatedByUserId` int,
	`moderatedAt` timestamp,
	`platformReviewOpen` boolean NOT NULL DEFAULT false,
	`platformReviewReason` varchar(64),
	`platformReviewNote` varchar(500),
	`platformReviewRequestedByUserId` int,
	`platformReviewRequestedAt` timestamp,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_feedback_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_feedback_appointment_uq` UNIQUE(`appointmentId`)
);

CREATE TABLE `customer_feedback_events` (
	`id` varchar(36) NOT NULL,
	`feedbackId` varchar(36) NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`actorUserId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_feedback_events_id` PRIMARY KEY(`id`)
);

CREATE TABLE `dashboard_user_preferences` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`metricKeys` json,
	`dismissedNotificationKeys` json,
	`settings` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dashboard_user_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `dash_prefs_user_org_uq` UNIQUE(`userId`,`organizationId`)
);

CREATE TABLE `expenses` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`category` varchar(100) NOT NULL,
	`amountTetri` int NOT NULL,
	`expenseDate` date NOT NULL,
	`description` text,
	`receiptKey` varchar(512),
	`createdByUserId` int NOT NULL,
	`record_status` enum('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);

CREATE TABLE `inventory_movements` (
	`id` varchar(36) NOT NULL,
	`productId` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`saleId` varchar(36),
	`changeQuantity` int NOT NULL,
	`stock_movement_type` enum('OPENING','ADJUSTMENT','SALE','VOID') NOT NULL,
	`reason` varchar(255),
	`recordedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_movements_id` PRIMARY KEY(`id`)
);

CREATE TABLE `inventory_stocks` (
	`id` varchar(36) NOT NULL,
	`productId` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`currentQuantity` int NOT NULL DEFAULT 0,
	`reorderLevel` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_stocks_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_stocks_product_location_uq` UNIQUE(`productId`,`locationId`)
);

CREATE TABLE `location_feed_posts` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`mediaKey` varchar(512) NOT NULL,
	`contentType` varchar(64) NOT NULL,
	`byteSize` int NOT NULL,
	`titleKa` varchar(160),
	`captionKa` text,
	`altTextKa` varchar(255) NOT NULL,
	`publicVisible` boolean NOT NULL DEFAULT false,
	`publishedAt` timestamp,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `location_feed_posts_id` PRIMARY KEY(`id`)
);

CREATE TABLE `location_marketplace_profiles` (
	`locationId` varchar(36) NOT NULL,
	`marketplace_listing_status` enum('DRAFT','SUBMITTED','APPROVED','HIDDEN','REJECTED') NOT NULL DEFAULT 'DRAFT',
	`areaLabelKa` varchar(160),
	`mapVisibility` boolean NOT NULL DEFAULT false,
	`geocodeConfirmedAt` timestamp,
	`ownerSubmittedAt` timestamp,
	`approvedAt` timestamp,
	`approvedByUserId` int,
	`reviewNoteKa` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `location_marketplace_profiles_locationId` PRIMARY KEY(`locationId`)
);

CREATE TABLE `location_opening_hours` (
	`id` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`weekday` int NOT NULL,
	`startLocalTime` time NOT NULL,
	`endLocalTime` time NOT NULL,
	`effectiveFrom` date,
	`effectiveUntil` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `location_opening_hours_id` PRIMARY KEY(`id`)
);

CREATE TABLE `locations` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`publicSlug` varchar(96) NOT NULL,
	`address` text,
	`latitudeE6` int,
	`longitudeE6` int,
	`timezone` varchar(64) NOT NULL DEFAULT 'Asia/Tbilisi',
	`phone` varchar(32),
	`email` varchar(320),
	`socialLinks` json,
	`publicDescription` text,
	`coverImageKey` varchar(512),
	`coverImageAltKa` varchar(255),
	`bookingEnabled` boolean NOT NULL DEFAULT true,
	`slotIntervalMinutes` int NOT NULL DEFAULT 15,
	`minimumNoticeMinutes` int NOT NULL DEFAULT 60,
	`maximumAdvanceDays` int NOT NULL DEFAULT 60,
	`cancellationCutoffMinutes` int NOT NULL DEFAULT 120,
	`record_status` enum('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `locations_id` PRIMARY KEY(`id`),
	CONSTRAINT `locations_public_slug_uq` UNIQUE(`publicSlug`)
);

CREATE TABLE `marketplace_categories` (
	`id` varchar(36) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`nameKa` varchar(120) NOT NULL,
	`nameEn` varchar(120),
	`nameRu` varchar(120),
	`iconKey` varchar(64) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplace_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `marketplace_categories_slug_uq` UNIQUE(`slug`)
);

CREATE TABLE `marketplace_listing_events` (
	`id` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`actorUserId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketplace_listing_events_id` PRIMARY KEY(`id`)
);

CREATE TABLE `marketplace_location_categories` (
	`locationId` varchar(36) NOT NULL,
	`categoryId` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketplace_location_categories_locationId_categoryId_pk` PRIMARY KEY(`locationId`,`categoryId`)
);

CREATE TABLE `marketplace_location_category_services` (
	`locationId` varchar(36) NOT NULL,
	`categoryId` varchar(36) NOT NULL,
	`serviceId` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sf_a7d11db64569dedd8f15` PRIMARY KEY(`locationId`,`categoryId`,`serviceId`)
);

CREATE TABLE `marketplace_promotions` (
	`id` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`marketplace_promotion_tier` enum('RECOMMENDED','VIP') NOT NULL,
	`marketplace_promotion_status` enum('SCHEDULED','ACTIVE','EXPIRED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`displayDisclosure` varchar(80) NOT NULL,
	`manualPriceTetri` int,
	`billingReference` varchar(160),
	`createdByUserId` int NOT NULL,
	`approvedByUserId` int,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplace_promotions_id` PRIMARY KEY(`id`)
);

CREATE TABLE `notification_jobs` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`appointmentId` varchar(36),
	`clientId` varchar(36),
	`notification_channel` enum('SMS','EMAIL','WHATSAPP') NOT NULL,
	`templateKey` varchar(96) NOT NULL,
	`locale` varchar(16) NOT NULL DEFAULT 'ka-GE',
	`payload` json NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`notification_status` enum('PENDING','PROCESSING','SENT','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`attemptCount` int NOT NULL DEFAULT 0,
	`lastError` varchar(512),
	`providerMessageId` varchar(160),
	`idempotencyKey` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_jobs_idempotency_uq` UNIQUE(`idempotencyKey`)
);

CREATE TABLE `organization_access_grants` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`access_grant_source` enum('MONTHLY_MANUAL','BONUS_DAYS') NOT NULL,
	`billingPaymentSubmissionId` varchar(36),
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`access_grant_status` enum('ACTIVE','REVOKED','EXPIRED') NOT NULL DEFAULT 'ACTIVE',
	`grantReasonKa` varchar(500),
	`grantedByUserId` int NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organization_access_grants_id` PRIMARY KEY(`id`)
);

CREATE TABLE `organization_memberships` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`membership_role` enum('OWNER','MANAGER','RECEPTIONIST','STAFF') NOT NULL,
	`membership_status` enum('INVITED','ACTIVE','DISABLED') NOT NULL DEFAULT 'INVITED',
	`permissionOverrides` json,
	`invitedByUserId` int,
	`invitedAt` timestamp,
	`activatedAt` timestamp,
	`disabledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organization_memberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `memberships_org_user_uq` UNIQUE(`organizationId`,`userId`)
);

CREATE TABLE `organizations` (
	`id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(96) NOT NULL,
	`logoKey` varchar(512),
	`defaultTimezone` varchar(64) NOT NULL DEFAULT 'Asia/Tbilisi',
	`defaultCurrency` varchar(3) NOT NULL DEFAULT 'GEL',
	`contactPhone` varchar(32),
	`contactEmail` varchar(320),
	`billingCode` varchar(24),
	`record_status` enum('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_uq` UNIQUE(`slug`),
	CONSTRAINT `organizations_billing_code_uq` UNIQUE(`billingCode`)
);

CREATE TABLE `password_reset_tokens` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`consumedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_tokens_hash_uq` UNIQUE(`tokenHash`)
);

CREATE TABLE `payments` (
	`id` varchar(36) NOT NULL,
	`appointmentId` varchar(36) NOT NULL,
	`amountTetri` int NOT NULL,
	`refundedTetri` int NOT NULL DEFAULT 0,
	`payment_method` enum('CASH','CARD_TERMINAL','BANK_TRANSFER','ONLINE','OTHER') NOT NULL,
	`payment_status` enum('PENDING','PAID','PARTIALLY_REFUNDED','REFUNDED','FAILED') NOT NULL DEFAULT 'PENDING',
	`externalReference` varchar(160),
	`collectedByUserId` int,
	`collectedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);

CREATE TABLE `public_conversion_events` (
	`id` varchar(36) NOT NULL,
	`eventName` varchar(64) NOT NULL,
	`routePath` varchar(180) NOT NULL,
	`consentVersion` varchar(32) NOT NULL,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `public_conversion_events_id` PRIMARY KEY(`id`)
);

CREATE TABLE `retail_products` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`nameKa` varchar(160) NOT NULL,
	`sku` varchar(96),
	`retailPriceTetri` int NOT NULL,
	`costTetri` int,
	`record_status` enum('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `retail_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `retail_products_org_sku_uq` UNIQUE(`organizationId`,`sku`)
);

CREATE TABLE `retail_sale_lines` (
	`id` varchar(36) NOT NULL,
	`saleId` varchar(36) NOT NULL,
	`productId` varchar(36),
	`productNameSnapshot` varchar(160) NOT NULL,
	`quantity` int NOT NULL,
	`unitPriceTetri` int NOT NULL,
	`lineTotalTetri` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `retail_sale_lines_id` PRIMARY KEY(`id`)
);

CREATE TABLE `retail_sales` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`clientId` varchar(36),
	`subtotalTetri` int NOT NULL,
	`totalTetri` int NOT NULL,
	`payment_method` enum('CASH','CARD_TERMINAL','BANK_TRANSFER','ONLINE','OTHER') NOT NULL,
	`retail_sale_status` enum('COMPLETED','VOIDED') NOT NULL DEFAULT 'COMPLETED',
	`collectedByUserId` int NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `retail_sales_id` PRIMARY KEY(`id`)
);

CREATE TABLE `schedule_exceptions` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`locationId` varchar(36),
	`staffProfileId` varchar(36),
	`exception_type` enum('BREAK','VACATION','SICK_LEAVE','CUSTOM_BLOCK','EXTENDED_WORKING_TIME','CLOSURE') NOT NULL,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`fullDay` boolean NOT NULL DEFAULT false,
	`reason` varchar(255),
	`notes` text,
	`approvedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schedule_exceptions_id` PRIMARY KEY(`id`)
);

CREATE TABLE `schedule_locks` (
	`id` varchar(80) NOT NULL,
	`staffProfileId` varchar(36) NOT NULL,
	`localDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `schedule_locks_id` PRIMARY KEY(`id`),
	CONSTRAINT `schedule_locks_staff_date_uq` UNIQUE(`staffProfileId`,`localDate`)
);

CREATE TABLE `service_categories` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`locationId` varchar(36),
	`nameKa` varchar(160) NOT NULL,
	`iconName` varchar(64),
	`color` varchar(16),
	`sortOrder` int NOT NULL DEFAULT 0,
	`record_status` enum('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `service_categories_id` PRIMARY KEY(`id`)
);

CREATE TABLE `services` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`categoryId` varchar(36) NOT NULL,
	`nameKa` varchar(160) NOT NULL,
	`publicDescriptionKa` text,
	`defaultDurationMinutes` int NOT NULL,
	`bufferBeforeMinutes` int NOT NULL DEFAULT 0,
	`bufferAfterMinutes` int NOT NULL DEFAULT 0,
	`priceTetri` int NOT NULL,
	`isFromPrice` boolean NOT NULL DEFAULT false,
	`onlineBookingEnabled` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`record_status` enum('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);

CREATE TABLE `staff_invites` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`locationId` varchar(36),
	`email` varchar(320),
	`normalizedPhone` varchar(32),
	`membership_role` enum('OWNER','MANAGER','RECEPTIONIST','STAFF') NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`invite_status` enum('PENDING','ACCEPTED','REVOKED','EXPIRED') NOT NULL DEFAULT 'PENDING',
	`expiresAt` timestamp NOT NULL,
	`invitedByUserId` int NOT NULL,
	`acceptedByUserId` int,
	`acceptedAt` timestamp,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_invites_token_hash_uq` UNIQUE(`tokenHash`)
);

CREATE TABLE `staff_locations` (
	`staffProfileId` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staff_locations_staffProfileId_locationId_pk` PRIMARY KEY(`staffProfileId`,`locationId`)
);

CREATE TABLE `staff_profiles` (
	`id` varchar(36) NOT NULL,
	`membershipId` varchar(36) NOT NULL,
	`publicDisplayName` varchar(160) NOT NULL,
	`publicBio` text,
	`color` varchar(16) NOT NULL DEFAULT '#17826A',
	`jobTitle` varchar(160),
	`specialty` varchar(255),
	`experienceYears` int,
	`avatarKey` varchar(512),
	`avatarAltKa` varchar(255),
	`phoneVisible` boolean NOT NULL DEFAULT false,
	`onlineBookingVisible` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`employmentStartDate` date,
	`employmentEndDate` date,
	`commission_type` enum('PERCENTAGE','FIXED'),
	`defaultCommissionValueTetri` int,
	`record_status` enum('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_profiles_membership_uq` UNIQUE(`membershipId`)
);

CREATE TABLE `staff_services` (
	`staffProfileId` varchar(36) NOT NULL,
	`serviceId` varchar(36) NOT NULL,
	`canPerform` boolean NOT NULL DEFAULT true,
	`durationOverrideMinutes` int,
	`priceOverrideTetri` int,
	`commission_type` enum('PERCENTAGE','FIXED'),
	`commissionValueTetri` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_services_staffProfileId_serviceId_pk` PRIMARY KEY(`staffProfileId`,`serviceId`)
);

CREATE TABLE `time_off_requests` (
	`id` varchar(36) NOT NULL,
	`staffProfileId` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`reason` varchar(255),
	`time_off_request_status` enum('PENDING','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `time_off_requests_id` PRIMARY KEY(`id`)
);

CREATE TABLE `tips` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`appointmentId` varchar(36),
	`staffProfileId` varchar(36) NOT NULL,
	`amountTetri` int NOT NULL,
	`payment_method` enum('CASH','CARD_TERMINAL','BANK_TRANSFER','ONLINE','OTHER') NOT NULL,
	`collectedByUserId` int NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tips_id` PRIMARY KEY(`id`)
);

CREATE TABLE `trial_access_events` (
	`id` varchar(36) NOT NULL,
	`trialRequestId` varchar(36) NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`actorUserId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trial_access_events_id` PRIMARY KEY(`id`)
);

CREATE TABLE `trial_access_requests` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`requestedSalonName` varchar(160) NOT NULL,
	`requestedSalonSlug` varchar(96) NOT NULL,
	`trial_access_status` enum('PENDING','APPROVED','REJECTED','EXPIRED','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`reviewNoteKa` varchar(500),
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`startsAt` timestamp,
	`expiresAt` timestamp,
	`organizationId` varchar(36),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trial_access_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `trial_requests_user_uq` UNIQUE(`userId`),
	CONSTRAINT `trial_requests_org_uq` UNIQUE(`organizationId`)
);

CREATE TABLE `user_daily_close_checklists` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`businessDate` date NOT NULL,
	`completedKeys` json NOT NULL,
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_daily_close_checklists_id` PRIMARY KEY(`id`),
	CONSTRAINT `daily_close_user_org_loc_date_uq` UNIQUE(`userId`,`organizationId`,`locationId`,`businessDate`)
);

CREATE TABLE `user_guided_tour_progress` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`tourKey` varchar(64) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`currentStep` int NOT NULL DEFAULT 0,
	`completed` boolean NOT NULL DEFAULT false,
	`autoShowDisabled` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_guided_tour_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `guided_tour_progress_user_org_key_uq` UNIQUE(`userId`,`organizationId`,`tourKey`)
);

CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`normalizedEmail` varchar(320),
	`normalizedPhone` varchar(32),
	`passwordHash` varchar(255),
	`avatarKey` varchar(512),
	`locale` varchar(16) NOT NULL DEFAULT 'ka-GE',
	`loginMethod` varchar(64),
	`platform_role` enum('user','admin') NOT NULL DEFAULT 'user',
	`account_status` enum('ACTIVE','DISABLED') NOT NULL DEFAULT 'ACTIVE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`),
	CONSTRAINT `users_normalized_email_uq` UNIQUE(`normalizedEmail`),
	CONSTRAINT `users_normalized_phone_uq` UNIQUE(`normalizedPhone`)
);

CREATE TABLE `verification_codes` (
	`id` varchar(36) NOT NULL,
	`destination` varchar(320) NOT NULL,
	`verification_purpose` enum('PUBLIC_BOOKING','EMAIL_VERIFICATION','PHONE_VERIFICATION','PASSWORD_RESET') NOT NULL,
	`codeHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`consumedAt` timestamp,
	`attemptCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verification_codes_id` PRIMARY KEY(`id`)
);

CREATE TABLE `waitlist_entries` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`clientId` varchar(36) NOT NULL,
	`serviceId` varchar(36) NOT NULL,
	`staffProfileId` varchar(36),
	`requestedDate` date NOT NULL,
	`preferredStartLocalTime` time,
	`customerNote` text,
	`waitlist_status` enum('PENDING','CONTACTED','FULFILLED','CANCELLED','EXPIRED') NOT NULL DEFAULT 'PENDING',
	`idempotencyKey` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `waitlist_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `waitlist_entries_idempotency_uq` UNIQUE(`idempotencyKey`)
);

CREATE TABLE `working_hour_rules` (
	`id` varchar(36) NOT NULL,
	`staffProfileId` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`weekday` int NOT NULL,
	`startLocalTime` time NOT NULL,
	`endLocalTime` time NOT NULL,
	`effectiveFrom` date,
	`effectiveUntil` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `working_hour_rules_id` PRIMARY KEY(`id`)
);

CREATE TABLE `workspace_saved_views` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`route` varchar(96) NOT NULL,
	`name` varchar(80) NOT NULL,
	`filterPayload` json NOT NULL,
	`schemaVersion` int NOT NULL DEFAULT 1,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspace_saved_views_id` PRIMARY KEY(`id`),
	CONSTRAINT `saved_view_user_org_route_name_uq` UNIQUE(`userId`,`organizationId`,`route`,`name`)
);

ALTER TABLE `appointment_services` ADD CONSTRAINT `appointment_services_appointmentId_appointments_id_fk` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `appointment_services` ADD CONSTRAINT `appointment_services_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `appointment_services` ADD CONSTRAINT `appointment_services_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `appointment_status_history` ADD CONSTRAINT `appointment_status_history_appointmentId_appointments_id_fk` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `appointment_status_history` ADD CONSTRAINT `appointment_status_history_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_cancelledByUserId_users_id_fk` FOREIGN KEY (`cancelledByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `attendance_entries` ADD CONSTRAINT `attendance_entries_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `attendance_entries` ADD CONSTRAINT `attendance_entries_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `attendance_entries` ADD CONSTRAINT `attendance_entries_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `attendance_entries` ADD CONSTRAINT `attendance_entries_recordedByUserId_users_id_fk` FOREIGN KEY (`recordedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `billing_configurations` ADD CONSTRAINT `billing_configurations_updatedByUserId_users_id_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `billing_payment_events` ADD CONSTRAINT `sf_84ba96272261807eddbd` FOREIGN KEY (`billingPaymentSubmissionId`) REFERENCES `billing_payment_submissions`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `billing_payment_events` ADD CONSTRAINT `billing_payment_events_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `billing_payment_submissions` ADD CONSTRAINT `billing_payment_submissions_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `billing_payment_submissions` ADD CONSTRAINT `billing_payment_submissions_submittedByUserId_users_id_fk` FOREIGN KEY (`submittedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `billing_payment_submissions` ADD CONSTRAINT `billing_payment_submissions_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `client_consents` ADD CONSTRAINT `client_consents_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `client_media_items` ADD CONSTRAINT `client_media_items_setId_client_media_sets_id_fk` FOREIGN KEY (`setId`) REFERENCES `client_media_sets`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `client_media_sets` ADD CONSTRAINT `client_media_sets_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `client_media_sets` ADD CONSTRAINT `client_media_sets_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `client_media_sets` ADD CONSTRAINT `client_media_sets_appointmentId_appointments_id_fk` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `client_media_sets` ADD CONSTRAINT `client_media_sets_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `client_media_sets` ADD CONSTRAINT `client_media_sets_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `client_merges` ADD CONSTRAINT `client_merges_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `client_merges` ADD CONSTRAINT `client_merges_sourceClientId_clients_id_fk` FOREIGN KEY (`sourceClientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `client_merges` ADD CONSTRAINT `client_merges_targetClientId_clients_id_fk` FOREIGN KEY (`targetClientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `client_merges` ADD CONSTRAINT `client_merges_mergedByUserId_users_id_fk` FOREIGN KEY (`mergedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `clients` ADD CONSTRAINT `clients_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `clients` ADD CONSTRAINT `clients_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `commission_entries` ADD CONSTRAINT `commission_entries_appointmentId_appointments_id_fk` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `commission_entries` ADD CONSTRAINT `sf_d5e49531fadf8512fd7f` FOREIGN KEY (`appointmentServiceId`) REFERENCES `appointment_services`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `commission_entries` ADD CONSTRAINT `commission_entries_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `commission_entries` ADD CONSTRAINT `commission_entries_ruleId_commission_rules_id_fk` FOREIGN KEY (`ruleId`) REFERENCES `commission_rules`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `commission_entries` ADD CONSTRAINT `commission_entries_adjustedByUserId_users_id_fk` FOREIGN KEY (`adjustedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `commission_rules` ADD CONSTRAINT `commission_rules_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `commission_rules` ADD CONSTRAINT `commission_rules_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `commission_rules` ADD CONSTRAINT `commission_rules_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `commission_rules` ADD CONSTRAINT `commission_rules_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `customer_feedback` ADD CONSTRAINT `customer_feedback_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `customer_feedback` ADD CONSTRAINT `customer_feedback_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `customer_feedback` ADD CONSTRAINT `customer_feedback_appointmentId_appointments_id_fk` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `customer_feedback` ADD CONSTRAINT `customer_feedback_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `customer_feedback` ADD CONSTRAINT `customer_feedback_moderatedByUserId_users_id_fk` FOREIGN KEY (`moderatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `customer_feedback` ADD CONSTRAINT `customer_feedback_platformReviewRequestedByUserId_users_id_fk` FOREIGN KEY (`platformReviewRequestedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `customer_feedback_events` ADD CONSTRAINT `customer_feedback_events_feedbackId_customer_feedback_id_fk` FOREIGN KEY (`feedbackId`) REFERENCES `customer_feedback`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `customer_feedback_events` ADD CONSTRAINT `customer_feedback_events_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `dashboard_user_preferences` ADD CONSTRAINT `dashboard_user_preferences_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `dashboard_user_preferences` ADD CONSTRAINT `dashboard_user_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `inventory_movements` ADD CONSTRAINT `inventory_movements_productId_retail_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `retail_products`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `inventory_movements` ADD CONSTRAINT `inventory_movements_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `inventory_movements` ADD CONSTRAINT `inventory_movements_saleId_retail_sales_id_fk` FOREIGN KEY (`saleId`) REFERENCES `retail_sales`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `inventory_movements` ADD CONSTRAINT `inventory_movements_recordedByUserId_users_id_fk` FOREIGN KEY (`recordedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `inventory_stocks` ADD CONSTRAINT `inventory_stocks_productId_retail_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `retail_products`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `inventory_stocks` ADD CONSTRAINT `inventory_stocks_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `location_feed_posts` ADD CONSTRAINT `location_feed_posts_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `location_feed_posts` ADD CONSTRAINT `location_feed_posts_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `location_feed_posts` ADD CONSTRAINT `location_feed_posts_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `location_marketplace_profiles` ADD CONSTRAINT `location_marketplace_profiles_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `location_marketplace_profiles` ADD CONSTRAINT `location_marketplace_profiles_approvedByUserId_users_id_fk` FOREIGN KEY (`approvedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `location_opening_hours` ADD CONSTRAINT `location_opening_hours_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `locations` ADD CONSTRAINT `locations_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `marketplace_listing_events` ADD CONSTRAINT `marketplace_listing_events_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `marketplace_listing_events` ADD CONSTRAINT `marketplace_listing_events_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `marketplace_location_categories` ADD CONSTRAINT `marketplace_location_categories_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `marketplace_location_categories` ADD CONSTRAINT `sf_ca9f82bace2f1b767ac5` FOREIGN KEY (`categoryId`) REFERENCES `marketplace_categories`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `marketplace_location_category_services` ADD CONSTRAINT `sf_e16bdd689eb94f005e83` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `marketplace_location_category_services` ADD CONSTRAINT `sf_f6373827d138064a873f` FOREIGN KEY (`categoryId`) REFERENCES `marketplace_categories`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `marketplace_location_category_services` ADD CONSTRAINT `marketplace_location_category_services_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `marketplace_promotions` ADD CONSTRAINT `marketplace_promotions_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `marketplace_promotions` ADD CONSTRAINT `marketplace_promotions_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `marketplace_promotions` ADD CONSTRAINT `marketplace_promotions_approvedByUserId_users_id_fk` FOREIGN KEY (`approvedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `notification_jobs` ADD CONSTRAINT `notification_jobs_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `notification_jobs` ADD CONSTRAINT `notification_jobs_appointmentId_appointments_id_fk` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `notification_jobs` ADD CONSTRAINT `notification_jobs_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `organization_access_grants` ADD CONSTRAINT `organization_access_grants_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `organization_access_grants` ADD CONSTRAINT `sf_09c5ecf1d25a436284ce` FOREIGN KEY (`billingPaymentSubmissionId`) REFERENCES `billing_payment_submissions`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `organization_access_grants` ADD CONSTRAINT `organization_access_grants_grantedByUserId_users_id_fk` FOREIGN KEY (`grantedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `organization_memberships` ADD CONSTRAINT `organization_memberships_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `organization_memberships` ADD CONSTRAINT `organization_memberships_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `organization_memberships` ADD CONSTRAINT `organization_memberships_invitedByUserId_users_id_fk` FOREIGN KEY (`invitedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `payments` ADD CONSTRAINT `payments_appointmentId_appointments_id_fk` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `payments` ADD CONSTRAINT `payments_collectedByUserId_users_id_fk` FOREIGN KEY (`collectedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `retail_products` ADD CONSTRAINT `retail_products_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `retail_sale_lines` ADD CONSTRAINT `retail_sale_lines_saleId_retail_sales_id_fk` FOREIGN KEY (`saleId`) REFERENCES `retail_sales`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `retail_sale_lines` ADD CONSTRAINT `retail_sale_lines_productId_retail_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `retail_products`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `retail_sales` ADD CONSTRAINT `retail_sales_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `retail_sales` ADD CONSTRAINT `retail_sales_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `retail_sales` ADD CONSTRAINT `retail_sales_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `retail_sales` ADD CONSTRAINT `retail_sales_collectedByUserId_users_id_fk` FOREIGN KEY (`collectedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `schedule_exceptions` ADD CONSTRAINT `schedule_exceptions_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `schedule_exceptions` ADD CONSTRAINT `schedule_exceptions_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `schedule_exceptions` ADD CONSTRAINT `schedule_exceptions_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `schedule_exceptions` ADD CONSTRAINT `schedule_exceptions_approvedByUserId_users_id_fk` FOREIGN KEY (`approvedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `schedule_locks` ADD CONSTRAINT `schedule_locks_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `service_categories` ADD CONSTRAINT `service_categories_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `service_categories` ADD CONSTRAINT `service_categories_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `services` ADD CONSTRAINT `services_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `services` ADD CONSTRAINT `services_categoryId_service_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `service_categories`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `staff_invites` ADD CONSTRAINT `staff_invites_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `staff_invites` ADD CONSTRAINT `staff_invites_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `staff_invites` ADD CONSTRAINT `staff_invites_invitedByUserId_users_id_fk` FOREIGN KEY (`invitedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `staff_invites` ADD CONSTRAINT `staff_invites_acceptedByUserId_users_id_fk` FOREIGN KEY (`acceptedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `staff_locations` ADD CONSTRAINT `staff_locations_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `staff_locations` ADD CONSTRAINT `staff_locations_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `staff_profiles` ADD CONSTRAINT `staff_profiles_membershipId_organization_memberships_id_fk` FOREIGN KEY (`membershipId`) REFERENCES `organization_memberships`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `staff_services` ADD CONSTRAINT `staff_services_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `staff_services` ADD CONSTRAINT `staff_services_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `time_off_requests` ADD CONSTRAINT `time_off_requests_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `time_off_requests` ADD CONSTRAINT `time_off_requests_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `time_off_requests` ADD CONSTRAINT `time_off_requests_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `tips` ADD CONSTRAINT `tips_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `tips` ADD CONSTRAINT `tips_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `tips` ADD CONSTRAINT `tips_appointmentId_appointments_id_fk` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `tips` ADD CONSTRAINT `tips_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `tips` ADD CONSTRAINT `tips_collectedByUserId_users_id_fk` FOREIGN KEY (`collectedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `trial_access_events` ADD CONSTRAINT `trial_access_events_trialRequestId_trial_access_requests_id_fk` FOREIGN KEY (`trialRequestId`) REFERENCES `trial_access_requests`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `trial_access_events` ADD CONSTRAINT `trial_access_events_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `trial_access_requests` ADD CONSTRAINT `trial_access_requests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `trial_access_requests` ADD CONSTRAINT `trial_access_requests_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `trial_access_requests` ADD CONSTRAINT `trial_access_requests_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `user_daily_close_checklists` ADD CONSTRAINT `user_daily_close_checklists_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `user_daily_close_checklists` ADD CONSTRAINT `user_daily_close_checklists_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `user_daily_close_checklists` ADD CONSTRAINT `user_daily_close_checklists_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `user_guided_tour_progress` ADD CONSTRAINT `user_guided_tour_progress_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `user_guided_tour_progress` ADD CONSTRAINT `user_guided_tour_progress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `waitlist_entries` ADD CONSTRAINT `waitlist_entries_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `waitlist_entries` ADD CONSTRAINT `waitlist_entries_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `waitlist_entries` ADD CONSTRAINT `waitlist_entries_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `waitlist_entries` ADD CONSTRAINT `waitlist_entries_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `waitlist_entries` ADD CONSTRAINT `waitlist_entries_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `working_hour_rules` ADD CONSTRAINT `working_hour_rules_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `working_hour_rules` ADD CONSTRAINT `working_hour_rules_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `workspace_saved_views` ADD CONSTRAINT `workspace_saved_views_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `workspace_saved_views` ADD CONSTRAINT `workspace_saved_views_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
CREATE INDEX `appointment_services_appointment_idx` ON `appointment_services` (`appointmentId`,`sortOrder`);
CREATE INDEX `appointment_status_history_appointment_idx` ON `appointment_status_history` (`appointmentId`,`createdAt`);
CREATE INDEX `appointments_staff_time_status_idx` ON `appointments` (`staffProfileId`,`startsAt`,`endsAt`,`appointment_status`);
CREATE INDEX `appointments_org_location_start_idx` ON `appointments` (`organizationId`,`locationId`,`startsAt`);
CREATE INDEX `appointments_client_start_idx` ON `appointments` (`clientId`,`startsAt`);
CREATE INDEX `attendance_org_location_clockin_idx` ON `attendance_entries` (`organizationId`,`locationId`,`clockInAt`);
CREATE INDEX `attendance_staff_clockin_idx` ON `attendance_entries` (`staffProfileId`,`clockInAt`);
CREATE INDEX `audit_logs_org_entity_created_idx` ON `audit_logs` (`organizationId`,`entityType`,`createdAt`);
CREATE INDEX `bill_evt_sub_created_idx` ON `billing_payment_events` (`billingPaymentSubmissionId`,`createdAt`);
CREATE INDEX `bill_sub_org_status_idx` ON `billing_payment_submissions` (`organizationId`,`billing_submission_status`);
CREATE INDEX `bill_sub_status_created_idx` ON `billing_payment_submissions` (`billing_submission_status`,`createdAt`);
CREATE INDEX `client_consents_client_type_idx` ON `client_consents` (`clientId`,`client_consent_type`);
CREATE INDEX `client_media_items_set_idx` ON `client_media_items` (`setId`,`client_media_stage`);
CREATE INDEX `client_media_sets_org_client_created_idx` ON `client_media_sets` (`organizationId`,`clientId`,`createdAt`);
CREATE INDEX `client_media_sets_appointment_idx` ON `client_media_sets` (`appointmentId`);
CREATE INDEX `client_media_sets_public_location_idx` ON `client_media_sets` (`publicVisible`,`locationId`,`createdAt`);
CREATE INDEX `client_merges_org_created_idx` ON `client_merges` (`organizationId`,`createdAt`);
CREATE INDEX `clients_org_email_idx` ON `clients` (`organizationId`,`normalizedEmail`);
CREATE INDEX `clients_org_name_idx` ON `clients` (`organizationId`,`lastName`,`firstName`);
CREATE INDEX `commission_entries_staff_created_idx` ON `commission_entries` (`staffProfileId`,`createdAt`);
CREATE INDEX `commission_rules_scope_idx` ON `commission_rules` (`organizationId`,`staffProfileId`,`serviceId`,`record_status`);
CREATE INDEX `customer_feedback_public_location_idx` ON `customer_feedback` (`locationId`,`customer_feedback_status`,`submittedAt`);
CREATE INDEX `customer_feedback_org_status_idx` ON `customer_feedback` (`organizationId`,`customer_feedback_status`,`submittedAt`);
CREATE INDEX `customer_feedback_platform_queue_idx` ON `customer_feedback` (`platformReviewOpen`,`platformReviewRequestedAt`);
CREATE INDEX `customer_feedback_events_feedback_created_idx` ON `customer_feedback_events` (`feedbackId`,`createdAt`);
CREATE INDEX `expenses_location_date_idx` ON `expenses` (`locationId`,`expenseDate`,`record_status`);
CREATE INDEX `inventory_movements_product_location_created_idx` ON `inventory_movements` (`productId`,`locationId`,`createdAt`);
CREATE INDEX `inventory_movements_sale_idx` ON `inventory_movements` (`saleId`);
CREATE INDEX `inventory_stocks_location_quantity_idx` ON `inventory_stocks` (`locationId`,`currentQuantity`);
CREATE INDEX `location_feed_posts_public_idx` ON `location_feed_posts` (`locationId`,`publicVisible`,`publishedAt`,`sortOrder`);
CREATE INDEX `location_feed_posts_org_created_idx` ON `location_feed_posts` (`organizationId`,`createdAt`);
CREATE INDEX `marketplace_profiles_status_idx` ON `location_marketplace_profiles` (`marketplace_listing_status`);
CREATE INDEX `marketplace_profiles_map_idx` ON `location_marketplace_profiles` (`mapVisibility`,`marketplace_listing_status`);
CREATE INDEX `opening_hours_location_weekday_idx` ON `location_opening_hours` (`locationId`,`weekday`);
CREATE INDEX `locations_organization_idx` ON `locations` (`organizationId`);
CREATE INDEX `marketplace_categories_active_sort_idx` ON `marketplace_categories` (`isActive`,`sortOrder`);
CREATE INDEX `marketplace_events_location_created_idx` ON `marketplace_listing_events` (`locationId`,`createdAt`);
CREATE INDEX `marketplace_location_categories_category_idx` ON `marketplace_location_categories` (`categoryId`);
CREATE INDEX `marketplace_category_services_service_idx` ON `marketplace_location_category_services` (`serviceId`);
CREATE INDEX `marketplace_promotions_location_status_idx` ON `marketplace_promotions` (`locationId`,`marketplace_promotion_status`);
CREATE INDEX `marketplace_promotions_active_range_idx` ON `marketplace_promotions` (`marketplace_promotion_status`,`startsAt`,`endsAt`);
CREATE INDEX `notification_jobs_due_idx` ON `notification_jobs` (`notification_status`,`scheduledAt`);
CREATE INDEX `access_grant_org_end_idx` ON `organization_access_grants` (`organizationId`,`access_grant_status`,`endsAt`);
CREATE INDEX `access_grant_sub_idx` ON `organization_access_grants` (`billingPaymentSubmissionId`);
CREATE INDEX `memberships_user_status_idx` ON `organization_memberships` (`userId`,`membership_status`);
CREATE INDEX `payments_appointment_status_idx` ON `payments` (`appointmentId`,`payment_status`);
CREATE INDEX `public_conversion_events_name_time_idx` ON `public_conversion_events` (`eventName`,`occurredAt`);
CREATE INDEX `public_conversion_events_route_time_idx` ON `public_conversion_events` (`routePath`,`occurredAt`);
CREATE INDEX `retail_products_org_status_idx` ON `retail_products` (`organizationId`,`record_status`);
CREATE INDEX `retail_sale_lines_sale_idx` ON `retail_sale_lines` (`saleId`);
CREATE INDEX `retail_sales_org_location_created_idx` ON `retail_sales` (`organizationId`,`locationId`,`createdAt`);
CREATE INDEX `retail_sales_client_created_idx` ON `retail_sales` (`clientId`,`createdAt`);
CREATE INDEX `schedule_exceptions_staff_time_idx` ON `schedule_exceptions` (`staffProfileId`,`startsAt`,`endsAt`);
CREATE INDEX `schedule_exceptions_location_time_idx` ON `schedule_exceptions` (`locationId`,`startsAt`,`endsAt`);
CREATE INDEX `service_categories_org_status_idx` ON `service_categories` (`organizationId`,`record_status`);
CREATE INDEX `services_org_status_idx` ON `services` (`organizationId`,`record_status`);
CREATE INDEX `services_category_idx` ON `services` (`categoryId`);
CREATE INDEX `staff_invites_org_status_idx` ON `staff_invites` (`organizationId`,`invite_status`);
CREATE INDEX `staff_profiles_booking_idx` ON `staff_profiles` (`onlineBookingVisible`,`record_status`);
CREATE INDEX `time_off_staff_status_idx` ON `time_off_requests` (`staffProfileId`,`time_off_request_status`,`startsAt`);
CREATE INDEX `tips_org_location_created_idx` ON `tips` (`organizationId`,`locationId`,`createdAt`);
CREATE INDEX `tips_staff_created_idx` ON `tips` (`staffProfileId`,`createdAt`);
CREATE INDEX `tips_appointment_idx` ON `tips` (`appointmentId`);
CREATE INDEX `trial_events_request_created_idx` ON `trial_access_events` (`trialRequestId`,`createdAt`);
CREATE INDEX `trial_requests_status_created_idx` ON `trial_access_requests` (`trial_access_status`,`createdAt`);
CREATE INDEX `trial_requests_expiry_idx` ON `trial_access_requests` (`expiresAt`);
CREATE INDEX `daily_close_org_loc_date_idx` ON `user_daily_close_checklists` (`organizationId`,`locationId`,`businessDate`);
CREATE INDEX `guided_tour_progress_organization_idx` ON `user_guided_tour_progress` (`organizationId`);
CREATE INDEX `verification_codes_destination_purpose_idx` ON `verification_codes` (`destination`,`verification_purpose`,`expiresAt`);
CREATE INDEX `waitlist_entries_location_date_status_idx` ON `waitlist_entries` (`locationId`,`requestedDate`,`waitlist_status`);
CREATE INDEX `waitlist_entries_client_status_idx` ON `waitlist_entries` (`clientId`,`waitlist_status`);
CREATE INDEX `working_hours_staff_location_weekday_idx` ON `working_hour_rules` (`staffProfileId`,`locationId`,`weekday`);
CREATE INDEX `saved_view_user_org_route_idx` ON `workspace_saved_views` (`userId`,`organizationId`,`route`);
