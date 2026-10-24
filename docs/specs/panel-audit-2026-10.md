# Panel audit (web-design-guidelines, haiku) — verify each line before fixing; skip any that is false
MUST
- pages/Staff.tsx:285 Field renders <Label> without htmlFor/wrapped control (dialog fields L247-275) — associate labels
- pages/Staff.tsx:238 team list no error branch (isError shows empty text) — WorkspaceState kind="error"
- pages/Staff.tsx:245-246 schedule/exceptions show empty text while loading/failed — loading + error states
- pages/Staff.tsx:245-246 icon buttons ~36px on phone — max-md:size-11
- pages/Staff.tsx:257,275 colour swatches 32px on phone — 44px hit area
- pages/POS.tsx:28 location SelectTrigger no accessible name — aria-label="ფილიალი"
- pages/POS.tsx:28 product list shows empty on inventory.isError — error state
- pages/POS.tsx:28 qty +/- icon buttons ~36px on phone — max-md:size-11
- pages/POS.tsx:27 submitProduct returns silently on invalid input — Georgian inline error + focus
- pages/Clients.tsx:88 search input no label — aria-label + type=search
- pages/Clients.tsx:88 mobile card buttons size sm on phone — min-h-11
- pages/Clients.tsx:90 phone input missing type=tel inputMode=tel autoComplete=tel
- pages/Today.tsx:153 action button h-10 on phone — h-11 md:h-10
- pages/Calendar.tsx:242-245 drag reschedule pointer-only — check whether a non-drag reschedule exists (AppointmentQuickAction); if not, keyboard alternative
SHOULD
- DashboardLayout.tsx:289-297 resize handle mouse-only div — role=separator, tabIndex, arrow keys
- Settings.tsx:72-74 preferences/locations no loading/error states
- Settings.tsx:73 free-text IANA timezone input — Select from shared/timezones
- Staff.tsx:238,250 <img> without width/height, loading=lazy; per-row h2 should be h3; sr-only file input label needs has-[:focus-visible] ring; size sm buttons min-h-11 on phone; error <p> need role=alert
- Clients.tsx:90 error paragraphs role=alert; row buttons need sr-only client name
- Services.tsx:148 row buttons min-h-11 on phone; :152 formError role=alert
- Today.tsx:160 locationError role=alert; "/book/{slug||"your-salon"}" English placeholder → Georgian; slug input spellCheck=false autoComplete=off + hint
- POS.tsx:28 SKU input spellCheck=false autoComplete=off; qty span aria-live=polite
- panel.css:66,69,104,137 .cwk-topbtn/.cwk-tab/.cwk-seg button/.cwk-strip button no hover state
- WorkspacePrimitives.tsx:58-61 loading state needs role=status aria-live
