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
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE `attendance_entries` ADD CONSTRAINT `attendance_entries_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_entries` ADD CONSTRAINT `attendance_entries_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_entries` ADD CONSTRAINT `attendance_entries_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_entries` ADD CONSTRAINT `attendance_entries_recordedByUserId_users_id_fk` FOREIGN KEY (`recordedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tips` ADD CONSTRAINT `tips_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tips` ADD CONSTRAINT `tips_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tips` ADD CONSTRAINT `tips_appointmentId_appointments_id_fk` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tips` ADD CONSTRAINT `tips_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tips` ADD CONSTRAINT `tips_collectedByUserId_users_id_fk` FOREIGN KEY (`collectedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `attendance_org_location_clockin_idx` ON `attendance_entries` (`organizationId`,`locationId`,`clockInAt`);--> statement-breakpoint
CREATE INDEX `attendance_staff_clockin_idx` ON `attendance_entries` (`staffProfileId`,`clockInAt`);--> statement-breakpoint
CREATE INDEX `tips_org_location_created_idx` ON `tips` (`organizationId`,`locationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `tips_staff_created_idx` ON `tips` (`staffProfileId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `tips_appointment_idx` ON `tips` (`appointmentId`);