# Chawera redesign: public site + panel restyle (2026-10)

Owner brief: structure and consumer feel like mysalon.ge/ka (photo banner carousel, category icon tiles, VIP cards with covers + heart, soft ground, mobile bottom tab bar, dark business band), but more refined; brand colour warm coral-rose, clearly not mysalon magenta. Panel keeps its information architecture (rail, head row, calendar board with tickets, ledger tables), restyled into the same brand, defects fixed. All copy Georgian. This replaces DESIGN.md's "Appointment Card" world: no indigo desk, violet stamp, perforations, Martian Mono, 2-6px corners, uppercase.

Real imagery only: `locations.coverImageKey` + `coverImageAltKa` (`coverImageUrl` in `marketplace.directory`), `organizations.logoKey`, staff `avatarKey`, `products.imageKey`, `marketplace_categories.iconKey` (lucide icon names). No stock photos, fake salons or reviews. Every photo slot has a designed fallback.

Decisions on open questions (orchestrator): keep "შესვლა" tab; `/my-bookings` stores NO manage tokens/links on the device, only {salon slug+name, service names, start time}, with the line "ჯავშნის შეცვლა ან გაუქმება შეგიძლია დადასტურების გვერდზე მიღებული ბმულით."; no admin banners; SALON tint stays in the accent family.

## 1. Direction
1. Soft blush-neutral ground, white rounded cards, one warm coral-rose accent. Consumer-friendly like mysalon, calmer and more legible.
2. Real business photos lead (carousel + card covers from uploaded covers); without photos, tinted initial tiles, never empty frames.
3. One family, Noto Sans Georgian at normal width; hierarchy by weight. No Mtavruli caps.
4. Mobile: 6-tab bottom bar; thumb-zone primary actions in sticky bottom bars on profile and booking.
5. Panel = same product: same tokens and accent, dark plum rail matching the site's business band.

Better than mysalon: never render an empty section (they leave a ~950px gap); body ≥16px, sentence case, `text-transform: uppercase` banned; search on home; informative cards (name, area, categories, vertical chip, disclosed paid placement); 6 tabs with 12px labels.

## 2. Tokens (index.css `:root` / `.dark`)
| token (`--sf-*`) | light | dark | notes |
|---|---|---|---|
| bg | `#FAF7F7` | `#161015` | page |
| surface | `#FFFFFF` | `#211820` | cards, sheets, inputs |
| surface-2 | `#F5EFF1` | `#2B2029` | sunken, table head, hover, disabled |
| text | `#2B2027` | `#F6EEF1` | 14.7:1 / 16.3:1 |
| muted | `#6B5E66` | `#BCA9B3` | 5.8:1 on bg |
| border | `#EADFE3` | `#3A2C36` | decorative dividers |
| border-strong | `#9C8E95` | `#7A6872` | input/switch/checkbox edges 3.1:1 |
| accent | `#CF3F55` | `#F06B80` | fills; white on it 4.7:1; dark text `#2A0E16` |
| accent-hover | `#B5304A` | `#F4889A` | |
| accent-ink | `#B5304A` | `#F48A9B` | accent as TEXT/links (5.65:1). Never plain accent for text on bg |
| accent-soft | `#FCE8EB` | `#3A1E27` | selected chips, icon tiles |
| focus | `#CF3F55` | `#F06B80` | 2px outline, 2px offset; white on band |
| band | `#2B1A25` | `#0E090D` | business band, panel rail |
| on-band / on-band-muted | `#FFFFFF` / `#D9C9D1` | same | |
| success / -soft | `#1F7A4D` / `#E3F3EA` | `#5FD39A` / `#123326` | |
| warning / -soft | `#8A5300` / `#FCF0D9` | `#F2B755` / `#3A2A0E` | |
| danger / -soft | `#B42318` / `#FDE8E6` | `#FF8A80` / `#3D1614` | icon + word; destructive buttons outlined, never filled |
| info / -soft | `#1E5FA8` / `#E5EFFA` | `#7DB4F5` / `#13263D` | |
| v-salon / -ink | `#FBE3E6` / `#9A2A3F` | `#3A1E27` / `#F7B3BE` | |
| v-aesthetics / -ink | `#FBEBC4` / `#6E4A00` | `#3A2D12` / `#F2CF7A` | |
| v-dental / -ink | `#DCEBFA` / `#154C85` | `#14304A` / `#A9D0F7` | |

