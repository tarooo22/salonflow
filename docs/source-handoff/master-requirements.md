# SalonFlow — Production Full-Stack Master Prompt for Manus

## 1. Mission

Build and publish a complete, production-oriented Georgian salon booking and operations platform called **SalonFlow** from the attached handoff package.

The owner runs a real salon. Customers must be able to book salon staff/barbers online. Every staff member must have a secure account with a personal schedule. A manager/owner must have a secure account that can view and manage the entire team, bookings, customers, services, working hours, payments and business reports.

The attached `APP-SOURCE` is a working React interaction and visual prototype. It demonstrates the desired warm premium design direction and several core flows, but it currently uses demo data and has no real backend. It must be evolved into a genuine full-stack product. Do not simply polish the mockup and call it complete.

The 30 `REFERENCE-SCREENSHOTS` show the breadth and behavior of Visage-like salon software. Treat them as references for information architecture, flows and feature coverage only. **Do not copy Visage branding, logo, text, exact layout, gradients or UI pixel-for-pixel.** SalonFlow must keep its own distinctive warm, premium, calm identity.

Primary product language is **Georgian**. The codebase, database identifiers and developer documentation may be English. All user-facing production copy must be real, natural Georgian with correct UTF-8 rendering. No mojibake, lorem ipsum, fake text or untranslated framework strings.

## 2. Required working method

Before making changes:

1. Extract and inspect the complete package.
2. Read every supplied Markdown/TXT instruction file and the current design-system file.
3. Run the existing prototype and click through:
   - manager dashboard;
   - staff dashboard;
   - team calendar;
   - clients;
   - services;
   - staff;
   - analytics;
   - quick internal booking modal;
   - public four-step booking flow;
   - login/logout and account-role switching.
4. Review all 30 reference screenshots and `DOCS/REFERENCE_INDEX.md`.
5. Produce a concise audit: current reusable pieces, missing backend pieces, architectural risks, design inconsistencies and implementation phases.
6. Continue implementation after the audit. Do not stop after planning. Do not wait for confirmation for ordinary implementation decisions.

When something is ambiguous, prefer a safe, documented production default. Ask the owner only when a missing answer materially changes the business result or requires a secret/external account. Never invent external credentials.

Maintain a short progress/checkpoint document while working so the project can survive context resets. Record migrations, environment names, completed flows, test results and remaining external blockers.

## 3. Product boundaries and priority

This is first a **single real salon system**, but the data model must be cleanly organization/location-aware so adding a second branch later does not require a rewrite.

Required now:

- one organization/salon;
- one or more locations supported by schema and settings;
- owner/manager/staff/receptionist permissions;
- customer booking without requiring a customer account;
- staff invitations and secure accounts;
- online booking, internal booking and walk-in booking;
- calendars, customers, services, staff, payments, commissions, history and reports;
- Georgian UI and Asia/Tbilisi timezone;
- production database, migrations, seed, validation, tests and deployment.

Not required to block initial launch unless the owner later requests it:

- building a public multi-tenant SaaS pricing/subscription platform;
- native iOS/Android applications;
- advanced inventory and product sales;
- live online card charging.

However, do not make architectural choices that make these impossible later.

## 4. Recommended technical architecture

Audit the Manus environment first and use the most reliable supported stack. Prefer the following unless Manus hosting constraints require a documented equivalent:

### Frontend

- React 19 + TypeScript + Vite;
- React Router or an equivalent real URL router;
- TanStack Query for server state, caching, loading and invalidation;
- React Hook Form + Zod for forms and shared validation;
- Lucide icons only for interface icons;
- the existing SalonFlow visual language and design tokens;
- reusable accessible components, not one enormous `App.jsx` file;
- a calendar implementation that is maintainable and accessible. A well-supported calendar library is acceptable if styled to the SalonFlow design system and if it supports Georgian/timezone behavior.

### Backend

- Node.js + TypeScript;
- Express/Fastify with tRPC or a typed REST API;
- Zod validation on every mutation and public input;
- PostgreSQL preferred, using Drizzle ORM with committed migrations. If the Manus managed SQL offering differs, adapt minimally and document the choice;
- server-side authorization on every protected endpoint. Hiding a button is not authorization;
- structured logging with secrets/PII redaction;
- background-job abstraction for reminders and notification retries.

