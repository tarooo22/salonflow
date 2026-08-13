# SalonFlow M1–M4 Validation Evidence

## Scope and Boundary

This record captures the released SalonFlow surfaces that do not depend on a transactional email sender. It covers a real disposable local-account onboarding path, protected operational workspaces, responsive rendering, keyboard accessibility, and server-side protection regressions. The disposable browser account, organization, location, and membership used by the browser validation are deleted after every run.

> Customer notification delivery, verification-code dispatch, and appointment reminders are intentionally excluded. Their provider-backed delivery remains the separately tracked M5 dependency on a verified sender domain and credentials.

| Validation dimension | Evidence command or coverage | Result |
|---|---|---|
| Local onboarding | `pnpm tsx scripts/authenticated-workspace-check.ts` | A newly registered local account reached Today, followed the real workspace setup action, created its first organization and location, and returned to authenticated Today. |
| Keyboard navigation | Same authenticated check | The sidebar tab sequence reached Today, Calendar, Clients, Staff, and Reports. The test additionally verified programmatic visible focus on navigation and an operational control for every workspace. |
| Responsive rendering | Same authenticated check at 1280 × 720 and 375 × 812 | Today, Calendar, Clients, Staff, and Reports rendered their exact Georgian headings with no horizontal document overflow. |
| Server safety | 29 Vitest files, 85 assertions | Organization scope, role gates, calendar/range predicates, CSV injection protection, money integrity, local session parsing/context acceptance, and cookie lifecycle regressions all passed. |
| Local session browser persistence | Cookie unit/auth tests plus authenticated check | Local register/login sessions use an HTTP-only, `SameSite=Lax` cookie, which is valid for local HTTP development and remains secure on proxied HTTPS deployment. |
| Error and recovery rendering | Same authenticated check with route-specific tRPC request failure injection | Today, Calendar, Clients, Staff, Reports, public discovery, and public booking each displayed their intended Georgian failure message. Interceptors were removed and public discovery was then reloaded successfully, proving the error path does not leave the browser in a blocked state. |

## Milestone Coverage

| Milestone | Released surface | Operational evidence | Server-safety evidence |
|---|---|---|---|
| M1 | Today and Calendar | Authenticated routing rendered Today and Calendar in both desktop and mobile viewport sizes; navigation and visible focus controls were verified. | Appointment tests assert active organization/location scoping, IANA business-day bounds, calendar range predicates, balance calculation, and role-gated quick actions. |
| M2 | Clients and Staff | Authenticated routing rendered Clients and Staff in both viewport sizes; keyboard traversal and operational control focus were verified. | Client care/history, consent, working-hours, exceptions, active assignment checks, and staff-performance range/organization tests pass. |
| M3 | Public discovery and booking | Public booking remains covered by its existing DOM and keyboard regressions; no account workflow is required for the customer booking path. | Catalog, category filtering, specialist eligibility, availability revalidation, idempotency, and concurrent booking safeguards are covered by router and live integration regressions. |
| M4 | Reports | Authenticated Reports rendering, responsive layout, keyboard focus, and sidebar traversal were verified. | Selected period, organization/range predicates, integer-tetri analytics, expense pressure, authorization, and CSV formula escaping are covered by reporting tests. |

## Reproducible Commands

```bash
pnpm test
pnpm check
node scripts/local-auth-routing-check.mjs
pnpm tsx scripts/authenticated-workspace-check.ts
pnpm build
```

The authenticated workspace command is deliberately self-cleaning. It creates unique `example.test` account and workspace identifiers, validates real browser behavior through the local application endpoint, then removes the location, membership, organization, and user records in dependency order.

For error-state review, the same command intercepts only the route-specific query being exercised. It validates the visible fallback copy for the failing query, removes the interception after the assertion, and confirms a normal public route can load again. The application code and its data are not modified by this review.

## Current M5 Dependency

The security foundations for password reset and verification codes persist only hash-only values, enforce expiry and single-use rules, and have dedicated regressions. No email or message is sent until a verified custom sender domain and the corresponding provider credentials are supplied. This prevents a request from appearing delivered when there is no approved transactional sender.
