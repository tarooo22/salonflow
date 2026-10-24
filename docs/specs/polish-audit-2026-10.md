# Chawera polish audit (2026-10-24)

Judged against docs/specs/chawera-redesign-2026-10.md. Direction is fixed; this is polish and consistency.
Decisions: brand stays Latin "Chawera" inside Georgian sentences (wordmark "ჩაწერა" only as logo; no brand eyebrows). Customer-facing pages use informal შენ; business-facing pages (panel, login/register, partner, pricing, features, FAQ, contact, privacy) use formal თქვენ. Keep SMS, Instagram, Facebook, VIP. "შესვლის ID" and the brows category icon stay as they are.

## 1. Global
1. catalog.css: delete dead appointment-card CSS (~lines 67–132: .cw-stack/.cw-tabs/.cw-tab/.cw-sheet/.cw-card*/.cw-field/.cw-perf-line/.cw-ticket*/.cw-stamp-mark/.cw-ledger*/.cw-rule-top + media queries) after grepping .tsx/.ts for each class.
2. `.cw-btn-line` (catalog.css ~62) → `border:1px solid var(--sf-border-strong); color:var(--sf-text)`, hover `background:var(--sf-surface-2)`. Same 1px for `.hm-band-btn--line` (discovery.css ~240, stays white).
3. `.cw-btn-stamp` (catalog.css ~59) and `.cw-consent-accept` (~196): `color: var(--primary-foreground)` (dark accent needs dark text).
4. index.css ~219–243: delete leftover `.dark … [class*="text-[#…]"]` !important overrides. CatalogChrome.tsx skip link `bg-white` → existing `.sf-skip-link`.
5. No dashed boxes: ui/empty.tsx drop border-dashed; workspace/SettingsPrimitives.tsx:19,28 → `rounded-[12px] bg-[var(--sf-surface-2)]` no border; Media.tsx:69,72 empty texts → `.cwk-state` markup; Staff.tsx:268,278 dashed → solid border. (Cancelled ticket dashed border in panel.css stays.)
6. One public empty state `.cw-empty` in catalog.css: surface-2, radius 16, padding 24, 40px accent-soft circle + 20px accent-ink icon, title 16/700, one muted 14 line, one action. Use on /my-bookings, /saved, /salons/map, /products, /vacancies.
7. New `client/src/components/ui/file-picker.tsx`: visually hidden input[type=file] + label styled `buttonVariants({variant:"outline"})` "ფაილის არჩევა" + file name or muted "ფაილი არ არის არჩეული"; passes accept/id/aria-describedby/onChange. Replace native inputs in Media, ClientGallery, Staff, PanelProducts, BillingActivation.
8. panel.css: `.cwk-main form [data-slot="select-trigger"]{width:100%}`.
9. New `client/src/lib/phone.ts` `formatPhoneDisplay("+995599352314")` → "+995 599 35 23 14" (+test). Use in Clients, SalonProfile phone link, Today rows.
10. No ISO dates (Today day-close "2026-10-24" → Georgian long date); no English dates (waitlist picker "Saturday, October 24" → "შაბათი, 24 ოქტომბერი" via lib/presentation Georgian formatters); Operations amount placeholder "10.00" → "მაგ. 10"; "5 MB" spelling everywhere.
11. Rename status tone "violet" → "accent" (WorkspacePrimitives.tsx, panel.css; callers PanelVacancies.tsx, AdminVacanciesSection.tsx).
12. Accent text on plum band: use #F48A9B (PartnerLanding Facebook link etc.).
13. Settings "ანიმაციების შემცირება" is saved but never read → see motion §4.1.

