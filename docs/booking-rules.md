# SalonFlow — Booking Rules

## Current enforced rules

Public booking uses an opaque public location context, active catalog/eligibility checks, server-calculated availability, integer-tetri price records, idempotency keys, and final conflict re-check. “ნებისმიერი თავისუფალი სპეციალისტი” is resolved by the server from eligible candidates and the final confirmation names the assigned specialist. A same-key retry returns the same booking contract rather than creating a duplicate.

| Rule | Enforcement boundary |
| --- | --- |
| Organization/location isolation | Scoped server query and opaque public location slug. |
| Specialist eligibility | Active service-to-staff eligibility validation before assignment. |
| Slot conflicts | Final transactional/schedule-lock re-check at commit time. |
| Price integrity | Integer tetri server records; presentation-only GEL formatters. |
| Client consent | Booking flow captures required consent and stores the applicable record. |
| Historical integrity | Appointment service details are preserved as snapshots when catalog records change. |

## Planned extensions and non-promises

Multi-service totals, add-to-calendar, manage/reschedule/cancel links, waitlist offers, and optional chair/room resources require separate server contracts, scope rules, test coverage, and truthful UI. No cancellation offer may silently book a client. Notification delivery remains disabled until verified provider prerequisites are supplied.

## Customer-visible errors

Availability conflicts, validation errors, and status feedback must be Georgian, actionable, and free of raw tokens, internal IDs, server stack traces, or another organization’s information.
