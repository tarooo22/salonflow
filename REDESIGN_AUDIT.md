# SalonFlow — Redesign P1 Audit

**Scope:** Public/authentication visual system and UX clarity only.  
**Date:** 14 August 2026.  
**Baseline version at audit:** `20f3aa92`.

## Baseline result

| Check | Result | Notes |
|---|---:|---|
| Vitest | 34 files / 100 assertions | Passed before visual work. |
| TypeScript | 0 errors | `pnpm check` passed. |
| Production build | Passed | Client entry remains above Vite's 500 kB advisory threshold; this is recorded separately, not treated as a redesign regression. |
| Development server | Healthy after restart | Restart cleared a stale `onboarding` hot-reload import message. |

## Preserved functional contracts

The following are **out of scope for replacement or behavioral change** in this phase:

- Local-only sign-in, registration, session issuance, and protected route gates; no Manus OAuth.
- Existing route paths: `/`, `/book`, `/book/:slug`, `/login`, `/register`, `/claim-account`, `/preview-demo` (development only), `/404`, and every `/app/*` path.
- Public booking's four steps, real catalog/eligibility/availability data, `ANY_AVAILABLE` assignment, idempotency, server conflict re-check, confirmation token, and IANA-timezone behavior.
- Organization/location scoping, roles, permission checks, integer-tetri accounting, payment and CSV safeguards.
- Database schema and existing tRPC contracts unless a documented, backwards-compatible UI requirement cannot be fulfilled with the current contract.

## Public/auth route inventory

| Route | Current verified behavior | P1 visual/UX change |
|---|---|---|
| `/` | Short Georgian home page with register/login calls to action | Expand into truthful B2B marketing narrative with navigation, product story, how-it-works, roles, FAQ, final CTA, and footer. |
| `/book` | Live location discovery and category chips | Improve search/filter presentation, scan-friendly location cards, real empty/error states, and direct booking CTA. |
| `/book/:slug` | Four-step live booking and server validation | Upgrade shell, stepper, selected/unavailable states, identity/context panel, compact summary, and responsive mobile CTA without changing commit behavior. |
| `/login`, `/register` | Local email/password forms | Improve field states, password reveal, autofill, loading and inline errors. |
| `/claim-account` | Legacy binding form | Replace raw technical wording with a recovery-code presentation only if server support is available; see open question. |
| `/preview-demo` | Clearly labeled development-only deterministic preview | Strengthen non-production framing and return path. |
| `/404` | Georgian recovery page | Align with the shared public exception-state visual system. |

## Existing visual foundations and component inventory

`client/src/index.css` is the single theme source of truth. It already provides warm paper/ivory/ink/terracotta/jade/violet semantics, maps those values into shadcn/Tailwind variables, implements a `.dark` theme, and exposes global focus styling. The redesign will refine these variables into the specified `--sf-canvas`, `--sf-surface`, status, spacing, radius, shadow, and motion tokens rather than create a second theme system.

Existing reusable primitives include Button, Input, Checkbox, Textarea, Card, Badge, Dialog, Sheet, Tooltip, Toast, and ThemeContext. P1 will add or refine public-facing composition around those primitives; it will not import a competing design language.

## Audit observations and open question

The public pages currently use repeated page-local hexadecimal utility classes and uneven component density. The visual target is a calmer, premium Georgian system with a spacious public narrative and a compact, scan-friendly booking surface.

The current `/claim-account` UI still shows an `openId`/`local_…` field, while the redesign brief requires a human-friendly recovery code. The present mutation submits `openId`, so a genuine recovery-code input cannot be implemented exclusively in the client. **If no existing server-side recovery-code contract is found, the minimum compatible solution is an additive mutation/input that maps a human recovery code to an incomplete local account while retaining current-password and email-uniqueness verification.** This requires no schema rewrite and must be fully regression tested before use.

## P1 exclusions and intentionally deferred work

Workspace pages (Today, Calendar, CRM, Services, Team, Reports, and Settings) are explicitly deferred until the public/auth redesign is accepted. Transactional email/SMS, external payment gateway, public self-service cancellation/rescheduling, multi-service appointments, real ratings, fabricated testimonials, and marketplace work are not included in P1.

## Acceptance evidence planned

The completed P1 delivery will include desktop and mobile screenshots at 1440px, 1024px, 768px, and 375px; keyboard/focus checks; public booking/local-auth regression results; test/typecheck/build results; and an explicit deferred-scope list.
