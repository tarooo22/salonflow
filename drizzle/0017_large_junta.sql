CREATE TABLE `organization_governance` (
	`organizationId` varchar(36) NOT NULL,
	`organization_governance_status` enum('ACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
	`publicVisible` boolean NOT NULL DEFAULT true,
	`controlNoteKa` varchar(500),
	`updatedByUserId` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organization_governance_organizationId` PRIMARY KEY(`organizationId`)
);
--> statement-breakpoint
CREATE TABLE `organization_governance_events` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`actorUserId` int NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organization_governance_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `organization_governance` ADD CONSTRAINT `org_gov_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_governance` ADD CONSTRAINT `org_gov_actor_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_governance_events` ADD CONSTRAINT `org_gov_evt_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_governance_events` ADD CONSTRAINT `org_gov_evt_actor_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `org_governance_events_org_created_idx` ON `organization_governance_events` (`organizationId`,`createdAt`);