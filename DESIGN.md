---
name: Chawera
description: One Georgian booking catalog for beauty, aesthetics and dental, drawn as a printed appointment card; the business panel is its back office.
colors:
  paper: "#fdfdfb"
  sheet-white: "#ffffff"
  ink: "#23235e"
  ink-soft: "#4a4b85"
  rule: "#cfd1ea"
  rule-strong: "#9fa3d1"
  rule-wash: "#e7e8f5"
  surface-hover: "#eff0f8"
  desk: "#1c1b48"
  desk-soft: "#2a2960"
  on-desk: "#eceefb"
  on-desk-soft: "#b9bce6"
  stamp: "#5a2fc2"
  stamp-hover: "#4a22a8"
  danger: "#b4232a"
  beauty: "#f8c8d8"
  beauty-ink: "#86194a"
  aesthetics: "#f6e17a"
  aesthetics-ink: "#5f4800"
  dental: "#bfe0f7"
  dental-ink: "#0d4a7f"
typography:
  display:
    fontFamily: "Noto Sans Georgian, Sora, system-ui, sans-serif"
    fontSize: "clamp(1.95rem, 5.6vw, 4.4rem)"
    fontWeight: 850
    lineHeight: 1.04
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 75"
  headline:
    fontFamily: "Noto Sans Georgian, Sora, system-ui, sans-serif"
    fontSize: "clamp(1.6rem, 3.2vw, 2.4rem)"
    fontWeight: 800
    lineHeight: 1.1
    fontVariation: "'wdth' 80"
  title:
    fontFamily: "Noto Sans Georgian, Sora, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.4
    fontVariation: "'wdth' 85"
  body:
    fontFamily: "Noto Sans Georgian, Sora, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Noto Sans Georgian, Sora, system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 700
    letterSpacing: "0.06em"
  numeral:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0"
    fontFeature: "'tnum'"
  panel-title:
    fontFamily: "Noto Sans Georgian, Sora, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 1.1rem + 1.2vw, 2rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 80"
  panel-sheet-title:
    fontFamily: "Noto Sans Georgian, Sora, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 800
    lineHeight: 1.3
    fontVariation: "'wdth' 85"
  panel-control:
    fontFamily: "Noto Sans Georgian, Sora, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 800
    fontVariation: "'wdth' 85"
  panel-body:
    fontFamily: "Noto Sans Georgian, Sora, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  panel-meta:
    fontFamily: "Noto Sans Georgian, Sora, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
  ticket-name:
    fontFamily: "Noto Sans Georgian, Sora, system-ui, sans-serif"
    fontSize: "0.82rem"
    fontWeight: 800
    lineHeight: 1.25
    fontVariation: "'wdth' 85"
  metric-numeral:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "1.35rem"
    fontWeight: 600
    lineHeight: 1.2
    fontFeature: "'tnum'"
rounded:
  hairline: "2px"
  field: "3px"
  card: "4px"
  tab: "6px 6px 0 0"
spacing:
  gutter: "1rem"
  row: "0.8rem 1rem"
  ticket: "1rem"
  card-inner: "clamp(1.25rem, 3.5vw, 2.75rem)"
  section: "clamp(3.5rem, 7vw, 6rem)"
  container: "76rem"
  panel-cell: "0.75rem 1rem"
  panel-sheet-head: "0.65rem 1rem 0.55rem"
  panel-toolbar: "0.6rem 0.75rem"
  board-gutter: "3.5rem"
