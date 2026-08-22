# SalonFlow Dashboard — ფაზა 1 UX Specification

## Scope

ფაზა 1 ცვლის მხოლოდ workspace-ის **Today dashboard-ის ინფორმაციულ იერარქიასა და presentation layer-ს**. არ იცვლება database schema, booking availability, appointment status transition rules, permission matrix, branch scope, payment/commission arithmetic ან public booking contract.

## არსებული მონაცემის გამოყენება

| არსებული contract | ფაზა 1-ის გამოყენება | არ იცვლება |
|---|---|---|
| `appointments.dashboard` | დღევანდელი appointments, counts, balances და selected branch context | server-derived timezone, organization/branch scope, STAFF own-data restrictions |
| `organizations.listLocations` | branch switcher და owner readiness context | assigned-branch restriction for STAFF |
| `appointments.updateStatus` | pending/confirmed/check-in/in-service/completed quick action | authoritative status permissions and transitions |
| `WalkInQuickEntry` | role-gated rapid entry | service, price, duration, staff eligibility and schedule checks |
| `WorkspacePrimitives` | header, metrics, sections, status pills and states | semantic theme tokens and current accessibility base |

## Role-specific hierarchy

| როლი | Above the fold | Next action | არ ჩანს როგორც primary UI |
|---|---|---|---|
| OWNER | დღევანდელი შედეგი, ყურადღების სიგნალი, next visit, workspace readiness | booking link, service/team/schedule completion, pending decisions | bulky operational details unless an alert exists |
| MANAGER | pending confirmations, now/next, daily queue | confirm/check-in, calendar, walk-in | owner-only setup and financial configuration |
| RECEPTIONIST | now/next, arrivals, queue, walk-in | client/booking action | reports, public profile setup, team configuration |
| STAFF | own next booking, own schedule, attendance/profile context | open own calendar/profile | organization-wide totals, clients, other specialists |

## Target layout

1. **Context header:** branch, date and one context-safe primary action.
2. **Now / Next rail:** current or immediate upcoming visit, with safe status action where permitted.
3. **Attention queue:** only actionable alerts — pending confirmation, payable balance or onboarding blocker; never a generic alert count without destination.
4. **Compact metrics:** maximum four cards, prioritised by role. Metric cards remain readable but do not become navigation noise.
5. **Quick actions:** two to four role-safe actions, compact and labelled.
6. **Readiness guidance:** owner-only, shown only when meaningful prerequisites are incomplete; each item has a direct route.
7. **Full daily queue:** retained below the decision surface, preserving existing queue information and status actions.

## Accessibility and responsive requirements

The dashboard must preserve logical DOM/tab order, visible focus, 44px minimum action targets, clear labels, no color-only status meaning, aria-live only for asynchronous feedback, and `prefers-reduced-motion` behavior. On 375px, Now/Next, Attention and Quick Actions stack vertically; no desktop metric grid is horizontally compressed. On tablet, dense cards use two columns. On desktop, the decision surface may use a 2:1 composition without obscuring the queue.

## Definition of done

The refactor is complete when each role sees only role-appropriate first actions; existing loading/error/empty states remain; no backend contract changes are required; client regression tests cover role hierarchy and state variants; and the complete repository passes tests, TypeScript and production build.
