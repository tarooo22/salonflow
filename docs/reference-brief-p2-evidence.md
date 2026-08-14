# SalonFlow — Reference Brief P2 Evidence

## Protected operational contracts

Walk-in creation is available only to roles with the existing `calendar:manage` action. The server verifies the active organization/location, optional active client, active staff-location assignment, active service, and service eligibility before deriving price and duration from the selected catalog/override. It writes the appointment, service snapshot, status history, and schedule lock inside a transaction after a final overlap check.

Rescheduling is available only for pending or confirmed appointments. The server preserves duration, locks the target date, excludes the appointment itself, rejects a blocking overlap, updates the time in a transaction, and records an audit-history event. No client-side availability assertion can commit a reschedule.

## Operational presentation

Today and Calendar now receive server-derived `UNPAID`, `PARTIAL`, `PAID`, `REFUNDED`, or `OVERPAID` payment context with totals. Each state is shown as Georgian text plus semantic style; it is not represented by color alone. Role-gated Walk-in and form-based reschedule controls are exposed on Today and Calendar without changing staff permissions.

## Validation

The self-cleaning authenticated browser flow created an active-catalog Walk-in after onboarding, asserted the unpaid state, rescheduled it successfully, and removed its temporary appointment/service/history/payment/lock graph in foreign-key-safe order. The complete release suite then passed: 34 test files, 104 assertions, TypeScript, production build, local-auth routing, booking keyboard, and authenticated workspace checks.
