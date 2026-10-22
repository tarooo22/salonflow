-- SalonFlow business verticals + clinical records: additive migration for Railway MySQL (drizzle 0019).
-- Safe to re-run: organizations.vertical is added only if missing, tables only if missing. Nothing is dropped or rewritten.
-- Existing organizations become SALON. Requires existing organizations, clients, appointments, staff_profiles and users tables.

SET @has_vertical := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'organizations' AND column_name = 'vertical');
SET @ddl := IF(@has_vertical = 0, "ALTER TABLE `organizations` ADD `vertical` enum('SALON','AESTHETICS','DENTAL') NOT NULL DEFAULT 'SALON'", 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `dental_tooth_records` (
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
	CONSTRAINT `dental_tooth_records_id` PRIMARY KEY(`id`),
	KEY `dental_tooth_client_tooth_idx` (`organizationId`,`clientId`,`toothCode`,`recordedAt`),
	CONSTRAINT `dental_tooth_records_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`),
	CONSTRAINT `dental_tooth_records_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`),
	CONSTRAINT `dental_tooth_records_appointmentId_appointments_id_fk` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`),
	CONSTRAINT `dental_tooth_records_recordedByUserId_users_id_fk` FOREIGN KEY (`recordedByUserId`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `aesthetic_procedure_records` (
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
	CONSTRAINT `aesthetic_procedure_records_id` PRIMARY KEY(`id`),
	KEY `aesthetic_client_performed_idx` (`organizationId`,`clientId`,`performedAt`),
	CONSTRAINT `aesthetic_procedure_records_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`),
	CONSTRAINT `aesthetic_procedure_records_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`),
	CONSTRAINT `aesthetic_procedure_records_appointmentId_appointments_id_fk` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`),
	CONSTRAINT `aesthetic_procedure_records_staffProfileId_staff_profiles_id_fk` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`),
	CONSTRAINT `aesthetic_procedure_records_recordedByUserId_users_id_fk` FOREIGN KEY (`recordedByUserId`) REFERENCES `users`(`id`),
	CONSTRAINT `aesthetic_procedure_records_voidedByUserId_users_id_fk` FOREIGN KEY (`voidedByUserId`) REFERENCES `users`(`id`)
);
