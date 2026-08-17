# SalonFlow — Completion Roadmap

**თარიღი:** 2026-08-17  
**საფუძველი:** მიმდინარე source, tRPC procedure inventory, route/test inventory, public-route visual review და არსებული implementation documentation.

## 1. მიმდინარე პროდუქტის რეალური მდგომარეობა

SalonFlow უკვე წარმოადგენს ფუნქციურ ქართულ, მრავალფილიალიან ოპერაციულ სისტემას. Local email/password authentication, role-based organization scope, onboarding, გუნდის invitations, სამუშაო საათები, services, CRM, Today, Calendar, payments, expenses, commissions, Reports/CSV და public booking ხელმისაწვდომია. Public booking იცავს availability re-check, idempotency, Georgian phone normalization, service/staff eligibility და token-based confirmation boundary-ს.

### დადასტურებული ძლიერი მხარეები

| მიმართულება | მიმდინარე შესაძლებლობა | Audit დასკვნა |
|---|---|---|
| ავთენტიკაცია და scope | Local session, protected procedures, organization/location/role validation | ძირითადი უსაფრთხოების საზღვარი არსებობს; დაუდასტურებელი OAuth ან გარე identity provider არ უნდა დაბრუნდეს. |
| ოპერაციები | Today queue, Calendar, walk-in, reschedule, status transitions | ყოველდღიური სამუშაო flow ფუნქციურია და არ საჭიროებს ხელახლა აშენებას. |
| CRM და გუნდი | Client detail/care/consents/merge; team, hours, exceptions, invitations | ძირითადი operational depth უკვე რეალურია. |
| ფინანსები | Payments, expenses, commission rules/entries/backfill, Reports charts და CSV | თანხები ინახება მხოლოდ integer tetri-ით და უნდა დარჩეს ასე. |
| Online booking | Discovery, catalog, availability, final conflict check, idempotency, confirmation token | უსაფრთხოების საფუძველი ძლიერი არის, მაგრამ არჩევისა და post-booking გამოცდილება შეიძლება გამდიდრდეს. |
| ხარისხი | 39 Vitest files / 116 tests ბოლო audit checkpoint-ში, TypeScript და production build | ცვლილება უნდა გაგრძელდეს test-first და full regression წესით. |

## 2. Audit-ის მთავარი gaps

| პრიორიტეტი | Gap | გავლენა | უსაფრთხო რეაგირება |
|---|---|---|---|
| P0 | Public discovery cards აკლია საკმარისი decision context: სამუშაო საათები და პირდაპირი კონტაქტი | სტუმარმა შესაძლოა გახსნას ბევრი booking flow მხოლოდ ინფორმაციის სანახავად | გაფართოვდეს უკვე public booking location payload და card UI მხოლოდ უკვე ფილიალის მიერ მითითებული phone/email/working-hours მონაცემებით. |
| P0 | Booking confirmation მხოლოდ token-ს აჩვენებს და სტუმარს არ აძლევს საკუთარ კალენდარში ვიზიტის შენახვის შესაძლებლობას | post-booking friction; ვიზიტი მარტივად იკარგება | დაემატოს client-side `.ics` calendar export რეალური არჩეული service/time/location/staff მონაცემებით; არ შეიცვალოს appointment API. |
| P0 | Keyboard skip-to-content pattern ჯერ მხოლოდ Home/shared marketing layout-ზეა | `/book`, development demo და 404 public routes-ზე repeated navigation კვლავ გამოტოვებადი არ არის | shared public header + focusable main target გავრცელდეს ამ public routes-ზე. |
| P1 | Public booking token არსებობს, მაგრამ სტუმრის თვითმომსახურების appointment view/cancel/reschedule flow არ არსებობს | მომხმარებელს ცვლილებისთვის სალონთან კონტაქტი სჭირდება | ცალკე, token-protected view/mutation design: expiry, allowed statuses, audit history და final availability re-check. ეს საჭიროა მხოლოდ სრული security review-ის შემდეგ. |
| P1 | Account security-ს აკლია self-service password change და explicit session/device management | owner/staff account hygiene შეზღუდულია | დაამატოს current-password-verified password change; session rotation/revocation design. Password reset email/SMS არ ჩაირთოს verified sender provider-ის გარეშე. |
| P1 | Calendar/Reports ინფორმაცია ძლიერია, მაგრამ recurring operational patterns (მრავალდღიანი განმეორებადი booking/expense workflows) არ არის public contract | ხელით განმეორებადი მონაცემის შეყვანა | ცალკე scope: recurrence model, exceptions, timezone, edit scope და finance snapshot rules; schema ცვლილება მხოლოდ migration plan-ის შემდეგ. |
| P2 | Notification delivery, sender identity და reminders არაა კონფიგურირებული | booking reminders ვერ იგზავნება | მომხმარებლისგან საჭიროებია verified sender domain, provider credentials, From identity, consent policy და webhook/retry design. მანამდე არ უნდა დაიმალოს როგორც "ჩართული". |
| P2 | Payment gateway/billing plans არაა კონფიგურირებული | ონლაინ გადახდა და subscription billing არ მუშაობს | საჭიროა owner confirmation: Stripe ან Shopify არჩევანი, legal/business rules, refund policy, currency/tax handling. |
| P2 | Public pages ვიზუალურად თანმიმდევრულია, მაგრამ secondary routes ზედმეტად ერთნაირ CTA-template-ს ეყრდნობა | ბრენდი ნაკლებად salon-native და product-evidence-rich ჩანს | ეტაპობრივი visual content system: booking slots, team/service chips, queue strips და Reports snippets; არ დაემატოს გამოგონილი testimonials/rates. |
| P3 | Production bundle-ს აქვს non-blocking chunk-size advisory | მომავალში შეიძლება საწყისი load გაუარესდეს | ჯერ measurement/budget, შემდეგ route-level import audit. არ დაბრუნდეს წინა unsafe Vite manualChunks split dependency-graph test-ის გარეშე. |

