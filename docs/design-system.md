# SalonFlow — Design System

## Token source of truth

The global semantic token layer is implemented in `client/src/index.css`; components should use semantic classes rather than raw hex values. This document aligns the existing design foundation with the reference brief’s warm palette.[^brief]

| Token | Value | Meaning |
| --- | --- | --- |
| `--sf-paper` | `#fffdf9` | Public canvas and elevated reading surfaces. |
| `--sf-ivory` | `#f7f2eb` | Workspace grouping and quiet separation. |
| `--sf-ink` | `#1d2a25` | High-contrast hierarchy and navigation. |
| `--sf-ink-muted` | `#66716b` | Supporting text only when contrast remains sufficient. |
| `--sf-terracotta` | `#c4623f` | Primary conversion and creation action. |
| `--sf-jade` | `#15806d` | Confirmed/success state with text or icon. |
| `--sf-violet` | `#6b5ab5` | Focus and secondary scheduling accent. |
| `--sf-line` | `#e7ddd3` | Quiet borders and dividers. |

## Layout, typography, theme, and motion

Use the 4px/8px spacing rhythm, persistent visible labels, 44px touch targets, and a mobile-first layout. Public pages can breathe; operational screens should favor scanability and table/card clarity. Light is default, and `light`, `dark`, and `system` preferences resolve through the shared theme provider. Dark mode retains semantic distinction between terracotta, jade, violet, warning, and error.

Nonessential motion uses opacity/transform only, targets 150–250ms, and is disabled or reduced by `prefers-reduced-motion`. Focus uses an unobscured violet ring. At least 4.5:1 contrast is required for normal text and all state meaning must have a label, icon, or text alternative.

## Component selection note

Existing shadcn primitives are retained for buttons, inputs, dialogs, menus, tables, sheets, skeletons, and feedback because they match the React/Tailwind stack. The configured 21st service may be considered only for a compatible primitive with a documented license and no incompatible brand, design-system, or heavy dependency; no external component has been imported for this foundation milestone.

## Design-intelligence selection note

The UI/UX design-system review supported low-cost soft depth, visible focus, restrained 150–250ms feedback, reduced-motion support, and responsive checkpoints. Its suggested pink/lavender palette and testimonial carousel are deliberately not adopted: SalonFlow retains its supplied paper/ink/terracotta/jade/violet tokens, and social proof may appear only when the owner supplies real, publishable evidence.

[^brief]: User-supplied *SalonFlow Manus Master Build Kit*, 2026-08-14, `/home/ubuntu/upload/SALONFLOW_MANUS_REFERENCE_LED_BUILD_BRIEF_GE_2026-08-14.md`.
