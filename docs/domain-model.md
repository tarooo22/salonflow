# SalonFlow Domain Model and Security Boundaries

## Design Decisions

SalonFlow uses the scaffold’s secure account identity as the authentication layer and adds organization memberships for business authorization. A user can belong to more than one organization without the client ever supplying an organization identifier that the server trusts. Every organization-owned query will derive its scope from the selected active membership and will apply the membership role on the server.

| Concept | Production default | Reason |
| --- | --- | --- |
| Primary business identifiers | Opaque 36-character IDs | Public routes and client payloads never reveal sequential identifiers. |
| Public location addressing | Globally unique `publicSlug` | Booking routes can resolve a location without exposing its primary key. |
| Timestamp storage | UTC timestamps with IANA location timezone | Calendar rules are interpreted in local wall time, while stored appointment instants remain unambiguous. |
| Currency | Integer tetri (`int`) | Avoids floating-point rounding errors for prices, payments, commissions, and expenses. |
| Historical records | Snapshots plus archive states | Editing or archiving services and staff cannot alter past bookings or reports. |
| Concurrency | Transactional day-level staff schedule locks | Booking creation and rescheduling lock all affected local dates before server-side overlap checks. |

## Role Matrix

| Capability | OWNER | MANAGER | RECEPTIONIST | STAFF |
| --- | --- | --- | --- | --- |
| Organization/security settings and audit log | Full | Limited | No | No |
| Team calendar and internal bookings | Full | Full | Full | Assigned appointments only |
| Client CRM | Full | Full | Operational access | Assigned-client context only |
| Staff, services, and schedule administration | Full | Full | View only | Own profile/schedule only |
| Payments, commissions, expenses, and reporting | Full | Full | Payments only where granted | Own permitted performance only |
| Appointment status progression | Full | Full | Check-in and operational actions | Permitted actions on own appointments |

## Availability and Booking Contract

The booking engine calculates availability only on the server. It converts the requested local day into the location timezone and evaluates location opening hours, closures, working-hour rules, staff exceptions, staff-service eligibility, service duration overrides, configured buffers, booking policy, and existing blocking appointments. A slot is validated again in the transaction that commits the appointment.

For every local date crossed by a booking interval, the transaction acquires a row in `scheduleLocks` for the assigned staff member before checking conflicts. It then uses indexed staff/time overlap queries and writes the appointment, service snapshots, status history, client data, and audit record atomically. Rescheduling reserves the replacement interval before releasing the previous interval; failure rolls back the entire transaction.

## Financial and Reporting Contract

Appointment totals are server-side snapshots. Payments, refunds, commissions, and expenses are independent records in tetri. The appointment balance is calculated on the server from the snapshot total, successful payments, and refunded amounts; it is never accepted from a client payload. CSV exports escape any cell beginning with a formula-significant character and are both permission-gated and audit logged.

## Notification Boundary

Notification jobs are durable records with scheduled time, idempotency key, sanitized provider result, and retry metadata. A provider adapter remains in safe development mode until the owner adds approved provider credentials. A deployed periodic worker can process due records later; no in-process timers will be used.
