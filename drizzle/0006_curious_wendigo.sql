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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE `locations` ADD `coverImageAltKa` varchar(255);--> statement-breakpoint
ALTER TABLE `staff_profiles` ADD `avatarAltKa` varchar(255);--> statement-breakpoint
ALTER TABLE `client_media_items` ADD CONSTRAINT `client_media_items_setId_client_media_sets_id_fk` FOREIGN KEY (`setId`) REFERENCES `client_media_sets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_media_sets` ADD CONSTRAINT `client_media_sets_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_media_sets` ADD CONSTRAINT `client_media_sets_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_media_sets` ADD CONSTRAINT `client_media_sets_appointmentId_appointments_id_fk` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_media_sets` ADD CONSTRAINT `client_media_sets_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_media_sets` ADD CONSTRAINT `client_media_sets_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `location_feed_posts` ADD CONSTRAINT `location_feed_posts_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `location_feed_posts` ADD CONSTRAINT `location_feed_posts_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `location_feed_posts` ADD CONSTRAINT `location_feed_posts_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `client_media_items_set_idx` ON `client_media_items` (`setId`,`client_media_stage`);--> statement-breakpoint
CREATE INDEX `client_media_sets_org_client_created_idx` ON `client_media_sets` (`organizationId`,`clientId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `client_media_sets_appointment_idx` ON `client_media_sets` (`appointmentId`);--> statement-breakpoint
CREATE INDEX `client_media_sets_public_location_idx` ON `client_media_sets` (`publicVisible`,`locationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `location_feed_posts_public_idx` ON `location_feed_posts` (`locationId`,`publicVisible`,`publishedAt`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `location_feed_posts_org_created_idx` ON `location_feed_posts` (`organizationId`,`createdAt`);