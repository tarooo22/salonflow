# SalonFlow Implementation Handoff

**Prepared:** 13 August 2026  
**Application:** SalonFlow  
**Stack:** React 19, Tailwind CSS 4, Express 4, tRPC 11, Drizzle ORM, MySQL/TiDB  
**Workspace language:** Georgian (`ka-GE`)

## Current Delivery State

SalonFlow is an authenticated, organization-scoped operations platform for appointment-based businesses. The current delivery includes an anonymous four-step booking journey, protected daily operations screens, a client CRM, full staff onboarding and assignment controls, service catalog, reporting data, financial workflows, and a guided first-workspace setup flow.

The current production build succeeds and the full automated test suite passes. The reviewed production schema has been activated in the managed TiDB environment, including all tables, foreign-key relationships, declared indexes, and the refund and commission-uniqueness migrations.

| Area | Current implementation | Status |
|---|---|---|
| Authentication and scope | Manus OAuth entry point with organization-scoped role checks for OWNER, MANAGER, RECEPTIONIST, and STAFF | Implemented |
| Initial workspace | Atomic organization, OWNER membership, and first-location setup with `Asia/Tbilisi` default and opaque public slug | Implemented |
| Public booking | Service, eligible specialist, availability, contact/consent, idempotent commit, HMAC confirmation token | Implemented |
| Daily operations | Today dashboard and team day calendar with protected live queries | Implemented |
| Staff | Invite acceptance, manager-created specialist profiles, profile/assignment editing, weekly hours, schedule exceptions, time-off review, and location assignment management | Implemented |
| Services | Protected category/service creation, active-service and category editing, archive action, and public-booking eligibility management | Implemented |
| Clients | Searchable CRM, consented internal client creation, protected booking history, immutable consent history, and transaction-safe duplicate merging | Implemented |
| Reporting | Revenue summary, payment-method breakdown, injection-safe CSV, paginated booking history, and commission analytics | Implemented |
| Finance | Integer-tetri expense entry UI, commission candidate/rule selection, duplicate safeguards, and commission analytics | Implemented |
| Calendar | Protected daily/weekly calendar, date navigation, and specialist-specific filtering | Implemented |
| Database migrations | Initial schema plus refund and commission-uniqueness migrations | Activated and reconciled |

> **Money rule:** All persisted monetary values are integers in tetri. Browser-facing GEL input is converted to integer tetri without retaining a floating-point amount.

## Verified Quality Gates

The following commands were run successfully on 13 August 2026.

| Command | Result |
|---|---|
| `pnpm test` | 13 test files, 43 assertions passing |
| `pnpm check` | TypeScript validation passed with zero errors |
| `pnpm build` | Production client and server bundle completed successfully |
| Deployed `/app/today` without a session | Correctly resolves to the Georgian sign-in screen rather than a blank workspace |

The build reports a non-blocking client chunk-size advisory. The current main JavaScript asset is above Vite’s default 500 kB warning threshold. Functional behavior is unaffected; dynamic imports or manual Rollup chunks can be considered as a performance follow-up.

## Database Migration Procedure

The schema and migrations are deliberately kept versioned. Do not create replacement migrations for the same changes. The listed migrations are activated in the managed environment; use the reviewed procedure only for a fresh environment or a recovery case.

| Migration | Purpose | Managed status |
|---|---|---|
| `drizzle/0000_glamorous_sally_floyd.sql` | Initial production schema | Activated; TiDB-compatible commission-service constraint identifier corrected |
| `drizzle/0001_giant_silver_surfer.sql` | Adds `refundedTetri` | Activated |
| `drizzle/0002_adorable_talkback.sql` | Adds unique constraint for `commission_entries.appointmentServiceId` | Activated |

When secure database connectivity is restored, apply the reviewed migrations in numeric order. Confirm the active `DATABASE_URL` points to the intended TiDB environment, take a database snapshot if the hosting provider supports it, then apply the migration SQL through the managed database workflow. Afterward, verify the expected tables and indexes exist before enabling live booking or finance entry in a production workspace.

Suggested verification sequence:

```bash
cd /home/ubuntu/salonflow
timeout 5 bash -lc '>/dev/tcp/gateway03.us-east-1.prod.aws.tidbcloud.com/4000' && echo reachable
pnpm drizzle-kit migrate
pnpm test
pnpm check
pnpm build
```

If the migration command is run from the managed project environment, use the controlled database execution workflow for the reviewed SQL rather than modifying the database schema manually. Never use destructive resets against a live environment.

## Required Runtime Configuration

The managed project injects the required system values. They must not be committed in `.env` files.

| Variable | Purpose | Handling |
|---|---|---|
| `DATABASE_URL` | TiDB/MySQL connection string | Required for all persisted workflows |
| `JWT_SECRET` | Signs session and deterministic booking confirmation data | Managed secret |
| `OAUTH_SERVER_URL` | Manus OAuth backend URL | Managed system value |
| `VITE_OAUTH_PORTAL_URL` | Browser OAuth portal URL | Managed system value |
| `VITE_APP_ID` | OAuth application identifier | Managed system value |
| `OWNER_OPEN_ID` | Initial project-owner identity | Managed system value |

## Operational Notes

The first authenticated user can use **Today → “სამუშაო სივრცის შექმნა”** to create an organization, an active OWNER membership, and the first location atomically. Owners and managers can subsequently add active locations directly from **Today**. Setup requires human-readable names and opaque, lowercase Latin slugs. The public location slug is used by the public booking route and does not expose sequential database identifiers.

The team page supports secure email-bound staff invitations, invite acceptance, manager-selected specialist profile creation for accepted members, active-location assignment edits, working-hours entry, schedule exceptions, and time-off request review. The services page supports category creation and editing, service creation and editing, history-preserving archives, and specialist eligibility settings for public booking. The clients page records mandatory booking-terms consent for internal client creation, presents a protected booking-history dialog, appends immutable marketing-consent audit records, and provides transaction-safe duplicate merging.

## Remaining Work

| Priority | Follow-up | Reason |
|---|---|---|
| High | Complete an authenticated browser walkthrough of first-workspace setup | The current test browser has no signed-in user session |
| High | Add database-backed public booking concurrency tests | Validates the active transaction and lock behavior end-to-end without relying only on mocks |
| Medium | Add rendered-interface coverage for public booking filtering, availability gating, and confirmation | Covers client-facing behavior beyond the current router coverage and responsive discovery review |
| Low | Split the main client bundle into route-level chunks | Addresses the non-blocking bundle advisory |

## Release Checklist

Before treating the deployment as production-ready, ensure the following conditions are met.

- [ ] Confirm TiDB connectivity and apply migrations in order.
- [ ] Verify a new organization, first location, staff self-profile, category, service, and client can be created using a real authenticated account.
- [ ] Verify a public booking can be made through the opaque slug route and appears in the protected calendar.
- [ ] Verify payment, expense, and commission workflows with a real organization once their UI is complete.
- [ ] Run `pnpm test`, `pnpm check`, and `pnpm build` after every release candidate.
- [ ] Review role permissions with at least one test account for each supported role.
- [ ] Confirm public URL, OAuth redirect configuration, and production visibility in the project settings.

## Source Locations

| Concern | Main files |
|---|---|
| Database schema and migrations | `drizzle/schema.ts`, `drizzle/0000_glamorous_sally_floyd.sql` through `0002_adorable_talkback.sql` |
| Access control | `server/access.ts` |
| Organization setup | `server/routers/organizations.ts`, `client/src/pages/WorkspaceSetup.tsx` |
| Booking integrity | `server/routers/public.ts`, `server/lib/availability.ts`, `server/lib/appointments.ts` |
| Financial safeguards | `server/routers/finance.ts`, `server/lib/commissions.ts`, `shared/money.ts` |
| Workspace pages | `client/src/pages/Today.tsx`, `Calendar.tsx`, `Staff.tsx`, `Services.tsx`, `Clients.tsx`, `Reports.tsx` |
| Automated tests | `server/**/*.test.ts` |

This document is intentionally specific about known limitations so the next implementation phase can be planned without treating any blocked infrastructure work as complete.
