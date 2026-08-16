# Claude Project Instructions for SalonFlow

Copy the text inside the block below into **Set project instructions**.

```text
You are working on SalonFlow, a secure, multi-location appointment and operations platform for salons, spas, clinics, and service businesses in Georgia. The stack is React 19 + TypeScript + Tailwind CSS 4, with Express 4, tRPC 11, Drizzle ORM, and TiDB/MySQL.

Always preserve existing product behavior unless the user explicitly asks for a functional change. Read README.md, docs/, todo.md, relevant components/pages/routers, and existing tests before editing. For complex work, reason systematically and give the user concise, decision-relevant rationale; do not expose private chain-of-thought.

Product rules:
- The UI is Georgian-first (ka-GE). Keep all visible labels, dates, GEL amounts, payment states, loading/error/empty states, and confirmation copy in Georgian.
- Authentication is local email/password only. Do not add or restore Manus OAuth.
- Preserve the four roles: OWNER, MANAGER, RECEPTIONIST, STAFF. Keep organization and location scoping, role checks, and protected routes intact.
- Money must be integer tetri only. Never introduce floating-point money calculations.
- Do not weaken server-side availability checks, overlap/conflict checks, idempotency, authorization, audit/history behavior, CSV formula-injection protection, payment/balance validation, or historical data preservation.
- Public booking remains a four-step flow and supports server-resolved ANY_AVAILABLE specialists. Do not change booking APIs, availability semantics, or confirmation contracts without explicit approval.
- Email/SMS reminders are intentionally deferred until a verified sender domain and provider credentials exist. Payment gateway integration and real subscription billing are not configured; never represent them as live.

Design and UX rules:
- Preserve the SalonFlow visual language: premium beauty SaaS, dark luxury surfaces, terracotta primary actions, jade status semantics, dense but readable workspace, Georgian-safe typography, Light/Dark/System themes, visible focus, and reduced-motion support.
- Use lightweight motion only for feedback. Animate transform/opacity, not layout properties; respect prefers-reduced-motion; do not add distracting animation to operational workflows.
- Design mobile-first and verify 375, 430, 768, 1024, 1280, and 1440px with no horizontal overflow.
- Reuse shared public/workspace primitives before creating duplicate UI. Keep loading, error, empty, disabled, focus, hover, and success states accessible.

Content and reference rules:
- Never fabricate reviews, ratings, testimonials, customer logos, business metrics, pricing, support contacts, blog/news content, or unsupported capabilities.
- MySalon, Visage, 21st, and UI/UX Pro Max are reference-only sources. Do not copy their code, assets, text, data, pricing, branding, or visual design.

Engineering workflow:
- Add every new request to todo.md as an unchecked item before implementation, then mark it complete only after validation.
- Prefer presentation-layer changes unless the user approves API/database/domain changes.
- Add or update Vitest coverage for behavior changes. Before delivery, run pnpm test, pnpm check, pnpm build, and relevant browser checks.
- Use precise error messages without exposing raw server/API details. Preserve keyboard navigation and move focus to actionable error summaries when appropriate.
- Before a release checkpoint, review todo.md. Explain what changed, tests run, known limitations, and any required user input clearly.
```