### Authentication

- secure server-side sessions in `httpOnly`, `secure`, `sameSite=lax` cookies, or an equally secure Manus-supported mechanism;
- password hashing with Argon2id or bcrypt with a strong cost;
- login throttling and generic invalid-credential errors;
- staff accounts created through manager invitations, not public manager registration;
- forgot/reset password flow with expiring, hashed, single-use tokens;
- logout invalidates the active session;
- optional OTP/phone verification provider abstraction for public bookings;
- never store access tokens in localStorage when secure cookies are available.

### Project structure

Refactor the prototype into clear modules such as:

```text
client/
  src/
    app/
    components/
    features/auth/
    features/bookings/
    features/calendar/
    features/clients/
    features/services/
    features/staff/
    features/finance/
    features/reports/
    features/settings/
    lib/
    routes/
server/
  src/
    auth/
    db/
    modules/
    notifications/
    jobs/
    middleware/
    lib/
shared/
  schemas/
  types/
drizzle/
tests/
```

An equivalent clean feature-based structure is acceptable. Do not leave the production product as a single giant component with hardcoded arrays.

## 5. Core domain model

Use UUIDs or robust collision-resistant IDs. Store timestamps in UTC and display/interpret schedule rules in the location timezone (`Asia/Tbilisi` by default). Use money in integer tetri, never floating-point GEL.

Implement at least these entities and relationships. Names may vary, but behavior must remain.

### Organization and locations

`organizations`

- id;
- name;
- slug;
- logo/object-storage key;
- default timezone;
- default currency (`GEL`);
- contact data;
- status;
- created/updated timestamps.

`locations`

- id, organization id;
- name and public slug;
- address and optional map coordinates;
- timezone;
- phone, email, social links;
- public description/cover image;
- booking enabled flag;
- default booking policy IDs/settings;
- active/archived status.

### Users, membership and permissions

`users`

- id;
- email and normalized phone, both uniquely constrained when present;
- password hash;
- display name;
- avatar;
- locale;
- active/disabled status;
- last login;
- created/updated timestamps.

`organization_memberships`

- organization id + user id;
- role: `OWNER`, `MANAGER`, `RECEPTIONIST`, `STAFF`;
- granular permission overrides if needed;
- invited/active/disabled state;
- invite metadata.

`staff_profiles`

- membership/user relation;
- public display name and bio;
- staff color;
- job title/specialty;
- phone visibility;
- online-booking visibility;
- sort order;
- employment start/end dates;
- commission defaults;
- active/archived.

Roles:

- **OWNER:** complete organization control, managers, finance, settings and audit logs.
- **MANAGER:** all salon operations, calendars, customers, services, staff schedules, reports and finance except owner-only destructive/security actions.
- **RECEPTIONIST:** bookings, calendar and customer CRM; no sensitive profit/payroll/security controls.
- **STAFF:** own schedule, allowed client details for assigned visits, permitted status changes and own performance summaries; cannot view other staff financial totals unless explicitly granted.

### Services

`service_categories`

- organization/location scope;
- Georgian name;
- optional icon identifier;
- color;
- sort order;
- active/archived.

`services`

- category and organization;
- Georgian name and public description;
- default duration minutes;
- cleanup/buffer-before and buffer-after minutes;
- price in tetri and optional “from price” flag;
- online-booking flag;
- deposit policy if later enabled;
- active/archived;
- sort order.

`staff_services`

- staff + service;
- can perform;
- optional staff-specific duration override;
- optional staff-specific price override;
- optional staff-specific commission rule.

Do not hard-delete services that have historical appointments. Archive them while preserving price/name snapshots in appointment records.

### Schedule and availability

`working_hour_rules`

- staff/location;
- weekday;
- start/end local time;
- optional split shifts;
- effective date range.

`schedule_exceptions` / `time_off`

- staff/location;
- start/end timestamp;
- type: break, vacation, sick leave, custom block, extended working time;
- reason/notes;
- approved by;
- full-day flag.

