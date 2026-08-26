ALTER TABLE `customer_feedback` ADD `platformReviewOpen` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `customer_feedback` ADD `platformReviewReason` varchar(64);--> statement-breakpoint
ALTER TABLE `customer_feedback` ADD `platformReviewNote` varchar(500);--> statement-breakpoint
ALTER TABLE `customer_feedback` ADD `platformReviewRequestedByUserId` int;--> statement-breakpoint
ALTER TABLE `customer_feedback` ADD `platformReviewRequestedAt` timestamp;--> statement-breakpoint
ALTER TABLE `customer_feedback` ADD CONSTRAINT `cf_platform_review_user_fk` FOREIGN KEY (`platformReviewRequestedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `customer_feedback_platform_queue_idx` ON `customer_feedback` (`platformReviewOpen`,`platformReviewRequestedAt`);
