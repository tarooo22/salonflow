# SalonFlow — პირველი კლასის სალონის Booking პლატფორმის სრულყოფის გეგმა

## მიზანი

SalonFlow უნდა იქცეს **საქართველოს სალონებისთვის მარტივ, სანდო და პრემიუმ booking/operations პლატფორმად**. პროდუქტის მთავარი დაპირებაა: მფლობელმა რამდენიმე წამში დაინახოს რა არის დღეს გასაკეთებელი, ადმინისტრატორმა შეცდომის გარეშე მართოს ჩანაწერები, სპეციალისტმა იმუშაოს მხოლოდ საკუთარ უსაფრთხო სივრცეში, ხოლო კლიენტმა მობილურიდან სწრაფად დაჯავშნოს სასურველი სერვისი.

ამ გეგმის შედეგად Dashboard აღარ იქნება მხოლოდ მონაცემების ეკრანი. ის გახდება **ყოველდღიური სამუშაოს მართვის ცენტრი**, სადაც ჩანს მხოლოდ კონტექსტურად საჭირო ინფორმაცია და არის მკაფიო პასუხი კითხვაზე — „ახლა რა უნდა გავაკეთო?“

## არსებული საფუძველი და რეალური დანაკლისები

პროდუქტში უკვე არსებობს მრავალფილიალიანობა, ადგილობრივი ელფოსტა/პაროლით ავტორიზაცია, როლები, კალენდარი, საჯარო booking, CRM, სერვისები, გუნდი, ოპერაციები, POS/მარაგი, მედია, ანგარიშები, PWA, public ka/en/ru surface და role-based security. ასევე მოქმედებს integer-tetri ფულად აღრიცხვაზე, booking conflict protection და public booking-ის უსაფრთხო მართვა.

შემდეგი ეტაპი არ უნდა გამეორებდეს უკვე შექმნილ ფუნქციებს. მან უნდა გააუმჯობესოს **გასაგებობა, onboarding, გადაწყვეტილების სიჩქარე, ვიზუალური იერარქია, booking conversion და ოპერაციული ნდობა**.

| სფერო | არსებული საფუძველი | მთავარი გაუმჯობესება |
|---|---|---|
| Dashboard | Today queue, KPI, quick actions, branch selector | ნაკლები კოგნიტიური დატვირთვა, role-specific priorities და actionable guidance |
| Booking | public discovery, multi-service, waitlist, reschedule/cancel | სწრაფი არჩევანი, მეტი ნდობა, უკეთესი მობილური flow და conversion-oriented copy |
| Onboarding | workspace setup + launch checklist | ინტერაქტიული, skip-able, resume-able პროდუქტის tour ყველა როლისთვის |
| Calendar/Operations | day/week views, drag/reschedule, walk-in, attendance | კონტექსტური დახმარება, ნაკლები შეცდომა, keyboard-safe alternatives და clearer statuses |
| CRM/Team | clients, history, staff profile, avatars | უფრო მარტივი workflow, next-best action, profile completeness და ownership clarity |
| Finance/Reports | integer-tetri reports, charts, CSV | გასაგები განმარტებები, manager-safe summaries, metric definitions და decision prompts |
| Public brand | salon profile, feed, services, team, media | რეალური ვიზუალური მასალა, SEO hygiene, trustworthy booking handoff და share surfaces |

## პროდუქტის პრინციპები