Radii: `--radius: 10px` (sm 6, md 8, lg 10, xl 14). Public `--sf-r-card: 16px`, `--sf-r-hero: 20px`, `--sf-r-pill: 999px`. Panel: cards 12, controls 8, marks pill.
Shadows: sm `0 1px 2px rgb(43 32 39/.06)`; md `0 1px 2px rgb(43 32 39/.05), 0 6px 16px -6px rgb(43 32 39/.12)`; lg `0 24px 48px -20px rgb(43 32 39/.28)`; dark: same offsets `rgb(0 0 0/.5)`. Cards at rest: border + sm. No glows.
Spacing base 4 (4…80). Public section gap 48 phone / 72 desktop. Container `min(100% - 32px, 1200px)`.
Type: Google Fonts `Noto Sans Georgian:wght@400..800` + `Noto Sans:wdth,wght@100,400..800`; stack `"Noto Sans Georgian","Noto Sans",system-ui,sans-serif`. Remove Sora, Martian Mono, Noto Serif Georgian from `client/index.html`. Numbers: `font-variant-numeric: tabular-nums`, not mono.
| role | size / lh / weight |
|---|---|
| display H1 | clamp(28px,4vw,40px) / 1.2 / 800 |
| h2 | clamp(22px,2.6vw,28px) / 1.25 / 750 |
| h3 / card title | 18 / 1.35 / 700 |
| body | 16 / 1.6 / 400 |
| body-sm | 14 / 1.5 |
| label | 14 / 1.4 / 600 |
| caption | 12 / 1.4 / 600 (floor; Georgian never <12px) |
| panel title | 24 (phone 22) / 1.25 / 800 |
| panel body / meta | 14 / 12 |
Letter-spacing 0. No uppercase.
Motion: press 120ms, hover 180ms, sheet 260ms, carousel 400ms; ease `cubic-bezier(.2,0,0,1)`, exit `cubic-bezier(.4,0,1,1)`. Carousel never autoplays. Reduced motion: transforms off.

Mapping: keep `--sf-bg`, `--sf-surface`, `--sf-surface-hover`→surface-2, `--sf-text`, `--sf-muted`, `--sf-border`, `--sf-accent`, `--sf-accent-strong`→accent-hover, `--sf-focus`, `--sf-danger`, `--sf-ink-deep`→band; add new names above. shadcn: `--background`=bg, `--card`/`--popover`=surface, `--primary`=accent, `--primary-foreground`=#fff (dark `#2A0E16`), `--secondary`/`--muted`/`--accent`=surface-2, `--muted-foreground`=muted, `--border`=border, `--input`=border-strong, `--ring`=focus, `--destructive`=danger, `--sidebar*`=band/on-band (accent/border `#3A2833`, ring `#D9C9D1`), `--chart-1..5`=accent, info, success, warning, muted. `.cw` and `--cwk-*` vars become aliases (`--cw-paper`/`--cwk-paper`→bg, `--cw-ink`→text, `--cw-stamp`→accent, `--cw-desk`→band, `--cw-beauty*`→v-salon*, …) so old classes recolour at once.
Dead tokens (grep `client/src`, replace with nearest core token, then delete): `--sf-salon-*`, `--sf-terracotta*`, `--sf-jade*`, `--sf-amber`, `--sf-violet`, `--sf-fuchsia`, `--sf-magenta`, `--sf-indigo`, `--sf-pink`, `--sf-teal`, `--sf-sky`, `--sf-gradient-*`, `--sf-glow-*`, `--sf-font-serif-ka`, `--sf-ivory`, `--sf-paper`, `--cwk-canary`, `--cwk-sky`, `--cw-mono`, `--cwk-mono`. Dead classes: card-band, perforation/notch masks, cw-sheet/cw-stack/cw-tabs carbon copies, rotated stamp marks, blank ruled tickets.

