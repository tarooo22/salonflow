# SalonFlow — Design and Component Foundation

## Purpose

This foundation turns the Master Plan’s brand direction into shared semantic tokens and component rules. It applies to public booking and the protected workspace. It does not change business authorization, booking availability, money calculations, or local authentication.

## Semantic token contract

| Intent | Token | Usage |
| --- | --- | --- |
| Paper background | `--sf-paper`, `--background` | Public canvas, forms, and elevated reading surfaces. |
| Soft workspace background | `--sf-ivory`, `--muted` | Grouping, filters, empty states, and gentle separation. |
| Primary text and navigation | `--sf-ink`, `--sidebar` | High-contrast text and protected workspace navigation. |
| Primary action | `--sf-terracotta`, `--primary` | Main submit, creation, and conversion actions. |
| Confirmed/success | `--sf-jade`, `--accent` | Confirmed booking and success context; never color-only. |
| Schedule/supporting accent | `--sf-violet`, `--ring` | Focus, secondary schedule distinctions, and accessible keyboard attention. |
| Error and warning | `--sf-danger`, `--sf-warning` | Inline validation, destructive outcomes, and operational attention. |
| Chart series | `--chart-1` through `--chart-5` | Report differentiation with labels/tooltips, not color alone. |

Raw values belong only in the global token layer. Components should use semantic Tailwind/shadcn classes such as `bg-primary`, `text-muted-foreground`, `border-border`, and `ring-ring`.

## Component boundaries

| Component category | Contract |
| --- | --- |
| Buttons and primary actions | Terracotta primary action, visible pending state, 44px target where touch-relevant, and a label that describes the outcome. |
| Forms | Persistent visible labels, `aria-describedby` helper/error text, inline error feedback, and no placeholder-only fields. |
| Statuses | Combine meaningful text, icon, and semantic color. Avoid a color-only booking/payment state. |
| Cards and dialogs | Paper/card surface, 1px semantic border, soft shadow, clear heading, and no clipped action row on narrow screens. |
| Calendar and reports | Use hue plus label/pattern/value, retain keyboard focus, and provide a textual alternative for critical chart information. |
| Empty states | State what is absent, why it matters, and one next action. Do not present zero metrics as completed performance. |

## Theme contract

The application supports `light`, `dark`, and `system` preferences. Light is the default for booking and first-run experiences. The resolved theme is applied through the root `.dark` class; the preference is stored in browser local storage under `salonflow-theme-preference`. A Settings control will expose the user-facing preference in the subsequent settings milestone.

Dark mode preserves terracotta as the main action and jade/violet as differentiated semantic accents. It must not invert or blur confirmed, warning, error, or focus meaning.

## Interaction and accessibility baseline

Use a visible violet focus outline, 150–250ms interaction feedback, and respect `prefers-reduced-motion` for any nonessential motion added later. Every icon-only control requires an accessible name. Public and internal screens must remain usable from 320px upward without horizontal scrolling.