`location_opening_hours` and location closures/holidays must also be supported.

### Clients

`clients`

- organization id;
- first/last name;
- normalized phone and optional email;
- birth date optional;
- gender optional only if the business needs it;
- marketing SMS/email consent with timestamp and source;
- booking terms consent with timestamp;
- notes and preferences;
- allergy/sensitivity note with stricter permission handling;
- first/last visit;
- visit count, no-show count and lifetime value can be computed/denormalized safely;
- created by/source;
- active/merged/archived status.

Deduplicate by normalized phone per organization. Provide a controlled merge flow that preserves booking history and audit logs.

### Appointments

`appointments`

- organization and location;
- client nullable for walk-ins;
- assigned staff;
- start/end UTC timestamps;
- status: `PENDING`, `CONFIRMED`, `CHECKED_IN`, `IN_SERVICE`, `COMPLETED`, `CANCELLED`, `NO_SHOW`;
- source: `PUBLIC_WEB`, `MANAGER`, `RECEPTION`, `STAFF`, `WALK_IN`, `IMPORT`;
- customer and internal notes separated;
- subtotal/discount/total in tetri;
- cancellation reason, cancelled by and timestamp;
- confirmation/reschedule/cancel token hash for customer self-service;
- created/updated timestamps and creator.

`appointment_services`

- appointment + service snapshot;
- service name snapshot;
- duration snapshot;
- price snapshot;
- staff if services can have different staff later;
- sort order.

`appointment_status_history`

- old/new status;
- actor;
- timestamp;
- reason and metadata.

### Payments, commissions and expenses

`payments`

- appointment;
- amount in tetri;
- method: cash, card terminal, bank transfer, online, other;
- status: pending, paid, partially refunded, refunded, failed;
- external reference nullable;
- collected by and timestamp;
- notes.

Support unpaid/partial/paid appointment totals. Initial launch may record external terminal/cash payments without processing cards online.

`commission_rules` and `commission_entries`

- percentage and/or fixed rule;
- staff/service specificity;
- immutable calculated snapshot for completed appointments;
- manager adjustment with reason and audit record.

`expenses` (required for accurate profit reporting)

- category;
- amount in tetri;
- date;
- location;
- description/receipt reference;
- creator;
- archived status.

### Notifications, sessions and audit

`notification_jobs`

- appointment/client target;
- channel SMS/email/WhatsApp abstraction;
- template key and locale;
- scheduled time;
- status, attempt count, last error and provider message ID;
- idempotency key.

`sessions`, `password_reset_tokens`, `staff_invites` as required by the auth implementation.

`audit_logs`

- organization;
- actor;
- action and entity type/id;
- sanitized before/after or metadata;
- IP/user-agent where appropriate;
- timestamp.

Audit at least: login security events, role/permission changes, staff changes, service price changes, appointment edits/cancellations, payment changes, commission overrides, exports and client merges.

## 6. Availability and booking engine — critical correctness

This is the heart of the system. Implement it on the server and test it thoroughly.

Availability for a selected service/staff/date must be generated from:

1. location opening hours and closures;
2. staff working-hour rules and exceptions;
3. staff-service eligibility;
4. selected services' total duration;
5. staff-specific duration overrides;
6. buffer-before/buffer-after;
7. existing non-cancelled appointments;
8. blocked times, breaks and leave;
9. booking lead time, maximum future booking window and slot interval;
10. location timezone.

Rules:

- Public availability is never trusted from the client. Recalculate and revalidate on the server immediately before insert.
- Prevent double booking under concurrency. Two simultaneous requests for the same slot must not both succeed. Use a database transaction plus an appropriate lock/advisory lock/serializable strategy or a documented database-native exclusion approach.
- Database indexes must support staff/date calendar and overlap queries.
- Cancelled appointments do not block time; other relevant statuses do.
- Rescheduling is atomic: the old appointment is not lost if the new slot fails.
- Duration and price are snapshotted when booked so later service edits do not mutate history.
- “Any specialist” returns the earliest valid staff/slot and assigns the selected staff transactionally.
- Slot interval is configurable (default 15 minutes).
- Default minimum notice: 1 hour. Default future window: 60 days. Both manager-configurable.
- Default cancellation/reschedule cutoff: 2 hours before. Manager override is allowed and audited.
- Store UTC timestamps; render in `Asia/Tbilisi`. Tests must cover date boundaries and timezone conversion.
- Never compute sensitive availability solely by filtering arrays in the frontend.

