CREATE TABLE `user_guided_tour_progress` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`tourKey` varchar(64) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`currentStep` int NOT NULL DEFAULT 0,
	`completed` boolean NOT NULL DEFAULT false,
	`autoShowDisabled` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_guided_tour_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `guided_tour_progress_user_org_key_uq` UNIQUE(`userId`,`organizationId`,`tourKey`)
);
--> statement-breakpoint
ALTER TABLE `user_guided_tour_progress` ADD CONSTRAINT `user_guided_tour_progress_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_guided_tour_progress` ADD CONSTRAINT `user_guided_tour_progress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `guided_tour_progress_organization_idx` ON `user_guided_tour_progress` (`organizationId`);