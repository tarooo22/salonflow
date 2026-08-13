# Reference Product Audit

## MySalon.ge

Source: [MySalon.ge Georgian home page](https://www.mysalon.ge/ka)

The public marketplace emphasizes **service-category discovery**, **location-oriented salon search**, curated **VIP**, **recommended**, and **new** salon collections, favorites, partnership onboarding, and a customer bookings area. Its public value proposition pairs fast booking with verified salons and platform-specific promotions or cashback. These patterns are relevant to SalonFlow’s future public discovery layer, but no third-party reviews, ratings, discounts, or VIP claims will be copied or fabricated without genuine underlying business data.

## Visage

Source: [Visage Georgian home page](https://www.visage.ge/)

Visage presents an all-in-one salon system with online booking calendar, 2–3-click entry, SMS reminders, realtime revenue analytics, CRM, staff scheduling, reminders, client histories, service-led reporting, and scalable plans. Its demonstrated CRM positioning includes client visit history, payments, preferences, allergies, formulas, and next-visit guidance. Its product claims also foreground a booking calendar, operational control, and salon-wide data in one workspace.

Its [calendar demo](https://www.visage.ge/demo/calendar) displays a day/week switch, previous/next date controls, employee columns, hourly grid, colour-coded appointment cards, appointment status, amount, service title, online-source marker, quick booking, and walk-in entry. These are useful operator patterns for SalonFlow’s protected calendar workspace. The calendar needs to retain server-side conflict protection and should not use sample appointment records as user-facing data.

Its [booking demo](https://www.visage.ge/demo/book) presents a customer-facing four-step journey: service, specialist, time, and information. It exposes salon contact details, social links, a public website link, weekly working hours, category filters, transparent service duration and pricing, and a specialist continuation action. These patterns reinforce SalonFlow’s direction toward clear availability, service-led decision cards, and verified business contact fields. Any client-facing contact, social, working-hours, price, or “from price” indicator in SalonFlow must come from actual location and service records.

## SalonFlow application implications

SalonFlow already has a secure public booking route, multi-location scope, role controls, service eligibility, availability validation, appointments, CRM records, staff scheduling foundations, payments, commissions, expenses, and reporting. The highest-value completion areas to evaluate next are public location/service discovery, a calendar-centric daily operations view, legitimate customer reminders after a sender provider is configured, richer client-care history, and operational analytics. Any claimed trust indicator, review, ranking, promotion, SMS outcome, or customer behavior signal must be backed by real SalonFlow data.

## Verified SalonFlow gap matrix

| Workflow | Current SalonFlow baseline | Reference pattern observed | Prioritized completion outcome |
| --- | --- | --- | --- |
| Public location discovery | `/book` lists booking-enabled locations by opaque slug. The public payload preserves booking integrity but only exposes a slim location payload. | MySalon promotes category and location-led discovery; the Visage booking page shows business and working-hours context. | Enrich the public location experience with genuine location contact data, opening hours, services/categories, and routing into the existing secure four-step booking flow. No fabricated review, rank, “VIP,” discount, or availability claim is permitted. |
| Customer booking | The four-step service → specialist → time → contact flow has eligibility, availability, consent, opaque confirmation, and idempotency safeguards. | Visage communicates service duration, price, working hours, and contact context before selection. | Preserve the existing booking contract while surfacing genuine service and location information needed to make a confident selection. |
| Operator calendar | `/app/calendar` supports date range, day/week switch, organization-scoped appointment query, and specialist filtering. The visual surface is a date-card list, not a time-scaled resource grid. | Visage uses hourly time lanes, employee columns, concise appointment cards, and quick internal scheduling actions. | Deliver a responsive protected time grid with staff columns, visible appointment timing/status/service/client context, and role-authorized quick actions while preserving server-side overlap locks. |
| Today operations | `/app/today` shows high-level appointment, pending, and outstanding-balance counts. Its current dashboard procedure does not accurately restrict the returned appointment set to the current business day. | Visage treats “Today” as the primary operational queue with clear current-day appointment state. | Replace the broad recent-record summary with a timezone-aware current-day queue, live status actions, and real counts derived from day-scoped appointments. |
| Client CRM | Search, create, consent history, booking history, and merge are implemented. The schema has notes, preferences, and sensitivity fields, but they are not presented or maintained in a richer client-care detail flow. | Visage highlights client history, care context, allergies/sensitivities, and service formula preferences. | Add role-scoped client detail and editing workflows for genuine notes, preferences, and sensitivities, paired with an ordered service/appointment history. Sensitive data remains organization-scoped and never exposed publicly. |
| Staff operations | Specialist setup, assignments, working-hour creation, schedule-exception creation, invitations, and time-off foundations exist. Management of existing rules and performance visibility remain incomplete. | Visage presents staff scheduling and performance as core workspace capabilities. | Add manageable current working hours/exceptions plus data-backed staff performance panels within role scope. |
| Finance and analytics | Integer-tetri payments, expenses, commissions, revenue summary, payment-method totals, booking history, and CSV export are available. The UI is limited to a fixed 30-day period with no charted trend or service breakdown. | Visage emphasizes realtime revenue and service/staff analytics. | Add adjustable periods and live-data reporting for revenue trends, service mix, and staff performance; retain integer tetri, snapshots, and injection-safe export handling. |
| Customer reminders | Secure notification-job data model exists, but transactional sender configuration has intentionally not been supplied. | Visage advertises SMS reminders and delivery outcomes. | Keep sender-dependent delivery disabled until a verified domain and provider credentials are supplied. Any future scheduled delivery must use platform-managed Heartbeat, an idempotent job contract, and the consent model; do not use in-process timers. |

## Delivery order

The first implementation milestone should strengthen the two screens that affect everyday service delivery: **the time-grid calendar and today queue**. The second milestone should make existing customer information operationally useful through a proper client-care detail. The third should upgrade public location discovery and booking context without weakening public booking safeguards. The fourth should add decision-ready live analytics and staff-performance reporting. Sender-domain-dependent reminders remain intentionally deferred and separate from these milestones.

| Milestone | Acceptance signals |
| --- | --- |
| M1 — Daily operations | Protected calendar and Today queries are timezone-aware and organization-scoped; appointment cards display genuine joined data; permitted status transitions run through the existing server transition/audit path; desktop and mobile interfaces retain keyboard use. |
| M2 — Client care | Client detail shows only authenticated organization data, supports validated notes/preferences/sensitivity editing for permitted roles, and preserves historical appointment/service snapshots. |
| M3 — Public conversion | Public location discovery returns only booking-enabled, active data; opening hours/contact/categories are sourced from database records; all booking eligibility, availability, consent, conflict, and idempotency checks remain covered by regression tests. |
| M4 — Business intelligence | Period filters, revenue trend, service mix, and staff performance are calculated from live source records in integer tetri; no synthetic sales/reviews/ratings data appears in UI or tests. |

## References

[1] [MySalon.ge — იპოვე შენი სალონი | ონლაინ ჯავშანი](https://www.mysalon.ge/ka)

[2] [Visage — სალონის მართვის პროგრამა](https://www.visage.ge/)

[3] [Visage calendar demo](https://www.visage.ge/demo/calendar)

[4] [Visage booking demo](https://www.visage.ge/demo/book)
