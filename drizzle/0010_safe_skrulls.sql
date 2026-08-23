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
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_feedback_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_feedback_appointment_uq` UNIQUE(`appointmentId`)
);
--> statement-breakpoint
CREATE TABLE `customer_feedback_events` (
	`id` varchar(36) NOT NULL,
	`feedbackId` varchar(36) NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`actorUserId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_feedback_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `customer_feedback` ADD CONSTRAINT `cf_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_feedback` ADD CONSTRAINT `cf_loc_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_feedback` ADD CONSTRAINT `cf_appt_fk` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_feedback` ADD CONSTRAINT `cf_client_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_feedback` ADD CONSTRAINT `cf_mod_fk` FOREIGN KEY (`moderatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_feedback_events` ADD CONSTRAINT `cfe_fb_fk` FOREIGN KEY (`feedbackId`) REFERENCES `customer_feedback`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_feedback_events` ADD CONSTRAINT `cfe_actor_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `customer_feedback_public_location_idx` ON `customer_feedback` (`locationId`,`customer_feedback_status`,`submittedAt`);--> statement-breakpoint
CREATE INDEX `customer_feedback_org_status_idx` ON `customer_feedback` (`organizationId`,`customer_feedback_status`,`submittedAt`);--> statement-breakpoint
CREATE INDEX `customer_feedback_events_feedback_created_idx` ON `customer_feedback_events` (`feedbackId`,`createdAt`);
