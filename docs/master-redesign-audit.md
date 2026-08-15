# SalonFlow Master Redesign — Safety, Capability and Reference Audit

## Non-negotiable boundary

This redesign changes the **presentation and interaction layer only**. It must not alter database schemas, API contracts, session/authentication behavior, organization scope, roles, permissions, booking and availability validation, monetary calculations, commissions, timezones, persisted data, or protected-route semantics.

## Baseline

| Check | Baseline result |
|---|---|
| Vitest | 35 files, 106 assertions passing |
| TypeScript | `pnpm check` passes with no errors |
| Production build | Succeeds; the client entry bundle remains approximately 1.24 MB uncompressed / 291 KB gzip and emits Vite's non-blocking chunk-size advisory |
| Current visual foundation | Light/Dark/System support and a Dark Luxury default are already in place |
| Existing safe release point | `manus-webdev://7ac280d6` |

## Current route reality

| Environment | Existing live routes | Scope conclusion |
|---|---|---|
| Marketing | `/` with anchored feature, workflow and FAQ sections | Features, pricing, demo, FAQ and contact can be created as truthful presentation routes; blog/news must not be represented as populated editorial feeds without real source content. |
| Auth and public booking | `/book`, `/book/:slug`, `/login`, `/register`, `/claim-account`, `/preview-demo` | Keep local auth and four-step supported booking logic; improve orientation, state feedback and mobile presentation only. |
| Workspace | `/app/today`, `/app/calendar`, `/app/clients`, `/app/services`, `/app/staff`, `/app/reports`, `/app/settings`, `/app/setup` | The established operations routes are retained. An Activity/Log route is not currently supported and must not be fabricated as a data-bearing feature. |

## Reference-derived principles

The following observations are **interface references, not customer research and not implementation instructions**. They are intentionally abstracted to avoid visual or brand copying.

| Reference | Observed pattern | SalonFlow interpretation |
|---|---|---|
| Visage | Clear product navigation separates capabilities, pricing, editorial information, questions and contact; the marketing narrative uses product-state visuals to explain bookings, CRM, staff and analytics. [1] | Use a truthful public information architecture and actual SalonFlow UI compositions rather than generic beauty photography, fake evidence or competitor-specific visual structures. |
| MySalon | Public discovery prioritizes category entry, carousel-like exploration and clear salon-card scanning on a Georgian interface. [2] | Retain SalonFlow's existing active category/filter discovery, strengthen selection hierarchy and mobile-friendly cards, but do not add marketplace claims, favorites, VIP labels, discounts or verification statements that SalonFlow does not support. |

## Capability map

| Need | Applied capability |
|---|---|
| Product IA, responsive design, accessibility and visual QA | ui-ux-pro-max, ux-architect, ui-designer |
| Brand distinction and Georgian presentation | brand-guardian, ux-researcher |
| React architecture, code splitting and test discipline | frontend-developer, senior-developer, full-stack project guidance |
| Restrained feedback and motion | whimsy-injector plus the existing Framer Motion dependency |
| 3D requirement | CSS perspective/DOM product composition first; this meets the brief's low-cost fallback path without adding WebGL to the workspace bundle. |

## 21st.dev reference check

The enabled 21st.dev connector was inspected before use. A project-agnostic inspiration query returned scheduling-card and calendar patterns with moderate relevance; no component source code was retrieved. The practical decision is to retain SalonFlow's existing calendar/booking contracts and use only the transferable principles: calendar-first scanning, compact booking-state hierarchy and responsive density. External code, themes, proprietary visual assets and component markup are intentionally excluded.

## Foundation and 3D proof visual check

The live homepage was rendered after the token evolution and CSS-perspective proof. The dark palette, terracotta CTA, Georgian hierarchy and product-oriented visual composition render without a runtime failure. The review identified an important brand-quality improvement: SalonFlow should repeat a distinctive **calendar-flow** motif rather than rely on generic application iconography or uniform rounded SaaS cards. The next implementation applies that principle through a small custom mark and stronger visible depth/readability in the product composition; it does not add a WebGL dependency.

The 375px proof initially exposed a Georgian display-headline overflow. The mobile display scale was reduced and a safe wrapping rule added; the recheck shows the headline, primary/secondary CTA and static scene entry without clipping. Desktop keeps pointer-responsive CSS depth, while mobile intentionally removes that movement.

## Marketing route visual check

Desktop checks of `/features` and `/pricing` show the shared public header/footer and the updated custom mark rendering across standalone routes. The pricing route explicitly states that billing plans are not configured; no invented monetary figures, customer evidence, partner logos, statistics or contact channels were introduced.

## Public-flow visual check

At 375px, `/login` renders the refined local-account card with a visible field focus state and readable recovery route, while `/book` renders the mobile public header, Georgian discovery hierarchy and filter entry without a visible horizontal-overflow or clipping issue. This pass made no change to local authentication, public catalog retrieval, availability or booking submission procedures.

## Final populated evidence

The final disposable browser workflow captured 120 screenshots across public and authenticated routes at 375, 430, 768, 1024, 1280 and 1440 pixels. Direct review confirms that the populated Today desktop surface retains readable KPI, queue, payment and action hierarchy, while the 375px booking flow keeps the four-step sequence, current-step focus, service selection and fixed continuation action readable without visible horizontal overflow. The disposable owner, organization and operational rows were removed by the harness cleanup.

## Delivery decision

The project is configured for automatic production publication on checkpoint. Therefore, no interim checkpoint will be created during this master redesign; the existing checkpoint remains the recovery point until final validation is complete.

## References

[1]: https://www.visage.ge/ "Visage — სალონის მართვის პროგრამა"
[2]: https://www.mysalon.ge/ka "MySalon.ge — იპოვე შენი სალონი"
