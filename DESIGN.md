---
name: Chawera
description: One Georgian booking catalog for beauty, aesthetics and dental, drawn as a printed appointment card.
colors:
  paper: "#fdfdfb"
  sheet-white: "#ffffff"
  ink: "#23235e"
  ink-soft: "#4a4b85"
  rule: "#cfd1ea"
  rule-strong: "#9fa3d1"
  desk: "#1c1b48"
  desk-soft: "#2a2960"
  on-desk: "#eceefb"
  on-desk-soft: "#b9bce6"
  stamp: "#5a2fc2"
  stamp-hover: "#4a22a8"
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
---

# Design System: Chawera

<!-- Scope: this system is the public catalog world (namespace `cw-`, tokens declared on `.cw` in client/src/components/catalog/catalog.css). As of this record it is shipped on the public home `/` only. The internal panel and the older public pages still run on the legacy `sf-` tokens in client/src/index.css; that is known drift, not yet migrated, and is not the authority for new public surfaces. -->

## Overview

**Creative North Star: "The Appointment Card"**

The public catalog is a printed form lying on an indigo desk. White form paper is ruled in a single indigo form ink; questions are boxed fields with small printed captions; the three verticals are carbon copies of the same form in pink (beauty), canary (aesthetics) and sky blue (dental); the one action ink is a violet rubber stamp. Businesses appear as numbered tear-off tickets with die-cut notches and a dashed perforation between stub and body. Every device is something a real appointment card, carbon triplicate or ticket roll actually has.

Density is that of a form: hairline rules (1.5px ink, 1px pale rule) carry structure, not cards floating on whitespace. Desk bands (header, hero, business band, footer) frame the paper; paper set on the desk keeps paper colours. Headlines are condensed, very heavy Georgian set at narrow width; every number (dates, ticket №, counts, domain) is typewriter mono with tabular digits. Motion is physical and short: sheets slide, tabs lift, tickets rise a few pixels, all on one out-expo curve, and all of it switches off under reduced motion.

The world explicitly rejects the category default it replaces: a soft pink gradient banner carousel over rows of rounded photo cards. No glass and no decorative colour gradients.

**Key Characteristics:**
- One indigo ink for all text and rules; one violet stamp for actions, statuses and promotion marks.
- Vertical colour is carbon-copy colour: it owns a whole region (tab, sheet, stub, ledger head), never a stray accent.
- Square-ish corners (2-6px), hairline rules, perforations and die-cut notches as the edge language.
- Condensed heavy Georgian display; mono tabular numerals for anything counted or dated.
- Soft, ink-tinted drop shadows only where paper sits on the desk or lifts on interaction.

## Colors

A cool indigo-ink-on-white form palette with three pastel carbon-copy tints and one saturated violet stamp.

### Primary
- **Rubber-Stamp Violet** (stamp): the single action colour. Primary buttons ("მოძებნე", "რუკის გახსნა"), the "ჩაწერა" ticket link, inline action links, the focus ring, VIP/RECOMMENDED and "მალე" stamp marks. White text on it passes at 8:1.
- **Pressed Stamp** (stamp-hover): hover state of stamp buttons only.

### Secondary (the carbon copies)
Each vertical is a pair: a pastel copy tint for the surface and a deep ink of the same hue for text set on it (all pairs pass AA at about 6.3-6.6:1).
- **Carbon Pink** (beauty) with **Beauty Ink** (beauty-ink): beauty / salons.
- **Carbon Canary** (aesthetics) with **Aesthetics Ink** (aesthetics-ink): aesthetics / cosmetology.
- **Carbon Sky** (dental) with **Dental Ink** (dental-ink): dentistry.

### Neutral
- **Form Paper** (paper): page background and the appointment card itself.
- **Sheet White** (sheet-white): inside field boxes, tickets and ledgers, so they read as inserted sheets on the paper.
- **Form Ink** (ink): all primary text, field borders, heavy 1.5px section and card-head rules.
- **Faded Ink** (ink-soft): ledes, captions, secondary metadata.
- **Pale Rule** (rule): 1px ledger row dividers, ticket borders, ruled lines on blank tickets.
- **Strong Rule** (rule-strong): dashed perforation lines and dashed "coming soon" outlines, ticket hover border. Decorative only (2.4:1 on white); never text.
- **Indigo Desk** (desk) and **Desk Shadow** (desk-soft): the desk bands and their hover/divider tone.
- **Desk Light** (on-desk) and **Desk Dim** (on-desk-soft): primary and secondary text on the desk.

### Named Rules
**The One Ink Rule.** Text and structural rules are Form Ink (or Faded Ink for secondary). No second text colour exists on paper; on a carbon tint, use that vertical's own ink.