## 3. განხორციელების რიგი

### Milestone A — Public conversion and accessibility hardening (ამ checkpoint-ში)

- [x] გაფართოვდეს `/book` ფილიალის card-ები არსებული public phone/email/working-hours მონაცემებით.
- [x] დაემატოს booking confirmation-ის `.ics` calendar export რეალური ვიზიტის ინფორმაციით.
- [x] გავრცელდეს skip-to-content და focusable main target `/book`, `/preview-demo` და `/404` public surfaces-ზე.
- [x] დაემატოს targeted tests, ka-GE labels, desktop/mobile QA და სრული regression validation.

### Milestone B — Secure self-service booking management (design and approval next)

- [ ] შეიქმნას token-protected booking detail/management contract.
- [ ] დაემატოს pending/confirmed appointment-ის safe cancel/reschedule mutation, slot re-check და status/audit events.
- [ ] შეიქმნას tamper/expiry/error coverage და privacy review.

### Milestone C — Account and workspace security (after Milestone B)

- [ ] current-password-verified password change.
- [ ] session rotation/revocation and activity context.
- [ ] privacy-safe error/empty/audit messages.

### Milestone D — Owner-dependent integrations (blocked until inputs)

- [ ] Verified transactional sender + provider integration, consent, retry/webhook policy and reminder schedule.
- [ ] Online payment/billing integration after the owner confirms provider and business policies.

### Milestone E — Scale and brand evolution (after product flows)

- [ ] recurring operations design with migration plan.
- [ ] deeper public product evidence and distinctive salon-operations visual motifs.
- [ ] measured performance budget and safe bundle optimization.

## 4. Non-negotiable implementation rules

1. Existing local auth, organization/location/role scope, availability logic, booking conflict protection, finance integer-tetri math and API contracts remain unchanged unless the roadmap explicitly approves a reviewed contract change.
2. No fabricated customer reviews, ratings, testimonials, prices, support contacts, notification delivery or payment capability may be shown.
3. All public interactive paths need ka-GE content, mobile-first layout, visible focus, keyboard operation, error/empty/loading states and `prefers-reduced-motion` respect.
4. Every milestone requires focused tests, full Vitest, TypeScript, production build and visual review before checkpointing.

## 5. Current execution decision

Milestone A is selected for immediate implementation because it increases public booking conversion, reduces post-booking friction and closes a known accessibility consistency gap without requiring secrets, a database migration, external provider activation or modification of the appointment/finance contracts.
