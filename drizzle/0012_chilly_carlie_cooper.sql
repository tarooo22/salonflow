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
--> statement-breakpoint
CREATE TABLE `billing_payment_events` (
	`id` varchar(36) NOT NULL,
	`billingPaymentSubmissionId` varchar(36) NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`actorUserId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `billing_payment_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE `organizations` ADD `billingCode` varchar(24);--> statement-breakpoint
ALTER TABLE `organizations` ADD CONSTRAINT `organizations_billing_code_uq` UNIQUE(`billingCode`);--> statement-breakpoint
ALTER TABLE `billing_configurations` ADD CONSTRAINT `bcfg_upd_usr_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `billing_payment_events` ADD CONSTRAINT `bpe_sub_fk` FOREIGN KEY (`billingPaymentSubmissionId`) REFERENCES `billing_payment_submissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `billing_payment_events` ADD CONSTRAINT `bpe_actor_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `billing_payment_submissions` ADD CONSTRAINT `bps_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `billing_payment_submissions` ADD CONSTRAINT `bps_submit_fk` FOREIGN KEY (`submittedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `billing_payment_submissions` ADD CONSTRAINT `bps_review_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_access_grants` ADD CONSTRAINT `oag_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_access_grants` ADD CONSTRAINT `oag_sub_fk` FOREIGN KEY (`billingPaymentSubmissionId`) REFERENCES `billing_payment_submissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_access_grants` ADD CONSTRAINT `oag_grant_fk` FOREIGN KEY (`grantedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `bill_evt_sub_created_idx` ON `billing_payment_events` (`billingPaymentSubmissionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `bill_sub_org_status_idx` ON `billing_payment_submissions` (`organizationId`,`billing_submission_status`);--> statement-breakpoint
CREATE INDEX `bill_sub_status_created_idx` ON `billing_payment_submissions` (`billing_submission_status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `access_grant_org_end_idx` ON `organization_access_grants` (`organizationId`,`access_grant_status`,`endsAt`);--> statement-breakpoint
CREATE INDEX `access_grant_sub_idx` ON `organization_access_grants` (`billingPaymentSubmissionId`);