## 3. Public site (1440 / 390)
**Header ≥1024:** 64px, surface, 1px border-bottom, sticky. Wordmark "ჩაწერა" 24/800 accent-ink. Nav 15/600 (≥40px): მთავარი, კატალოგი, რუკა, პროდუქტები, ვაკანსიები; active = accent-soft pill + accent-ink. Right: "ბიზნესისთვის" (outline pill 40), language select, "შესვლა" (ink-filled pill). <1024: 56px bar with wordmark + language; nav moves to tab bar.
**Bottom tab bar <1024:** fixed, 64px + safe-area, surface, 1px top border, shadow md. Cells: მთავარი `/`, ძიება `/salons`, რუკა `/salons/map` (use the real map route), ჩემი `/saved` (heart), ჯავშნები `/my-bookings`, შესვლა `/login` (signed in: "პანელი" → `/app/today`). Icon 22, label 12/600, cell ≥44×56. Active: accent-ink + 32×4 accent pill above icon + `aria-current="page"`. Hidden on `/salon/:slug`, `/book/*`, `/manage-booking/*`. `<main>` reserves 80px bottom.
**ჩემი / ჯავშნები (device-local, localStorage, try/catch):** `/saved` grid of saved SalonCards re-fetched by slug. `/my-bookings` rows {salon, services, date/time} written on booking success, link to salon page only (no manage token stored). Under titles: "ინახება მხოლოდ ამ მოწყობილობაზე." Empty: saved "ჯერ არაფერი შეგინახავს." + "გულის ნიშანზე დააჭირე და ადგილი აქ გამოჩნდება."; bookings "ამ მოწყობილობიდან ჯერ არ დაგიჯავშნია." + "ადგილის მოძებნა". Row action "სიიდან წაშლა".
**Home (empty sections not rendered):**
1. Banner carousel: `marketplace.directory` items with VIP promotion && coverImageUrl, ≤6. Desktop 2 side by side, 16/9, radius 20, gap 16, round 44px prev/next ("წინა"/"შემდეგი"). Phone 1 slide 88% + peek, scroll-snap, 4/3. Slide = link to `/salon/:slug`, bottom scrim `linear-gradient(to top, rgb(20 10 16/.72), transparent 60%)`, name white 24/800 (phone 20), area + 2 categories 15 on-band-muted, top-left "VIP" chip (accent, sr "ფასიანი განთავსება"). Dots 8px, active 24 pill. 0 slides → skip; 1 → single full-width banner.
2. Search: H1 "იპოვე და ჩაეწერე ონლაინ"; lede "სალონები, ესთეტიკის ცენტრები და სტომატოლოგიური კლინიკები მთელ საქართველოში." One bar (surface, radius 16, border-strong, 56px): "რა გჭირდება?" + city + accent "მოძებნე"; phone stacked 48px fields + full-width button. Vertical chips (40px pills): ყველა / სილამაზე / ესთეტიკა / სტომატოლოგია, keep existing vertical state; selected = vertical tint/ink + `aria-pressed`.
3. Categories ("კატეგორიები") from `marketplace.categories`: tile 64×64 radius 16 accent-soft, lucide icon from iconKey 26px accent-ink, label 14/600 ≤2 lines, 88 wide. Desktop 8/row wrap; phone horizontal scroll 2 rows (`grid-auto-flow: column`, ~4.3 visible). Link `marketplaceDiscoveryHref("/salons", slug)`.
4. Listing strips: "VIP ადგილები" (disclosure "ფასიანი განთავსება"), "რეკომენდებული", "ახალი კატალოგში", "ყველა ადგილი". Head h2 + "ყველას ნახვა" (accent-ink). Desktop 4-col grid; phone snap row cards 78%. <4 listings total → one "ყველა ადგილი" grid only.
5. How it works: 3 numbered steps (accent-soft 32px circle), keep existing copy.
6. Cities: pill chips + "რუკის გახსნა".
7. Vacancies / products strips only when items exist; no dashed empty boxes.
8. Business band: band bg, radius 24 inside container, padding 40/24; "ბიზნესის მფლობელი ხარ?" white, lede on-band-muted; "მართვის პროგრამა" (white fill) + "რეგისტრაცია" (white outline); keep 4 feature items, icons `#F48A9B`.
9. Footer: light surface, 1px top border; columns brand+tagline / კლიენტისთვის / ბიზნესისთვის / links; 14 muted links → ink + underline on hover; bottom row 12. No app-store badges.
**SalonCard** (shared card in `Tickets.tsx`): surface, radius 16, border, shadow sm; hover shadow md + translateY(-2px). Cover 4/3 object-fit cover, alt coverImageAltKa. Heart 40px top-right (white 90%, `aria-pressed`, label "შენახვა"/"შენახულიდან ამოშლა", filled accent when saved). Top-left "VIP"/"რეკომენდებული" chip + sr disclosure. Body 12/14: name 18/700 2-line clamp; area with MapPin 14 muted; categories ", " 14 muted 1 line; vertical chip. No cover → vertical tint fill, first letter 56/800 in vertical ink centred, first category icon 24 bottom-right. Never blank placeholder cards.
**/salons:** H1 "კატალოგი" + "{n} ადგილი". Sticky filter bar (surface + border): search 44px, city select, category chips (scroll, selected accent-soft/accent-ink + check icon), "რუკა". Grid 1/2(≥640)/3(≥1024)/4(≥1280), gap 16, "მეტის ჩვენება". Phone filter area ≤150px so the first card is in the first viewport. Empty "ამ ძიებით ადგილი ვერ მოიძებნა." + "ფილტრების გასუფთავება". Error danger-soft + "სცადე თავიდან".
**/salon/:slug:** cover desktop 21/9 radius 20, phone full-bleed 4/3; none → 160px tint band with logo/initial. Name H1; open-status pill with Clock (success-soft "ღიაა, იკეტება 20:00-ზე" / surface-2 "დაკეტილია, იხსნება დღეს 10:00-ზე") if data exists. Address (MapPin) + phone (`tel:`). Remove raw URL line and "კატალოგი" caption. Lede in muted (fix ~1.8:1). Tabs (pill): სერვისები / გუნდი / სამუშაო საათები / პროდუქტები (if any). Service row ≥56px, whole row is the label: 24px checkbox, name 16/600, duration 14 muted, price right 16/700 tabular. Desktop sticky right summary card (top 88, radius 16, shadow md). Phone sticky bottom bar (72 + safe area): "არჩეულია: N სერვისი" + total, primary "დროის არჩევა"; none chosen → disabled "აირჩიე სერვისი".
**/book/:slug:** keep 4 steps and logic. Card max 640 radius 20; progress 4-segment bar + "ნაბიჯი 2 / 4". Sticky choice strip (service, specialist, time, price chips with "შეცვლა"). Specialist 56px rows with avatar/initials, "ნებისმიერი სპეციალისტი" first. Date strip 56×64 day cards (weekday 12, date 18/700 tabular; selected accent; closed muted "დაკეტ."). Slots grid 4 phone / 6 desktop, 44px, radius 12, border-strong, 16/600 tabular, selected accent + check. Details: name `autocomplete="name"`, phone `type="tel" inputmode="tel" autocomplete="tel"` with "+995" adornment; labels above; errors under field via `aria-describedby`. Primary in sticky bottom bar on phone. States: no slots "ამ დღეს თავისუფალი დრო აღარ არის." + "შემდეგი თავისუფალი დღე"; closed "ამ დღეს დაკეტილია."; slot taken on commit inline danger-soft "ეს დრო ახლახან დაიკავეს. აირჩიე სხვა დრო." → refetch + focus alert; network "კავშირი გაწყდა. სცადე თავიდან." + "თავიდან ცდა". On success save to my-bookings storage.
**Login/register:** ground bg, card max 420 radius 20 shadow md, wordmark above; inputs 48 radius 10; one focus ring (inner input outline none, field gets ring); full-width primary; links accent-ink.
**Products / vacancies cards:** product image 1/1 radius 16 (fallback tint + Package 32), name 16/700, brand 14 muted, price 18/700 tabular, stock pill, salon link. Vacancy: logo/initial 48, title 18/700, salon + area 14 muted, date, "VIP" chip if paid. Grid as /salons.
**Cookie banner** (`PublicAnalyticsConsentContext.tsx`): phone compact sheet above tab bar ≤120px, "ვაგროვებთ ანონიმურ სტატისტიკას: მხოლოდ გვერდებს და დროს." + "დეტალურად", buttons "თანხმობა"/"უარი" in one row; desktop 380px card bottom-left. New public strings need en/ru entries in existing `ui` objects.

