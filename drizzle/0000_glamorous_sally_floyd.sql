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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
	CONSTRAINT `commission_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(96) NOT NULL,
	`logoKey` varchar(512),
	`defaultTimezone` varchar(64) NOT NULL DEFAULT 'Asia/Tbilisi',
	`defaultCurrency` varchar(3) NOT NULL DEFAULT 'GEL',
	`contactPhone` varchar(32),
	`contactEmail` varchar(320),
	`record_status` enum('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` varchar(36) NOT NULL,
	`appointmentId` varchar(36) NOT NULL,
	`amountTetri` int NOT NULL,
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `schedule_locks` (
	`id` varchar(80) NOT NULL,
	`staffProfileId` varchar(36) NOT NULL,
	`localDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `schedule_locks_id` PRIMARY KEY(`id`),
	CONSTRAINT `schedule_locks_staff_date_uq` UNIQUE(`staffProfileId`,`localDate`)
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `staff_locations` (
	`staffProfileId` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staff_locations_staffProfileId_locationId_pk` PRIMARY KEY(`staffProfileId`,`locationId`)
);
--> statement-breakpoint
CREATE TABLE `staff_profiles` (
	`id` varchar(36) NOT NULL,
	`membershipId` varchar(36) NOT NULL,
	`publicDisplayName` varchar(160) NOT NULL,
	`publicBio` text,
	`color` varchar(16) NOT NULL DEFAULT '#17826A',
	`jobTitle` varchar(160),
	`specialty` varchar(255),
	`avatarKey` varchar(512),
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE `appointment_services` ADD CONSTRAINT `appointment_services_appointmentId_appointments_id_fk` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointment_services` ADD CONSTRAINT `appointment_services_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointment_services` ADD CONSTRAINT `appointment_services_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointment_status_history` ADD CONSTRAINT `appointment_status_history_appointmentId_appointments_id_fk` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointment_status_history` ADD CONSTRAINT `appointment_status_history_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_cancelledByUserId_users_id_fk` FOREIGN KEY (`cancelledByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_consents` ADD CONSTRAINT `client_consents_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_merges` ADD CONSTRAINT `client_merges_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_merges` ADD CONSTRAINT `client_merges_sourceClientId_clients_id_fk` FOREIGN KEY (`sourceClientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_merges` ADD CONSTRAINT `client_merges_targetClientId_clients_id_fk` FOREIGN KEY (`targetClientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_merges` ADD CONSTRAINT `client_merges_mergedByUserId_users_id_fk` FOREIGN KEY (`mergedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clients` ADD CONSTRAINT `clients_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clients` ADD CONSTRAINT `clients_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commission_entries` ADD CONSTRAINT `commission_entries_appointmentId_appointments_id_fk` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commission_entries` ADD CONSTRAINT `ce_app_svc_fk` FOREIGN KEY (`appointmentServiceId`) REFERENCES `appointment_services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commission_entries` ADD CONSTRAINT `commission_entries_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commission_entries` ADD CONSTRAINT `commission_entries_ruleId_commission_rules_id_fk` FOREIGN KEY (`ruleId`) REFERENCES `commission_rules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commission_entries` ADD CONSTRAINT `commission_entries_adjustedByUserId_users_id_fk` FOREIGN KEY (`adjustedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commission_rules` ADD CONSTRAINT `commission_rules_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commission_rules` ADD CONSTRAINT `commission_rules_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commission_rules` ADD CONSTRAINT `commission_rules_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commission_rules` ADD CONSTRAINT `commission_rules_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `location_opening_hours` ADD CONSTRAINT `location_opening_hours_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `locations` ADD CONSTRAINT `locations_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_jobs` ADD CONSTRAINT `notification_jobs_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_jobs` ADD CONSTRAINT `notification_jobs_appointmentId_appointments_id_fk` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_jobs` ADD CONSTRAINT `notification_jobs_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_memberships` ADD CONSTRAINT `organization_memberships_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_memberships` ADD CONSTRAINT `organization_memberships_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_memberships` ADD CONSTRAINT `organization_memberships_invitedByUserId_users_id_fk` FOREIGN KEY (`invitedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_appointmentId_appointments_id_fk` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_collectedByUserId_users_id_fk` FOREIGN KEY (`collectedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedule_exceptions` ADD CONSTRAINT `schedule_exceptions_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedule_exceptions` ADD CONSTRAINT `schedule_exceptions_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedule_exceptions` ADD CONSTRAINT `schedule_exceptions_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedule_exceptions` ADD CONSTRAINT `schedule_exceptions_approvedByUserId_users_id_fk` FOREIGN KEY (`approvedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedule_locks` ADD CONSTRAINT `schedule_locks_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_categories` ADD CONSTRAINT `service_categories_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_categories` ADD CONSTRAINT `service_categories_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `services` ADD CONSTRAINT `services_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `services` ADD CONSTRAINT `services_categoryId_service_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `service_categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_invites` ADD CONSTRAINT `staff_invites_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_invites` ADD CONSTRAINT `staff_invites_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_invites` ADD CONSTRAINT `staff_invites_invitedByUserId_users_id_fk` FOREIGN KEY (`invitedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_invites` ADD CONSTRAINT `staff_invites_acceptedByUserId_users_id_fk` FOREIGN KEY (`acceptedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_locations` ADD CONSTRAINT `staff_locations_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_locations` ADD CONSTRAINT `staff_locations_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_profiles` ADD CONSTRAINT `staff_profiles_membershipId_organization_memberships_id_fk` FOREIGN KEY (`membershipId`) REFERENCES `organization_memberships`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_services` ADD CONSTRAINT `staff_services_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_services` ADD CONSTRAINT `staff_services_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `time_off_requests` ADD CONSTRAINT `time_off_requests_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `time_off_requests` ADD CONSTRAINT `time_off_requests_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `time_off_requests` ADD CONSTRAINT `time_off_requests_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `working_hour_rules` ADD CONSTRAINT `working_hour_rules_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `working_hour_rules` ADD CONSTRAINT `working_hour_rules_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `appointment_services_appointment_idx` ON `appointment_services` (`appointmentId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `appointment_status_history_appointment_idx` ON `appointment_status_history` (`appointmentId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `appointments_staff_time_status_idx` ON `appointments` (`staffProfileId`,`startsAt`,`endsAt`,`appointment_status`);--> statement-breakpoint
CREATE INDEX `appointments_org_location_start_idx` ON `appointments` (`organizationId`,`locationId`,`startsAt`);--> statement-breakpoint
CREATE INDEX `appointments_client_start_idx` ON `appointments` (`clientId`,`startsAt`);--> statement-breakpoint
CREATE INDEX `audit_logs_org_entity_created_idx` ON `audit_logs` (`organizationId`,`entityType`,`createdAt`);--> statement-breakpoint
CREATE INDEX `client_consents_client_type_idx` ON `client_consents` (`clientId`,`client_consent_type`);--> statement-breakpoint
CREATE INDEX `client_merges_org_created_idx` ON `client_merges` (`organizationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `clients_org_email_idx` ON `clients` (`organizationId`,`normalizedEmail`);--> statement-breakpoint
CREATE INDEX `clients_org_name_idx` ON `clients` (`organizationId`,`lastName`,`firstName`);--> statement-breakpoint
CREATE INDEX `commission_entries_staff_created_idx` ON `commission_entries` (`staffProfileId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `commission_rules_scope_idx` ON `commission_rules` (`organizationId`,`staffProfileId`,`serviceId`,`record_status`);--> statement-breakpoint
CREATE INDEX `expenses_location_date_idx` ON `expenses` (`locationId`,`expenseDate`,`record_status`);--> statement-breakpoint
CREATE INDEX `opening_hours_location_weekday_idx` ON `location_opening_hours` (`locationId`,`weekday`);--> statement-breakpoint
CREATE INDEX `locations_organization_idx` ON `locations` (`organizationId`);--> statement-breakpoint
CREATE INDEX `notification_jobs_due_idx` ON `notification_jobs` (`notification_status`,`scheduledAt`);--> statement-breakpoint
CREATE INDEX `memberships_user_status_idx` ON `organization_memberships` (`userId`,`membership_status`);--> statement-breakpoint
CREATE INDEX `payments_appointment_status_idx` ON `payments` (`appointmentId`,`payment_status`);--> statement-breakpoint
CREATE INDEX `schedule_exceptions_staff_time_idx` ON `schedule_exceptions` (`staffProfileId`,`startsAt`,`endsAt`);--> statement-breakpoint
CREATE INDEX `schedule_exceptions_location_time_idx` ON `schedule_exceptions` (`locationId`,`startsAt`,`endsAt`);--> statement-breakpoint
CREATE INDEX `service_categories_org_status_idx` ON `service_categories` (`organizationId`,`record_status`);--> statement-breakpoint
CREATE INDEX `services_org_status_idx` ON `services` (`organizationId`,`record_status`);--> statement-breakpoint
CREATE INDEX `services_category_idx` ON `services` (`categoryId`);--> statement-breakpoint
CREATE INDEX `staff_invites_org_status_idx` ON `staff_invites` (`organizationId`,`invite_status`);--> statement-breakpoint
CREATE INDEX `staff_profiles_booking_idx` ON `staff_profiles` (`onlineBookingVisible`,`record_status`);--> statement-breakpoint
CREATE INDEX `time_off_staff_status_idx` ON `time_off_requests` (`staffProfileId`,`time_off_request_status`,`startsAt`);--> statement-breakpoint
CREATE INDEX `verification_codes_destination_purpose_idx` ON `verification_codes` (`destination`,`verification_purpose`,`expiresAt`);--> statement-breakpoint
CREATE INDEX `working_hours_staff_location_weekday_idx` ON `working_hour_rules` (`staffProfileId`,`locationId`,`weekday`);