components:
  button-stamp:
    backgroundColor: "{colors.stamp}"
    textColor: "{colors.sheet-white}"
    rounded: "{rounded.card}"
    padding: "0 1.4rem"
    height: "3rem"
  button-stamp-hover:
    backgroundColor: "{colors.stamp-hover}"
  button-paper:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "0 1.4rem"
    height: "3rem"
  button-line:
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "0 1.4rem"
    height: "2.75rem"
  field:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0.4rem 0.75rem 0.55rem"
  vertical-tab:
    textColor: "{colors.ink}"
    rounded: "{rounded.tab}"
    padding: "0.55rem 0.9rem 0.85rem"
  ticket:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    height: "8.5rem"
  ledger:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  ledger-row:
    padding: "{spacing.row}"
  stamp-mark:
    textColor: "{colors.stamp}"
    rounded: "{rounded.card}"
    padding: "0.05rem 0.45rem"
  navlink:
    textColor: "{colors.on-desk}"
    rounded: "{rounded.card}"
    padding: "0.5rem 0.65rem"
  navlink-hover:
    backgroundColor: "{colors.desk-soft}"
  panel-stamp-button:
    backgroundColor: "{colors.stamp}"
    textColor: "{colors.sheet-white}"
    typography: "{typography.panel-control}"
    rounded: "{rounded.card}"
    padding: "0 0.85rem"
    height: "2.25rem"
  panel-stamp-button-hover:
    backgroundColor: "{colors.stamp-hover}"
  panel-segment:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "0 0.7rem"
    height: "2.25rem"
  panel-segment-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet-white}"
  panel-sheet:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  panel-metric:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "{spacing.panel-cell}"
  status-mark:
    textColor: "{colors.ink-soft}"
    typography: "{typography.panel-meta}"
    rounded: "{rounded.field}"
    padding: "0.05rem 0.45rem"
    height: "1.5rem"
  status-mark-pending:
    backgroundColor: "{colors.aesthetics}"
    textColor: "{colors.aesthetics-ink}"
  status-mark-info:
    backgroundColor: "{colors.dental}"
    textColor: "{colors.dental-ink}"
  status-mark-done:
    backgroundColor: "{colors.rule}"
    textColor: "{colors.ink}"
  status-mark-struck:
    backgroundColor: "{colors.rule-wash}"
    textColor: "{colors.ink-soft}"
  status-mark-active:
    backgroundColor: "{colors.stamp}"
    textColor: "{colors.sheet-white}"
  count-mark:
    textColor: "{colors.ink}"
    typography: "{typography.numeral}"
    rounded: "{rounded.field}"
    padding: "0.05rem 0.45rem"
    height: "1.5rem"
  board-ticket:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  ticket-stub-pending:
    backgroundColor: "{colors.aesthetics}"
    textColor: "{colors.ink}"
    width: "1.15rem"
  ticket-stub-confirmed:
    backgroundColor: "{colors.dental}"
    textColor: "{colors.dental-ink}"
    width: "1.15rem"
  ticket-stub-in-service:
    backgroundColor: "{colors.stamp}"
    textColor: "{colors.sheet-white}"
    width: "1.15rem"
  ticket-stub-completed:
    backgroundColor: "{colors.rule}"
    textColor: "{colors.ink}"
    width: "1.15rem"
  ticket-stub-struck:
    textColor: "{colors.ink-soft}"
    width: "1.15rem"
  rail:
    backgroundColor: "{colors.desk}"
    textColor: "{colors.on-desk}"
  rail-navlink:
    textColor: "{colors.on-desk}"
    rounded: "{rounded.card}"
    padding: "0 0.65rem"
    height: "2.25rem"
  rail-navlink-active:
    backgroundColor: "{colors.desk-soft}"
    textColor: "{colors.sheet-white}"
  phone-tab-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet-white}"
    rounded: "{rounded.card}"
    height: "3rem"
---

# Design System: Chawera

