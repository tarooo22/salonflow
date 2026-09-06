-- SalonFlow Platform Admin Governance additive migration for Railway MySQL.
-- Safe on an empty or already-updated database: no DROP/ALTER/DATA deletion.
-- Requires existing organizations and users tables.

CREATE TABLE IF NOT EXISTS `organization_governance` (
  `organizationId` varchar(36) NOT NULL,
  `accessStatus` enum('ACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  `publicVisible` boolean NOT NULL DEFAULT true,
  `controlNoteKa` varchar(500),
  `updatedByUserId` int,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`organizationId`),
  CONSTRAINT `org_gov_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `org_gov_actor_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS `organization_governance_events` (
  `id` varchar(36) NOT NULL,
  `organizationId` varchar(36) NOT NULL,
  `eventType` varchar(80) NOT NULL,
  `actorUserId` int NOT NULL,
  `metadata` json,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `org_governance_events_org_created_idx` (`organizationId`, `createdAt`),
  CONSTRAINT `org_gov_evt_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `org_gov_evt_actor_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
);