1. **დღის ოპერაცია პირველია.** ყველა dashboard გადაწყვეტილება იწყება კითხვით: ეხმარება თუ არა ეს სალონს დღეს ჯავშნის, კლიენტის ან გადახდის მართვაში.
2. **ერთ ეკრანზე ერთი მთავარი მიზანი.** ზედმეტი chart, დიდი ცარიელი card და განმეორებითი CTA უნდა შემცირდეს.
3. **როლზე მორგებული სირთულე.** მფლობელს მეტი კონტროლი, მენეჯერს/ადმინისტრატორს სწრაფი ოპერაციები, სპეციალისტს მხოლოდ საკუთარი სამუშაო და პროფილი.
4. **სალონის რეალური მონაცემები.** არ დაემატება გამოგონილი review, ფასი, სტატისტიკა, ფოტო ან availability claim.
5. **უსაფრთხოება დიზაინის ნაწილია.** UI არ იქნება permission-ის შემცვლელი; ყველა მნიშვნელოვანი კონტროლი რჩება server-side policy-ით დაცული.
6. **მობილური booking-first, desktop operations-first.** კლიენტის flow 375px-ზე უნდა იყოს სწრაფი და ერთსვეტიანი, ხოლო ოპერაციული desktop სივრცე — მკვრივი და სკანირებადი.
7. **ქართული სამუშაო ენა.** workspace-ის ტექსტები, თანხები, თარიღები და status labels რჩება ka-GE; public language selector გამოიყენება მხოლოდ კლიენტის-facing ზედაპირებზე.

## სამიზნე გამოცდილება

### მფლობელი

შესვლის შემდეგ ხედავს დღევანდელ მდგომარეობას: რამდენი booking აქვს, ვინ ელოდება დადასტურებას, რა არის შემდეგი ვიზიტი, რა თანხაა მისაღები და რომელი setup ნაბიჯი უშლის ხელს ონლაინ booking-ის დაწყებას. მას შეუძლია ერთიდან სამ მოქმედებამდე გადავიდეს Calendar-ზე, Team-ზე, Service-ზე ან branch booking link-ზე.

### მენეჯერი და ადმინისტრატორი

იღებენ მცირე, სწრაფი ოპერაციების ზედაპირს: „დასადასტურებელი“, „ახლა იწყება“, „შემდეგი“, „walk-in“, „კლიენტის პოვნა“. მათ არ უნდა შეხვდეთ მფლობელის ფინანსური/ორგანიზაციული setup კონტროლი.

### სპეციალისტი

ხედავს საკუთარ დღევანდელ სამუშაოს, საკუთარ კალენდარს, attendance action-ს და „ჩემი პროფილი“ entry-ს. იგი ვერ ხედავს სხვის schedule-ს, branch management-ს ან სალონის online visibility decision-ს.

### კლიენტი

იღებს სალონის ნამდვილ public გვერდს, სერვისებს, სპეციალისტებს, ფილიალს, სამუშაო კონტექსტს, შესაძლო დროს და უსაფრთხო booking confirmation-ს. მას შეუძლია მართოს საკუთარი booking მხოლოდ token-protected public link-ით.

## ეტაპობრივი განხორციელების გეგმა

| ფაზა | მიზანი | მთავარი შედეგი | დამოკიდებულება |
|---|---|---|---|
| **1** | Dashboard simplification და UX foundation | ერთიანი ოპერაციული იერარქია, role dashboards, reusable workspace primitives და readiness model | დაიწყება დამტკიცებისთანავე |
| **2** | Guided product tour და contextual help | პატარა interactive დახმარების ფანჯარა: შემდეგი/წინა/skip/გათიშვა/განახლება | ფაზა 1-ის stable target elements |
| **3** | Public booking conversion და salon brand polish | უფრო სწრაფი mobile booking, ნდობის კონტენტი, clearer booking handoff | ფაზა 1-ის design tokens |
| **4** | Daily operations clarity | Calendar, queue, walk-in, CRM, Team და POS workflows-ის გამარტივება | ფაზები 1–2 |
| **5** | Owner control, reports და growth surfaces | setup health, KPI explanations, public link/share, profile completeness, report clarity | ფაზები 1–4 |
| **6** | Provider-dependent activations | Email/SMS, push ან deposits მხოლოდ verified provider/policy-ის შემდეგ | მომხმარებლის credentials და policy გადაწყვეტილებები |
| **7** | ხარისხი, performance და live rollout | accessibility, test coverage, performance budget, responsive QA და release checkpoint | ყოველი ფაზის დასრულება |

