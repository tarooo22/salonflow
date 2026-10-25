---
name: Chawera
description: One Georgian booking catalog for beauty, aesthetics and dental. Soft blush ground, white rounded cards, a single warm coral-rose accent; the business panel is the same product with a dark plum rail.
colors:
  bg: "#faf7f7"
  surface: "#ffffff"
  surface-2: "#f5eff1"
  text: "#2b2027"
  muted: "#6b5e66"
  border: "#eadfe3"
  border-strong: "#9c8e95"
  accent: "#cf3f55"
  accent-hover: "#b5304a"
  accent-ink: "#b5304a"
  accent-soft: "#fce8eb"
  band: "#2b1a25"
  on-band: "#ffffff"
  on-band-muted: "#d9c9d1"
  success: "#1f7a4d"
  success-soft: "#e3f3ea"
  warning: "#8a5300"
  warning-soft: "#fcf0d9"
  danger: "#b42318"
  danger-soft: "#fde8e6"
  info: "#1e5fa8"
  info-soft: "#e5effa"
  v-salon: "#fbe3e6"
  v-salon-ink: "#9a2a3f"
  v-aesthetics: "#fbebc4"
  v-aesthetics-ink: "#6e4a00"
  v-dental: "#dcebfa"
  v-dental-ink: "#154c85"
typography:
  display:
    fontFamily: "Noto Sans Georgian, Noto Sans, system-ui, sans-serif"
    fontSize: "clamp(28px, 4vw, 40px)"
    fontWeight: 800
    lineHeight: 1.2
  h2:
    fontFamily: "Noto Sans Georgian, Noto Sans, system-ui, sans-serif"
    fontSize: "clamp(22px, 2.6vw, 28px)"
    fontWeight: 750
    lineHeight: 1.25
  h3:
    fontFamily: "Noto Sans Georgian, Noto Sans, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "Noto Sans Georgian, Noto Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: "Noto Sans Georgian, Noto Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Noto Sans Georgian, Noto Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
  caption:
    fontFamily: "Noto Sans Georgian, Noto Sans, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
  panel-title:
    fontFamily: "Noto Sans Georgian, Noto Sans, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1.25
rounded:
  sm: "6px"
  control: "8px"
  lg: "10px"
  panel-card: "12px"
  xl: "14px"
  card: "16px"
  hero: "20px"
  pill: "999px"
spacing:
  base: "4px"
  section-phone: "48px"
  section-desktop: "72px"
  container: "min(100% - 32px, 1200px)"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    height: "40px"
  button-destructive:
    backgroundColor: "transparent"
    textColor: "{colors.danger}"
    rounded: "{rounded.control}"
    height: "40px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    height: "40px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
  chip-selected:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.pill}"
    height: "40px"
  rail:
    backgroundColor: "{colors.band}"
    textColor: "{colors.on-band}"
    rounded: "{rounded.control}"
---

# Design System: Chawera

## Overview

**North star: a calm, consumer-friendly marketplace with real photos in front.** The structure follows the Georgian booking category (photo banner carousel, category icon tiles, venue cards with cover and heart, mobile tab bar, dark business band) but is more legible and more refined: a soft blush-neutral ground, white rounded cards, one warm coral-rose accent that is clearly not magenta, and one type family at normal width.

This replaces the earlier "Appointment Card" world (indigo desk, violet stamp, perforated tickets, Martian Mono, 2-6px corners, uppercase captions). None of those devices remain.

- **Public site (Persuade / Catalog):** blush ground, 16px cards, real cover photos from uploaded business covers; without a photo a vertical-tinted tile with the initial, never an empty frame. Empty sections are not rendered.
- **Business panel (Operate):** same tokens and accent, same family. Dark plum rail (`band`) matching the public business band, white sheets with 12px corners, denser ramp (14px body, 12px meta, 40px controls).
- **Rejected:** gradients, glows, glassmorphism, perforation and notch masks, rotated stamp marks, uppercase, monospace numbers, side-stripe accents.

Copy is Georgian. Hierarchy is made with weight and size, not capitals. Letter-spacing is 0.

## Colors

One neutral family tinted toward the accent hue (blush, plum), one accent, five semantic hues, three vertical tints.

