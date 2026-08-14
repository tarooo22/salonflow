# SalonFlow — QA Checklist

## Release command baseline

Run the following before a checkpoint that contains application behavior changes. Record actual output with the related release evidence; do not convert a planned command into a passing claim.

```bash
pnpm test
pnpm check
pnpm build
node scripts/local-auth-routing-check.mjs
node scripts/booking-keyboard-check.mjs
pnpm tsx scripts/authenticated-workspace-check.ts
```

## Critical acceptance checklist

| Area | Required evidence |
| --- | --- |
| Local access | Register/login persist a signed local session; protected route reaches workspace; logout clears matching cookie; recovery never asks for raw internal identifiers. |
| Scope and roles | URL/API manipulation cannot reveal cross-organization/location data; role-limited UI actions are also rejected server-side. |
| Booking | Server-calculated availability, idempotency replay, any-available fallback, and duplicate-slot rejection produce Georgian outcomes. |
| Operations | Booking appears in operational data; walk-in/reschedule/payment changes use protected conflict checks and role rules. |
| Presentation | Georgian copy; ka-GE money/date/time display; light/dark/system contrast; truthful unavailable integration statuses. |
| Accessibility | Keyboard path, focus visibility, dialogs, Escape, semantic labels, 44px touch targets, reduced motion, and no horizontal overflow. |
| Responsive | 320, 375, 390, 430, 768, 1024, and 1440px checks for public booking, auth, setup, Today, Calendar, CRM, Team, Reports, and Settings. |

## Deferred prerequisites

Email/SMS notification dispatch remains unconfigured until the owner supplies a verified sender domain and provider credential through secure settings. Payment-provider delivery, real customer images, ratings, and reviews are also not represented as connected unless separately implemented and tested.
