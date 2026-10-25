# Chawera: signature, booking delight, panel clarity (2026-10-25)

Colours, type and radii from chawera-redesign-2026-10.md stay. This spec supersedes there: Home starts with search (not VIP carousel); `.cwk-state`/`.cw-empty` use the ring instead of the accent-soft circle; booking goes from 4 steps to 3 with a two-column desktop layout. Online bookings are always PENDING until the salon confirms (server inserts status PENDING).

## Problems
1. Nothing ownable: photo-scrim hero, stock category tiles, pink icon squares = mysalon's vocabulary. The name means "writing in" and nothing visual uses it.
2. Booking repeats itself (profile picks services, then a full specialist screen, then a review table).
3. Time step: date strip only knows working hours (dead-end days); green "available" notice after every tap.
4. Phone back gesture quits the flow (step is local state).
5. Confirmation is a receipt: raw token in <code>, no directions/share, no "what next" (booking is PENDING, no SMS), manage link presented as an ordinary button.
6. Panel rail: 16 items under 3 captions; "მედია და პროფილი" vs "კატალოგის პროფილი" overlap; "ოპერაციები" means clock-in and tips; staff hours hidden in "გუნდი".
7. Today readiness panel sits below queue/day-close; done steps filtered out (no progress); QuickActions repeat the rail.
8. Calendar opens at 12:00 while a 10:15 booking is off-screen.
9. Skip-link pill visible mid-page on phone (profile/booking); footer renders inside booking.

