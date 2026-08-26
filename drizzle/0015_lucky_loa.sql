CREATE TABLE `public_conversion_events` (
	`id` varchar(36) NOT NULL,
	`eventName` varchar(64) NOT NULL,
	`routePath` varchar(180) NOT NULL,
	`consentVersion` varchar(32) NOT NULL,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `public_conversion_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `public_conversion_events_name_time_idx` ON `public_conversion_events` (`eventName`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `public_conversion_events_route_time_idx` ON `public_conversion_events` (`routePath`,`occurredAt`);