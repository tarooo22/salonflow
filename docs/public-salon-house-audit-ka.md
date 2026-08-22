# SalonFlow Public Surface Audit — Salon House მიმართულება

## Audit scope

შემოწმებულია ყველა მიმდინარე public/auth route: Home, Features, Pricing, Demo, FAQ, Contact, public booking discovery/flow/management/waitlist, public salon profile და local authentication/invite entry points. Audit ეფუძნება მოქმედ route map-სა და source-level UI behavior-ს; იგი არ წარმოადგენს გამოგონილ მომხმარებლის კვლევას ან ბაზრის სტატისტიკას.

## დადასტურებული ძლიერი მხარეები

| Surface | არსებული ძლიერი მხარე | შენარჩუნების წესი |
|---|---|---|
| Public route architecture | Home, marketing, booking, salon profile და local auth routes უკვე მკაფიოდ გამოყოფილია. | Public redesign არ აერთიანებს public და dashboard shell-ს; public pages ინარჩუნებს lazy route loading-ს. |
| Booking safety | Discovery, 4-step booking, waitlist და token management არსებობს; availability საბოლოოდ server-ზე მოწმდება. | UI არასოდეს აცხადებს slot-ს საბოლოოდ დაჯავშნილად availability/commit contract-ის მიღმა. |
| Truthful commerce | Pricing, contact, notifications და payment boundaries უკვე არ აჩვენებს არარსებულ ფასებს ან provider capability-ს. | New content იმეორებს ამ transparency rule-ს; არ ემატება fake pricing/reviews/revenue. |
| Public identity | Public header/footer, locale selector, PWA entry და Dark Luxury tokens უკვე არსებობს. | ისინი გარდაიქმნება Salon House დიზაინში საერთო primitives-ით, არა page-by-page განსხვავებული CSS-ით. |
| Auth | Local email/password UI, validation და role-safe return route მოქმედებს. | არ ემატება OAuth/Manus-თან დაკავშირებული copy ან flow. |

## აღმოჩენილი Public UX შესაძლებლობები

| პრიორიტეტი | პრობლემა/შესაძლებლობა | გადაწყვეტა |
|---|---|---|
| P0 | Public pages ვიზუალურად ერთ სისტემას ეკუთვნის, მაგრამ ზოგიერთი section ჯერ generic SaaS card stack-ს ჰგავს. | Shared Salon House primitives: editorial heading, service/specialist/location cards, quiet trust note, image frame, content-readiness state და flow-line section transition. |
| P0 | Home/Features/Demo ერთმანეთისგან საკმარისად არ განსხვავდება user decision-ის დონეზე. | თითო route იღებს ერთ მთავარ job-ს: Home = არჩევანი/გზა; Features = capability-to-scenario; Demo = labelled walkthrough; FAQ = risk removal. |
| P0 | რეალური სალონის მედია შესაძლოა ცარიელი იყოს ახალ workspace-ში. | Owner-controlled S3 media რჩება პრიორიტეტად; არარსებული მედიისთვის აბსტრაქტული Salon House fallback + truthful readiness prompt. |
| P1 | Booking route ძლიერია, მაგრამ discovery → choice → management narrative უნდა იყოს ერთი ბრენდული flow. | Same service/specialist/time/status language, compact mobile summary, explicit waitlist semantics და stable error recovery patterns. |
| P1 | Auth უკვე ფუნქციურია, თუმცა public brand shell-ის თანმიმდევრული integration საჭიროებს polish-ს. | Local-auth truthfulness, password/recovery context, state contrast და mobile header rhythm განახლდება shared foundation-ის შემდეგ. |
| P1 | Public salon profile შეიცავს კარგი რეალური მონაცემის boundaries-ს, მაგრამ media/team/service readiness უფრო editorial და სალონის-კონტექსტური უნდა გახდეს. | Branch identity, service price/duration card hierarchy, team profile framing, consent note და booking handoff დახვეწა. |
| P2 | Pricing და Contact არ მალავს არარსებულ კომერციულ capability-ს. | არ ჩაემატება content მანამ, სანამ owner არ დაადასტურებს plans/contact channel; მხოლოდ უფრო კარგი transparent state და CTA. |