## 1. Signature: the ring ("შემოხაზვა")
People circle an appointment on a paper calendar. Chawera's mark is a hand-drawn open ring whose tail overshoots its start. Rule: **the ring marks your choice.**
Primitive `client/src/components/brand/Ring.tsx`: `<Ring variant="wide"|"square" draw?>` → aria-hidden SVG absolutely positioned (`inset:-6px -8px`; square `-5px`), pointer-events none, overflow visible; parent position:relative. Paths (pathLength="1", preserveAspectRatio="none", fill none, round caps, vector-effect non-scaling-stroke, stroke-width 2.25):
- wide, viewBox 0 0 120 48: `M14 30 C8 18 30 6 62 6 C96 6 116 14 113 26 C110 39 82 44 56 43 C28 42 8 36 10 24 C12 16 26 10 40 9`
- square, viewBox 0 0 64 64: `M10 36 C6 18 22 6 36 7 C52 8 60 22 57 36 C54 50 40 58 28 56 C14 54 7 44 9 32 C10 24 16 17 24 13`
Colour `--sf-accent-ink` (#B5304A); dark mode and on band #F48A9B; on photos #fff; forced-colors `Highlight`. Motion: on select stroke-dashoffset 1→0, 360ms cubic-bezier(.2,0,0,1); deselect opacity→0 120ms; static under prefers-reduced-motion or `[data-reduce-motion="true"]`. Verify pathLength + non-scaling-stroke in Chrome/Safari; if broken drop vector-effect, never the ring. The ring is never the only cue: selected also has accent-soft fill, accent-ink 700 text, aria-pressed/checked.
Where (≤3 per viewport, all marking the same choice): home hero vertical words (selected word; the page's only load animation, draws once 200ms after first paint); /salons selected filter chip; booking selected day (square), selected slot (wide), time in the summary; confirmation time numerals (draws after the check); category tiles (26px lucide icon in a 64px static square ring, label below — replaces stock photo tiles); empty states public and panel (20px icon in a 44px static ring); panel only in Today "დაიწყეთ აქ" (completed step numbers ringed). Optional (owner approval): favicon + 24px mark (ring + 4px ink dot at tail) next to the wordmark.
Never on: buttons, navigation, tables, status marks, list prices, errors, destructive actions, photos (except hero frame), headlines/body, other panel pages.
Home hero (replaces photo-scrim hero): desktop plain ground, 7/5 columns. Left: H1 "იპოვე და ჩაეწერე ონლაინ" clamp(32px,4.4vw,52px)/1.1/800; label "რას ეძებ?" 14/600 muted; four pressable words "ყველა", "სილამაზე", "ესთეტიკა", "სტომატოლოგია" 24/700 text-coloured, gap 28, ≥44px, aria-pressed, ring on selected (reuse vertical state); then the existing 56px search bar. Right: one decorative brand photo (alt=""), radius 24, aspect 4/5, max-height 440. Phone: no photo, H1 28px, words an 18/700 horizontal scroll row, search fields stacked. Remove the "აირჩიე სფერო" photo trio; VIP carousel becomes section 2. Brand photos only in hero frame and business band.
Better than mysalon.ge: search first (theirs: two ad banners); no dead space; sentence-case Mkhedruli ≥16px (theirs Mtavruli caps); paid placement disclosed; booking shows first truly free time, dims full days, 3 steps with live summary, back gesture works; one catalog for beauty/aesthetics/dental with vertical choice as the hero and an ownable ring.

## 2. Booking delight
Goal: "I picked a time and it's circled." One question per screen; choices always visible and changeable.
Steps: 3 — "სერვისი · დრო · დეტალები". From the profile (`?services=`) open on "დრო" with service segment done. URL keeps step `?step=time|details` via wouter navigate (push); back goes to previous step, from first step to the profile. Progress 3 segments + "ნაბიჯი 2 / 3". No footer on /book/*. getBookingValidationIssue and tests move to new indexes; mutations/queries unchanged.
Layout ≥1024: step card (max 640) + sticky summary card (320, top 88, radius 16, shadow md) "შენი ჩაწერა": services+prices, specialist, date+time (ringed), total ("-დან" kept), each with "შეცვლა". Phone: sticky bottom bar 72px + safe area: left 2 lines (services joined " + " with ellipsis; "ხუთ, 30 ოქტ · 11:30" or duration), right primary; tapping left opens ui/drawer with the same summary ("შენი ჩაწერა"); remove the separate choice strip on phone.
Step "სერვისი" (only when entering without services): current grouped rows; nothing selected → only disabled "აირჩიე სერვისი".
Step "დრო" (specialist folded in):
1. Specialist row 56px: "სპეციალისტი: ნებისმიერი თავისუფალი" + "შეცვლა". Default ANY_AVAILABLE; exactly one eligible → preselect, hide "შეცვლა". "შეცვლა" opens drawer (phone)/dialog (≥640) "აირჩიე სპეციალისტი": first row "ნებისმიერი თავისუფალი სპეციალისტი" (meta "სისტემა თავისუფალ სპეციალისტს თავად შეარჩევს."), then specialists with avatar/initial + specialty. Changing specialist clears time. After check ANY shows "{name} (ავტომატურად)" (existing autoPicked).
2. Suggestion chip when availabilityDays' first free slot isn't on the selected day: "უახლოესი თავისუფალი დრო: ხვალ, 11:30" (or "{weekday}, {date}, {time}"); tap selects day+slot and draws ring; no auto-advance.
3. Date strip (keep the new week strip from 21st pattern): closed days "დაკეტ.", zero-slot days "სავსეა", both muted but selectable (show empty state). First selected day = first day with slots. Selected day accent-soft + square ring.
4. Slots grouped დილა / შუადღე / საღამო; 4 cols phone / 6 desktop; 44px. Selected accent-soft, accent-ink 700, wide ring, aria-checked. Drop the green "available" notice; availability check runs silently; bar button "მოწმდება…" only if >300ms.
5. Bar: "აირჩიე დრო" (disabled) → "გაგრძელება".
Step "დეტალები": compact review card (services+total, date+time, specialist, each "შეცვლა"); fields: "სახელი" autocomplete given-name; "ტელეფონი" +995 adornment, type tel, inputmode tel, autocomplete tel-national, hint "ფორმატი: 5XX XX XX XX"; disclosure "მეტი დეტალი (არასავალდებულო)" with "გვარი", "ელფოსტა", "კომენტარი" (hint "მაგ. რა უნდა იცოდნენ ვიზიტამდე"); checkbox "ვეთანხმები ჩაწერის პირობებს" + link (only if the flow already has terms consent — don't invent a new legal requirement); primary "ჯავშნის გაგზავნა". No personal data stored on device.
Confirmation: one card max 560 centred, title focused on mount. Celebration: 56px mark — check stroke draws 240ms, then ring 420ms (200ms delay) over accent-soft disc scaling 0.6→1 in 400ms; no confetti; static with reduced motion. H1 "ჯავშანი გაიგზავნა"; lede "ახლა ჯავშანს დადასტურება სჭირდება. სტატუსს ჯავშნის გვერდზე ნახავ." Date block: weekday 16/600 muted; "30 ოქტომბერი" 28/800; "11:30–12:15" 40/800 tabular ringed; then salon name+address, specialist, services+total. Actions (stacked full width on phone): "კალენდარში დამატება" primary (existing downloadBookingCalendar); "რუკაზე ნახვა" secondary if address (`https://www.google.com/maps/search/?api=1&query=` + encoded "name, address"); "გაზიარება" (navigator.share title salon, text "{date}, {time}, {salon}, {address}", url /salon/:slug; fallback copy + toast "დაკოპირდა"; never share the manage token; AbortError silent). "რა ხდება შემდეგ" ordered list: "{locationName} ჯავშანს განიხილავს."; "სტატუსს ნახავ ჯავშნის პირად გვერდზე."; "შეცვლა ან გაუქმება შეგიძლია ვიზიტამდე {n} საათით ადრე." (only if cutoff known). Private link card (surface-2, radius 16) replacing raw code: title "ჯავშნის პირადი ბმული", text "ჯავშნის შეცვლა ან გაუქმება მხოლოდ ამ ბმულით შეიძლება. შეინახე და სხვას ნუ გაუზიარებ.", buttons "ბმულის კოპირება" (toast "ბმული დაკოპირდა") and "ჯავშნის გვერდი".
Recovery (keep data and idempotencyKey): slot taken → back to "დრო", keep day, ring fades, existing alert focused, plus "უახლოესი თავისუფალი დრო ამ დღეს:" + one slot button from refetched list; network failure "ჯავშანი ვერ გაიგზავნა: კავშირი გაწყდა. შეყვანილი მონაცემები შენახულია." + "თავიდან ცდა"; slots fail "თავისუფალი დრო ვერ ჩაიტვირთა." + "თავიდან ცდა"; closed day "ამ დღეს დაკეტილია." + "შემდეგი ღია დღე"; full day existing copy + "შემდეგი თავისუფალი დღე" (jump via availabilityDays) + waitlist link; no eligible specialist "ამ სერვისების ერთად შესრულება ონლაინ ვერ ხერხდება. სცადე სერვისების ცალ-ცალკე დაჯავშნა." + "სერვისების შეცვლა".
Profile: Team tab "ჩაწერა" → /book/:slug?staff={id}; sticky bar second line "უახლოესი: ხვალ, 11:30" once a service is chosen (availabilityDays ANY, days=7); skip link sr-only until focused.

## 3. Panel clarity
Rail (same routes; menuItems role filter stays source of truth):
- (no caption): დღეს /app/today; კალენდარი /app/calendar; კლიენტები (vertical term) /app/clients; სალარო /app/pos. STAFF: "ჩემი დღე", "ჩემი კალენდარი", plus "ჩემი პროფილი" /app/staff and "ცვლა და ჩაი" /app/operations at top.
- "ჩემი სალონი" / "ჩემი კლინიკა" / "ჩემი ცენტრი" (by vertical): სერვისები და ფასები /app/services; გუნდი და საათები /app/staff; ონლაინ გვერდი /app/marketplace; ანგარიშები /app/reports. OWNER all; MANAGER "შეფასებები" /app/feedback instead of ონლაინ გვერდი; RECEPTIONIST none.
- "მეტი" (collapsed; auto-open when a child is active; open state in localStorage): მოლოდინის სია /app/waitlist; ცვლა და ჩაი /app/operations; ვიზიტის ფოტოები /app/client-gallery; ვაკანსიები /app/vacancies; პროდუქტები /app/products. OWNER all; MANAGER all except gallery; RECEPTIONIST waitlist + ცვლა და ჩაი.
- footer: პარამეტრები /app/settings next to დახმარება.
- "პლატფორმა" (admin only, collapsed): 4 existing admin items.
Online-page sub-navigation `components/workspace/OnlinePageTabs.tsx` on /app/marketplace, /app/media, /app/feedback: "კატალოგში გამოჩენა" · "ფოტოები და აღწერა" · "შეფასებები". Billing in rail only when locked or access ends within 3 days; otherwise Settings link "პაკეტი და გადახდა". Phone tab bar: დღეს, კალენდარი, კლიენტები (STAFF: პროფილი), სალარო (STAFF: ცვლა და ჩაი), მეტი.
Renames: ოპერაციები→ცვლა და ჩაი; კლიენტის გალერეა→ვიზიტის ფოტოები; მედია და პროფილი→ფოტოები და აღწერა; კატალოგის პროფილი→ონლაინ გვერდი (rail; page title "კატალოგში გამოჩენა"); სერვისები→სერვისები და ფასები; გუნდი→გუნდი და საათები; სალონის მართვა→ჩემი სალონი (vertical-aware); პლატფორმის მართვა→პლატფორმა; Today "დღის რიგი"→"დღის ჯავშნები"; Settings "ჩემი გარემო"→"ჩემი ანგარიში", "ინტეგრაციები" last.
Page hints (one line under title, 14 muted, also on phone, 2-line clamp):
- დღეს: "დღის ჯავშნები, გადასახდელი და ის, რასაც ყურადღება სჭირდება."
- კალენდარი: "ყველა ჯავშანი სპეციალისტების მიხედვით. ახალი ჯავშნისთვის დააჭირეთ თავისუფალ დროს."
- კლიენტები: "კლიენტების ბარათები, ვიზიტების ისტორია და კონტაქტები."
- სალარო: "გადახდის მიღება ვიზიტისა და პროდუქტის გაყიდვისთვის."
- სერვისები და ფასები: "რას სთავაზობთ კლიენტებს, რა ღირს და რამდენ ხანს გრძელდება."
- გუნდი და საათები: "სპეციალისტები, მათი სერვისები და სამუშაო საათები."
- კატალოგში გამოჩენა: "როგორ გამოიყურება თქვენი სალონი კატალოგში."
- ანგარიშები: "შემოსავალი და ჯავშნები არჩეული პერიოდისთვის."
- მოლოდინის სია: "კლიენტები, რომლებმაც თავისუფალი დრო ვერ იპოვეს." (SMS note stays as a muted line in the page)
- ცვლა და ჩაი: "სამუშაოს დაწყება და დასრულება, მიღებული ჩაის აღრიცხვა."
- ვიზიტის ფოტოები: "ვიზიტის ფოტოები. საჯაროდ ჩანს მხოლოდ კლიენტის თანხმობით."
- ვაკანსიები: "განცხადებები სამუშაოს შესახებ, რომლებიც კატალოგში ჩანს."
- პროდუქტები: "პროდუქტები, რომლებსაც სალონში ან კატალოგში ყიდით."
- შეფასებები: "კლიენტების შეფასებები ვიზიტის შემდეგ."
- პარამეტრები: "სალონის, ჩაწერის წესებისა და ანგარიშის პარამეტრები."
Primary-action rule: ≤1 filled primary per page, last in head row; phone full width under title; rest = one secondary + "მეტი მოქმედება". Today: primary "+ ჯავშანი" → /app/calendar?create=1 (opens existing create dialog at next free time); secondary "ადგილზე მოსულის ჩაწერა"; remove QuickActions row; "ჩაწერის ბმულის კოპირება" in the menu.
Today order: head; "დაიწყეთ აქ" (owner, while incomplete); metric tiles; now/next; day's bookings; "დღის დახურვა" collapsed to one row "დღის დახურვა 0/4" expanding on click. STAFF: title "ჩემი დღე", no money; first-visit dismissible tip "აქ ჩანს თქვენი დღევანდელი ჯავშნები. სტატუსის შესაცვლელად დააჭირეთ ჯავშანს." + "გასაგებია" (localStorage).
"დაიწყეთ აქ" checklist (replaces SalonStatusPanel readiness at top; access-expiry stays a separate notice): lede "ხუთი ნაბიჯი და კლიენტები ონლაინ ჩაგეწერებიან.", pill "{n} / 5 მზადაა"; all steps listed, numbers in 28px circles, done = ring + "მზადაა" mark (Check + word):
1. "დაამატეთ სერვისები და ფასები" → /app/services (done when services exist)
2. "დაამატეთ გუნდი" → /app/staff
3. "მიუთითეთ სამუშაო საათები" → /app/staff
4. "გახსენით ჩაწერის გვერდი და სცადეთ": "გახსნა" (/book/{slug} new tab; done stored on device) + "ბმულის კოპირება"; disabled without slug with link to Settings
5. "გამოჩნდით კატალოგში" → /app/marketplace; status from trpc.marketplace.getOwnListing: "განხილვაშია" (Clock) when submitted; done when approved
All done: one line "ყველაფერი მზადაა. კლიენტებს უკვე შეუძლიათ ონლაინ ჩაწერა." + "ბმულის კოპირება" + "დამალვა" (hidden permanently per org, localStorage).
Progressive disclosure: Reports default 3 tiles (შემოსავალი, ჯავშნები, საშუალო ჩეკი) + weekly chart; comparisons/breakdowns/export behind ui/collapsible "დეტალური ანალიზი" (closed; `?details=1`). Calendar saved views in menu. Settings "უსაფრთხოება" and "ინტეგრაციები" last. Admin collapsed.
Teaching empty states (ring icon, title, line, action):
- Calendar day: "ამ დღეს ჯავშანი არ არის." / "ახალი ჯავშნისთვის დააჭირეთ თავისუფალ დროს." / "+ ჯავშანი"; board scrolls to first booking of the day, else now, else opening start.
- Clients: "კლიენტები აქ პირველივე ჯავშნის შემდეგ გამოჩნდებიან." / "კლიენტის დამატება"
- Services: "დაამატეთ პირველი სერვისი: სახელი, ფასი და ხანგრძლივობა. ამის გარეშე ონლაინ ჩაწერა ვერ იმუშავებს." / "სერვისის დამატება"
- Staff: "დაამატეთ სპეციალისტი და მიუთითეთ, რომელ სერვისებს ასრულებს." / "სპეციალისტის დამატება"
- Reports: "ანგარიში პირველი დასრულებული ვიზიტის შემდეგ გამოჩნდება." / "კალენდრის გახსნა"
- Waitlist: "მოლოდინის სია ცარიელია. აქ ჩნდებიან კლიენტები, რომლებმაც სასურველი დრო ვერ იპოვეს."

## 4. Mobile and a11y
Hero words `<button aria-pressed>` in role="group" labelled "რას ეძებ?". Day cards/slots keep radio semantics; focus to step heading on step change, slot-taken alert takes focus; drawer traps and returns focus. Bar summary is `<button aria-expanded>`; primary ≥48px right edge; main padding-bottom calc(88px + safe-area). Clipboard toasts role="status"; share feature-detected. Ring aria-hidden; forced-colors Highlight. Contrast: accent-ink on accent-soft ~5.5:1. Panel hints/checklist no horizontal scroll at 360px; tab labels 12px truncate with title.

## 5. Server
- public.bookingCatalog (read-only additions): team[].avatarUrl (avatarKey→mediaUrl mapping as in profile); location.cancellationCutoffMinutes.
- New public.availabilityDays (publicProcedure, read-only): input { slug, serviceIds[1..MAX], staffProfileId | "ANY_AVAILABLE", fromDate YYYY-MM-DD, days 1..14 }; output { timezone, days: [{ date, slotCount, firstStartsAt: string|null, firstLabel: string|null }] }. Reuse the same daySlots / multi-service path as availableSlots / multiAvailableSlots; batch appointment reads per range; schema in shared/validation.ts; same trial/suspension gates as availableSlots. Commit still re-validates in the transaction.
- No other server needs (.ics client-side; directions URL client-side; marketplace status via getOwnListing; ?create=1 client-only).

## 6. Work packages (disjoint)
- S server (sonnet): server/routers/public.ts, shared/validation.ts, public tests. Acceptance: 14 days; counts match availableSlots per day in tests; >14 rejected; empty for unknown slug / inactive trial; bookingCatalog has avatarUrl + cancellationCutoffMinutes; commit paths untouched. Light reviewer pass.
- R ring (haiku): new components/brand/Ring.tsx (+test), index.css ring block + reduced-motion, DESIGN.md "Signature" section. Favicon only if owner approves.
- H home (sonnet, after R): Home.tsx, HomeMotion.tsx, discovery.css, public/MarketplaceDiscovery.tsx, CatalogChrome.tsx (skip link), catalog.css (.cw-empty ring).
- B1 booking (sonnet, after R, S): BookingFlow.tsx, BookingPrimitives.tsx, booking.css, BookingFlow.test.tsx.
- B2 profile (haiku, after B1, S): SalonProfile.tsx, profile.css.
- N panel shell (sonnet, after R): DashboardLayout.tsx, panel.css, WorkspacePrimitives.tsx (hint on phone, ring in WorkspaceState), new lib/panelNav.ts (+test), new workspace/OnlinePageTabs.tsx.
- T today (sonnet, after N, R): Today.tsx and children only it imports.
- P1 panel heavy (sonnet, after N): Calendar.tsx (+ calendar-only children), Reports.tsx, Settings.tsx.
- P2 panel copy (haiku, after N): Clients, Services, Staff, Operations, WaitlistQueue, ClientGallery, Media, MarketplaceSetup, PanelVacancies, PanelProducts, FeedbackModeration.
Order: S, R, N → H, B1, T, P1, P2 → B2.