## 2. Per page
Public
1. Home.tsx / HomeMotion.tsx: remove mock "ჯავშანი დადასტურდა 14:30" chip (keep real category-count chip); `Float` must not loop forever (run once or drop).
2. Home SalonLoading: card-shaped skeleton (4/3 cover + 3 bars 60/40/30%, .sf-skeleton, radius 16, border).
3. Home "ყველა კატეგორია" chips: only categories without a photo tile.
4. MarketplaceDirectory phone (<640): search full width 44px; city becomes first chip ("ქალაქი" + chevron opening the existing select); filter area ≤150px.
5. SalonProfile/profile.css: (a) phone formatted, ink + Phone icon, underline on hover only; (b) tab strip edge-fade mask when overflowing; (c) stray pill above sticky bar on phone (~y=1405) — inspect and hide <1024; (d) main padding-bottom calc(88px + safe-area).
6. BookingFlow/booking.css: (a) keep "-დან" (isFromPrice) in rows and total like SalonProfile; (b) top bar title "ჩაწერა" nowrap+ellipsis; (c) nothing selected → only disabled "აირჩიე სერვისი"; (d) "სამუშაო საათები და კონტაქტი" → ghost button with Clock + chevron inside salon row right.
7. Waitlist/GeorgianDateTimePicker: (a) drop "← " double arrow; (b) Georgian date; (c) 1440 time field overflows card → grid minmax(0,1fr), fields min-w-0 w-full; (d) same step heading style for steps 1 and 2; (e) phone hint "ფორმატი: 5XX XX XX XX".
8. LocalAuth: (a) double focus box still there → remove wrapper focus-within outline, only input ring; (b) remove "ჩაწერა" wordmark above card; (c) password eye inside input as trailing 40px ghost icon button (pr-12), aria-label "პაროლის ჩვენება"/"პაროლის დამალვა".
9. MyBookings/Saved: top padding 32 desktop / 24 phone like /salons; shared chrome root `min-h-dvh flex flex-col`, main flex-1 so footer sits at bottom on short pages.
10. MarketplaceMap: delete technical disclosure line; empty: "ამ ფილტრით რუკაზე ადგილი ჯერ არ ჩანს." / "ადგილი რუკაზე მხოლოდ მფლობელის თანხმობით ჩნდება." / action "სიის ნახვა".
11. Products/Vacancies/commerce.css: no plum hero band (band is for business band only) → /salons pattern (H1+lede on ground, filter card surface+border); delete leftover ticket header row ("თარიღი 24.10.2026 … chawera.ge").
12. NotFound: delete "№ 404" pill and "chawera.ge" row; "404" as 12/600 muted caption.
13. MarketingPages/marketing.css: ~150px dead space hero→first card → section gaps 72/48; drop "Chawera" eyebrows; pricing card icon in 40px accent-soft tile.
14. PartnerLanding: comparison cards 1 per row below 1280 with 50/50 columns inside; band link colour (#F48A9B).
Panel
15. Today: "შემდეგი ჯავშანი" + "დღეს მეტი ჯავშანი აღარ არის." (drop redundant lines); "გადასახდელია" mark gets Wallet icon; day-close Georgian date.
16. Clients: drop "შიდა" chip (mark only "ონლაინ ჩაწერა"); formatted phones; phone filters: row1 search, row2 [source select flex-1][ხედები 44px icon].
17. Staff: P0 phone page is 819px wide → wrap hours table in `-mx-4 overflow-x-auto px-4`, min-w-0 on grid parents; "ფოტო" button → row kebab "ფოტოს შეცვლა"; stats 3-col grid label above value; name one line ellipsis, role chip line 2; exceptions empty: line "დაამატეთ გამონაკლისი, თუ სპეციალისტი რომელიმე დღეს არ მუშაობს." + secondary "გამონაკლისის დამატება".
18. Settings: section nav → ui/tabs pill style (accent-soft active), scroll + edge fade on phone; theme ღია/მუქი/სისტემა as one `.cwk-seg` with aria-pressed; "შეტყობინებები აპში" caption margin 16/8, 14/600 muted; save full width on phone.
19. POS: "კოდი (SKU)" → "არტიკული"; uniform label block (label, optional hint, gap 6) so inputs share a baseline.
20. Operations: metric "არ ხართ" → "სამუშაოზე არ ხართ"; placeholder/selects per global 8/10.
21. MarketplaceSetup: page is 7,220px desktop / 13,743px phone (every category lists all services). Per category show linked services as removable chips + "სერვისის მიბმა" Popover with ui/command search; collapse categories without links into "სხვა კატეგორიები ({n})".
22. Media/ClientGallery: file picker; dashed placeholders; disabled "ატვირთვა"/"პოსტის შენახვა" → Button outline disabled tokens + helper "ჯერ აირჩიეთ ფაილი.".
23. PanelVacancies: empty list shows "ვაკანსიის დამატება" twice → drop from empty state.
24. Reports: "CSV" → "ექსპორტი" with title "CSV ფაილად ჩამოტვირთვა".

## 3. Copy
Informal (customer): BookingFlow (14 formal strings, e.g. "რა გსურთ დღეს?" → "რომელი სერვისი გჭირდება?", "აირჩიეთ…" → "აირჩიე…", "მიუთითეთ სახელი" → "მიუთითე სახელი"), ManageBooking, Waitlist, Book, MarketplaceMap, MarketplaceDirectory, SalonProfile, Products, Vacancies, VacancyDetail, NotFound, GeorgianDateTimePicker, ka strings in PublicLocaleContext.
Formal: Privacy.tsx:42 "ჩაეწერე" → "ჩაეწერეთ"; Staff.tsx:283 "ნახე" → "ნახეთ".
English → Georgian:
- server/routers/marketplace.ts:58-63,120: "cover ფოტო" → "ტიტულური ფოტო" (action "ტიტულური ფოტო ატვირთეთ გვერდზე „მედია და პროფილი“."); alt action "დაამატეთ ტიტულური ფოტოს მოკლე აღწერა ქართულად."; "online booking" → "ონლაინ ჩაწერა" (action "ჩართეთ ონლაინ ჩაწერა და დატოვეთ მინიმუმ ერთი აქტიური სერვისი, რომელზეც ონლაინ ჩაწერა შეიძლება."); "Marketplace კატეგორია" → "კატალოგის კატეგორია" (action "კატეგორია დააკავშირეთ სერვისთან, რომელზეც ონლაინ ჩაწერა შეიძლება."); map action "რუკაზე გამოსაჩენად ჯერ დაადასტურეთ ადგილის წერტილი."; :120 "კატალოგის სამართავად პლატფორმის ადმინისტრატორის წვდომაა საჭირო."
- LocalAuth: eyebrows → "დაცული შესვლა" / "ახალი სამუშაო სივრცე"; "ქართული-first სამუშაო სივრცე" → "სამუშაო სივრცე ქართულ ენაზე"; "Chawera platform admin-ის ხელით დამტკიცების შემდეგ" → "პლატფორმის ადმინისტრატორის მიერ ხელით დამტკიცების შემდეგ".
- MarketingPages: :13 "ჩაწერა, მობილურზე მორგებული"; :18 "…ორგანიზაციასა და აქტიურ ფილიალებს აერთიანებს, თითოეულს თავისი დროის სარტყლითა და ჩაწერის ბმულით."; :20 "ავტომატური შეტყობინებები ელფოსტითა და SMS-ით ჯერ არ იგზავნება."; :69 "ერთი სამუშაო პროცესი — ჩაწერიდან ანგარიშებამდე."; :79 "თქვენი ყოველდღიური საქმე — უფრო მშვიდ რიტმში."; :84 "ფასები და გადახდის პირობები ჯერ არ გამოქვეყნებულა. გამოგონილ ტარიფებს არ ვაჩვენებთ."; pricing card title "ტარიფებს გამოვაქვეყნებთ, როცა გადახდის პირობები საბოლოოდ დადგინდება.", body "მანამდე შეგიძლიათ შექმნათ ანგარიში და გაეცნოთ სამუშაო სივრცესა და ონლაინ ჩაწერას.", note "ამ გვერდზე გამოწერის ან გადახდის ვალდებულება არ ჩნდება."; :96 "პროდუქტი რეალურ სამუშაო დღეზე გამოსცადეთ."; :101 "ნახეთ რეალური სამუშაო პროცესი და არა გამოგონილი პანელი."; :104 "Today" → "„დღეს“"; :137 "საჯარო საკონტაქტო ფორმა და ელფოსტა ჯერ არ გვაქვს, ამიტომ გამოგონილ არხს არ ვაჩვენებთ."; FAQ band → "დაწყებისას ნაბიჯ-ნაბიჯ ვითხოვთ მხოლოდ იმ მონაცემებს, რომლებიც პირველ სამუშაო დღეს გჭირდებათ."
- PartnerLanding:19,35 "Today და კალენდარი" → "„დღეს“ და „კალენდარი“".
- Panel: GuidedHelpTour:33 "booking-ებს" → "ჯავშნებს"; CommandPalette:18 "booking ბმული" → "ჩაწერის ბმული"; BillingActivation:25, TrialStatus:26, TrialRequest:34 "platform-admin-ის / admin-მა / platform admin" → "პლატფორმის ადმინისტრატორის / ადმინისტრატორმა / პლატფორმის ადმინისტრატორი"; "Chawera ID / სალონის ID" → "გადახდის კოდი".
Update tests asserting copy (MarketingPages.test, LocalAuth.test, BookingFlow.test, marketplace tests).

## 4. Motion (framer-motion, no new deps)
1. DashboardLayout: `<MotionConfig reducedMotion={settings.reducedMotion ? "always" : "user"}>` + `document.documentElement.dataset.reduceMotion`; index.css `[data-reduce-motion="true"] *{transition-duration:.01ms!important;animation-duration:.01ms!important}`; HomeMotion uses `useReducedMotionConfig()`.
2. Panel page enter: keep `sf-motion-enter` on main with `key={location}`.
3. Panel lists: RevealGroup/RevealItem on first mount for Today queue, Clients, Services, Staff; stagger first 8 only; no animation on refetch.
4. panel.css press feedback: `:active{transform:scale(.97)}` 120ms on .cwk-seg button, .cwk-strip button, .cwk-datebtn, .cwk-tab, .cwk-topbtn, .cwk-rail-btn; include in reduced-motion block.
5. Public inner pages: HeroIn on H1+lede for /salons, /salon/:slug, /products, /vacancies, /saved, /my-bookings, /salons/map, login/register, marketing pages; `reveal` on SalonGrid for /salons and /saved.
6. Booking steps: AnimatePresence mode="wait" around step body (opacity + x 12→0, 180ms EASE; exit 120ms cubic-bezier(.4,0,1,1)); focus step heading after change.
7. No infinite loops; transforms off under reduced motion.

## 5. Work packages (disjoint files)
- WP-A tokens/shared (sonnet, first): index.css, catalog/catalog.css, catalog/HomeMotion.tsx, ui/empty.tsx, new ui/file-picker.tsx, new lib/phone.ts(+test), catalog/CatalogChrome.tsx. Global 1–4, 6 (class), 7, 9; motion 1 (HomeMotion part), 7.
- WP-B panel shell (sonnet): DashboardLayout.tsx, workspace/panel.css, workspace/WorkspacePrimitives.tsx, workspace/SettingsPrimitives.tsx, PanelVacancies.tsx, AdminVacanciesSection.tsx. Global 5 (SettingsPrimitives), 8, 11; motion 1–4; page 23.
- WP-C1 panel heavy (sonnet, after B): Staff, Settings, MarketplaceSetup, Media, ClientGallery, PanelProducts. Pages 17, 18, 21, 22.
- WP-C2 panel light (haiku, after B): Today, Clients, Services, POS, Operations, Reports, BillingActivation, TrialStatus, TrialRequest, GuidedHelpTour, CommandPalette. Pages 15, 16, 19, 20, 24 + panel copy.
- WP-D server copy (haiku): server/routers/marketplace.ts (58–63, 120) + tests.
- WP-E1 booking (sonnet, after A): BookingFlow, booking.css, Waitlist, GeorgianDateTimePicker, ManageBooking, BookingPrimitives, BookingFlow.test. Pages 6, 7; motion 6; informal copy. Styling/copy only.
- WP-E2 discovery (sonnet, after A): Home, discovery.css, Tickets, MarketplaceDirectory, MarketplaceMap, Book, SalonProfile, profile.css, Saved, MyBookings, PublicLocaleContext. Pages 1–5, 9, 10; motion 5 for these.
- WP-F marketing/auth/commerce (haiku, after A): MarketingPages, marketing.css, PartnerLanding, LocalAuth, NotFound, Products, Vacancies, VacancyDetail, Commerce, commerce.css, Privacy + tests. Pages 8, 11–14; §3 copy; motion 5 for these.
Order: A → {B, D, E1, E2, F} → {C1, C2}.