## Salon House brand system

### Positioning

SalonFlow არის **სალონის ყოველდღიური ნაკადის მშვიდი მართვა**: კლიენტისთვის გასაგები online booking და გუნდისთვის როლზე მორგებული სამუშაო სივრცე. Public tone უნდა იყოს სტუმართმოყვარე, თბილი და editorial; სამუშაოს/უსაფრთხოების ტექსტი — პირდაპირი და ზუსტი.

### Visual grammar

1. **Canvas:** obsidian/plum base, warm terracotta/champagne highlights, jade მხოლოდ safe/success availability semantics-სთვის.
2. **Signature motif:** discreet time-slot / flow-line, რომელიც აერთიანებს hero, booking progress, service cards და section transitions-ს. იგი არასოდეს გამოიყენება როგორც fake chart ან KPI.
3. **Composition:** dark card monotony იცვლება editorial split, calm product context, service/menu rhythm და conversion scenes-ით.
4. **Imagery:** real owner media პირველ რიგში; illustrative asset მხოლოდ generic, clearly non-testimonial context-ში, optimized WebP/AVIF/S3 და ქართული alt text-ით.
5. **Motion:** 120–240ms, transform/opacity-only, subtle tap confirmation; reduced-motion preference გამორთავს decorative entrance/parallax effect-ს.

### Voice

| კონტექსტი | ხმა |
|---|---|
| Booking | მშვიდი, კონკრეტული, არაპრესიული: „აირჩიეთ სერვისი“, „დრო ხელმისაწვდომობას მოწმდება“. |
| Owner setup | პროფესიული და მხარდამჭერი: „ამ ნაბიჯით თქვენი booking link მზად იქნება“. |
| Error | მკაფიო recovery: „მონაცემები არ დაგიკარგავთ — შეამოწმეთ კავშირი და სცადეთ ხელახლა“. |
| Empty media/content | truthful readiness: „ჯერ არ არის დამატებული“ + შესაბამისი owner next action. |
| Commercial | არ გამოიყენება ფასის, გარანტიის, შეტყობინების ან გადახდის დაპირება რეალური configuration-ის გარეშე. |

## Public IA decisions

| Route | Primary visitor job | Primary CTA | Secondary/recovery path |
|---|---|---|---|
| `/` | გაიგოს SalonFlow და აირჩიოს owner ან client გზა | შექმენი სამუშაო სივრცე | ონლაინ ჩაწერის ნახვა |
| `/features` | შეადაროს სამუშაო პრობლემა და მხარდაჭერილი capability | workflow-ის ნახვა | workspace შექმნა |
| `/pricing` | გაიგოს commercial availability truthfully | workspace შექმნა | product tour |
| `/demo` | ნახოს labelled product walkthrough | workspace შექმნა | online booking |
| `/faq` | მოიხსნას გადაწყვეტილების/უსაფრთხოების ეჭვი | პირველი ფილიალის გახსნა | booking discovery |
| `/contact` | იცოდეს რეალური contact status | local account/signup | safe login |
| `/book` | იპოვოს აქტიური სალონი | სალონის არჩევა | search/filter reset |
| `/book/:slug` | შეასრულოს booking | booking submit | back / waitlist / contact context |
| `/manage-booking/:token` | მართოს საკუთარი მოთხოვნა | reschedule/cancel as allowed | safe status explanation |
| `/salon/:slug` | გაეცნოს სალონს და დაჯავშნოს | online booking | services/team/contact context |
| local auth | შეიქმნას/შევიდეს workspace account-ში | secure submit | recovery / alternate auth route |

## Phase 0 exit criteria

Public route family, brand grammar, content rules, role/security boundaries, media policy და test matrix დოკუმენტირებულია. შემდეგი ფაზა იმუშავებს მხოლოდ shared design primitives-ზე; არც ერთი backend, payment, notification, booking, consent ან auth contract არ იცვლება ამ audit-ის შედეგად.
