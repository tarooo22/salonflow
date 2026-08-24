CREATE TABLE `trial_access_events` (
	`id` varchar(36) NOT NULL,
	`trialRequestId` varchar(36) NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`actorUserId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trial_access_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE `trial_access_events` ADD CONSTRAINT `trial_evt_req_fk` FOREIGN KEY (`trialRequestId`) REFERENCES `trial_access_requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trial_access_events` ADD CONSTRAINT `trial_evt_actor_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trial_access_requests` ADD CONSTRAINT `trial_req_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trial_access_requests` ADD CONSTRAINT `trial_req_reviewer_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trial_access_requests` ADD CONSTRAINT `trial_req_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `trial_events_request_created_idx` ON `trial_access_events` (`trialRequestId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `trial_requests_status_created_idx` ON `trial_access_requests` (`trial_access_status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `trial_requests_expiry_idx` ON `trial_access_requests` (`expiresAt`);