## 4. Panel restyle (IA and layouts unchanged)
- Rail (`.cwk-rail`, DashboardLayout): band bg; nav 14/600 on-band, icons on-band-muted; hover/active `#3A2833`, active white 700 + accent `#F06B80` icon, radius 8, 40px; group captions 12/600 on-band-muted, no uppercase; wordmark 20/800 white, remove domain; vertical chip via `--sf-v-*`; foot 1px `#3A2833` top border, nav list scrolls above it (`overflow-y:auto; padding-bottom:8px`) with 16px fade.
- Phone bars: topbar surface + 1px border; tab bar = public style (active pill + accent-ink).
- Head row `.cwk-head`: title 24/800 normal width, 1px border bottom, ≤1 primary + 1 secondary + "მეტი მოქმედება" kebab (DropdownMenu) for the rest; description 14 muted 1 line, hidden <640.
- Buttons: `.cwk-stampbtn` → primary (accent, radius 8, 40/44 phone, no shadow); secondary surface + border-strong; ghost hover surface-2; destructive danger outline; disabled surface-2 + muted + not-allowed + helper line why.
- Inputs/selects 40/44, radius 8, border-strong, focus 2px accent; full width in forms; optional = "(არასავალდებულო)" in hint line under label.
- Switch: off track border-strong, on accent.
- Sheets `.cwk-sheet`: radius 12, 1px border, no shadow; head 16/700 over 1px border.
- Metric tiles: radius 12, label 12/600 muted, value 22/700 tabular Noto Sans; phone 2×2 inside padding.
- Tables: head surface-2 13/600 muted 40px; rows 52 with border dividers, hover `#FBF7F8`; whole row links to profile; actions = edit icon button (36, aria-label) + kebab; phone 2-line rows, no buttons under each row.
- Status marks `.cwk-mark`: pill 12/600 24px, icon 14 + word always. pending warning-soft/warning Clock; confirmed info-soft/info CalendarCheck; checked-in/in-service accent-soft/accent-ink UserCheck; completed success-soft/success Check; cancelled/no-show surface-2/muted X struck. Count mark surface-2 tabular.
- Calendar board: radius 12; hour lines border, half-hours 50%; gutter 12/500 muted tabular; colhead 15/700 + 10px staff-colour dot; now line 2px accent + "ახლა" pill; drag wash accent 6%.
- Tickets `.cwk-ticket`: no notch mask / perforation; radius 8, border, shadow sm; left stub 6px status colour (pending `#E9A93B`, confirmed `#4C8FE0`, in-service accent, completed `#B9A9B1`, cancelled 45° hatch + dashed border + struck name) plus icon in body line 1; name 13/700, service 12 muted, time 12 tabular, status word 12/600 when ≥76px tall; `.cwk-tact` accent radius 6, 28px (44 phone); keep stamp-press as "status pulse" scale 1.15→1 220ms, off under reduced motion.
- Dialogs: radius 16, shadow lg, padding 20, title 18/700, primary right (stacked full-width on phone), max-height 90dvh, scrolling body.
- Empty states `.cwk-state`: surface-2, no dashed border, radius 12, 40px accent-soft circle + 20px accent-ink icon, title 15/700, one muted line, one action; error variant danger-soft.
- Global: delete `text-transform: uppercase` (`.cwk-caption`, `.cwk-group-caption`, `.cw-caption`, `.cw-soon`) and every Martian Mono use.

