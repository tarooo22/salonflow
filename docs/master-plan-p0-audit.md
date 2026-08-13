# SalonFlow — Master Plan P0 Audit

**Audit date:** 2026-08-14  
**Scope:** Current SalonFlow repository, development runtime, routes, tRPC contracts, schema, authentication, and validation coverage.  
**Purpose:** Establish a fact-based baseline before implementing the supplied Master Plan. This is a code-and-UI audit, not a claim of real user research.

## Verified baseline

| Area | Verified current state | Evidence |
| --- | --- | --- |
| Application stack | React, Tailwind, Express, tRPC, Drizzle, and TiDB/MySQL are configured as one full-stack project. | `package.json`, `server/`, `client/`, and `drizzle/` inventories. |
| Test health | The baseline suite passes **29 test files / 87 assertions**. | `pnpm test`, 2026-08-14. |
| Type safety | The project compiles without TypeScript errors. | `pnpm check`, 2026-08-14. |
| Local authentication | `/register`, `/login`, and `/claim-account` are local-only routes. Sessions are signed; request context accepts only active users whose signed subject starts with `local_` and whose `loginMethod` is `local`. | `App.tsx`, `auth.ts`, `context.ts`, local auth routing regression. |
| Browser auth smoke test | A self-cleaning browser flow completed real local registration, workspace creation, authenticated workspace entry, keyboard checks, and temporary-data cleanup after the development server restart. | `pnpm tsx scripts/authenticated-workspace-check.ts`, 2026-08-14. |
| Data model | Existing schema covers organizations, locations, roles, staff, services, opening hours, client consents, appointments, payments, commissions, expenses, notifications, invitations, verification, recovery, and audit logs. | `drizzle/schema.ts`. |
| Protected operations | Today, Calendar, Clients, Services, Staff, Reports, Finance, Payments, and organization procedures have server-side protected tRPC contracts. | `server/routers/*.ts`. |
| Public booking | Public discovery, booking catalog, availability check, idempotent commit, HMAC confirmation-token generation, transactional conflict re-check, and client consent persistence are implemented. | `server/routers/public.ts`. |

## Runtime incident resolved during audit

The development service retained a stale hot-reload module graph that reported a missing `createLocalUser` export. The current source exports that helper. A clean development-server restart restored the current module graph; TypeScript verification, local route validation, and an actual browser registration-to-authenticated-workspace smoke test all succeeded afterwards. The old error remains in historical logs but did not recur after the restart.

## Deep-link render evidence

Desktop render review covered `/`, `/book`, `/login`, `/register`, `/claim-account`, `/app/today`, `/app/setup`, and an unknown route. Public discovery and local auth forms rendered; protected routes presented the expected sign-in gate; and the 404 fallback rendered rather than failing to load. The review also identified two intentional follow-up items: claim-account visibly requests a technical `local_…` reference, and the 404 copy is still English. Both are included in the P1 localization/recovery work rather than being represented as complete.

## Error-state evidence

| Scenario | Observed user-facing/runtime behavior | Audit result |
| --- | --- | --- |
| Unauthenticated protected route | `/app/today` and `/app/setup` render the SalonFlow sign-in gate instead of exposing protected operations. | Verified in desktop deep-link capture. |
| Unknown route | An unknown route renders the application 404 fallback rather than a blank page or a server failure. | Verified in desktop deep-link capture; Georgian localization remains a P1 gap. |
| Historical module/API failure | A stale development hot-reload graph caused `auth.ts` to report a missing `createLocalUser` export and client requests to fail. | Resolved by restart, then verified by `pnpm check`, local auth route regression, and a real post-restart registration-to-authenticated-workspace browser smoke test. |
| Public/protected query feedback | Existing automated browser validation intercepts targeted Today, Calendar, Clients, Staff, Reports, public discovery, and public booking queries and asserts visible Georgian error/recovery feedback. | Previously implemented self-cleaning validation remains part of the P0 baseline. |

## Current routes and live surfaces

