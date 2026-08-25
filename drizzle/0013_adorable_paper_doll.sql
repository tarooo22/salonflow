CREATE TABLE `dashboard_user_preferences` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`metricKeys` json,
	`dismissedNotificationKeys` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dashboard_user_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `dash_prefs_user_org_uq` UNIQUE(`userId`,`organizationId`)
);
--> statement-breakpoint
CREATE TABLE `user_daily_close_checklists` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`businessDate` date NOT NULL,
	`completedKeys` json NOT NULL,
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_daily_close_checklists_id` PRIMARY KEY(`id`),
	CONSTRAINT `daily_close_user_org_loc_date_uq` UNIQUE(`userId`,`organizationId`,`locationId`,`businessDate`)
);
--> statement-breakpoint
CREATE TABLE `workspace_saved_views` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`route` varchar(96) NOT NULL,
	`name` varchar(80) NOT NULL,
	`filterPayload` json NOT NULL,
	`schemaVersion` int NOT NULL DEFAULT 1,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspace_saved_views_id` PRIMARY KEY(`id`),
	CONSTRAINT `saved_view_user_org_route_name_uq` UNIQUE(`userId`,`organizationId`,`route`,`name`)
);
--> statement-breakpoint
ALTER TABLE `dashboard_user_preferences` ADD CONSTRAINT `dash_prefs_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dashboard_user_preferences` ADD CONSTRAINT `dash_prefs_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_daily_close_checklists` ADD CONSTRAINT `daily_close_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_daily_close_checklists` ADD CONSTRAINT `daily_close_location_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_daily_close_checklists` ADD CONSTRAINT `daily_close_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspace_saved_views` ADD CONSTRAINT `saved_view_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspace_saved_views` ADD CONSTRAINT `saved_view_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `daily_close_org_loc_date_idx` ON `user_daily_close_checklists` (`organizationId`,`locationId`,`businessDate`);--> statement-breakpoint
CREATE INDEX `saved_view_user_org_route_idx` ON `workspace_saved_views` (`userId`,`organizationId`,`route`);