Panel defects (from screenshots):
1. Rail wordmark domain truncated → remove (`.cwk-wordmark-domain`).
2. Last rail nav item hidden under help/user footer → SidebarContent overflow.
3. Today walk-in strip is a 120px box with a floating disabled checkbox → one-row sheet with secondary "ადგილზე მოსულის ჩაწერა".
4. Today phone head row stacks 4 rows → bell into topbar, "+ ფილიალი" into location select menu, "მაჩვენებლები" 40px icon button.
5. Today phone metric grid touches edge, right border clipped.
6. Day-close rows have checkbox + external link → whole row a link + status mark.
7. Calendar with 0 bookings: bare grid ending 17:00 → centred pill "ამ დღეს ჯავშანი არ არის." + "+ ჯავშანი", auto-scroll to working-hours start.
8. Calendar phone: row 1 `[‹ date ›] [დღეს]`, row 2 `[დღე|კვირა] [ხედები]`.
9. Clients: mismatched "პროფილი"/"შერწყმა" buttons, 3 lines per client on phone → row link + kebab.
10. Clients "16 ჩანაწერი" off baseline → count mark in sheet head.
11. Services: 3 text actions wrap on phone → edit icon + kebab (სპეციალისტები, არქივი).
12. Services: "ონლაინ ხილული" on every row → mark only "ონლაინ დამალულია".
13. Staff: head row 4 buttons + inline stats; hours as card per person per weekday → person × weekday table "10:00–20:00" + edit icon per row.
14. Reports: weekly-compare sheet ~300px empty; "+56 ჯავშანი" wraps; mono ₾ off baseline.
15. POS: add-product labels on different baselines; disabled checkout lavender/white <3:1 → panel disabled tokens + helper "ჯერ კალათაში დაამატეთ პროდუქტი."; selects hug content.
16. Settings: "მხოლოდ თქვენთვის" mark tiny; switch off-track invisible (`ui/switch.tsx`).
17. Martian Mono phone numbers ~130px per cell → tabular Noto Sans.
Accessibility audit for panel pages: `docs/specs/panel-audit-2026-10.md` (verify each line before fixing).

