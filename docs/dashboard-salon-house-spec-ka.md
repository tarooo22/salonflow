# SalonFlow Dashboard — Salon House Operations Specification

## მიზანი

Workspace უნდა იყოს **მშვიდი, სწრაფად გასაგები სალონის სამუშაო ინსტრუმენტი** და არა public marketing გვერდის ასლი. ის იყენებს Salon House-ის თბილ accent-ებსა და მკაფიო ზედაპირებს, მაგრამ ინარჩუნებს მაღალ ინფორმაციულ სიმჭიდროვეს, რეალურ მონაცემებსა და ერთი შეხედვით წასაკითხ ოპერაციულ პრიორიტეტებს.

## უცვლელი კონტრაქტები

| საზღვარი | მოთხოვნა |
|---|---|
| ავტორიზაცია | მხოლოდ არსებული local email/password session და protected route flow |
| scope | ორგანიზაცია, აქტიური ფილიალი და membership როლი server-ზე მოწმდება; UI არ აფართოებს მონაცემის ხილვადობას |
| ფული | ყველა გამოთვლა რჩება integer-tetri-ში; UI მხოლოდ არსებული ka-GE formatter-ით აჩვენებს მნიშვნელობებს |
| booking | availability, eligibility, status transition, idempotency და final conflict check არ იცვლება |
| მედია | public/owner-approved boundaries უცვლელია; dashboard მხოლოდ protected მართვას აჩვენებს |

## Role-specific სამუშაო სურათი

| როლი | პირველადი გადაწყვეტილება | მეორე რიგის მოქმედება | არასდროს გამოჩნდება |
|---|---|---|---|
| მფლობელი | დღევანდელი მზადყოფნა, attention, revenue context | booking link, გუნდი, სერვისები, ანგარიშები | სხვა ორგანიზაციის/ფილიალის მონაცემი |
| მენეჯერი | მომლოდინე booking-ები და დღიური queue | Calendar, Clients, Operations | owner-only catalog/report/media მართვა |
| რეცეფცია | სტუმრის მიღება, queue, Walk-in | Calendar, Clients, POS | ფინანსური/სერვისის ადმინისტრირება |
| სპეციალისტი | საკუთარი ახლა/შემდეგი ვიზიტი | საკუთარი Calendar, attendance, profile | სხვისი კლიენტები, branch-wide analytics, ორგანიზაციული control |

## Stage A — shell და Today

Dashboard shell ინარჩუნებს role-filtered navigation-ს, მაგრამ item-ები დაჯგუფდება ოპერაციულად: **დღის მართვა**, **კლიენტები და გაყიდვა**, **სალონის მართვა**. Mobile header აჩვენებს მიმდინარე page-სა და Help trigger-ს; desktop sidebar ინარჩუნებს keyboard-visible active state-ს. Today რჩება decision-first: ახლა/შემდეგი, attention, metrics, role-safe quick actions, readiness და queue. არ ემატება ახალი server query ან permission.

## Stage B — Calendar და CRM

Calendar მიიღებს უფრო წაკითხვად დროის grid hierarchy-ს desktop-ზე და day/list fallback-ს mobile-ზე. CRM აერთიანებს სწრაფ search/result state-ს, client details-სა და next-action context-ს. მოქმედებები იყენებს მხოლოდ მიმდინარე router-სა და `canManageAppointmentQueue`/role gates-ს.

## Stage C — Team, Operations და POS

Team ინარჩუნებს owner-only ორგანიზაციულ მართვას და specialist self-profile boundary-ს. Operations და POS აშკარად გამოყოფს attendance, tips, retail sale და stock context-ს; ეს არ ააქტიურებს external payment capture-ს.

## Stage D — Reports და Settings

Reports აუმჯობესებს metric definitions, range context და forecast caveat readability-ს რეალური data source-ის ფარგლებში. Settings აჯგუფებს workspace, security, appearance, booking link, provider readiness და public profile management მოქმედებებს ისე, რომ inactive notification/payment მდგომარეობა არ წარმოაჩინოს აქტიურად.

## ხარისხის კარიბჭე ყოველი Stage-ისთვის

ყოველი Stage-ის შემდეგ სავალდებულოა შესაბამისი Vitest ცვლილება ან დამატება, TypeScript, production build, 375px და 1280px visual review, keyboard focus/reduced-motion შემოწმება და server-scope regression. ახალი dashboard ფაზა არ იწყება მანამ, სანამ მიმდინარე ფაზის ეს კარიბჭე არ გაივლის.

## Stage A QA finding

Unauthenticated browser review-ზე `/app/today` არ აჩვენებს workspace მონაცემს და უსაფრთხოდ გადადის არსებულ local `/login?returnTo=%2Fapp%2Ftoday` flow-ზე. ეს ადასტურებს protected-route boundary-ს. Populated role-specific shell-ის ვიზუალური review დარჩება authenticated QA session-ის ხელმისაწვდომობისას; მიმდინარე ავტომატური coverage ამოწმებს route grouping-ს, role filters-სა და Today decision helpers-ს.