## 7. Public salon website and booking experience

Create a real public-facing salon experience under public routes. It must be optimized for mobile because most customers will book by phone.

Required routes (exact path can be adapted but deep links must work):

- `/` — salon landing page with brand, services, selected staff, working hours, location/contact and strong booking CTA;
- `/services` — public service categories, duration and prices;
- `/team` — public bookable staff profiles;
- `/book` — the booking flow;
- `/booking/:publicToken` — customer booking details with secure cancel/reschedule actions;
- `/booking/:publicToken/success` or an equivalent confirmation state;
- `/login`, `/forgot-password`, `/reset-password` — staff/manager auth only;
- privacy/booking terms pages.

Do not build a generic SaaS pricing/blog marketing site unless requested later. This should first represent the owner's real salon.

### Public booking flow

Use the existing prototype as a starting point and implement these real steps:

1. **Location** only if more than one active location exists; otherwise skip automatically.
2. **Services:** filter by category, display duration and price, support one or more compatible services if the engine supports it. Disable unavailable/archived items.
3. **Specialist:** “any available” plus eligible public staff only. Show name, specialty and optional photo/bio.
4. **Date/time:** load real server-calculated slots. Provide clear empty/loading/error states and next available date. No stale-slot booking.
5. **Customer details:** full name, Georgian phone number, optional email, notes, required booking-terms consent and separate optional marketing consent.
6. **Verification:** support provider-based SMS OTP if enabled. In development, use a clearly labeled local test adapter; never expose a production OTP in logs or UI.
7. **Confirmation:** show service, staff, local date/time, location, price, cancellation policy and add-to-calendar link/download.

Public self-service:

- secure unguessable link/token;
- view booking without exposing other client data;
- cancel with reason within policy;
- reschedule through real availability;
- expired/revoked token handling;
- rate limits against enumeration/abuse.

Use normalized `+995` Georgian phone input. Provide input masks only if they do not interfere with paste/autofill/accessibility.

## 8. Internal application routes and features

All internal pages must use real URLs and survive refresh/deep-linking. Suggested routes:

- `/app/today`;
- `/app/calendar`;
- `/app/clients` and `/app/clients/:id`;
- `/app/services`;
- `/app/staff` and `/app/staff/:id`;
- `/app/reports`;
- `/app/history`;
- `/app/settings/*`;
- `/app/profile`.

### Today dashboard

Manager/owner view:

- today's revenue collected and expected;
- number of appointments by status;
- confirmed/completed/no-show counts;
- team workload cards;
- upcoming bookings;
- unconfirmed/attention-needed appointments;
- open schedule gaps;
- quick actions for booking, walk-in and client;
- link to full calendar and reports.

Staff view:

- only own day unless broader permission exists;
- next appointment and client context;
- own appointments, duration and status;
- allowed check-in/start/complete/no-show actions;
- own daily/weekly performance if enabled;
- no unauthorized organization-wide financial visibility.

### Calendar

Manager/reception:

- day/team/week views;
- date navigation and today shortcut;
- staff filters, service/status/source filters and search;
- vertical time grid with one staff column per selected employee;
- status/source indicators not conveyed by color alone;
- create booking by clicking an empty slot;
- open/edit booking by clicking a card;
- drag/drop and resize only if implemented accessibly and safely, with confirmation, server validation and rollback on failure;
- working-hour/background visualization;
- current-time indicator;
- conflict warning;
- mobile alternative as an agenda/list view rather than an unusable squeezed grid.

Staff:

- own calendar by default;
- cannot move or edit another staff member's appointment without permission.

### Internal booking and walk-in

Provide a clear modal/drawer flow:

- existing client search by name/phone;
- quick new-client creation;
- walk-in mode without mandatory client;
- service selection;
- eligible staff;
- real date/time availability;
- price and duration snapshot;
- internal/customer notes;
- confirmation/source/status;
- conflict protection;
- success feedback and calendar invalidation.

### Booking details

The booking detail drawer/page must provide:

- complete summary;
- status history;
- client contact/profile link;
- service/staff/time/price;
- notes separated by visibility;
- confirmation/reminder state;
- payment state and payment collection;
- reschedule, cancel, no-show and complete actions;
- permission-aware actions;
- audit metadata for sensitive changes.

### Client CRM

- paginated/searchable/sortable list;
- debounced search by name/normalized phone/email;
- filters for recent, inactive, no-show and marketing consent;
- create/edit/merge/archive;
- client detail with contact, preferences, notes, visit timeline, spend/LTV, cancellations/no-shows and future bookings;
- CSV export gated by permission and audit logged;
- CSV formula-injection protection;
- privacy-safe display and no unnecessary data exposure to staff.

### Services

- category CRUD and ordering;
- service CRUD, archive/restore and ordering;
- price/duration/buffer and online booking toggles;
- staff eligibility and staff-specific overrides;
- commission rule assignment;
- validation against zero/negative values and unreasonable durations;
- historical appointments unchanged after edits.

### Staff

- invite staff/manager/receptionist;
- activate/disable, archive while preserving history;
- profile, specialty, public visibility and calendar color;
- working hours, split shifts, breaks and time off;
- offered services and overrides;
- role/permissions;
- own and manager-visible metrics;
- staff calendar and future appointments;
- invitation state and resend/revoke actions.

### Finance and reports

At minimum:

- daily/weekly/monthly/custom date filters;
- gross booked revenue, collected revenue, unpaid balance, refunds and discounts;
- appointment count and average ticket;
- utilization/occupancy;
- completion/cancellation/no-show rates;
- new vs returning clients;
- revenue and booking counts by service, category and staff;
- payment method breakdown;
- staff commission due/paid calculation;
- expenses and simple gross margin (`collected - refunds - commissions - expenses`) with explicit labeling;
- downloadable CSV respecting the active filters;
- charts with accessible legends/tooltips and corresponding tabular data.

All reporting queries must use real database data and correct status/payment semantics. Do not hardcode numbers or calculate production totals from visible page rows only.

### History and audit

- appointment history table with date range, client, staff, category, service, price, source, payment and status filters;
- pagination and CSV export;
- owner/manager audit log for sensitive changes;
- audit metadata must not store password hashes, reset tokens, OTPs or payment secrets.

### Settings

Include:

- salon and location information;
- public booking slug/URL and copy button;
- logo/cover with persistent object storage;
- timezone/currency (timezone changes guarded);
- opening hours and closures;
- booking lead time/window/slot interval/buffers/cancellation cutoff;
- notification templates and timing;
- payment methods;
- roles/permissions overview;
- data export and owner-only security actions;
- branding tokens where safe.

## 9. Notifications and provider integrations

Implement a provider abstraction so the app is functional without hardcoding a vendor:

```ts
interface NotificationProvider {
  sendSms(input): Promise<ProviderResult>
  sendEmail(input): Promise<ProviderResult>
}
```

Required events:

- booking created/confirmed;
- booking rescheduled;
- booking cancelled;
- configurable reminder (default 24 hours and/or 2 hours before);
- staff invitation;
- password reset;
- optional daily staff agenda.

Requirements:

- queued jobs with retry/backoff;
- idempotency keys to prevent duplicate reminders;
- provider response IDs and sanitized errors;
- do not block a successfully committed booking merely because an SMS provider is temporarily down;
- show notification state internally;
- dev/test provider writes sanitized messages to a local test sink, never real customer destinations unless explicitly configured;
- Manus secrets only for provider credentials.

WhatsApp may be a later adapter. Do not pretend it is integrated if credentials/provider approval are absent.

## 10. API and backend quality requirements

