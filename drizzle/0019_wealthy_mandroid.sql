CREATE TABLE `aesthetic_procedure_records` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`clientId` varchar(36) NOT NULL,
	`appointmentId` varchar(36),
	`staffProfileId` varchar(36),
	`performedAt` timestamp NOT NULL,
	`procedureName` varchar(160) NOT NULL,
	`productName` varchar(160),
	`batchNumber` varchar(80),
	`productExpiry` date,
	`doseHundredths` int,
	`dose_unit` enum('UNITS','ML','MG','OTHER'),
	`treatmentAreas` varchar(500),
	`notes` varchar(2000),
	`recordedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`voidedAt` timestamp,
	`voidedByUserId` int,
	`voidReason` varchar(300),
	CONSTRAINT `aesthetic_procedure_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dental_tooth_records` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`clientId` varchar(36) NOT NULL,
	`toothCode` varchar(2) NOT NULL,
	`surfaces` varchar(5),
	`tooth_condition` enum('HEALTHY','CARIES','FILLED','CROWN','ROOT_CANAL','IMPLANT','BRIDGE','MISSING','EXTRACTION_NEEDED','OTHER') NOT NULL,
	`note` varchar(1000),
	`appointmentId` varchar(36),
	`recordedByUserId` int NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dental_tooth_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `organizations` ADD `vertical` enum('SALON','AESTHETICS','DENTAL') DEFAULT 'SALON' NOT NULL;--> statement-breakpoint
ALTER TABLE `aesthetic_procedure_records` ADD CONSTRAINT `aesthetic_procedure_records_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aesthetic_procedure_records` ADD CONSTRAINT `aesthetic_procedure_records_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aesthetic_procedure_records` ADD CONSTRAINT `aesthetic_procedure_records_appointmentId_appointments_id_fk` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aesthetic_procedure_records` ADD CONSTRAINT `aesthetic_procedure_records_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aesthetic_procedure_records` ADD CONSTRAINT `aesthetic_procedure_records_recordedByUserId_users_id_fk` FOREIGN KEY (`recordedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aesthetic_procedure_records` ADD CONSTRAINT `aesthetic_procedure_records_voidedByUserId_users_id_fk` FOREIGN KEY (`voidedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dental_tooth_records` ADD CONSTRAINT `dental_tooth_records_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dental_tooth_records` ADD CONSTRAINT `dental_tooth_records_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dental_tooth_records` ADD CONSTRAINT `dental_tooth_records_appointmentId_appointments_id_fk` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dental_tooth_records` ADD CONSTRAINT `dental_tooth_records_recordedByUserId_users_id_fk` FOREIGN KEY (`recordedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `aesthetic_client_performed_idx` ON `aesthetic_procedure_records` (`organizationId`,`clientId`,`performedAt`);--> statement-breakpoint
CREATE INDEX `dental_tooth_client_tooth_idx` ON `dental_tooth_records` (`organizationId`,`clientId`,`toothCode`,`recordedAt`);