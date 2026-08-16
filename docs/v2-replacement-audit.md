# SalonFlow V2 Replacement Audit

**Replacement mode:** Full V2 source replacement, explicitly selected by the project owner.  
**Archive:** `salonflow-v2.zip`  
**Safety baseline:** pre-replacement checkpoint `aedcae99` and a local source copy at `/home/ubuntu/salonflow-pre-v2-aedcae99`.

## Source boundary

The uploaded archive was inspected before extraction. Its CRC integrity check passed. The archive contained approximately 30,720 entries and included an embedded dependency cache, a `.env` file, a project metadata file with credentials, and older generated artifacts. None of those items were copied into the managed project.

The replacement copied V2 application source while preserving the managed project identity and environment wiring: `.git`, `.project-config.json`, `.manus`, and runtime logs remained outside the replacement boundary. No database migration, seed command, SQL command, data deletion, environment secret import, Docker command, or arbitrary archive script was executed.

## Compatibility findings

V2 uses the same React/TypeScript/Express/tRPC/Drizzle family and declares the same 29 database tables as the prior project. Its package manifest differed from the previous release, including `cross-env` and a smaller dependency set. A clean dependency installation reconciled the archive lockfile with the managed package configuration. The initial frozen install stopped because of inherited override metadata; the non-frozen install completed and regenerated compatible lock metadata.

The archive contained an older handoff document that mentioned OAuth, but the replacement's local `/register` and `/login` screens render inside SalonFlow in the current dev runtime. The replacement does not change live database contents or run the three versioned Drizzle migrations.

## Validation evidence

| Check | Result |
|---|---|
| Dependency installation | Passed after lockfile reconciliation |
| TypeScript (`pnpm check`) | Passed with 0 errors |
| Production build (`pnpm build`) | Passed |
| Vitest (`pnpm test`) | 36 files / 110 tests passed |
| Dev server restart | Passed on port 3000 |
| Browser smoke review | Home, `/register`, `/login`, and protected `/app/today` rendered correctly |

## Follow-up notes

The V2 archive originally had an incomplete Team-page test mock for its invitations and member-creation controls. The test-only mock was aligned with the already-present V2 UI actions; production Team, invitation, and permission behavior was not changed. The pre-replacement checkpoint remains the designated rollback point if the owner decides to restore the prior application.