- Authenticate and authorize every protected request server-side.
- Scope every organization-owned query by authenticated organization. Prevent IDOR/cross-tenant reads even though only one salon launches initially.
- Validate route params, query params and bodies with shared schemas.
- Standardize error codes and safe Georgian messages. Do not leak stack traces/SQL/provider errors to clients.
- Paginate large clients/history/audit lists server-side.
- Apply transactions to multi-record booking, payment, commission, merge and reschedule operations.
- Use idempotency for public booking confirmation, payment recording where appropriate and notification jobs.
- Add rate limits to login, reset, OTP, public availability and booking endpoints.
- Add CSRF protection if required by the selected session approach.
- Configure CORS narrowly for the production origin.
- Sanitize uploads by MIME, size and extension. Store on persistent object storage, not an ephemeral local path.
- Generate thumbnails/optimized WebP or AVIF for user-uploaded images while preserving originals when needed.
- Never trust client-supplied organization IDs, roles, total price, staff eligibility or availability.
- Use database constraints for uniqueness/referential integrity in addition to application validation.
- Use soft archive for business records referenced by history.
- Add useful indexes and inspect slow queries for calendar/reports.

## 11. Frontend design direction

Preserve the **SalonFlow** visual identity demonstrated in `APP-SOURCE`:

- warm premium salon character;
- charcoal/ink primary surfaces;
- clay/terracotta primary action;
- off-white/paper backgrounds;
- muted green for success, restrained violet/gold as secondary data colors;
- rounded but not childish surfaces;
- subtle elevation and soft borders;
- calm, professional density;
- Georgian-first typography using `Noto Sans Georgian` or a verified high-quality Georgian font;
- Lucide outline icons, consistent stroke and sizes;
- no emoji used as structural icons.

Improve the prototype rather than copying it blindly:

- create semantic tokens for color, typography, spacing, radius, shadow and z-index;
- ensure small secondary text remains readable; production body text should generally be at least 14–16px depending on context;
- maintain 4.5:1 text contrast and visible keyboard focus;
- make touch targets at least 44×44px;
- avoid hover-only behavior;
- 150–300ms meaningful transitions and `prefers-reduced-motion` support;
- loading skeletons/spinners, empty states, error states, offline/retry messaging and success feedback;
- no raw browser `alert`/`confirm` for core workflows; use accessible dialogs;
- no layout shifts during loading;
- no fake disabled buttons or dead controls;
- cards/tables/charts must not rely on color alone;
- Georgian copy must fit without clipping.

### Responsive requirements

Test and fix at 320, 375, 390, 430, 768, 1024 and 1440 widths.

- No accidental page-level horizontal scrolling.
- Sidebar becomes an accessible drawer on smaller screens.
- Desktop team calendar becomes an agenda/list or controlled horizontal schedule on mobile.
- Tables use a deliberate card/scroll strategy, with key actions still reachable.
- Modal dialogs become safe bottom sheets/full-screen flows on mobile when needed.
- Sticky headers/footers must not obscure focus or scroll content.
- Respect safe areas where relevant.
- Large text/zoom at 200% must not make core actions unusable.

### Accessibility

Target WCAG 2.2 AA for core flows:

- semantic landmarks and heading hierarchy;
- labels and descriptions for fields;
- inline validation associated with fields;
- proper button/link semantics;
- keyboard-operable calendar alternatives;
- focus trap/return for dialogs;
- aria-live feedback for async booking/form results;
- descriptive labels for icon-only controls;
- high contrast status text/icon, not color alone;
- skip link;
- reduced motion;
- automated axe checks plus manual keyboard testing.

## 12. Form and interaction standards

- Use correct input types (`tel`, `email`, date/time controls where appropriate).
- Mark required/optional fields clearly.
- Validate on blur and submit; do not punish users while typing incomplete values.
- Keep user input after recoverable API errors.
- Disable repeated submission while pending and show progress.
- Server errors map to safe field/general messages.
- Confirm destructive actions with exact consequences.
- Unsaved-change protection on substantial edit forms.
- Search/filter input should be debounced/deferred.
- Filter state should be shareable/persisted in URL when useful.
- Date/time display uses consistent Georgian locale and location timezone.
- Money format is consistent GEL while stored as integer tetri.

## 13. Database, migrations and seed