- **Ground and surfaces:** `bg` page, `surface` cards/sheets/inputs, `surface-2` sunken areas, table heads, hover and disabled fills. Dark: `#161015` / `#211820` / `#2b2029`.
- **Text:** `text` (14.7:1 on bg), `muted` (5.8:1 on bg).
- **Lines:** `border` for decorative dividers only; `border-strong` (3.1:1) for input, switch and checkbox edges.
- **Accent:** `accent` for fills (white text 4.7:1; dark text `#2a0e16` in dark mode); `accent-hover` for pressed/hover; `accent-ink` whenever the accent is used as text or a link (5.65:1); `accent-soft` for selected chips and icon tiles. The focus ring is `accent`, 2px outline, 2px offset.
- **Band:** `band` (`#2b1a25`; dark `#0e090d`) with `on-band` and `on-band-muted` for the public business band and the panel rail.
- **Semantic:** success, warning, danger, info, each with a `-soft` fill. Danger is shown with icon and word; destructive buttons are outlined, never filled.
- **Verticals:** salon rose, aesthetics amber, dental blue; each a tint plus an ink. The salon tint stays inside the accent family.

### Named rules
- **One Accent Rule.** The coral-rose accent is the only brand hue. Verticals and semantics use their own tints and never compete with it on the same control.
- **Ink Rule.** Never put plain `accent` on text over `bg`; use `accent-ink`.
- **Pair Rule.** A tint always pairs with its ink; status is icon + word + colour, never colour alone.

## Typography

One family: **Noto Sans Georgian** (400-800) with **Noto Sans** as Latin fallback, loaded from Google Fonts in `client/index.html`. Normal width, no condensed Mtavruli display, no serif, no mono.

| role | size / line / weight |
|---|---|
| display H1 | clamp(28px, 4vw, 40px) / 1.2 / 800 |
| h2 | clamp(22px, 2.6vw, 28px) / 1.25 / 750 |
| h3 / card title | 18 / 1.35 / 700 |
| body | 16 / 1.6 / 400 |
| body-sm | 14 / 1.5 |
| label | 14 / 1.4 / 600 |
| caption | 12 / 1.4 / 600 (floor; Georgian never below 12px) |
| panel title | 24 (phone 22) / 1.25 / 800 |
| panel body / meta | 14 / 12 |

Numbers (dates, times, prices, counts) use `font-variant-numeric: tabular-nums` in the same family. `text-transform: uppercase` is banned.

## Layout

Spacing base 4px (4 to 80). Container `min(100% - 32px, 1200px)`. Public section gap 48px phone, 72px desktop. Public listing grids 1 / 2 (640) / 3 (1024) / 4 (1280) columns with 16px gap; phone strips use scroll-snap cards at 78%. Phone has a fixed 6-tab bar (64px plus safe area; `main` reserves 80px). Panel keeps its information architecture: rail, one head row per page (at most one primary and one secondary action plus a kebab), calendar board, ledger tables.

## Elevation & Depth

Cards at rest: 1px `border` plus `shadow-sm`. Hover: `shadow-md` and a 2px lift. Overlays: `shadow-lg`.

- sm `0 1px 2px rgb(43 32 39 / .06)`
- md `0 1px 2px rgb(43 32 39 / .05), 0 6px 16px -6px rgb(43 32 39 / .12)`
- lg `0 24px 48px -20px rgb(43 32 39 / .28)`
- dark: same offsets with `rgb(0 0 0 / .5)`

No glows. Panel sheets use a border and no shadow.

## Shapes

`--radius` is 10px (sm 6, md 8, lg 10, xl 14). Public cards 16px, hero and banner 20px, business band 24px, chips and marks pill. Panel: cards and sheets 12px, controls 8px, ticket 8px, dialogs 16px.

## Components

Primitives live in `client/src/components/ui/` and carry the shared radius, height, focus and disabled behaviour; page families (catalog, panel) add their own classes on top.

- **Buttons:** primary (accent fill, 8px radius, 40px desktop / 44px phone, no shadow, hover `accent-hover`); secondary (surface, `border-strong` edge); ghost (hover `surface-2`); destructive (danger outline, never filled); disabled = `surface-2` fill, `muted` text, `not-allowed`, with a helper line saying why.
- **Inputs, selects, textareas:** `surface` fill, `border-strong` edge, 8px radius, 40px / 44px phone, focus = 2px accent ring; disabled = `surface-2`. Labels above; optional marked "(არასავალდებულო)" in the hint line.
- **Checkbox / switch:** 20px checkbox with 6px corners; switch 44x24, off track `border-strong`, on track `accent`, white thumb.
- **Tabs:** pill list, active tab `accent-soft` with `accent-ink` text.
- **Badges and status marks:** pill, 12/600, icon plus word. pending = warning, confirmed = info, checked-in / in service = accent-soft, completed = success, cancelled / no-show = `surface-2` muted, struck.
- **Cards:** `surface`, 1px border, `shadow-sm`; 12px in the panel, 16px on the public site.
- **Tables:** head `surface-2`, 13/600 muted, 40px; rows 52px with border dividers.
- **Dialogs, sheets, drawers:** dialog 16px radius, 20px padding, `shadow-lg`, max-height 90dvh with scrolling body; bottom sheet and drawer 16px top corners; sheet motion 260ms.
- **Navigation:** header 64px (public), 6-tab bottom bar on phone with an accent pill above the active icon, dark plum panel rail with white active item and accent icon.