| Surface | Route | Current state | Master Plan implication |
| --- | --- | --- | --- |
| Public home | `/` | Live branded landing page. | Retain warm public entry point; audit conversion content later. |
| Discovery | `/book` | Live location discovery with category filtering. | Extend only if multi-location booking decision needs clearer public context. |
| Booking | `/book/:slug` | Live catalog, specialist eligibility, availability and commit flow. | P0 refinement: multi-service selection, “any available” specialist, customer-facing confirmations and safe management flow. |
| Authentication | `/login`, `/register`, `/claim-account` | Local email/password flow and legacy local-account claim flow. | Preserve security model; hide technical account references from user-facing recovery. |
| First workspace | `/app/setup` | Live one-form organization plus first-location creation. | Replace with a guided four-step onboarding/checklist rather than a zero-data dashboard. |
| Operations | `/app/today`, `/app/calendar` | Live queries and role-gated status actions. | Add workflow completeness: walk-ins, conflict-safe rescheduling, payment state, and staff-only views verification. |
| CRM | `/app/clients` | Live clients, care data, consents, merge and history flows. | Add search/duplicate behavior and sensitive-note role audit. |
| Services and team | `/app/services`, `/app/staff` | Live service/category/team/schedule/performance contracts. | Extend onboarding integration, service availability, assignment, commission and permissions review. |
| Reporting | `/app/reports` | Live revenue, analytics, commissions, expenses, and protected CSV export. | Add onboarded-versus-empty analytics behavior and filter completeness. |

## Security and data-integrity baseline

| Control | Current implementation | Audit conclusion |
| --- | --- | --- |
| Session acceptance | Signed local session token; `local_` subject prefix; active local-account lookup in request context. | Keep unchanged. |
| Passwords | Scrypt hashing and password verification helper. | Keep unchanged; do not introduce credential bypasses. |
| Authorization | Active organization membership and role-action checks are server-side. | Extend tests for role-specific data visibility as new workflows are added. |
| Money | Monetary operations use integer tetri. | Preserve end to end; UI formatters should be centralized. |
| Public booking race safety | Transactional re-check, schedule locks, idempotency key, and existing concurrency test coverage. | Preserve; expand customer-facing conflict recovery. |
| Public tokens | Confirmation token is HMAC-derived and stored only as a hash. | Preserve; future manage/cancel URLs must not expose raw authorization data in logs or UI. |
| CSV safety | Protected export is covered by formula-injection safety tests. | Preserve. |

## Verified gaps against the Master Plan

| Priority | Gap | Required next action |
| --- | --- | --- |
| P0 | First workspace is a single creation form, not the requested four-step guided onboarding. | Design and implement an explicitly staged onboarding flow with safe transactional persistence. |
| P0 | New workspaces land in operational pages without a progressive onboarding dashboard/checklist. | Add actionable setup progress and prevent empty analytics from resembling finished reports. |
| P0 | There is no development-only idempotent demo seed for realistic preview data. | Define strict preview-only boundary and an idempotent seed path that never touches production customer data. |
| P0 | Public booking currently commits one service and requires a named eligible specialist. | Add multi-service totals and a server-resolved “any available” path; preserve availability re-check and idempotency. |
| P0 | Customer confirmation currently returns a token but lacks a complete user-facing reference, calendar action, and safe management/cancellation experience. | Add a non-leaking confirmation contract and dedicated management actions. |
| P1 | Theme provider is fixed to light mode; there is no Settings surface for Light/Dark/System, profile, privacy, or notification preferences. | Add a role-gated settings domain after onboarding foundation is stable. |
| P1 | Claim-account currently needs a technical `local_…` account reference. | Replace this with a human-friendly recovery-code design without weakening the current password verification requirement. |
| P1 | Public/internal locale and money formatting are not yet centralized in one shared presentation layer. | Introduce `ka-GE` date/time and GEL formatter helpers when revising the design system. |
| P1 | The rendered 404 page still has English title, message, and primary action copy. | Localize the fallback and align it with the SalonFlow semantic color and typography system. |

## Implementation order

1. Produce the scripted usability, keyboard, and responsive acceptance plan; treat it as QA design, not fabricated user evidence.
2. Establish shared tokens, component boundaries, form/feedback conventions, and the Light/Dark/System design contract.
3. Implement guided onboarding and the empty-workspace checklist.
4. Add preview-only idempotent demo data with explicit visual labelling and a non-production guard.
5. Complete public booking gaps and test the end-to-end propagation from booking to Calendar, Today, CRM, and Reports.
6. Implement Settings, locale polish, theme support, and the account-recovery presentation improvement.
7. Re-run role/isolation, keyboard, responsive, concurrency, integration, build, and production checks at each release checkpoint.

## Out-of-scope until later

Transactional email/SMS delivery remains deferred until a verified sender domain and provider credentials are supplied. App Store Optimization is not a blocker for the current web release; it becomes relevant only if a PWA or native-store release is explicitly introduced.