---

## ფაზა 1 — მარტივი და უფრო გასაგები Dashboard (პირველი იმპლემენტაციის ფაზა)

### 1.1 Dashboard-ის ახალი ინფორმაციული იერარქია

Today გვერდი გარდაიქმნება „დღის მართვის“ ეკრანად და არა სრული სისტემის შეჯამებად. ზედა ნაწილში დარჩება მხოლოდ: ფილიალის არჩევა, მიმდინარე დღის თარიღი და 1–2 ყველაზე მნიშვნელოვანი მოქმედება. KPI-ები მაქსიმუმ ოთხი იქნება და თითოეულს ექნება განმარტება ან მოქმედების გზა.

| ბლოკი | რას აჩვენებს | ვის ხედავს | მოქმედება |
|---|---|---|---|
| **ახლა / შემდეგი** | მიმდინარე და შემდეგი appointment, დრო, კლიენტი, სერვისი, სპეციალისტი | ყველა შესაბამისი როლი | Calendar ან უსაფრთხო status transition |
| **საჭირო ყურადღება** | pending confirmations, outstanding balance, setup blocker | Owner/Manager შესაბამისი scope-ით | პირდაპირი filtered queue |
| **დღის მოკლე შედეგი** | bookings, completed, scheduled/collected/outstanding GEL | როლით შეზღუდული | განმარტება ან Reports entry |
| **სწრაფი მოქმედებები** | Walk-in, Calendar, ახალი კლიენტი, booking link/Team/Service | role-specific | პირდაპირი, permission-safe route |
| **შემდეგი setup ნაბიჯი** | მხოლოდ არასრულყოფილ სამუშაო სივრცეში: სერვისი, გუნდი, საათები, public link | Owner | ერთი ნაბიჯი, progress and completion state |

### 1.2 Role-specific dashboard modes

Dashboard shell საერთო იქნება, მაგრამ card order და actions განსხვავდება.

| როლი | Dashboard-ის პრიორიტეტი | დაუშვებელი distraction |
|---|---|---|
| OWNER | business health, setup readiness, approvals, public booking readiness | staff-level task clutter პირველ ეკრანზე |
| MANAGER | daily queue, confirmations, schedule changes, client service | branch configuration და owner-only finance setup |
| RECEPTIONIST | arrivals, today queue, walk-in, client lookup, payments context | reports, team configuration, public profile management |
| STAFF | own next booking, own day, attendance, own profile completion | სხვისი კლიენტები/კალენდარი, ფინანსები, branch settings |

### 1.3 „რა უნდა გავაკეთო?“ დახმარების ფენა

ფაზა 1 მოამზადებს reusable `ContextualHelp` architecture-ს: action label, მოკლე განმარტება, ერთი next route და state-aware copy. მაგალითად, ცარიელი calendar არ იტყვის მხოლოდ „მონაცემი არ არის“ — მფლობელს შესთავაზებს სამუშაო საათების შემოწმებას, ადმინისტრატორს Calendar-ის გახსნას, ხოლო სპეციალისტს საკუთარი განრიგის ნახვას.

### 1.4 Design system cleanup

ფაზა 1-ში გადაწყდება და დოკუმენტირდება semantic tokens, რათა Dark Luxury დარჩეს პრემიუმ, მაგრამ dashboard გახდეს უფრო მარტივი: ზედაპირი, elevated surface, selection, focus, success/warning/danger, status pills, chart palette, borders, shadows, radius, spacing და motion tokens. კომპონენტებში არ დაემატება შემთხვევითი ფერები ან page-specific CSS.

### 1.5 ფაზა 1-ის acceptance criteria