Public defects: P1 aesthetics/dental category names mojibake in LOCAL DB (non-utf8mb4 insert) — data issue, not CSS; P2 blank placeholder tickets and "0 ადგილი"; P3 cookie card covers page; P4 profile lede contrast; P5 raw URL line on profile; P6 login double focus box; P7 /salons phone first listing ~2 screens down.

## 5. Work packages (no file shared between packages)
- WP0 Tokens and primitives (sonnet): `client/index.html` fonts, `client/src/index.css`, `components/ui/{button,input,select,textarea,checkbox,switch,tabs,dialog,sheet,drawer,dropdown-menu,badge,table,card}.tsx` (radius/height/focus only, no API changes), `DESIGN.md`, `.impeccable/design.json`; delete dead tokens after grep.
- WP1 Public chrome (sonnet, after WP0): `components/catalog/CatalogChrome.tsx` (header, MobileTabBar, footer), `catalog.css`, `contexts/PublicAnalyticsConsentContext.tsx`, new `lib/deviceSaved.ts` (+test), new `pages/Saved.tsx`, `pages/MyBookings.tsx`, `App.tsx` routes.
- WP2 Discovery (sonnet, after WP1): `components/catalog/Tickets.tsx`, `discovery.css`, `pages/Home.tsx`, `pages/MarketplaceDirectory.tsx`, `components/public/MarketplaceDiscovery.tsx`, `pages/Book.tsx`, `pages/MarketplaceMap.tsx` (card restyle only).
- WP3 Profile and booking (sonnet, after WP1): `pages/SalonProfile.tsx`, `profile.css`, `pages/BookingFlow.tsx`, `booking.css`, `components/public/{BookingPrimitives,GeorgianDateTimePicker,BookingFeedbackForm}.tsx`, `pages/ManageBooking.tsx`, `pages/Waitlist.tsx`. Styling and states only; booking mutation and availability calls untouched.
- WP4 Commerce, auth, marketing (haiku, after WP0): `components/catalog/{Commerce.tsx,commerce.css,marketing.css}`, `pages/{LocalAuth,Products,Vacancies,VacancyDetail,MarketingPages,PartnerLanding,NotFound,Privacy}.tsx`.
- WP5 Panel shell (sonnet, after WP0): `components/DashboardLayout.tsx`, `workspace/panel.css`, `workspace/WorkspacePrimitives.tsx`.
- WP6a Calendar (sonnet, after WP5): `pages/Calendar.tsx` + calendar-only components.
- WP6b Panel pages (sonnet, after WP5): `pages/{Today,Clients,Services,Staff,Reports,POS,Settings}.tsx` + page-only children.
Order: WP0 → {WP1, WP4, WP5} → {WP2, WP3, WP6a, WP6b}.

## 6. Acceptance
1. Home desktop ≥1 VIP cover: 2-up carousel, search visible above 900px, category tiles, no oversized sections, no blank cards, band then light footer.
2. Home 0 photos 1 listing: no carousel, search first, one SalonCard with tinted initial cover, empty vacancies/products absent.
3. Phone home: 6-tab bar 12px labels, მთავარი active pill, no horizontal scroll, categories 2 scrolling rows, cookie sheet ≤120px above tab bar.
4. /salons phone: first card in first viewport; selected chips have check icon.
5. /salon/:slug phone: cover or tint band, open pill, sticky booking bar with count + total, tab bar hidden.
6. Booking: choice strip with "შეცვლა", 4-col slot grid on phone, slot-taken alert next to slots.
7. Login: single focus ring.
8. Panel: plum rail, no truncated wordmark, last nav item visible; one head row ≤2 buttons + kebab; tables without per-row text buttons; status pills icon + word; calendar empty-day pill; tickets without notches; readable disabled checkout with helper.
9. Contrast: accent-ink on bg ≥5.6:1, white on accent ≥4.7:1. grep: no `text-transform: uppercase`, no "Martian Mono" in `client/src`.