<!-- Scope: one world, two modes. Catalog mode is the public catalog (namespace `cw-`, tokens on `.cw` in client/src/components/catalog/catalog.css). Operate mode is the business panel /app/* (namespace `cwk-`, client/src/components/workspace/panel.css, reached through WorkspacePrimitives.tsx and DashboardLayout.tsx). The `:root` tokens in client/src/index.css were retoned to this palette: the core `sf-` names (`--sf-bg`, `--sf-surface`, `--sf-text`, `--sf-muted`, `--sf-border`, `--sf-accent`, `--sf-ink-deep`, `--sf-gradient-*` as flat single colours) and the shadcn variables (`--background`, `--primary`, `--border`, `--ring`, `--sidebar*`, `--radius` = 4px) are aliases of the colours below, not a second system. Known remnants that are NOT part of the system: `--sf-salon-warm/champagne/rose/leaf/glass/hairline` (terracotta/champagne, still read by `sf-public-*` classes), and the `.dark` theme (aubergine sidebar #0d0619, never visually reviewed). -->

## Overview

**Creative North Star: "The Appointment Card"**

The public catalog is a printed form lying on an indigo desk. White form paper is ruled in a single indigo form ink; questions are boxed fields with small printed captions; the three verticals are carbon copies of the same form in pink (beauty), canary (aesthetics) and sky blue (dental); the one action ink is a violet rubber stamp. Businesses appear as numbered tear-off tickets with die-cut notches and a dashed perforation between stub and body. Every device is something a real appointment card, carbon triplicate or ticket roll actually has.

Density is that of a form: hairline rules (1.5px ink, 1px pale rule) carry structure, not cards floating on whitespace. Desk bands (header, hero, business band, footer) frame the paper; paper set on the desk keeps paper colours. Headlines are condensed, very heavy Georgian set at narrow width; every number (dates, ticket №, counts, domain) is typewriter mono with tabular digits. Motion is physical and short: sheets slide, tabs lift, tickets rise a few pixels, all on one out-expo curve, and all of it switches off under reduced motion.

The business panel (Operate mode, /app/*) is the back office of the same card. Navigation sits on the indigo desk as a rail; work happens on form paper in sheet-white sheets ruled with a 1.5px ink head rule. The calendar is a timetable board on which every booking is a small torn-off ticket whose stub is coloured by status. Operate mode is denser than the catalog: a smaller type ramp, 2.25rem controls on desktop, one compact head row per page, and no explanatory paragraphs.

The world explicitly rejects the category default it replaces: a soft pink gradient banner carousel over rows of rounded photo cards, and in the panel a pastel SaaS dashboard with gradient hero headers, coloured metric cards and pill buttons. No glass and no decorative colour gradients.

**Key Characteristics:**
- One indigo ink for all text and rules; one violet stamp for actions, statuses and promotion marks.
- Vertical colour is carbon-copy colour: it owns a whole region (tab, sheet, stub, ledger head), never a stray accent. In the panel, canary and sky also carry booking status on ticket stubs and status marks, under the named Status Stub exception.
- Square-ish corners (2-6px), hairline rules, perforations and die-cut notches as the edge language.
- Condensed heavy Georgian display; mono tabular numerals for anything counted, timed or dated.
- Soft, ink-tinted drop shadows only where paper sits on the desk or lifts on interaction.
- Panel: desk rail, one head row, sheets, ticket board.

## Colors

A cool indigo-ink-on-white form palette with three pastel carbon-copy tints and one saturated violet stamp.

### Primary
- **Rubber-Stamp Violet** (stamp): the single action colour. Primary buttons ("მოძებნე", "რუკის გახსნა", panel "+ ჯავშანი"), the "ჩაწერა" ticket link, inline action links, the focus ring, VIP/RECOMMENDED and "მალე" stamp marks. In the panel also: the "ახლა" now-rule and tag, in-place ticket actions, the drop-target wash (6%), and the stub of a checked-in / in-service booking. White text on it passes at 8:1.
- **Pressed Stamp** (stamp-hover): hover state of stamp buttons only.

### Secondary (the carbon copies)
Each vertical is a pair: a pastel copy tint for the surface and a deep ink of the same hue for text set on it (all pairs pass AA at about 6.3-6.6:1).
- **Carbon Pink** (beauty) with **Beauty Ink** (beauty-ink): beauty / salons.
- **Carbon Canary** (aesthetics) with **Aesthetics Ink** (aesthetics-ink): aesthetics / cosmetology. In the panel also the "pending" status.
- **Carbon Sky** (dental) with **Dental Ink** (dental-ink): dentistry. In the panel also the "confirmed" / informational status.

### Neutral
- **Form Paper** (paper): page background, the appointment card itself, and the panel's work ground and phone top bar.
- **Sheet White** (sheet-white): inside field boxes, tickets, ledgers, and every panel sheet, metric, toolbar and the board.
- **Form Ink** (ink): all primary text, field borders, heavy 1.5px section and card-head rules; in the panel also the fill of pressed segments, selected specialist chips and the active phone tab.
- **Faded Ink** (ink-soft): ledes, captions, secondary metadata.
- **Pale Rule** (rule): 1px ledger row dividers, ticket borders, sheet borders, board column lines and hour ruling (half-hours at 45%); in the panel also the "completed" stub and "done" mark.
- **Ruled Wash** (rule-wash): fill of the struck (cancelled / no-show) status mark.
- **Hover Wash** (surface-hover): quiet hover on sheet-white controls (date buttons; shadcn secondary/muted/accent).
- **Strong Rule** (rule-strong): dashed perforation lines and dashed "coming soon" or empty-state outlines, ticket hover border, the outline of date and strip buttons. Decorative only (2.4:1 on white); never text.
- **Indigo Desk** (desk) and **Desk Shadow** (desk-soft): the desk bands, the panel rail, and their hover / active / divider tone.
- **Desk Light** (on-desk) and **Desk Dim** (on-desk-soft): primary and secondary text on the desk; Desk Dim is also the focus outline on the rail.
- **Error Red** (danger): destructive actions and the error empty-state outline and icon only (shadcn `--destructive`).

### Named Rules
**The One Ink Rule.** Text and structural rules are Form Ink (or Faded Ink for secondary). No second text colour exists on paper; on a carbon tint, use that vertical's own ink.

**The Carbon Copy Rule.** A vertical colour fills a whole region tied to that vertical (tab, sheet, ticket stub, ledger head, tint of the chosen card at 16%, the org's vertical chip on the rail). It is never used as a generic accent, button colour, or decoration detached from a vertical. The one sanctioned exception is the Status Stub Rule below.

**The Status Stub Rule.** In Operate mode, booking status is printed on the ticket stub and on status marks with a fixed vocabulary: pending = Carbon Canary stub with Form Ink glyph; confirmed = Carbon Sky with Dental Ink; checked-in and in-service = Rubber-Stamp Violet with white; completed = Pale Rule with Form Ink; cancelled and no-show = a 45deg hatch of Pale Rule (3px on, 3px off), dashed ticket border and the client name struck through in Faded Ink. Status marks follow the same map (warning = canary with a violet outline, info = sky, success = pale rule, danger = ruled wash struck through, violet = stamp fill). Every stub also carries a line icon and, where height allows, the status word, so status never rides on colour alone. Carbon Pink is never a status colour. Outside the stub and the mark, canary and sky mean their vertical only.

**The Stamp Rule.** Violet means "act" or "officially marked". Primary actions, links to book, focus, promotion/status stamps, the now-line, and the in-service stub; nothing else.

## Typography

**Display Font:** Noto Sans Georgian, variable width axis (with Sora, system-ui fallback)
**Body Font:** Noto Sans Georgian (same family, normal width)
**Label/Mono Font:** Martian Mono (with ui-monospace)

**Character:** One Georgian sans pushed to its narrowest, heaviest cut for headlines and kept at normal width for reading, paired with a typewriter mono that makes every date and number look stamped onto the form.

### Hierarchy
- **Display** (850, clamp(1.95rem, 5.6vw, 4.4rem), 1.04, width 75%): the hero headline on the card, and the wordmark at 1.7rem (1.5rem on the panel rail). Balanced wrapping.
- **Headline** (800, clamp(1.6rem, 3.2vw, 2.4rem), 1.1, width 80%): section headings.
- **Title** (800, 1.125-1.25rem, width 85%): ticket names, ledger heads, shelf titles, step titles. Buttons and tabs share the 85% width at 800.
- **Body** (400-600, 1rem; ledes 1.05rem / 1.6 at max 34rem, in Faded Ink): descriptions and ledes. Field input text is 1.05rem at 600.
- **Label** (700, 0.72rem, 0.06em tracking): printed captions inside field boxes and footer column heads. The CSS sets uppercase, which leaves Georgian script unchanged; do not rely on case for hierarchy.
- **Numeral** (Martian Mono, tabular, 0.7-0.875rem, 600): ticket № (zero-padded, "№ 001"), the form date, counts, domain, copyright year.

### Operate ramp (panel)
The panel runs a denser ramp; these are the only sizes it should use.
- **Panel title** (800, clamp(1.5rem, 1.1rem + 1.2vw, 2rem), 1.1, width 80%, balanced): the one page title in the head row; 1.5rem on phones.
- **Metric numeral** (Martian Mono 600, 1.35rem, 1.2): the value in a metric tile.
- **Sheet title** (800, 1.05rem, 1.3, width 85%): section sheet heads.
- **Column head** (800, 0.95rem, width 85%): specialist / day names on the board; the date stamp (700, 0.95rem, mono digits at 0.9rem).
- **Control** (800, 0.85-0.9rem, width 85%): segmented switch, date buttons, specialist strip, stamp button. Rail nav links are 0.9rem / 600, active 800 at 90% width.
- **Panel body** (0.875rem): head-row description (one truncated line, hidden under 640px), rail footer links, empty-state text.
- **Sheet description** (0.8rem) and **org name** on the rail (0.8rem / 700).
- **Ticket name** (800, 0.82rem, 1.25, width 85%): client name on a board ticket.
- **Panel meta** (0.72-0.75rem): metric helper, status and count marks (0.75rem / 700), in-place ticket action (0.75rem / 800), ticket service line (0.74rem), column sub-line, rail captions (0.72rem / 700, 0.06em) and phone tab labels (0.72rem / 700).
- **Panel numerals** (Martian Mono, tabular, 600): board hour gutter at 0.7rem, ticket times, the date stamp, metric values, counts, the rail domain.

### Named Rules
**The Stamped Numeral Rule.** Every date, time, count, price, ticket number and the domain is set in Martian Mono with tabular digits. Prose never is.

**The Condensed Voice Rule.** Emphasis comes from width and weight (75-90% width, 800-850), not from a second display family or colour.

**The Text Floor Rule.** Georgian text never goes below 0.72rem; mono numerals may go to 0.7rem. Density comes from fewer words, not smaller ones.

## Layout

A single centred container (76rem max, 1rem gutters each side) inside full-bleed bands. Desk bands (header, hero, business band, footer) alternate with paper sections; paper sections are separated by a 1.5px Form Ink rule across the top and padded clamp(3.5rem, 7vw, 6rem) vertically.

The hero is one full-width appointment card on the desk: carbon sheets stacked behind it offset in steps of 9px (5px under 640px), vertical tabs hanging above its top edge, a 10px colour band across its top, a mono date header over a 1.5px ink rule, then headline and lede beside the boxed search fields (1.15fr / 1fr from 1024px, stacked below). The card's bottom edge is perforated.

Listings are ticket grids: one column, two from 768px, three from 1280px, 1rem gaps. Category ledgers sit three across from 1024px. Mobile first: under 640px the tabs become a four-column grid with smaller type, ticket stubs narrow from 4.75rem to 3.5rem, and under 768px extra blank tickets are hidden.

### Operate layout (panel)
- **Frame:** desk rail at left (collapses to an icon rail), paper work area padded 0.75rem, 1.25rem from 640px, 1.5rem from 1280px. On phones the rail becomes an off-canvas sheet behind a 3.5rem paper top bar (1.5px ink rule under it) and a fixed bottom tab bar (four quick destinations plus "მეტი", 3rem cells, 1.5px ink rule over it); the work area reserves 6rem at the bottom for it.
- **Page:** one head row, then sheets, metric rows and toolbars stacked below it. Pages are full width; the board uses all of it.
- **Board:** a scrollable sheet (min 22rem, max viewport minus 13rem, minus 14rem under 1024px) holding a grid of a 3.5rem mono hour gutter plus one column per specialist (min 11rem in day view, 9.5rem in week view). Column heads and the gutter are sticky; hours are ruled with a 1px Pale Rule and half-hours at 45%. A 2px violet now-rule crosses today's column with a violet "ახლა" tag in the gutter. Under 768px the board shows one column at a time (3.25rem gutter, column heads hidden) and a horizontally scrolling strip of specialist (or day) chips picks it.
- **Touch:** under 768px every board control, the stamp button and ticket actions grow to 2.75rem.

## Elevation & Depth

Paper on a desk: mostly flat, with soft ink-tinted shadows that only express a sheet lying on, or lifting off, the surface below. Depth among the carbon copies is conveyed by physical offset and stacking order first, shadow second. No hard offset shadows, no glass, no blur layers.

### Shadow Vocabulary
- **Card on desk** (`filter: drop-shadow(0 18px 30px rgba(8, 7, 32, 0.45))`): the appointment card only; a filter so it follows the perforated mask.
- **Chosen sheet** (`box-shadow: 0 10px 24px -14px rgba(0, 0, 0, 0.6)`): the carbon copy pulled forward.
- **Raised tab** (`box-shadow: 0 -6px 14px -10px rgba(0, 0, 0, 0.5)`): the pressed vertical tab.
- **Stamp press** (`box-shadow: 0 6px 14px -8px rgba(58, 28, 134, 0.75)`, active `0 2px 6px -4px`): stamp buttons (catalog and panel), which push down 1px when pressed.
- **Ticket lift** (`box-shadow: 0 14px 24px -18px rgba(35, 35, 94, 0.6)`): catalog ticket hover, with a 3px rise.
- **Pinned ticket** (`box-shadow: 0 1px 2px rgba(35, 35, 94, 0.08)`): board tickets at rest, pinned to the board.

### Named Rules
**The Paper Only Lifts Rule.** Surfaces are flat at rest except the card on the desk and the pinned board ticket's 1px contact shadow. Every other shadow is a response to state: chosen, pressed, hovered. Panel sheets, metrics and toolbars carry no shadow.

## Shapes

Square-ish and printed. Corners are 2px (cover images, specialist colour dots), 3px (field boxes, chips, small badges, step number boxes, status and count marks, the vertical chip, the now tag, in-place ticket actions), 4px (buttons, cards, tickets, ledgers, sheets, metric tiles, board, rail buttons and nav links, phone tabs) and 6px top-only on tabs. No pills. In Tailwind terms, with `--radius` at 4px, `rounded-lg` is 4px and `rounded-md` 2px; `rounded-xl` (8px), `rounded-2xl` and `rounded-full` are off the ramp.

Edges carry the world: perforated card bottoms (7px semicircle notches every 18px, cut with a mask), tickets with 9px die-cut notches top and bottom at the stub line and a 2px dashed divider, 2px dashed perforation rules, dashed outlines for not-yet-available features, and ruled blank lines (1px every 1.9rem) on unfilled tickets. Board tickets repeat it small: 4px notches top and bottom at the 1.15rem stub line and a 1.5px dashed Strong Rule perforation. Borders are 1.5px Form Ink for structure (head rows, sheet heads, column heads, segmented controls) and 1px Pale Rule for subdivision (sheets, board columns). These mask and repeating-gradient techniques are cutting, ruling and hatching, not colour gradients, and are native to the world.

## Components

### Buttons
Printed and pressed, never pill-shaped.
- **Shape:** 4px corners, min-height 3rem (2.5-2.75rem in dense rows), 1.4rem horizontal padding, 800 weight at 85% width, optional 16-20px line icon.
- **Stamp (primary):** violet with white text and the stamp-press shadow. One per region.
- **Paper:** paper-coloured on the desk (login, "გაიგე მეტი"); hovers to pure white.
- **Line:** transparent with a 1.5px currentColor border; hover fills currentColor at 10%. Used for "მთელი კატალოგი", city chips, and white-on-desk registration.
- **Panel stamp:** the same stamp at Operate density: 2.25rem high (2.75rem under 768px), 0.85rem padding, 0.9rem, leading plus icon. One per head row, at the right.
- **Hover / Focus:** 160ms colour/transform transitions; focus is a 3px violet outline offset 2px (white on the catalog desk, Desk Dim offset 1px on the panel rail).

### Chips
- **City chips:** Line buttons at min-height 2.5rem, 0.875rem bold.
- **Vertical chips (on desk):** 3px corners, the vertical's tint and ink, 800 weight. Static labels, not filters. On the panel rail the org's vertical chip sits beside the org name at 0.72rem minimum.
- **Specialist strip (phones):** sheet-white chips with a Strong Rule outline, 2.75rem, colour dot plus name; the chosen one fills with Form Ink.

### Status and Count Marks (panel)
- **Status mark:** 3px corners, 1px outline in the tone's line colour, 0.75rem / 700, min-height 1.5rem, nowrap. Tones follow the Status Stub Rule; neutral is transparent with Pale Rule outline and Faded Ink.
- **Count mark:** transparent, 1px Form Ink outline, Form Ink Martian Mono tabular digits at 600. Every count badge in the panel is this mark, never a coloured bubble.

### Cards / Containers
- **Appointment card:** paper, 4px corners, 10px colour band on top (Form Ink, or the chosen vertical's tint), mono date header, perforated bottom, card-on-desk shadow. Takes a 16% tint of the chosen vertical.
- **Ledger:** sheet white, 1.5px ink border, 4px corners; head band in the vertical's tint with a mono count; rows divided by 1px Pale Rule, hover tints with 45% of the vertical colour. Also used as a numbered step list with 2.25rem mono number boxes.
- **Coming-soon panel:** 2px dashed Strong Rule outline, 4px corners, 1.5rem padding, line icon, stamp mark.
- **Panel sheet:** sheet white, 1px Pale Rule border, 4px corners; head band of title (and optional one-line description, optional action at right) over a 1.5px ink rule; 1rem body padding. No shadow, no tint.
- **Metric tile:** sheet white, 1px Pale Rule border, 4px corners, 0.75rem 1rem padding; caption with an optional line icon at right, mono value, optional helper. Tiles are never coloured by tone.
- **Empty / loading / error state:** 1px dashed Strong Rule outline (error: Error Red), 4px corners, min-height 8rem, line icon, bold title, one optional line.
- **Toolbar:** sheet white strip, 1px Pale Rule border, 4px corners, filters bottom-aligned.

### Inputs / Fields
- **Style:** sheet white box, 1.5px Form Ink border, 3px corners, printed Label caption above the input inside the box, input at 1.05rem / 600. Panel selects and inputs are the shadcn controls at 2.25rem (2.75rem on phones) on the same tokens.
- **Focus:** the field shows a 3px violet ring at 35% opacity around the whole box (focus-within); the inner input has no outline of its own.

### Navigation
- **Header:** on the desk, min-height 4rem. Wordmark (Display at 1.7rem plus mono domain), nav links in Desk Light at 0.9rem / 600 with 4px hover fill in Desk Shadow. Unavailable destinations stay visible but inert at 70% with a bordered "მალე" tag. Under 1024px a menu button reveals a stacked list under a desk-soft divider.
- **Footer:** desk band, three columns from 768px, Label captions over 0.875rem links that underline on hover, mono year.
- **Desk rail (panel):** the whole navigation column is Indigo Desk. Head: rail toggle, wordmark (1.5rem, 75% width, 850) with mono domain, quick-search button (2.25rem bordered desk buttons). Under it the org name and its vertical chip. Grouped nav with Desk Dim captions (the management group collapses behind its caption button); links are 4px, 0.9rem / 600 in Desk Light with Desk Dim icons; hover and active fill Desk Shadow, active turns white, 800 at 90% width with a 1px inset ring. Footer: help link and the user (4px square avatar, name, mail) over a Desk Shadow divider. The rail collapses to icons; the paper side never hosts primary navigation.
- **Phone bars (panel):** paper top bar with menu, wordmark in Form Ink, search and help (2.75rem bordered buttons); sheet-white bottom tab bar whose active tab is a Form Ink fill.

### Head Row (panel)
The one page head: condensed Panel title at left, optional one-line description (truncated, hidden under 640px), actions at right, all on one row over a 1.5px Form Ink rule, 0.7rem below the text. On the calendar on phones the title and stamp share the first row, the date bar takes the full second row, view switch and location follow. No eyebrow or kicker sits above the title.

### Segmented Switch and Date Bar (panel)
- **Segmented switch:** sheet white, 1.5px Form Ink outline and dividers, 4px corners, 2.25rem cells; the pressed cell fills Form Ink with white text. Day / week.
- **Date bar:** prev and next date buttons (1px Strong Rule outline, 4px, hover wash), the mono date stamp between them, and a "დღეს" button.

### Ticket (signature)
A tear-off ticket for each approved business: sheet white, 1.5px Pale Rule border, 4px corners, min-height 8.5rem, notched at the stub line. The stub carries the lead vertical's tint and ink, a vertical mono "№ 001" and the vertical name; the body holds the name (Title), area with a pin icon, categories, a violet "ჩაწერა" with an arrow that nudges right on hover, and an optional 6rem cover image (from 640px). Promotion is shown as a stamp mark with a disclosure. Unfilled tickets show ruled blank lines.

### Ticket Board (signature, panel)
The calendar is a timetable board of small tickets, absolutely placed by time and lane. Each board ticket is sheet white with a 1px Pale Rule border, 4px corners, the pinned-ticket shadow and 4px die-cut notches at the stub line. The 1.15rem stub is coloured by status (Status Stub Rule) and carries a 0.7rem line icon (hidden on very short tickets); a 1.5px dashed perforation divides it from the body. The body stacks client name, service (from 60px tall), mono time, and the status word (from 76px tall); short tickets collapse to one line of name and time. The next action ("confirm", "check in", "finish", "pay") sits in the ticket as a small violet 3px button, so staff act in place. In week view with all specialists a specialist colour dot precedes the client name; column heads carry the same dot (the staff colour is the specialist's own, 2px square).
- **Hover:** border to Strong Rule and the body washes 6% toward violet. No lift; the board is dense.
- **Focus:** 2px violet outline inset by 2px on focus-within.
- **Drag:** pending and confirmed tickets are draggable by managers (grab cursor); the target column washes 6% violet. Drag-and-drop is pointer-only.
- **Motion (stamp press):** when a booking's status changes, its stub recolours over 200ms and plays a 220ms stamp press: it starts 3px high at 130% with a small ink shadow, overshoots to 94% one pixel low, and settles. All on cubic-bezier(0.16, 1, 0.3, 1).
- **Reduced motion:** the stamp press does not play, and ticket, stub, stamp-button, rail-button, rail-link and nav transitions are removed; the global reduced-motion rule also collapses every other transition and the page enter animation.

### Stamp Mark (signature)
Violet text in a 2px violet border, 4px corners, 900 weight at 75% width, 0.8rem, 0.06em tracking, rotated -5deg, multiply blend. Only for official marks: VIP, RECOMMENDED, "მალე".

### Known limits (panel)
Week view with all specialists is dense (seven days times every specialist on narrow columns). Drag-to-reschedule is pointer-only. Touch and keyboard users have no drag path on the board. The `.dark` theme exists but was not visually reviewed and does not yet follow this system.

## Do's and Don'ts

### Do:
- **Do** set all text and structural rules in Form Ink on paper, and each vertical's own ink on its tint.
- **Do** give every vertical its full carbon-copy pair and use it for whole regions (tab, sheet, stub, ledger head).
- **Do** reserve Rubber-Stamp Violet for actions, focus, and stamp marks.
- **Do** set dates, counts, ticket numbers and the domain in Martian Mono with tabular digits.
- **Do** use perforations, die-cut notches, dashed tear lines and ruled lines as the edge vocabulary.
- **Do** keep corners between 2px and 6px and borders at 1.5px ink or 1px pale rule.
- **Do** show unbuilt features honestly as dashed outlines with a "მალე" stamp, not as hidden or fake content.
- **Do** run all motion on cubic-bezier(0.16, 1, 0.3, 1) and disable it under prefers-reduced-motion.
- **Do** open every /app page with the one head row (condensed title, actions right, 1.5px ink rule), and put navigation on the desk rail.
- **Do** print booking status on stubs and marks with the Status Stub vocabulary, always with an icon or word beside the colour.
- **Do** show every count in the panel as a count mark: Form Ink outline, mono digits.
- **Do** keep panel controls at 2.25rem on desktop and 2.75rem under 768px.

### Don't:
- **Don't** use pill-shaped buttons, chips or badges.
- **Don't** use glass, backdrop blur, or decorative colour gradients (mask and ruling gradients that cut perforations, draw lines or hatch a cancelled stub are fine).
- **Don't** use hard offset shadows; shadows are soft and ink-tinted.
- **Don't** use a vertical colour as a generic accent or a second action colour; canary and sky carry status only on stubs and status marks, and pink never does.
- **Don't** set Georgian text below 0.72rem, or numerals below 0.7rem.
- **Don't** add a second display family; emphasis is width and weight of Noto Sans Georgian.
- **Don't** put an eyebrow, kicker or second header band above a panel title, or colour metric tiles by tone.
- **Don't** use `rounded-xl`, `rounded-2xl` or `rounded-full` in the panel; they fall off the 2-6px ramp.
- **Don't** read the `--sf-salon-*` tokens or add new `sf-` names; core `sf-` names are aliases of this palette, and new work uses `cw-` / `cwk-` tokens.
