# SalonFlow — Usability, Accessibility, and Responsive QA Plan

**Status:** Implementation acceptance plan.  
**Scope:** Owner, manager/reception, specialist, and public client workflows.  
**Research integrity:** This document defines scripted QA scenarios. It does **not** represent completed interviews, surveys, or observed customer research. Any future participant findings must be recorded separately with consent, sample details, and actual evidence.

## Outcome and evidence protocol

Each scenario is successful only when the tester can complete the stated task with the expected visible feedback, correct authorization boundary, and no console/runtime error. Record the route, role, viewport, observed result, screenshot or test command, and any defect. Do not replace an interaction test with a static screenshot where a mutation, permission, or focus behavior is the acceptance target.

| Evidence type | Use when | Required record |
| --- | --- | --- |
| Browser scripted check | Registration, booking, calendar, status mutation, keyboard traversal, and responsive rendering need repeatability. | Script name, command, pass/fail output, temporary-data cleanup result. |
| Server/router test | A role, organization, money, idempotency, or concurrency rule must be proven independent of UI. | Test file, assertion, affected procedure, and expected error/success condition. |
| Rendered review | Visual hierarchy, readable Georgian copy, mobile wrapping, focus visibility, or overlay clipping must be inspected. | Route, viewport, screenshot, and reviewer finding. |
| Manual product acceptance | A future real owner validates a business preference or content choice. | Tester, date, scenario, result, and feedback; do not label it as research unless it was actually conducted. |

## Scripted usability scenarios

| ID | Persona and precondition | Task | Success criteria | Evidence target |
| --- | --- | --- | --- | --- |
| U-01 | **Owner** with a newly registered local account and no organization. | Complete onboarding: salon identity, first location/timezone, working hours/exceptions, services/prices, owner/staff profile, and public-booking activation. | A guided progress flow persists each completed step safely; the owner lands on a checklist/dashboard rather than an ambiguous empty analytics screen; public URL is visible only after activation. | Browser onboarding flow, organization/service/staff router tests, rendered review. |
| U-02 | **Manager or receptionist** with an active location, services, staff, and appointments. | Open Calendar, create a walk-in or booking, reschedule it, and update the operational status/payment state. | Only permitted locations/staff appear; conflict-safe server validation prevents double booking; status changes update Today and Calendar; failure has clear Georgian feedback. | Appointment router test, browser calendar flow, injected-error test. |
| U-03 | **Specialist** with one assigned location and own schedule. | Open Today and Calendar, review own next appointments, and use only allowed quick actions. | No other staff’s restricted finance/personal details are displayed; own schedule is timezone-correct; unauthorized action requests are rejected server-side. | Role/isolation router tests, authenticated browser capture. |
| U-04 | **Client** on a phone. | Discover a location, choose one or more services, select a specialist or “any available”, select a server-calculated time, submit +995 phone and consent, then read confirmation. | Total duration and price are intelligible; invalid phone or unavailable time has Georgian guidance; duplicate submit creates only one appointment; confirmation contains reference, date/time, location, specialist/services, and safe management path. | Public router concurrency test, mobile booking browser script, rendered confirmation review. |
| U-05 | **Owner/manager** with historical booking, payment, commission, and expense data. | Filter Reports by date, location, staff, and service; export CSV; inspect CRM history from a selected client. | Values remain integer-tetri based and displayed consistently in GEL; filter scope is authorized; CSV does not execute formulas; data remains clearly empty/onboarding-state when no operations exist. | Reporting/finance/router tests, rendered Reports and CRM review. |

## Keyboard and assistive-technology scenarios

| ID | Route or component | Keyboard task | Acceptance criteria |
| --- | --- | --- | --- |
| K-01 | Global public header, sign-in, and booking entry | Use `Tab`, `Shift+Tab`, and `Enter` from the header through primary calls to action. | Logical order, visible focus ring, no focus loss, and every icon-only control has an accessible label. |
| K-02 | Local registration, login, and claim/recovery | Complete fields using keyboard and trigger validation. | Labels are programmatically associated; autocomplete is appropriate; errors are adjacent and announced/visible; technical identifiers such as `local_` are not requested in the future human recovery flow. |
| K-03 | Public booking steps | Select services, specialist/any available, date/time, consent, and submit without pointer use. | Step state is communicated; inactive controls are not misleadingly focusable; invalid/expired availability returns the user to a useful, focused recovery action. |
| K-04 | Today, Calendar, Clients, Staff, Services, Reports | Traverse filters, tables/cards, contextual actions, and dialogs. | No keyboard trap outside a dialog; modal focus is trapped while open; `Escape` closes non-destructive overlays; focus returns to the triggering control. |
| K-05 | Reduced motion and semantic review | Enable `prefers-reduced-motion`; review headings, status labels, alerts, and charts. | Nonessential animation is reduced; status is never color-only; headings form a usable hierarchy; charts provide labels/tooltips or tabular equivalents. |

## Responsive acceptance matrix

| Viewport | Core checks | Routes to review |
| --- | --- | --- |
| 320px | No horizontal scroll; 44px touch targets; long Georgian labels wrap without clipping; forms retain labels. | `/`, `/book`, `/book/:slug`, `/login`, `/register`. |
| 375px and 390px | Booking progress, selectors, consent, date/time choices, and confirmation remain reachable. | `/book`, `/book/:slug`. |
| 430px | Public cards and auth/onboarding controls retain hierarchy and action visibility. | `/`, `/login`, `/register`, `/app/setup`. |
| 768px | Sidebars, dialogs, tables, schedule controls, and filters do not overlap. | Today, Calendar, Clients, Staff, Services, Reports. |
| 1024px | Internal two-column and calendar resource layouts retain scannability and staff columns remain readable. | Today, Calendar, Reports. |
| 1440px | Wide layouts preserve information hierarchy without excessively stretched forms or detached actions. | Home, Book, Today, Calendar, Reports. |

## Authorization and data-boundary acceptance

| Boundary | Required proof |
| --- | --- |
| Organization | A request using another organization’s opaque identifier is rejected by the server, not merely hidden by UI. |
| Location | Calendar, staff, services, and booking operations verify active assignment/location scope. |
| Role | OWNER/MANAGER/RECEPTIONIST/STAFF action availability is matched by server authorization tests. |
| Sensitive client data | Care notes and consent controls show only to roles authorized for client management. |
| Public booking | Client-entered values are validated; schedule is rechecked transactionally; confirmation authorization is hash/HMAC-backed and does not expose raw token data. |

## Completion gate for this plan

The plan becomes an execution report only when every applicable scenario has a dated command or screenshot reference, an observed pass/fail result, and any temporary data has been cleaned up. Unrun scenarios must remain marked as planned rather than passed.