ფაზა წარმატებულია, თუ მფლობელი 10 წამში ხედავს დღის მთავარ რისკს, ადმინისტრატორი 2 მოქმედებით მიდის confirmation-ზე, სპეციალისტი ხედავს მხოლოდ საკუთარ სამუშაოს, პირველადი setup blocker არის კონკრეტული და actionable, ხოლო 375px/768px/1024px/1440px ეკრანებზე არ ჩნდება horizontal scroll.

---

## ფაზა 2 — Interactive Guided Tour და დახმარების ფანჯარა

### 2.1 ფუნქციური მოთხოვნა

იქმნება პატარა, არააგრესიული დახმარების flow, რომელიც პირველად გამოჩნდება შესაბამისი role-ის dashboard-ზე და ყოველთვის ხელახლა გაეშვება Help/კითხვის ნიშნის ღილაკით. მისი მიზანია არა პროდუქტის რეკლამა, არამედ სამუშაოს სწავლება.

| ელემენტი | ქცევა |
|---|---|
| Spotlight + anchored popover | აქტიურ UI ელემენტს უსვამს მსუბუქ highlight-ს და განმარტავს მის დანიშნულებას |
| ნაბიჯები | „წინა“, „შემდეგი“, პროგრესი მაგალითად `2 / 6` |
| გამოტოვება | „ახლა გამოტოვება“ ინახავს progress-ს და არ აჩვენებს განმეორებით ავტო-launch-ზე |
| გათიშვა | „აღარ მაჩვენო ავტომატურად“; Help menu-დან ხელახლა გაშვება ყოველთვის შესაძლებელია |
| დასრულება | მოკლე completion state და ერთი contextual CTA, არა მოულოდნელი redirect |
| Mobile fallback | თუ spotlight ელემენტი off-screen არის, გამოიყენება ცენტრში მოთავსებული dialog/card, არა უხარისხო overlay |
| Accessibility | focus trap მხოლოდ modal fallback-ში; Esc, keyboard navigation, focus restoration, `aria-live` progress, reduced-motion support |

### 2.2 Role-specific tour content

| როლი | რეკომენდებული ნაბიჯები |
|---|---|
| OWNER | Today → setup health → Services → Team → work hours → branch booking link → Reports/Settings |
| MANAGER | Today queue → confirm booking → Calendar → Client card → Walk-in → daily operations |
| RECEPTIONIST | Today → client search → booking status → Calendar → Walk-in → payment context |
| STAFF | own today → own calendar → attendance → own profile → help restart |

### 2.3 Persistence და privacy გადაწყვეტილება

Tour-ის progress უნდა იყოს **მომხმარებლისა და ორგანიზაციის scope-ით** შენახული, რათა სხვადასხვა მოწყობილობაზე არ დაიკარგოს. ინახება მხოლოდ: tour version, completed step, dismissed/disabled flag და timestamps. არ ინახება კლიენტის, booking-ის ან ფინანსური შინაარსი. ახალი feature-ისთვის tour version იზრდება, ხოლო უკვე დასრულებული ძირითადი tour თავიდან არ აწუხებს მომხმარებელს.

### 2.4 Test coverage

დაიწერება unit/integration tests შემდეგი სცენარებისთვის: role-specific steps, forward/back behavior, skip, disable, resume, version update, missing anchor fallback, Esc/focus behavior, reduced motion, responsive modal fallback და denied route-ის არარსებობა tour CTA-ში.

---

## ფაზა 3 — Public Booking Conversion და სალონის ციფრული ვიტრინა

### 3.0 Home page — SalonFlow-ის მთავარი public entry point

Home page ასევე შეიცვლება Phase 3-ში, მაგრამ არ გადაიქცევა generic SaaS landing page-ად. მისი მთავარი მიზანი იქნება სამიზნე სალონის მფლობელისთვის და მომხმარებლისთვის მკაფიოდ გადმოსცეს: **„ონლაინ ჩაწერა, ყოველდღიური ოპერაციები და გუნდის მართვა ერთ ქართულ პლატფორმაში.“** Dark Luxury ვიზუალური მიმართულება შენარჩუნდება, თუმცა ინფორმაციული იერარქია გამარტივდება.