**The Carbon Copy Rule.** A vertical colour fills a whole region tied to that vertical (tab, sheet, ticket stub, ledger head, tint of the chosen card at 16%). It is never used as a generic accent, button colour, or decoration detached from a vertical.

**The Stamp Rule.** Violet means "act" or "officially marked". Primary actions, links to book, focus, and promotion/status stamps; nothing else.

## Typography

**Display Font:** Noto Sans Georgian, variable width axis (with Sora, system-ui fallback)
**Body Font:** Noto Sans Georgian (same family, normal width)
**Label/Mono Font:** Martian Mono (with ui-monospace)

**Character:** One Georgian sans pushed to its narrowest, heaviest cut for headlines and kept at normal width for reading, paired with a typewriter mono that makes every date and number look stamped onto the form.

### Hierarchy
- **Display** (850, clamp(1.95rem, 5.6vw, 4.4rem), 1.04, width 75%): the hero headline on the card, and the wordmark at 1.7rem. Balanced wrapping.
- **Headline** (800, clamp(1.6rem, 3.2vw, 2.4rem), 1.1, width 80%): section headings.
- **Title** (800, 1.125-1.25rem, width 85%): ticket names, ledger heads, shelf titles, step titles. Buttons and tabs share the 85% width at 800.
- **Body** (400-600, 1rem; ledes 1.05rem / 1.6 at max 34rem, in Faded Ink): descriptions and ledes. Field input text is 1.05rem at 600.
- **Label** (700, 0.72rem, 0.06em tracking): printed captions inside field boxes and footer column heads. The CSS sets uppercase, which leaves Georgian script unchanged; do not rely on case for hierarchy.
- **Numeral** (Martian Mono, tabular, 0.7-0.875rem, 600): ticket № (zero-padded, "№ 001"), the form date, counts, domain, copyright year.

### Named Rules
**The Stamped Numeral Rule.** Every date, count, ticket number and the domain is set in Martian Mono with tabular digits. Prose never is.

**The Condensed Voice Rule.** Emphasis comes from width and weight (75-85% width, 800-850), not from a second display family or colour.

## Layout

A single centred container (76rem max, 1rem gutters each side) inside full-bleed bands. Desk bands (header, hero, business band, footer) alternate with paper sections; paper sections are separated by a 1.5px Form Ink rule across the top and padded clamp(3.5rem, 7vw, 6rem) vertically.

The hero is one full-width appointment card on the desk: carbon sheets stacked behind it offset in steps of 9px (5px under 640px), vertical tabs hanging above its top edge, a 10px colour band across its top, a mono date header over a 1.5px ink rule, then headline and lede beside the boxed search fields (1.15fr / 1fr from 1024px, stacked below). The card's bottom edge is perforated.

Listings are ticket grids: one column, two from 768px, three from 1280px, 1rem gaps. Category ledgers sit three across from 1024px. Mobile first: under 640px the tabs become a four-column grid with smaller type, ticket stubs narrow from 4.75rem to 3.5rem, and under 768px extra blank tickets are hidden.

## Elevation & Depth

Paper on a desk: mostly flat, with soft ink-tinted shadows that only express a sheet lying on, or lifting off, the surface below. Depth among the carbon copies is conveyed by physical offset and stacking order first, shadow second. No hard offset shadows, no glass, no blur layers.

### Shadow Vocabulary
- **Card on desk** (`filter: drop-shadow(0 18px 30px rgba(8, 7, 32, 0.45))`): the appointment card only; a filter so it follows the perforated mask.
- **Chosen sheet** (`box-shadow: 0 10px 24px -14px rgba(0, 0, 0, 0.6)`): the carbon copy pulled forward.
- **Raised tab** (`box-shadow: 0 -6px 14px -10px rgba(0, 0, 0, 0.5)`): the pressed vertical tab.
- **Stamp press** (`box-shadow: 0 6px 14px -8px rgba(58, 28, 134, 0.75)`, active `0 2px 6px -4px`): stamp buttons, which push down 1px when pressed.
- **Ticket lift** (`box-shadow: 0 14px 24px -18px rgba(35, 35, 94, 0.6)`): ticket hover, with a 3px rise.

### Named Rules
**The Paper Only Lifts Rule.** Surfaces are flat at rest except the card on the desk. Every other shadow is a response to state: chosen, pressed, hovered.

## Shapes

Square-ish and printed. Corners are 2px (cover images), 3px (field boxes, chips, small badges, step number boxes), 4px (buttons, cards, tickets, ledgers, sheets) and 6px top-only on tabs. No pills.

