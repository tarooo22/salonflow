# SalonFlow — Information and Technical Architecture

## Route and responsibility map

| Route group | Responsibility | Boundary |
| --- | --- | --- |
| `/`, `/book`, `/book/:slug` | Public discovery and booking. | Public procedures expose only public location/catalog/availability data; booking commit is server-revalidated and idempotent. |
| `/login`, `/register`, `/claim-account` | Local account access and recovery. | Local scrypt credentials and signed local-only session; no Manus OAuth. |
| `/app/today`, `/app/calendar`, `/app/clients`, `/app/services`, `/app/staff`, `/app/reports` | Protected operations workspace. | `DashboardLayout` gates unauthenticated states; server procedures enforce organization, location, and role scope. |
| `/app/setup` | First-run owner onboarding. | Creates organization/location/catalog/schedule through a guarded transaction. |
| `/app/settings` | Planned protected profile, theme, preference, privacy, and notification status surface. | Must never claim unconfigured sender/provider delivery. |

## Data and component boundaries

React pages coordinate UI and tRPC hooks; reusable components own interaction behavior and semantic states; Express/tRPC routers own authorization and input validation; Drizzle helpers own scoped data access; database constraints and transactions preserve conflicts and historical records. Money remains integer tetri in storage and arithmetic. IANA timezone values are server inputs and presentation uses shared Georgian formatting helpers.

## Responsive and role strategy

Desktop uses the protected sidebar; mobile uses compact navigation and a visible path to the primary operations action. Owner and manager may access organization-wide configuration according to server policy; reception workflow changes are separately gated; staff views must not leak colleagues’ private finance details. The theme preference is stored client-side today; any profile or organizational preference write must use a protected server contract.

## Near-term architecture decisions

The next P1 work adds Settings and human recovery without changing the session, role, or data model contract. P2 walk-in and rescheduling must call protected appointment procedures that repeat schedule, eligibility, location, and conflict validation on the server; UI drag/drop or forms must never infer availability client-side.

[^brief]: User-supplied *SalonFlow Manus Master Build Kit*, 2026-08-14, `/home/ubuntu/upload/SALONFLOW_MANUS_REFERENCE_LED_BUILD_BRIEF_GE_2026-08-14.md`.