- Commit complete versioned migrations. Do not rely on runtime schema push in production.
- Provide `.env.example` with variable names and safe descriptions only.
- Provide a development seed that creates:
  - one organization and one location;
  - owner/manager, receptionist and four staff accounts using non-production demo credentials;
  - realistic categories/services;
  - working hours and a few exceptions;
  - sample clients and appointments across statuses;
  - sample payments/expenses for reports.
- Seed is idempotent and never runs automatically in production.
- Provide a safe initial-owner bootstrap mechanism using a one-time command/environment input. Do not hardcode a production password.
- Backups and restore expectations must be documented for the selected managed database.
- Never run destructive reset/drop/truncate operations on a production database.

## 14. Environment variables

Names may adapt to the final providers, but document at least:

```text
NODE_ENV
APP_URL
API_URL (only if separate)
DATABASE_URL
SESSION_SECRET
INITIAL_OWNER_EMAIL (bootstrap only)
INITIAL_OWNER_PHONE (bootstrap only)
OBJECT_STORAGE_ENDPOINT
OBJECT_STORAGE_REGION
OBJECT_STORAGE_BUCKET
OBJECT_STORAGE_ACCESS_KEY_ID
OBJECT_STORAGE_SECRET_ACCESS_KEY
SMS_PROVIDER
SMS_API_KEY
SMS_SENDER_ID
EMAIL_PROVIDER
EMAIL_API_KEY
EMAIL_FROM
SENTRY_DSN (optional)
ANALYTICS_ID (optional and consent-aware)
```

Server secrets must never use public frontend prefixes and must never appear in source, screenshots, logs, reports or the final response. Return an environment checklist containing names/status only, never values.

## 15. Security and privacy baseline

- OWASP-aware authentication and authorization;
- password/reset/OTP hashes never returned by APIs;
- generic login/reset responses to reduce account enumeration;
- session rotation and revocation;
- rate limiting and basic abuse protection;
- secure headers/CSP where compatible;
- CSRF strategy documented;
- PII minimized in logs;
- public booking tokens stored hashed when practical;
- exported CSV authorization and auditing;
- data retention/archive/deletion workflow documented;
- consent captured separately for booking terms and marketing;
- cookie/analytics consent only if non-essential analytics are enabled;
- dependency audit and no known critical vulnerabilities at handoff;
- secrets configured only in Manus environment controls.

## 16. Automated testing and quality gates

Use a real test strategy, not only manual clicking.

### Unit tests

- money utilities;
- phone normalization;
- timezone/date utilities;
- permission checks;
- commission calculations;
- availability slot generation;
- cancellation cutoff rules.

### Integration tests

- login/session/logout/reset;
- role and organization access boundaries;
- service/staff eligibility;
- create/reschedule/cancel appointment;
- simultaneous booking attempts against the same slot: exactly one succeeds;
- walk-in creation;
- status transitions;
- payment recording and commission snapshot;
- client deduplication/merge;
- reporting totals;
- notification idempotency/retry.

### End-to-end tests

At minimum with Playwright or equivalent:

1. Customer completes public booking and receives confirmation state.
2. Customer tries a stale/taken slot and receives a safe alternative without duplicate booking.
3. Manager logs in, creates client booking, reschedules, records payment and completes appointment.
4. Manager creates a walk-in booking.
5. Staff logs in and sees only permitted schedule/data.
6. Unauthorized staff cannot access manager finance/staff APIs by direct URL/API request.
7. Manager creates/edits service and staff working hours; availability changes accordingly.
8. Manager filters reports and downloads a safe CSV.
9. Customer cancels/reschedules using a public token within policy.
10. Mobile 390px booking and staff flows complete without horizontal overflow.

### Build/quality commands

Use one package manager consistently and commit its lockfile. The supplied prototype includes `package-lock.json`, so `npm ci` is valid for the initial audit. If you deliberately migrate the full-stack project to pnpm, remove the obsolete npm lockfile, commit `pnpm-lock.yaml`, document the choice and use frozen installs thereafter. Provide and run scripts equivalent to:

