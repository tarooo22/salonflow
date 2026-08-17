CREATE TABLE `inventory_movements` (
	`id` varchar(36) NOT NULL,
	`productId` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`saleId` varchar(36),
	`changeQuantity` int NOT NULL,
	`stock_movement_type` enum('OPENING','ADJUSTMENT','SALE','VOID') NOT NULL,
	`reason` varchar(255),
	`recordedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_stocks` (
	`id` varchar(36) NOT NULL,
	`productId` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`currentQuantity` int NOT NULL DEFAULT 0,
	`reorderLevel` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_stocks_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_stocks_product_location_uq` UNIQUE(`productId`,`locationId`)
);
--> statement-breakpoint
CREATE TABLE `retail_products` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`nameKa` varchar(160) NOT NULL,
	`sku` varchar(96),
	`retailPriceTetri` int NOT NULL,
	`costTetri` int,
	`record_status` enum('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `retail_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `retail_products_org_sku_uq` UNIQUE(`organizationId`,`sku`)
);
--> statement-breakpoint
CREATE TABLE `retail_sale_lines` (
	`id` varchar(36) NOT NULL,
	`saleId` varchar(36) NOT NULL,
	`productId` varchar(36),
	`productNameSnapshot` varchar(160) NOT NULL,
	`quantity` int NOT NULL,
	`unitPriceTetri` int NOT NULL,
	`lineTotalTetri` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `retail_sale_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `retail_sales` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`locationId` varchar(36) NOT NULL,
	`clientId` varchar(36),
	`subtotalTetri` int NOT NULL,
	`totalTetri` int NOT NULL,
	`payment_method` enum('CASH','CARD_TERMINAL','BANK_TRANSFER','ONLINE','OTHER') NOT NULL,
	`retail_sale_status` enum('COMPLETED','VOIDED') NOT NULL DEFAULT 'COMPLETED',
	`collectedByUserId` int NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `retail_sales_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD CONSTRAINT `inventory_movements_productId_retail_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `retail_products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD CONSTRAINT `inventory_movements_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD CONSTRAINT `inventory_movements_saleId_retail_sales_id_fk` FOREIGN KEY (`saleId`) REFERENCES `retail_sales`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD CONSTRAINT `inventory_movements_recordedByUserId_users_id_fk` FOREIGN KEY (`recordedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_stocks` ADD CONSTRAINT `inventory_stocks_productId_retail_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `retail_products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_stocks` ADD CONSTRAINT `inventory_stocks_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `retail_products` ADD CONSTRAINT `retail_products_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `retail_sale_lines` ADD CONSTRAINT `retail_sale_lines_saleId_retail_sales_id_fk` FOREIGN KEY (`saleId`) REFERENCES `retail_sales`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `retail_sale_lines` ADD CONSTRAINT `retail_sale_lines_productId_retail_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `retail_products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `retail_sales` ADD CONSTRAINT `retail_sales_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `retail_sales` ADD CONSTRAINT `retail_sales_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `retail_sales` ADD CONSTRAINT `retail_sales_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `retail_sales` ADD CONSTRAINT `retail_sales_collectedByUserId_users_id_fk` FOREIGN KEY (`collectedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `inventory_movements_product_location_created_idx` ON `inventory_movements` (`productId`,`locationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `inventory_movements_sale_idx` ON `inventory_movements` (`saleId`);--> statement-breakpoint
CREATE INDEX `inventory_stocks_location_quantity_idx` ON `inventory_stocks` (`locationId`,`currentQuantity`);--> statement-breakpoint
CREATE INDEX `retail_products_org_status_idx` ON `retail_products` (`organizationId`,`record_status`);--> statement-breakpoint
CREATE INDEX `retail_sale_lines_sale_idx` ON `retail_sale_lines` (`saleId`);--> statement-breakpoint
CREATE INDEX `retail_sales_org_location_created_idx` ON `retail_sales` (`organizationId`,`locationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `retail_sales_client_created_idx` ON `retail_sales` (`clientId`,`createdAt`);