1. Hero-ში დარჩება ერთი ძირითადი CTA — სამუშაო სივრცის შექმნა/დაწყება — და ერთი secondary CTA რეალური booking flow-ის სანახავად.
2. დაემატება მოკლე, ფაქტობრივ შესაძლებლობებზე დაფუძნებული flow: public booking → დღიური queue → გუნდი/კალენდარი → reports; არ დაემატება გამოგონილი ფასები, reviews, კლიენტების რაოდენობა ან წარმატების სტატისტიკა.
3. Marketing ტექსტი იქნება ქართული-first, ხოლო public locale switcher შენარჩუნდება არსებული ka/en/ru საზღვრებით.
4. 375px-ზე CTA, navigation, proof/feature sections და footer იქნება ერთსვეტიანი, სწრაფი და keyboard-accessible; desktop-ზე შეინარჩუნებს პრემიუმ ვიზუალურ ჰიერარქიას ზედმეტი animation-ის გარეშე.
5. დაემატება route-level loading, focus, contrast, reduced-motion და performance QA; არსებული booking/auth CTA routes არ შეიცვლება server contract-ის გარეშე.

### 3.1 Booking-ის გაუმჯობესება

მიზანი არის ნაკლები არჩევანის დაღლა და მეტი ნდობა. არ იცვლება არსებული authoritative availability, eligibility, booking conflict ან token security contract.

1. Booking discovery-ს დაემატება კატეგორიებით სწრაფი შესვლა, მომსახურების გამარტივებული ბარათები, ხანგრძლივობა/ფასი/„დან“ განმარტება და უკეთესი search/filter მხოლოდ არსებული მონაცემით.
2. სპეციალისტის არჩევა აჩვენებს რეალურ სახელს, სპეციალიზაციას, experience years-ს, avatar-ს და მხოლოდ eligible services-ს.
3. მობილურზე flow დარჩება ერთსვეტიანი: სერვისი → სპეციალისტი → დრო → მონაცემები/confirmation, მუდმივად ხილული მოკლე summary-ით.
4. თითოეული ეტაპი მიიღებს inline validation-ს, progress-ს, preserved choices-ს, loading/error/empty state-ს და keyboard-safe back behavior-ს.
5. Confirmation გვერდი მკაფიოდ გამოყოფს booking detail-ს, calendar export-ს, manage/cancel/reschedule link-ს და არ დაჰპირდება SMS/email-ს მანამ, სანამ provider არ იქნება აქტიური.

### 3.2 Public salon profile და asset quality

სალონის public გვერდი მიიღებს profile-completeness guidance მფლობელისთვის: cover, logo/avatar conventions, branch address, active price list, verified contact, team bio, alt text და consent-safe gallery/feed. გამოიყენება მხოლოდ სალონის რეალური, ნებართვით ატვირთული ფოტოები. AI-generated imagery იქნება მხოლოდ optional decorative placeholder/illustration, არასოდეს რეალური სალონის, მომსახურების, პერსონალის ან შედეგის ცრუ წარმოდგენა.

### 3.3 Image asset workflow

თუ მფლობელი გადაწყვეტს marketing illustrations-ის შექმნას, მზადდება reuse-able prompt kit შემდეგი კატეგორიებისთვის: luxury salon atmosphere, neutral appointment illustration, clean product/beauty abstract background და staff portrait guidance. ყველა prompt განსაზღვრავს subject, setting, lighting, composition, aspect ratio და negative constraints; generated materials მკაფიოდ ვერ ჩაანაცვლებს ნამდვილ სალონის/კლიენტის ფოტოებს.

---

