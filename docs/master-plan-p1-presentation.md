# SalonFlow — P1 Presentation and Localization Evidence

## Shared presentation contract

`client/src/lib/presentation.ts` centralizes visible money and date/time output for Georgian-facing surfaces. `formatGelTetri` accepts integer tetri and renders GEL only for presentation; it does not alter storage or server-side arithmetic. `formatKaDateTime` uses `ka-GE` with an optional IANA timezone. The helpers are adopted by Today and public booking summaries, while `BookingFlow` preserves its existing `formatGel` export as a compatibility wrapper.

## Localized fallback evidence

The unknown-route fallback now uses Georgian copy, semantic SalonFlow paper/ink/terracotta styling, and explicit recovery actions for home and browser-back navigation. Render review at 1280px and 375px confirmed readable Georgian text, non-clipped buttons, and no horizontal overflow. The fallback is a recovery surface; it makes no claim about a business record or user data.

## Validation

Focused TypeScript and rendered tests passed for the shared presentation helper, BookingFlow, and public booking router. The 404 desktop and mobile captures were inspected after the semantic design-token refactor.
