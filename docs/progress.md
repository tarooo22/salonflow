# SalonFlow Implementation Progress

## Completed Foundations

The initial requirements audit is complete, the approved warm premium design direction is documented, and the first versioned migration defines the organization-scoped SalonFlow domain. The schema contains 29 tables for identities, memberships, locations, staff, services, scheduling, CRM, appointments, payments, commissions, expenses, notifications, invitations, verification, and audit logging.

## Current Migration Status

The reviewed initial migration is committed at `drizzle/0000_glamorous_sally_floyd.sql`, followed by the non-destructive refund-balance migration `drizzle/0001_giant_silver_surfer.sql`. Applying them is temporarily blocked by a managed-database connection timeout from the current environment. No destructive or partial database operation was performed. The migrations will be re-run once database connectivity is restored.

## Implementation Principles in Force

All business records will remain organization-scoped; public booking will resolve only opaque location slugs; all monetary fields are integer tetri; appointment snapshots protect historical reports; availability is recalculated on the server; and notification jobs are durable records rather than in-process timers.

## Verified So Far

`pnpm check` passes. `pnpm test` passes with eight assertions covering secure logout, Georgian contact normalization, tetri conversion, role boundaries, appointment status transitions, interval overlap behavior, and server-derived balances. The public Georgian landing page and mobile booking entry route have also been visually checked. The booking entry route correctly displays a loading or safe empty state until real location data becomes available from the migrated database.

`pnpm build` also passes. The build currently reports a non-blocking large client bundle advisory, which will be addressed through route-level code splitting as the remaining operational screens are implemented.

Database network probe: host did not resolve/reach TCP port 4000 from the current environment on 2026-08-12.

## Appointment and Payment Workflow Progress

The server now exposes protected appointment creation, status transitions, dashboard summaries, payment recording, and derived-balance procedures. Appointment creation uses day-level staff locks, conflict checks, immutable status history, and server-derived total validation. Payment recording prevents refund amounts above the recorded payment and returns balances calculated only from the persisted appointment total and payment rows. `pnpm check`, `pnpm test`, and `pnpm build` pass after this module addition.

Reporting utility coverage now includes revenue, balance, refund, discount, expense, gross-margin, payment-method, and CSV formula-injection safeguards. The local type check and unit suite pass with twelve assertions.

The public booking experience now has a non-sequential location-slug route that retrieves the location catalog server-side and presents the four required booking stages. It does not expose numeric database identifiers. The flow was verified through `pnpm check`, the twelve-test suite, and a production build. The preview screenshot upload failed independently of the running preview, so no visual defect was reported by the build or type checker.

Slot-generation utilities now deterministically reject buffer conflicts and return only time windows inside opening hours. The local validation suite passes with fourteen assertions across appointment rules, availability, financial reporting, CSV safety, authentication, and contact normalization.

Commission utilities now calculate fixed and percentage earnings from integer tetri service snapshots and allocate discounts deterministically without floating-point drift. The local suite passes with sixteen assertions.

The protected finance router now lists and records organization-scoped expenses using integer tetri, finance permission checks, and auditable creator attribution. Type checking, sixteen unit assertions, and the production build pass after this addition.

Commission entries can now be created only through a protected workflow that resolves an active organization rule, apportions any appointment discount across immutable service snapshots, prevents duplicate entries for the same appointment service, and saves the calculation input alongside the resulting tetri amount. Type checking, all sixteen unit assertions, and the production build pass.

Finance integrity was further strengthened with an active-location ownership check for expenses, explicit commission-rule scope matching, and a reviewed non-destructive migration that adds a unique constraint on `commission_entries.appointmentServiceId`. The local type check, production build, and seventeen unit assertions pass. The constraint migration remains pending the managed database endpoint recovery.

The public booking router now includes an opaque-slug availability endpoint that validates active locations, online services, specialist eligibility, advance-notice windows, buffer intervals, and conflicting appointment states entirely server-side. Type checking, seventeen assertions, and a production build pass after the update.

The authenticated Today dashboard now reads the organization-scoped appointments dashboard and presents real booking totals, pending confirmations, and bookings with an outstanding balance. It retains localized loading, empty, and unavailable states instead of rendering placeholder metrics.
