-- One-time data fix for Railway MySQL: salons onboarded with weekdays saved as 0=Sunday.
--
-- Background: the guided onboarding (commit 90a5df1, 2026-08-13) wrote location_opening_hours and the owner's
-- working_hour_rules with weekday 0=Sunday, 1=Monday ... 6=Saturday. The schema, the availability engine and the
-- editors use 0=Monday ... 6=Sunday. Commit 5dd82c1 (2026-10-24 23:25 UTC) fixed the writer, so every row written
-- by the onboarding path before that is shifted by one day. The fix is weekday := (weekday + 6) % 7
-- (old 0 Sunday -> 6, old 1 Monday -> 0, ...).
--
-- SCOPE (a row is touched only if ALL of these hold)
--   * its organization was created from 2026-08-13 00:00:00 UTC (epoch 1786579200) up to the 5dd82c1 commit time,
--     2026-10-24 23:25:47 UTC (epoch 1792884347). The window deliberately ends at the commit, not a day later:
--     salons onboarded after the fix have correct weekdays and must not be shifted. Salons created in the first
--     minutes after the commit but before Railway finished deploying are ambiguous; check them by hand with
--     query C below before running (widen the end epoch only if their Monday-Friday rows are stored as 1-5).
--   * the location was created by the same onboarding transaction (within 5 seconds of the organization);
--   * opening hours: the row was written with that location (within 5 seconds) and never updated afterwards;
--   * working hours: the rule belongs to the OWNER's staff profile that onboarding created (profile within
--     5 seconds of the organization), is on the onboarding location, was written with that profile and never
--     updated afterwards. Rules the owner edited or added later in the Staff editor were written with the
--     correct weekday and are left alone. Workspaces made through organizations.createWorkspace /
--     organizations.create have no opening hours and no onboarding rules, so they never match.
--
-- RUN EXACTLY ONCE, all statements together in one go (a single mysql session, or Railway's Query UI "run all").
-- A shifted row shifted again would be wrong, so each step is guarded by a marker row in data_fixes: once the marker
-- exists the guarded UPDATE matches nothing. Do not delete the marker. If the run is interrupted between an UPDATE
-- and its marker INSERT, do NOT re-run blindly: run queries A/B below and compare with the "before" output.
--
-- HOW TO VERIFY (run before, then again after; times are stored local to the location, only weekday moves)
--   A. Opening hours that this script would shift (before: Monday-Friday salons show weekdays 1,2,3,4,5; after: 0,1,2,3,4):
--        SELECT o.slug, l.name, GROUP_CONCAT(oh.weekday ORDER BY oh.weekday) AS weekdays
--        FROM location_opening_hours oh JOIN locations l ON l.id = oh.locationId JOIN organizations o ON o.id = l.organizationId
--        WHERE UNIX_TIMESTAMP(o.createdAt) >= 1786579200 AND UNIX_TIMESTAMP(o.createdAt) < 1792884347
--          AND ABS(UNIX_TIMESTAMP(l.createdAt) - UNIX_TIMESTAMP(o.createdAt)) <= 5
--        GROUP BY o.slug, l.name ORDER BY o.createdAt;
--   B. The owners' onboarding rules, same shape (join through staff_profiles and organization_memberships with membership_role = 'OWNER').
--   C. Salons in the ambiguous hours after the fix commit:
--        SELECT o.slug, o.createdAt, (SELECT GROUP_CONCAT(weekday ORDER BY weekday) FROM location_opening_hours oh
--          JOIN locations l ON l.id = oh.locationId WHERE l.organizationId = o.id) AS weekdays
--        FROM organizations o WHERE UNIX_TIMESTAMP(o.createdAt) >= 1792884347 AND UNIX_TIMESTAMP(o.createdAt) < 1792972800;
--   D. Marker (empty before, two rows after):  SELECT * FROM data_fixes;
-- Back out only by hand from a backup/the "before" output; the script has no undo.

CREATE TABLE IF NOT EXISTS `data_fixes` (
  `name` varchar(120) NOT NULL,
  `appliedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`name`)
);

START TRANSACTION;

-- 1. location_opening_hours
UPDATE `location_opening_hours` oh
JOIN `locations` l ON l.`id` = oh.`locationId`
JOIN `organizations` o ON o.`id` = l.`organizationId`
SET oh.`weekday` = (oh.`weekday` + 6) % 7
WHERE NOT EXISTS (SELECT 1 FROM `data_fixes` f WHERE f.`name` = '2026-10-opening-hours-weekday-shift')
  AND UNIX_TIMESTAMP(o.`createdAt`) >= 1786579200
  AND UNIX_TIMESTAMP(o.`createdAt`) < 1792884347
  AND ABS(UNIX_TIMESTAMP(l.`createdAt`) - UNIX_TIMESTAMP(o.`createdAt`)) <= 5
  AND ABS(UNIX_TIMESTAMP(oh.`createdAt`) - UNIX_TIMESTAMP(l.`createdAt`)) <= 5
  AND UNIX_TIMESTAMP(oh.`updatedAt`) - UNIX_TIMESTAMP(oh.`createdAt`) <= 5;

INSERT INTO `data_fixes` (`name`)
SELECT '2026-10-opening-hours-weekday-shift' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `data_fixes` f WHERE f.`name` = '2026-10-opening-hours-weekday-shift');

-- 2. working_hour_rules of the owner profile created by onboarding
UPDATE `working_hour_rules` w
JOIN `staff_profiles` sp ON sp.`id` = w.`staffProfileId`
JOIN `organization_memberships` m ON m.`id` = sp.`membershipId` AND m.`membership_role` = 'OWNER'
JOIN `organizations` o ON o.`id` = m.`organizationId`
JOIN `locations` l ON l.`id` = w.`locationId` AND l.`organizationId` = o.`id`
SET w.`weekday` = (w.`weekday` + 6) % 7
WHERE NOT EXISTS (SELECT 1 FROM `data_fixes` f WHERE f.`name` = '2026-10-owner-working-hours-weekday-shift')
  AND UNIX_TIMESTAMP(o.`createdAt`) >= 1786579200
  AND UNIX_TIMESTAMP(o.`createdAt`) < 1792884347
  AND ABS(UNIX_TIMESTAMP(l.`createdAt`) - UNIX_TIMESTAMP(o.`createdAt`)) <= 5
  AND ABS(UNIX_TIMESTAMP(sp.`createdAt`) - UNIX_TIMESTAMP(o.`createdAt`)) <= 5
  AND ABS(UNIX_TIMESTAMP(w.`createdAt`) - UNIX_TIMESTAMP(sp.`createdAt`)) <= 5
  AND UNIX_TIMESTAMP(w.`updatedAt`) - UNIX_TIMESTAMP(w.`createdAt`) <= 5;

INSERT INTO `data_fixes` (`name`)
SELECT '2026-10-owner-working-hours-weekday-shift' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `data_fixes` f WHERE f.`name` = '2026-10-owner-working-hours-weekday-shift');

COMMIT;