## ფაზა 4 — ყოველდღიური ოპერაციების გამარტივება

### Calendar

Calendar-ზე დარჩება day/week resource logic, თუმცა ვიზუალური hierarchy გამარტივდება: first-class „ახლა“, „შემდეგი“, clear booking blocks, filter context, booking status legend და mobile day/list flow. Drag-and-drop-ს ექნება keyboard/button alternative, confirmation feedback და conflict explanation.

### Client / CRM

Desktop table დარჩება მონაცემებით მდიდარი, mobile card — ერთი შეხედვით წასაკითხი. Client detail მიიღებს ზედა „შემდეგი საუკეთესო მოქმედება“ ნაწილს: ახალი booking, ბოლო ვიზიტი, შენიშვნა, თანხმობა და balance context. Client-facing communication არ ჩაირთვება provider-ის გარეშე.

### Team, Services და Operations

Team-ზე მფლობელს ექნება setup completeness indicator (profile, branch, schedule, eligibility, public visibility), სპეციალისტს — საკუთარი profile/availability context. Services-ზე გამოჩნდება category, duration, integer-tetri price, online state და staff eligibility მარტივი status language-ით. Operations-ზე attendance, walk-in, tips და POS დარჩება role-scoped, მაგრამ თითოეულ action-ს ექნება მოკლე განმარტება და safe empty/error states.

---

## ფაზა 5 — მფლობელის კონტროლი, ფინანსური clarity და ზრდის ზედაპირები

### Dashboard health და onboarding checklist

მფლობელის Today ზედაპირს დაემატება „Salon readiness“ checklist: branch contacts, working hours, bookable services, eligible/visible team, public booking link, booking policy wording და media/profile completeness. ის არ შეცვლის owner approval-ს და არც ავტომატურად გამოაქვეყნებს მონაცემს.

### ანგარიშები და ფინანსური განმარტებები

Reports-ში ყველა metric მიიღებს short definition: booked value, collected value, outstanding balance, refund handling, commission status და forecast limitation. დაემატება date preset-ები, filter summary, export context და chart/table parity keyboard მომხმარებლისთვის. ფინანსური მონაცემები დარჩება მხოლოდ SalonFlow-ის own organization-scoped database-ზე და integer tetri-ზე; external market/stock data არ არის საჭირო ამ პროდუქტის ფუნქციისთვის.

### Share და growth readiness

მფლობელი Settings/branch readiness surface-დან მარტივად დააკოპირებს public booking link-ს, ნახავს მის preview-ს და გააზიარებს მხოლოდ იმ სოციალურ არხებში, რომლებზეც თავად იღებს გადაწყვეტილებას. SEO/meta data, canonical URLs, localized public navigation და schema markup შემოწმდება რეალური სალონის კონტენტზე.

---

## ფაზა 6 — Provider-dependent შესაძლებლობები (მხოლოდ საჭირო prerequisites-ის შემდეგ)

| შესაძლებლობა | რა სჭირდება დაწყებამდე | რა არ გაკეთდება წინასწარ |
|---|---|---|
| Email confirmation/reminder | verified sender domain, provider API credential, consent/opt-out policy, scheduler monitoring | რეალური გაგზავნა ან ყალბი „აქტიურია“ toggle |
| SMS reminder | ქართული ნომრების provider, sender ID approval, opt-in/legal policy, retry/idempotency design | SMS dispatch, background cron send |
| Deposit/prepayment | payment provider, merchant account, booking/deposit/refund/no-show policy, webhook signature/reconciliation | თანხის ჩამოჭრა ან „დეპოზიტი მიღებულია“ claim |
| Web Push | VAPID keys, explicit subscription consent, unsubscribe, secure storage/delivery endpoint | permission prompt ან push შეტყობინება |

## ყოველი ფაზის არასაკომპრომისო ხარისხის ჩარჩო

