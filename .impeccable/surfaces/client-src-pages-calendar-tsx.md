---
version: 1
slug: "client-src-pages-calendar-tsx"
primary_target: "client/src/pages/Calendar.tsx"
related_targets: ["client/src/components/DashboardLayout.tsx","client/src/pages/Today.tsx","client/src/components/workspace/WorkspacePrimitives.tsx","client/src/index.css"]
---

# Surface: business panel (/app/*), led by the Calendar

Mode: Operate. Users: owners, managers, receptionists (desktop at the front desk) and specialists/owners on phones, about equally. The calendar is the screen people look at all day; Today and every other page hang off it.

Owner asks: one brand with the public site (no pink/magenta), fully Georgian labels, less explanatory text and more working information per screen, faster, each vertical keeps its own carbon colour.

## Direction contract

THESIS: The panel is the back office of the same appointment card the customer filled in. The calendar is a timetable board where every booking is a torn-off ticket: stub coloured by status, body with client, service and time. It refuses the category default of a pastel SaaS dashboard with gradient hero headers, metric cards and pill buttons.

OWN-WORLD: DESIGN.md "Appointment Card" carried into Operate mode. Indigo desk rail (#1c1b48) for navigation, form paper ground, sheet-white work areas with 1.5px Form Ink head rules and 1px Pale Rule subdivisions, 2-6px corners, violet stamp (#5a2fc2) only for actions/focus/selection, Martian Mono tabular numerals for every time, date, price and count, Noto Sans Georgian condensed heavy for page titles. Vertical carbon tints mark the business's vertical (rail chip, ticket stubs of that vertical's services). Status vocabulary on ticket stubs: pending = canary stub with stamp outline, confirmed = sky, checked-in/in service = stamp violet, completed = pale rule with ink check, cancelled/no-show = struck, hatched.

STORY: Staff open the panel and immediately see today's board: who is with whom now, what is next, what needs confirming. They act in place (confirm, check in, finish, take payment) without reading paragraphs. Every other page uses the same compact head row and ledger tables.

FIRST VIEWPORT: Left: desk rail (wordmark, grouped nav, vertical chip, user at bottom; collapses to an icon rail; bottom tab bar on phones). Main: one compact head row on paper (condensed title "კალენდარი", mono date stamp with prev/next/today, day/week switch, location and staff filters, stamp "+ ჯავშანი" at right). Below, full width: the board, a mono time gutter, one column per specialist with name and colour dot, bookings as tickets, a violet "ახლა" rule across all columns. Phones: one specialist column at a time with a horizontal specialist strip.

FORM: Timetable board with tear-off tickets (dealt lead, position 4 of 7 on the grounded list), seed key 008863da.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
