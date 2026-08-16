# SalonFlow — Visage-inspired Design Overhaul Plan

**Goal:** Rebuild the entire visual language to match the polish of [visage.ge](https://www.visage.ge)
(public site + `/demo/today` + `/demo/book`) — a signature **fuchsia → violet gradient** aesthetic on
light, airy surfaces — and push beyond it with **beautiful 3D animations, aurora gradient meshes, glass
panels, and refined micro-interactions**.

The app is fully **token-driven** (`--sf-*` CSS variables + `.sf-*` classes in `client/src/index.css`).
Retheming the tokens instantly transforms every page; signature scenes and page layouts are then refined
component-by-component.

---

## 1. Aesthetic direction — "Aurora Salon"

Light-first, luxurious, modern SaaS. Pink-to-purple as the emotional signature; white cards floating on a
soft lavender canvas with violet-tinted shadows; multi-hue accents for staff/calendar (like Visage).

### Color system (light, primary)

| Token | Value | Use |
|---|---|---|
| Signature gradient | `#F0369E` → `#C026D3` → `#7C3AED` | Hero, CTAs, "Pro" card, active states |
| Primary (violet) | `#7C3AED` | Buttons, links, focus |
| Pink accent | `#EC4899` / hot `#F0369E` | Highlights, badges, chart 1 |
| Deep plum ink | `#2A1740` | Headings / text |
| Muted plum | `#7C6F92` | Secondary text |
| Lavender canvas | `#FAF7FF` / `#F5F0FE` | Page background |
| White surface | `#FFFFFF` | Cards |
| Emerald | `#10B981` | Confirmations / paid / green checks |
| Amber | `#F59E0B` | Pending / warnings |
| Teal | `#14B8A6` | Staff color / info |
| Sky | `#0EA5E9` | Chart / staff color |

Dark variant: deep aubergine `#140A22` canvas, elevated plum surfaces, brighter fuchsia/violet accents.
The light theme becomes the **default** (Visage is light); dark remains available via the existing toggle.

### Typography

- **Display (Latin accents / wordmark / big numbers):** `Sora` — geometric, modern, distinctive.
- **Georgian headings (large):** `Noto Serif Georgian` — editorial character for hero titles.
- **Body / UI (Georgian + Latin):** `Noto Sans Georgian` — clean, native, highly legible.
- Tight tracking on display, generous line-height on body, strong weight contrast (400 / 600 / 750).

---

## 2. Motion & 3D system

- **Aurora mesh backgrounds** — layered radial gradients (fuchsia + violet + teal) with a slow 18–24s drift.
- **Signature 3D hero scene** — glassmorphic dashboard mockup that tilts in 3D on mouse move (parallax
  perspective), floating "booking confirmed / team / revenue" glass chips at different depths, lit by a
  gradient glow. Upgrade of the existing `SalonFlowHeroScene`.
- **Floating 3D orbs / gradient blobs** — soft, blurred, gently bobbing; add depth without noise.
- **Staggered page-load reveals** — hero, then sections cascade in (`animation-delay`).
- **Scroll-triggered reveals** — sections rise + fade as they enter the viewport (IntersectionObserver).
- **Micro-interactions** — button press-scale, card hover-lift with gradient ring, magnetic CTAs.
- **Booking flow** — animated step transitions (present) + a **confirmation celebration** (checkmark burst).
- **Respect `prefers-reduced-motion`** everywhere (already wired).

## 3. Imagery strategy

No raster AI-photo generator is available in this environment, so all visuals are **code-crafted** —
which keeps them theme-aware, crisp at any DPI, animated, and CSP-safe:

- Hero: animated 3D glass dashboard + aurora mesh (no photo needed).
- Booking cover (Visage uses a salon photo): a **stylized SVG "salon scene"** — gradient room, mirror
  lights, vanity silhouette — themed to the palette.
- Decorative: SVG gradient blobs, fine grain/noise overlay, sparkle particles.
- Avatars: vibrant gradient monogram avatars (per-staff hue), already the pattern.
- Marketing/feature tiles: gradient-lit glyph badges (lucide icons on gradient chips).

> If you want real photographic salon imagery later, those files can be dropped into `client/public/`
> and swapped into the cover/hero — the layout will accommodate them.

---

## 4. Page-by-page plan

### Public / marketing
1. **Home** — Aurora hero (pink→purple), interactive 3D glass dashboard, floating chips; trust strip;
   "problem → rhythm" cards; feature grid with gradient icons; 4-step "how it works"; roles; FAQ
   accordion; full-bleed gradient CTA. Scroll reveals throughout.
2. **Features / Pricing / Demo / FAQ / Contact** — shared aurora system. Pricing: 3 tiers with the
   signature gradient **Pro** card raised in the middle (mirrors Visage's pink Pro card).
3. **Book** (public landing) — SVG salon-scene cover, search, location cards.
4. **BookingFlow** — Visage's exact 4-step: **service → specialist → time → info**, with the left
   business card (cover, hours, socials, address) + right stepper; animated steps; celebratory
   confirmation screen.
5. **LocalAuth** (login / register / claim) — split layout: gradient hero panel left, white form card
   right (mirrors Visage auth).

### Workspace / app
6. **DashboardLayout** — lavender canvas, violet sidebar with gradient active pill, clean topbar
   (demo-style banner where relevant).
7. **Today** — gradient metric hero cards (pink revenue card + violet bookings ring like Visage),
   live queue with staff chips + status pills, next-up banner.
8. **Calendar** — multi-column day view; each specialist a column; colored appointment blocks with
   price + status (Visage calendar).
9. **Clients** — CRM table: gradient avatars, phone, email, last visit, LTV, consent state.
10. **Services** — category groups with colored dots, durations, prices, edit affordances.
11. **Staff** — personnel cards/rows with revenue, bookings, month totals, category chips.
12. **Reports** — KPI grid with trend deltas, revenue+bookings chart, service donut, staff bars,
    weekly heatmap (Visage analytics).
13. **Settings / WorkspaceSetup / WorkspacePlaceholder** — consistent surfaces, gradient accents.

---

## 5. Execution order

1. **Foundation** — retheme `index.css` tokens (palette, fonts, gradients, shadows), load fonts,
   default to light, build the aurora + 3D utility classes. → instantly reskins all pages.
2. **Signature scenes** — upgrade the hero 3D scene; build aurora/orb/blob + scroll-reveal utilities.
3. **Public pages** — Home → BookingFlow → Book → Auth → Marketing/Pricing.
4. **Workspace pages** — DashboardLayout → Today → Calendar → Reports → Clients → Services → Staff.
5. **Polish pass** — motion timing, confirmation celebration, empty/loading states, responsive, a11y,
   `pnpm check` + tests.