ყველა ცვლილება შემოწმდება 375px, 768px, 1024px და 1440px viewports-ზე. გამოყენებული იქნება keyboard-only flow, visible focus, semantic labels, screen-reader-friendly text alternatives, WCAG AA contrast, light/dark/system modes, reduced-motion behavior და 44px+ pointer targets.

კრიტიკულ flow-ებზე დაემატება unit/integration tests: authorization, organization/branch scope, booking availability, status transitions, onboarding persistence, tour state, error/empty/loading states და money calculations. ყოველი release დასრულდება TypeScript check-ით, production build-ით, regression suite-ით, responsive visual QA-ით, console review-ით და restore-able checkpoint-ით.

## Performance და technical quality backlog

1. არსებული დიდი shared bundle-ის audit და route/component code-splitting, განსაკუთრებით Reports-dependent code-ისთვის.
2. Image pipeline review: responsive sizes, lazy loading, reserved aspect ratio, S3 key safety და WebP/AVIF strategy მხოლოდ მხარდაჭერილ შემთხვევაში.
3. Query invalidation და optimistic update audit high-frequency actions-ისთვის, რათა queue/status ცვლილება სწრაფად და სწორად აისახოს.
4. Error boundary და retry affordance consistency ყველა protected/public route-ზე.
5. Audit log visibility მხოლოდ შესაბამისი owner/manager scope-ით მნიშვნელოვანი ოპერაციული ცვლილებებისთვის.
6. Public SEO/structured-data regression checks და noindex boundaries დაცული management routes-ისთვის.
7. Deployment checklist: HTTPS cookies, environment validation, migration review, backup/rollback routine და no-secret-in-client verification.

## თანმიმდევრობა და დამოკიდებულებები

ფაზა 1 პირველია, რადგან მის გარეშე guided tour უბრალოდ არსებულ რთულ navigation-ს ახსნის. ჯერ უნდა გამარტივდეს dashboard hierarchy და სტაბილური, role-aware UI targets ჩამოყალიბდეს; ამის შემდეგ ფაზა 2 დააბამს guided tour-ს ამ target-ებზე. Public booking polish პარალელურად არ შეცვლის server booking safeguards-ს, ხოლო provider-bound ფუნქციები შეგნებულად რჩება ბოლოს.

## ვარაუდები და ღია გადაწყვეტილებები

1. სამუშაო ენა დარჩება ქართული, ხოლო public ka/en/ru surface არ თარგმნის სალონის მიერ შეყვანილ ტექსტს ავტომატურად.
2. მფლობელი კვლავ ფლობს final control-ს role, branch assignment, online booking visibility, public feed და ორგანიზაციულ პარამეტრებზე.
3. Tour-ის completion state რეკომენდებულია persist-დეს server-ში მომხმარებლის/ორგანიზაციის scope-ით; მისი ზუსტი UX copy დამტკიცდება ფაზა 1-ის UX audit-ის შემდეგ.
4. რეალური ფოტოები, reviews, ფასები და სტატისტიკა მხოლოდ მფლობელის მიერ მიწოდებული/დადასტურებული მონაცემებით გამოჩნდება.
5. Email, SMS, payment და push არ გააქტიურდება სანამ მათი verifier/provider/policy prerequisites არ იქნება მიწოდებული.

## ფაზა 1-ის პირველი სამუშაო პაკეტი დამტკიცების შემდეგ

დამტკიცების შემდეგ დავიწყებ მხოლოდ ფაზა 1-ს: მიმდინარე Today/dashboard route-ების role-by-role audit, new information architecture, shared dashboard primitives, owner/manager/receptionist/staff screen specification, existing API contract-ის reuse map, responsive wireframe-level implementation plan, regression test matrix და შემდეგ თავად dashboard refactor-ს. Guided tour, public booking redesign და provider integrations არ დაიწყება მანამ, სანამ ფაზა 1 არ გაივლის design, security და responsive validation-ს.
