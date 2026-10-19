-- SalonFlow vacancies + products + dental/aesthetic categories: additive migration for Railway MySQL (drizzle 0018).
-- Safe to re-run: tables are created only if missing; category rows are skipped if their id/slug exists. Nothing is dropped or altered.
-- Requires existing organizations, locations, users and marketplace_categories tables.

CREATE TABLE IF NOT EXISTS `products` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`brand` varchar(120),
	`description` varchar(600),
	`priceTetri` int NOT NULL,
	`inStock` boolean NOT NULL DEFAULT true,
	`imageKey` varchar(512),
	`imageAltKa` varchar(255),
	`record_status` enum('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	KEY `products_location_status_idx` (`locationId`,`record_status`),
	KEY `products_organization_idx` (`organizationId`,`record_status`),
	CONSTRAINT `products_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`),
	CONSTRAINT `products_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`)
);

CREATE TABLE IF NOT EXISTS `vacancies` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`title` varchar(160) NOT NULL,
	`roleCategory` varchar(64),
	`vacancy_employment_type` enum('FULL_TIME','PART_TIME','CHAIR_RENTAL','FREELANCE') NOT NULL,
	`salaryFromTetri` int,
	`salaryToTetri` int,
	`description` text NOT NULL,
	`contactPhone` varchar(32),
	`contactEmail` varchar(320),
	`vacancy_status` enum('DRAFT','PUBLISHED','CLOSED') NOT NULL DEFAULT 'DRAFT',
	`publishedAt` timestamp,
	`expiresAt` timestamp,
	`vipUntil` timestamp,
	`vipSetByUserId` int,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vacancies_id` PRIMARY KEY(`id`),
	KEY `vacancies_public_idx` (`vacancy_status`,`expiresAt`),
	KEY `vacancies_location_idx` (`locationId`),
	KEY `vacancies_organization_idx` (`organizationId`,`vacancy_status`),
	CONSTRAINT `vacancies_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`),
	CONSTRAINT `vacancies_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`),
	CONSTRAINT `vacancies_vipSetByUserId_users_id_fk` FOREIGN KEY (`vipSetByUserId`) REFERENCES `users`(`id`),
	CONSTRAINT `vacancies_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`)
);

INSERT IGNORE INTO `marketplace_categories` (`id`,`slug`,`nameKa`,`nameEn`,`nameRu`,`iconKey`,`sortOrder`,`isActive`) VALUES
  ('mp_cat_dental_therapy_001','dental-therapy','თერაპიული სტომატოლოგია','Therapeutic dentistry','Терапевтическая стоматология','smile',8,true),
  ('mp_cat_dental_hygiene_001','dental-hygiene','პროფესიული წმენდა','Professional cleaning','Профессиональная чистка','droplets',9,true),
  ('mp_cat_dental_implants_001','dental-implants','იმპლანტაცია','Implants','Имплантация','anchor',10,true),
  ('mp_cat_dental_ortho_001','dental-orthodontics','ორთოდონტია','Orthodontics','Ортодонтия','ruler',11,true),
  ('mp_cat_dental_surgery_001','dental-surgery','ქირურგიული სტომატოლოგია','Dental surgery','Хирургическая стоматология','stethoscope',12,true),
  ('mp_cat_dental_kids_001','dental-kids','ბავშვთა სტომატოლოგია','Pediatric dentistry','Детская стоматология','baby',13,true),
  ('mp_cat_aesthetic_inject_001','aesthetic-injections','ინექციური ესთეტიკა','Injectable aesthetics','Инъекционная эстетика','syringe',14,true),
  ('mp_cat_aesthetic_laser_001','aesthetic-laser','ლაზერული პროცედურები','Laser procedures','Лазерные процедуры','scan-line',15,true);
