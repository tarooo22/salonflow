CREATE TABLE `location_marketplace_profiles` (
	`locationId` varchar(36) NOT NULL,
	`marketplace_listing_status` enum('DRAFT','SUBMITTED','APPROVED','HIDDEN','REJECTED') NOT NULL DEFAULT 'DRAFT',
	`areaLabelKa` varchar(160),
	`mapVisibility` boolean NOT NULL DEFAULT false,
	`geocodeConfirmedAt` timestamp,
	`ownerSubmittedAt` timestamp,
	`approvedAt` timestamp,
	`approvedByUserId` int,
	`reviewNoteKa` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `location_marketplace_profiles_locationId` PRIMARY KEY(`locationId`)
);
--> statement-breakpoint
CREATE TABLE `marketplace_categories` (
	`id` varchar(36) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`nameKa` varchar(120) NOT NULL,
	`nameEn` varchar(120),
	`nameRu` varchar(120),
	`iconKey` varchar(64) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplace_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `marketplace_categories_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `marketplace_listing_events` (
	`id` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`actorUserId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketplace_listing_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketplace_location_categories` (
	`locationId` varchar(36) NOT NULL,
	`categoryId` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketplace_location_categories_locationId_categoryId_pk` PRIMARY KEY(`locationId`,`categoryId`)
);
--> statement-breakpoint
CREATE TABLE `marketplace_location_category_services` (
	`locationId` varchar(36) NOT NULL,
	`categoryId` varchar(36) NOT NULL,
	`serviceId` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketplace_location_category_services_locationId_categoryId_serviceId_pk` PRIMARY KEY(`locationId`,`categoryId`,`serviceId`)
);
--> statement-breakpoint
CREATE TABLE `marketplace_promotions` (
	`id` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`marketplace_promotion_tier` enum('RECOMMENDED','VIP') NOT NULL,
	`marketplace_promotion_status` enum('SCHEDULED','ACTIVE','EXPIRED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`displayDisclosure` varchar(80) NOT NULL,
	`manualPriceTetri` int,
	`billingReference` varchar(160),
	`createdByUserId` int NOT NULL,
	`approvedByUserId` int,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplace_promotions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `location_marketplace_profiles` ADD CONSTRAINT `location_marketplace_profiles_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `location_marketplace_profiles` ADD CONSTRAINT `location_marketplace_profiles_approvedByUserId_users_id_fk` FOREIGN KEY (`approvedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplace_listing_events` ADD CONSTRAINT `marketplace_listing_events_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplace_listing_events` ADD CONSTRAINT `marketplace_listing_events_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplace_location_categories` ADD CONSTRAINT `mp_loc_cat_cat_fk` FOREIGN KEY (`categoryId`) REFERENCES `marketplace_categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplace_location_category_services` ADD CONSTRAINT `mp_lcs_loc_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplace_location_category_services` ADD CONSTRAINT `mp_lcs_cat_fk` FOREIGN KEY (`categoryId`) REFERENCES `marketplace_categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplace_location_category_services` ADD CONSTRAINT `mp_lcs_service_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplace_promotions` ADD CONSTRAINT `mp_promotions_loc_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplace_promotions` ADD CONSTRAINT `mp_promotions_creator_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplace_promotions` ADD CONSTRAINT `mp_promotions_approver_fk` FOREIGN KEY (`approvedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `marketplace_profiles_status_idx` ON `location_marketplace_profiles` (`marketplace_listing_status`);--> statement-breakpoint
CREATE INDEX `marketplace_profiles_map_idx` ON `location_marketplace_profiles` (`mapVisibility`,`marketplace_listing_status`);--> statement-breakpoint
CREATE INDEX `marketplace_categories_active_sort_idx` ON `marketplace_categories` (`isActive`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `marketplace_events_location_created_idx` ON `marketplace_listing_events` (`locationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `marketplace_location_categories_category_idx` ON `marketplace_location_categories` (`categoryId`);--> statement-breakpoint
CREATE INDEX `marketplace_category_services_service_idx` ON `marketplace_location_category_services` (`serviceId`);--> statement-breakpoint
CREATE INDEX `marketplace_promotions_location_status_idx` ON `marketplace_promotions` (`locationId`,`marketplace_promotion_status`);--> statement-breakpoint
CREATE INDEX `marketplace_promotions_active_range_idx` ON `marketplace_promotions` (`marketplace_promotion_status`,`startsAt`,`endsAt`);
--> statement-breakpoint
INSERT INTO `marketplace_categories` (`id`,`slug`,`nameKa`,`nameEn`,`nameRu`,`iconKey`,`sortOrder`,`isActive`) VALUES
  ('mp_cat_hair_001','hair','თმა','Hair','Волосы','scissors',0,true),
  ('mp_cat_nails_001','nails','ფრჩხილები','Nails','Ногти','sparkles',1,true),
  ('mp_cat_makeup_001','makeup','მაკიაჟი','Makeup','Макияж','brush',2,true),
  ('mp_cat_brows_001','brows-lashes','წარბები და წამწამები','Brows and lashes','Брови и ресницы','eye',3,true),
  ('mp_cat_cosmetology_001','cosmetology','კოსმეტოლოგია','Cosmetology','Косметология','flower-2',4,true),
  ('mp_cat_spa_001','massage-spa','მასაჟი და SPA','Massage and SPA','Массаж и SPA','sun',5,true),
  ('mp_cat_epilation_001','epilation','ეპილაცია','Epilation','Эпиляция','zap',6,true),
  ('mp_cat_other_001','other-services','სხვა სერვისები','Other services','Другие услуги','plus',7,true);