```text
npm ci
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Keep and commit a valid lockfile. Fix all new errors. The production build must pass.

## 17. Performance and observability

- sensible code splitting/lazy loading for internal modules;
- no giant initial bundle caused by reports/calendar if avoidable;
- optimized fonts and images;
- reserve image dimensions to avoid CLS;
- cache safe reference data while invalidating mutations correctly;
- virtualize/paginate large lists;
- debounce search;
- backend health/readiness endpoint;
- structured request/job logs with correlation IDs and redaction;
- error monitoring integration point (Sentry optional);
- basic operational documentation for failed notifications and database migrations.

Target a good mobile public booking experience on normal network conditions. Measure before premature optimization, but do not ship obvious N+1 queries or unbounded lists.

## 18. Deployment requirements

- Import into a private Manus project.
- Use a persistent managed production database.
- Use persistent object storage for uploads.
- Run migrations as a controlled deploy step.
- Create separate development/preview and production environment concepts where Manus supports them.
- Publish first to a private/temporary HTTPS preview URL.
- Do not buy/connect a custom domain without owner approval.
- Do not enable real SMS/email sends to customers until provider credentials and test recipients are approved.
- Do not enable online card charging without explicit owner approval and production credentials.
- Configure secure cookies and correct trusted origins for the preview/production URL.
- Verify refresh/deep links for all routes.

## 19. Things that must be changed from the attached prototype

The following are explicitly not production-ready and must be replaced:

- hardcoded demo arrays in `App.jsx`;
- fake statistics and chart data;
- fake role toggle that changes UI without real authentication/authorization;
- fake login credentials and client-side-only login state;
- booking steps that do not call a server;
- fake availability/time slots;
- client data displayed from source constants;
- all dead buttons and non-persistent edits;
- one-file component architecture;
- lack of real routes/deep links;
- lack of database/API/migrations;
- lack of concurrency protection;
- lack of loading/error/empty states;
- lack of automated tests;
- external Google Font dependency if production policy/performance favors self-hosting;
- any accessibility/contrast/font-size issues found during audit.

Reuse the good parts:

- SalonFlow brand direction and palette;
- Georgian-first interface;
- dashboard/card visual language;
- manager/staff mental model;
- quick booking and public booking concepts;
- responsive sidebar/drawer approach;
- Lucide icon system;
- the information hierarchy that tests well after the audit.

## 20. Definition of done

Do not say “complete” merely because pages render. Completion requires all of the following:

- persistent database and migrations work on a clean environment;
- real secure login/logout/reset and role permissions;
- manager sees/manages all authorized team calendars;
- staff sees only authorized personal data;
- public booking calculates real availability and persists;
- concurrent double booking is prevented and tested;
- internal client and walk-in booking persists;
- client/service/staff/schedule CRUD persists with validation;
- booking reschedule/cancel/status/payment flows work;
- reports use real database data and totals are tested;
- notification adapter/jobs and dev/test mode exist;
- audit logs exist for sensitive changes;
- public and internal routes work on refresh;
- responsive flows work at required widths;
- accessibility baseline is verified;
- lint/typecheck/unit/integration/E2E/build pass;
- no console errors, broken assets, raw placeholders or Georgian encoding issues;
- no secrets in source/logs/final report;
- preview deployment is live over HTTPS;
- setup, migration, seed, environment and operational instructions are current.

## 21. Final deliverables

Return:

1. live Manus HTTPS preview URL;
2. repository/project structure summary;
3. architecture and database summary;
4. migrations executed and seed counts;
5. role/permission matrix;
6. environment variable checklist by name/status only;
7. build, lint, typecheck, unit, integration and E2E results;
8. responsive/accessibility test matrix;
9. files/areas materially changed from the prototype;
10. provider integrations that are live, test-only or waiting for owner credentials;
11. remaining owner decisions/placeholders;
12. exact custom-domain and production-provider activation steps, but do not perform them without approval.

## 22. Final instruction

Start by auditing the package and presenting the concise implementation plan. Then execute the plan and continue until the production-ready preview and required test evidence are delivered, unless genuinely blocked by an external credential or owner-only business decision. Do not substitute mock data for a missing backend, do not call a static prototype “full stack,” and do not silently skip any acceptance criterion.
