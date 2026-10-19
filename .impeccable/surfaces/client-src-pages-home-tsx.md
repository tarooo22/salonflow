---
version: 1
slug: "client-src-pages-home-tsx"
primary_target: "client/src/pages/Home.tsx"
related_targets: []
---

# Public home (catalog landing)

Scope: `/` — the customer-facing catalog home. Mode: Persuade.
Audience: people across Georgia on phones looking for beauty, aesthetic or dental services. Action: search by what + where, or open a business and book.
Proof/content: real approved listings from `marketplace.directory` (VIP / RECOMMENDED / all). No fake businesses, ratings, counts or slots. Dental has no categories yet: show it honestly as "coming soon". Products and vacancies do not exist yet: "coming soon" stubs only.
Constraints: Georgian first (ka/en/ru via PublicLocaleContext), mobile first, WCAG AA. Working brand name "Chawera" from one constant.

## Direction contract

THESIS: The page is an appointment card. You fill in "what / where" on a printed form and real tear-off tickets (approved businesses) hang below it. It refuses the category default: soft pink gradient banner carousel over rows of rounded photo cards.

OWN-WORLD: White form paper ruled in one indigo form ink; field boxes with small printed captions; carbon-copy colours own whole regions — pink copy = beauty, canary copy = aesthetics, sky-blue copy = dental; violet rubber-stamp ink for the primary action, statuses and VIP marks; perforated edges and numbered tickets (№ in tabular digits). Square-ish corners, hairline rules, no glass, no gradients.

STORY: The visitor sees one platform covering beauty, aesthetics and dentistry, understands that every listed place is verified and bookable online, and acts: fills the card or tears a ticket.

FIRST VIEWPORT: Full-width form card on an indigo desk band. Left: form header "ჩაწერის ბარათი", big Georgian headline, one-line promise. Right/below: boxed fields "რა?" (service or place) and "სად?" (city/area) with a violet stamp-style "მოძებნე" button. Behind the card, the three carbon copies (pink, canary, blue) peek out as tabs labelled by vertical; picking one slides that copy forward and filters categories. Card bottom edge is perforated; the first ticket strip starts just below the fold line.

FORM: Appointment card / carbon triplicate form; position 4 on my ordered list; seed key e71801b9. Signature interaction: the carbon-copy shuffle when switching vertical.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
