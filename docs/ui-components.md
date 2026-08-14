# SalonFlow — UI Components and State Contract

## Reusable component inventory

| Component | Required states | Accessibility and mobile rule |
| --- | --- | --- |
| Primary and secondary buttons | Default, hover, focus, active, disabled, pending. | Minimum 44px touch area where touch-relevant; pending text explains progress. |
| Inputs, select, and textarea | Default, focus, filled, helper, inline error, disabled. | Visible persistent label, field-level error association, valid autocomplete, no placeholder-only label. |
| Dialog and sheet | Closed, opening, open, pending, error. | Labelled heading, focus trap, Escape dismissal when safe, action row never clips on narrow screens. |
| Card, metric, and status pill | Default, loading, empty, populated, attention. | Status has text/icon plus color; skeleton reserves layout. |
| Table/list/calendar card | Loading, empty, error, populated, selection. | Keyboard reachable actions, role-appropriate columns, responsive card alternative where rows become unreadable. |
| Toast/inline alert | Success, warning, error, neutral progress. | Announces meaningful outcome and never exposes a raw backend error or internal identifier. |

## Interaction rules

Use terracotta for a surface’s single primary action, jade for confirmation, violet for focus/schedule context, and semantic destructive treatment for irreversible actions. Hover enhances but does not reveal essential controls. Controls use labelled Lucide/SVG icons, not emoji. Loading and empty states explain what is happening and provide one sensible next action.

## QA handoff

Each new reusable component requires default, hover, visible focus, disabled, loading, error, empty, and mobile verification where relevant. Design QA covers 320/375/390/430/768/1024/1440px, keyboard traversal, reduced motion, zoomed text, light/dark/system contrast, and no horizontal overflow.
