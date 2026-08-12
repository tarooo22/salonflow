# SalonFlow Acceptance Checklist

Manus must mark each item with evidence. “Page exists” is not sufficient when persistence/authorization is required.

## Foundation

- [ ] Clean install from committed lockfile succeeds.
- [ ] Production database is persistent and migrations run on a clean database.
- [ ] Idempotent development seed works and is not auto-run in production.
- [ ] `.env.example` and setup/deployment docs are accurate.
- [ ] Production build passes without console errors or encoding problems.

## Authentication and authorization

- [ ] Owner/manager/receptionist/staff login, logout and reset work.
- [ ] Staff invite lifecycle works.
- [ ] Sessions are secure and revocable.
- [ ] Direct API/URL access is denied for unauthorized roles.
- [ ] Staff cannot view prohibited team financial/private data.
- [ ] Cross-organization/IDOR tests pass.

## Booking engine

- [ ] Working hours, closures, time off, services, durations and buffers affect slots.
- [ ] Public booking persists real client/appointment/service snapshots.
- [ ] Any-specialist assignment is valid and atomic.
- [ ] Internal client booking persists.
- [ ] Walk-in booking persists.
- [ ] Reschedule/cancel/status flow persists and records history.
- [ ] Simultaneous same-slot test proves only one booking succeeds.
- [ ] Customer self-service cancel/reschedule token is secure and policy-aware.

## Operations

- [ ] Manager team calendar uses real data and filters.
- [ ] Staff personal calendar uses real permission-scoped data.
- [ ] Client CRUD/search/detail/history/merge/archive work.
- [ ] Service/category CRUD, staff eligibility and archive work.
- [ ] Staff profile/roles/hours/time-off/service assignment work.
- [ ] Payment/partial/refund state and appointment balance work.
- [ ] Commission snapshots and expenses work.
- [ ] History/audit/CSV exports use real filtered data.

## Reports

- [ ] Revenue/collected/unpaid/refund totals are correct.
- [ ] Average ticket, utilization, status rates and client metrics are correct.
- [ ] Staff/service/payment reports match database test fixtures.
- [ ] Commission and gross-margin labels/calculations are explicit and tested.

## Notifications

- [ ] Booking/reschedule/cancel/reminder/invite/reset events enqueue jobs.
- [ ] Retry and idempotency behavior is tested.
- [ ] Development adapter is safe and clearly separated from production.
- [ ] Missing provider credentials do not fake successful delivery.

## UI/UX

- [ ] SalonFlow visual identity is preserved and Visage is not copied.
- [ ] Georgian copy and fonts render correctly.
- [ ] Required loading/empty/error/success states exist.
- [ ] No dead buttons, demo totals or hardcoded client/calendar arrays remain.
- [ ] 320/375/390/430/768/1024/1440 layouts are verified.
- [ ] No accidental horizontal overflow.
- [ ] Mobile calendar has a usable agenda/list alternative.
- [ ] Keyboard, focus, dialog and screen-reader basics pass.
- [ ] Contrast/touch targets/reduced motion meet requirements.

## Security and deployment

- [ ] Secrets are only in Manus secret controls.
- [ ] Auth/public endpoints have rate limits.
- [ ] Uploads are validated and stored persistently.
- [ ] Logs redact PII/secrets.
- [ ] Dependency audit has no known critical launch blocker.
- [ ] Private/temporary HTTPS preview is live.
- [ ] Deep links and refresh work.
- [ ] Backup/migration/notification-failure operations are documented.

## Automated evidence

- [ ] lint passes;
- [ ] typecheck passes;
- [ ] unit tests pass;
- [ ] integration tests pass;
- [ ] E2E tests pass;
- [ ] production build passes;
- [ ] final report lists exact results, remaining external credentials and owner decisions.
