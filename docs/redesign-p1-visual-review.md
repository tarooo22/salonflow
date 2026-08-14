# SalonFlow — Redesign P1 Desktop Visual Review

## Captured surfaces

On 14 August 2026, desktop full-page renders at 1440 × 960 were reviewed for `/`, `/book`, `/login`, `/register`, `/claim-account`, a localized unknown route, and `/preview-demo`. The new surfaces share the same warm canvas, forest-ink foundation, terracotta action color, Georgian display hierarchy, visible focus system, and consistent public navigation/footer.

## Findings incorporated before delivery

The home page's preview originally contained technical implementation words. It now uses customer-facing Georgian operational language. The local login description no longer refers to an external/vendor account. The development preview preserves its strong non-production disclosure while replacing internal implementation jargon with a clear statement that its data is pre-defined, non-real, and unavailable in the published product.

## Responsive review

Full-page renders at 1024 × 900 and 768 × 1024 confirmed that the public header reduces to the appropriate compact controls, long Georgian headings remain inside their content columns, the login/register/claim forms retain a single readable card, discovery controls wrap cleanly, and the 404 and preview pages preserve their recovery/disclosure actions. No visible horizontal clipping was observed in the reviewed public/auth screens.

At 375 × 812, the header presents the compact menu trigger, public calls to action stack without truncation, discovery location cards switch to a vertical action layout, and login/register/recovery fields remain at comfortable touch size. The localized 404 actions stack cleanly, while the development preview remains explicitly non-production even in the narrow layout.

## Automated responsive and interaction evidence

`scripts/public-redesign-check.mjs` passed after a real mobile overflow finding was fixed in the home preview decoration and a visible-focus override was removed from the brand link. The script verifies no horizontal overflow and a visible keyboard focus affordance across the seven public/auth routes at 375px, 768px, 1024px, and 1440px. Full regression then passed with 35 Vitest files / 103 assertions, TypeScript, production build, local-auth routing, booking keyboard flow, and the self-cleaning authenticated workspace flow.

## Remaining observations

The home and auth screens are the strongest branded surfaces in P1. A later workspace-only redesign should extend the queue/calendar/staff-flow motif into authenticated dense-data modules rather than change their existing behavior. No rating, testimonial, or commercial claim was added because no owner-provided evidence exists.