Edges carry the world: perforated card bottoms (7px semicircle notches every 18px, cut with a mask), tickets with 9px die-cut notches top and bottom at the stub line and a 2px dashed divider, 2px dashed perforation rules, dashed outlines for not-yet-available features, and ruled blank lines (1px every 1.9rem) on unfilled tickets. Borders are 1.5px Form Ink for structure and 1px Pale Rule for subdivision. These mask and repeating-gradient techniques are cutting and ruling, not colour gradients, and are native to the world.

## Components

### Buttons
Printed and pressed, never pill-shaped.
- **Shape:** 4px corners, min-height 3rem (2.5-2.75rem in dense rows), 1.4rem horizontal padding, 800 weight at 85% width, optional 16-20px line icon.
- **Stamp (primary):** violet with white text and the stamp-press shadow. One per region.
- **Paper:** paper-coloured on the desk (login, "გაიგე მეტი"); hovers to pure white.
- **Line:** transparent with a 1.5px currentColor border; hover fills currentColor at 10%. Used for "მთელი კატალოგი", city chips, and white-on-desk registration.
- **Hover / Focus:** 160ms colour/transform transitions; focus is a 3px violet outline offset 2px (white on the desk).

### Chips
- **City chips:** Line buttons at min-height 2.5rem, 0.875rem bold.
- **Vertical chips (on desk):** 3px corners, the vertical's tint and ink, 800 weight. Static labels, not filters.

### Cards / Containers
- **Appointment card:** paper, 4px corners, 10px colour band on top (Form Ink, or the chosen vertical's tint), mono date header, perforated bottom, card-on-desk shadow. Takes a 16% tint of the chosen vertical.
- **Ledger:** sheet white, 1.5px ink border, 4px corners; head band in the vertical's tint with a mono count; rows divided by 1px Pale Rule, hover tints with 45% of the vertical colour. Also used as a numbered step list with 2.25rem mono number boxes.
- **Coming-soon panel:** 2px dashed Strong Rule outline, 4px corners, 1.5rem padding, line icon, stamp mark.

### Inputs / Fields
- **Style:** sheet white box, 1.5px Form Ink border, 3px corners, printed Label caption above the input inside the box, input at 1.05rem / 600.
- **Focus:** the field shows a 3px violet ring at 35% opacity around the whole box (focus-within); the inner input has no outline of its own.

### Navigation
- **Header:** on the desk, min-height 4rem. Wordmark (Display at 1.7rem plus mono domain), nav links in Desk Light at 0.9rem / 600 with 4px hover fill in Desk Shadow. Unavailable destinations stay visible but inert at 70% with a bordered "მალე" tag. Under 1024px a menu button reveals a stacked list under a desk-soft divider.
- **Footer:** desk band, three columns from 768px, Label captions over 0.875rem links that underline on hover, mono year.

### Carbon Copy Tabs and Sheets (signature)
Four tabs (all, then one per vertical) hang above the card in their copy colours with 6px top corners. At rest they sit 6px low; hover lifts to 2px; the pressed tab rises to -2px with the raised-tab shadow (320ms). Choosing a vertical slides its sheet out from under the card (offset 3x right, 1.6x up, rotated 1.4deg; 560ms), recolours the card band (420ms) and tints the card. This shuffle is the system's signature interaction.

### Ticket (signature)
A tear-off ticket for each approved business: sheet white, 1.5px Pale Rule border, 4px corners, min-height 8.5rem, notched at the stub line. The stub carries the lead vertical's tint and ink, a vertical mono "№ 001" and the vertical name; the body holds the name (Title), area with a pin icon, categories, a violet "ჩაწერა" with an arrow that nudges right on hover, and an optional 6rem cover image (from 640px). Promotion is shown as a stamp mark with a disclosure. Unfilled tickets show ruled blank lines.

### Stamp Mark (signature)
Violet text in a 2px violet border, 4px corners, 900 weight at 75% width, 0.8rem, 0.06em tracking, rotated -5deg, multiply blend. Only for official marks: VIP, RECOMMENDED, "მალე".

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

### Don't:
- **Don't** use pill-shaped buttons, chips or badges.
- **Don't** use glass, backdrop blur, or decorative colour gradients (mask and ruling gradients that cut perforations or draw lines are fine).
- **Don't** use hard offset shadows; shadows are soft and ink-tinted.
- **Don't** use a vertical colour as a generic accent or a second action colour.
- **Don't** set body text, captions or labels below 0.72rem.
- **Don't** add a second display family; emphasis is width and weight of Noto Sans Georgian.
- **Don't** pull values from the legacy `sf-` tokens in client/src/index.css for public catalog surfaces.