## Motion

Press 120ms, hover 180ms, sheet 260ms, carousel 400ms. Ease `cubic-bezier(.2, 0, 0, 1)`, exit `cubic-bezier(.4, 0, 1, 1)`. The carousel never autoplays. Under `prefers-reduced-motion` transforms and animations switch off.

## Signature: the ring (შემოხაზვა)

People circle an appointment on a paper calendar; Chawera's mark is that gesture, a hand-drawn open ring whose tail overshoots its start. **Rule: the ring marks your choice.** It is the only ornament in the product; everything else stays plain.

- **Primitive:** `components/brand/Ring.tsx`, `<Ring variant="wide" | "square" draw? tone? />`, placed inside a `position: relative` parent. Absolute, `inset: -6px -8px` (square `-5px`), `pointer-events: none`, `aria-hidden`. Stroke 2.25, round caps, `pathLength=1`. Colour `accent-ink`; `#F48A9B` in dark mode and on the band (`tone="band"` or a `.cw-on-band` ancestor); `#fff` on photos (`tone="photo"` or `.cw-on-photo`); `Highlight` in forced-colors. No `vector-effect`: with `pathLength` it mis-scales the dash in Chromium, so the stroke scales gently with the box instead.
- **Where (at most 3 per viewport, all marking the same choice):** hero vertical words, selected filter chip, booking day (square), slot and summary time (wide), confirmation time, category tiles and empty-state icons (static square), panel "დაიწყეთ აქ" completed step numbers.
- **Never on:** buttons, navigation, tables, status marks, list prices, errors, destructive actions, photos (except the hero frame), headlines or body text, other panel pages. Never the only cue: a selected item also has the `accent-soft` fill, `accent-ink` 700 text and `aria-pressed` / `aria-checked`.
- **Mark and favicon:** `components/brand/ChaweraMark.tsx` (24px ring plus a dot where the pen rests) sits left of the "ჩაწერა" wordmark; `client/public/favicon.svg` is the same mark with a dark-scheme colour switch.
- **Motion:** `draw` true: `stroke-dashoffset` 1 to 0, 360ms `cubic-bezier(.2, 0, 0, 1)`. `draw` false: opacity to 0 in 120ms. `draw` omitted: static, fully drawn. Static under `prefers-reduced-motion` and `[data-reduce-motion="true"]`.
- **A11y:** decorative only; meaning lives in text and ARIA state. Keep `Ring` always mounted and pass `draw={selected}` when deselect should fade.

## Do's and Don'ts

### Do
- Use real business imagery (covers, logos, avatars, product images) and design a fallback for every photo slot.
- Keep body text at 16px or larger on the public site; sentence case everywhere.
- Use `accent-ink` for accent-coloured text and links.
- Show status with icon, word and colour together.
- Hide sections that have no content instead of rendering empty frames.

### Don't
- Don't use `text-transform: uppercase`, Martian Mono, serif display or condensed widths.
- Don't add gradients, glows, glass blur, perforations, notches or rotated stamps.
- Don't fill destructive buttons or rely on colour alone for state.
- Don't use stock photos, fake salons or invented reviews.
- Don't introduce a second brand hue next to the coral-rose accent.

## Implementation notes

- Core tokens: `client/src/index.css` (`--sf-*` in `:root` and `.dark`); shadcn variables map onto them. `.cw` / `--cwk-*` variables in `catalog/*.css` and `workspace/panel.css` are aliases of these tokens and are removed as those files migrate.
- Temporary aliases for legacy token names (`--sf-jade`, `--sf-amber`, `--sf-violet`, `--sf-terracotta*`, `--sf-salon-warm/hairline`, `--sf-gradient-brand`) are marked in `index.css` with the file that still needs migrating.
