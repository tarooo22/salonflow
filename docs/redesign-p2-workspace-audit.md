# SalonFlow — Prompt 2 Workspace / Operations Audit

## Scope and invariants

Prompt 2 is a **presentation and UX refactor**. It must preserve local authentication, organization membership and role checks, location scope, timezone/availability logic, integer-tetri money, server-side balances, appointment status rules, reporting calculations, CSV safety, tRPC procedure names, and database schema. The P2 operational contracts restored in the assertion audit are part of this preserved baseline.

## Route inventory

| Current route | User-facing role | Existing functional contract | Redesign direction |
|---|---|---|---|
| `/app/today` | Daily operational queue | Timezone-aware location dashboard, status actions, server balances | Compact “now / next” queue, small KPI strip, role-gated action cluster, visible payment status. |
| `/app/calendar` | Staff/resource scheduling | Day/week range, active location/staff scope, server conflict-safe mutations | Desktop resource grid with sticky time axis; mobile day/list agenda instead of a scaled grid. |
| `/app/clients` | CRM | Search, add, detail/history, consent, care notes, merge | Dense desktop table, mobile cards, clearer detail drawer/dialog grouping. |
| `/app/services` | Catalog and eligibility | Categories, services, archive state, staff eligibility | Compact category/service matrix; duration, price, status, eligibility at scan speed. |
| `/app/staff` | Team and availability | Profiles, assignments, hours, exceptions, performance | Availability-first roster with concise work-hour and role/context signals. |
| `/app/reports` | Finance/reporting | Ranged metrics, expenses, commission, CSV, history | Localized filter rail, denser metrics/analytics, desktop table / mobile booking cards. |
| `/app/settings` | Account/workspace preference | **Route currently absent** | Add client-only protected route and navigation; group existing-safe profile summary, appearance/theme, notification delivery status, security and integrations boundaries. |
| `/app/setup` | Guided onboarding | Secure four-step onboarding | Remains functionally unchanged; only shared shell tokens may apply where appropriate. |

## Shared-shell findings

`DashboardLayout` already provides the correct protected guard, sidebar, user menu, collapse behavior, and mobile header. It needs a clearer brand marker, stronger active-state geometry, a settings item, compact contextual page metadata, theme shortcut, and mobile surface with 44px targets. Existing `ThemeContext` stays the sole light/dark/system preference owner.

## Data-density and responsiveness findings

The current Workspace has good operational data contracts but uneven presentation density. Today begins with four large KPI cards before the queue. Calendar renders desktop resource grids with fixed minimum widths (52rem/74rem); mobile needs a separate day agenda/list with time, specialist, service, client, status, and payment context rather than horizontal desktop scrolling. Clients is a stacked registry where desktop benefits from a table and mobile from cards. Services and Team are functionally rich but visually card-heavy. Reports exposes raw payment method keys and uses a 670px minimum-width history table, neither of which meet the Georgian/mobile requirement.

## Localization presentation rules

The shared `formatGelTetri` and `formatKaDateTime` helpers are the currency/date source of truth. P2 will add pure client presentation mappings for payment methods and payment states, then route Today, Calendar, Services, Team, and Reports through those shared helpers. Database enums remain unchanged; only visible labels change.

| Persisted code | Visible Georgian payment method |
|---|---|
| `CASH` | ნაღდი ფული |
| `CARD_TERMINAL` | ბარათით — ტერმინალი |
| `BANK_TRANSFER` | საბანკო გადარიცხვა |
| `ONLINE` | ონლაინ გადახდა |
| `OTHER` | სხვა მეთოდი |

## P2 layout and accessibility plan

All protected pages use a 16px mobile gutter, a compact 24px desktop page rhythm, semantic headings, an inline non-color status label, component-level loading/error/empty treatment, and visible keyboard focus. At 375px/768px, dense tables become semantic card/list layouts; desktop data tables are introduced only from the breakpoint where columns remain readable without forced horizontal scrolling. Theme styling relies on the established CSS variables rather than page-local hard-coded colors. Motion remains limited to opacity/transform feedback and respects reduced motion.

## Explicit deferrals

No database migration, payment provider, email/SMS delivery, new notification dispatch, backend integration, API shape change, real testimonial, client-facing public cancellation, or new scheduling semantics is included in this visual phase. Where a Settings group has no backed action, it will truthfully describe its status instead of simulating a control.
