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
--> statement-breakpoint
ALTER TABLE `waitlist_entries` ADD CONSTRAINT `waitlist_entries_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `waitlist_entries` ADD CONSTRAINT `waitlist_entries_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `waitlist_entries` ADD CONSTRAINT `waitlist_entries_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `waitlist_entries` ADD CONSTRAINT `waitlist_entries_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `waitlist_entries` ADD CONSTRAINT `waitlist_entries_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `waitlist_entries_location_date_status_idx` ON `waitlist_entries` (`locationId`,`requestedDate`,`waitlist_status`);--> statement-breakpoint
CREATE INDEX `waitlist_entries_client_status_idx` ON `waitlist_entries` (`clientId`,`waitlist_status`);