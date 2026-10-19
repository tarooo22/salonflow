# SalonFlow

Booking platform for salons and other service businesses (Georgia). Customers find a service, pick a specialist, see open times and book. Salons run calendar, clients, staff, POS, reports and a marketplace profile.

## Stack

- **Client** `client/src/`: React 19, Vite 7, Tailwind 4, shadcn/ui (`components/ui/`), wouter routing (`App.tsx`), TanStack Query via tRPC (`lib/trpc.ts`).
- **Server** `server/`: Express + tRPC 11 (`server/routers/*.ts`, merged in `server/routers.ts`), procedures `publicProcedure` / `protectedProcedure` / `adminProcedure` in `server/_core/trpc.ts`. Domain logic in `server/lib/`.
- **Shared** `shared/`: code used by both sides (validation, money, timezones, types).
- **DB**: MySQL + Drizzle ORM. Schema `drizzle/schema.ts`, migrations `drizzle/*.sql`. Local MySQL in `docker-compose.yml`.
- **Auth**: local accounts, JWT (jose) in cookies; org roles in `server/access.ts`.
- **Deploy**: Railway (`railway.json`), auto-deploys on push to `main`. Prod: https://salonflow-production-c542.up.railway.app. Guide: `docs/RAILWAY_DEPLOYMENT.md`.
- Package manager is **pnpm**. Never use npm/yarn here.

The tRPC router types *are* the API contract: the client imports them, so `pnpm check` catches client/server mismatches. There is no separate API spec.

## Commands

| | |
|---|---|
| `pnpm check` | TypeScript, whole repo |
| `pnpm vitest run <path>` | focused unit tests (tests sit next to the file: `*.test.ts(x)`) |
| `pnpm test` | full Vitest suite |
| `pnpm test:e2e` | Playwright smoke tests — they hit **production**, so they must stay read-only |
| `pnpm build` | production build |
| `pnpm db:push` | generate + apply migrations — **never run without the user's explicit go-ahead** |

## Invariants — do not break

- **Double-booking protection**: creating or moving an appointment runs in one `db.transaction` that first upserts a `scheduleLocks` row per staff member per affected day, then re-reads blocking appointments and checks `intervalsOverlap`, then writes (`server/routers/appointments.ts`). Any new path that creates or moves a booking must do the same. Never check availability only on the client.
- **Availability is computed on the server only** (`server/lib/availability.ts`) and re-validated inside the commit transaction.
- **Time**: store UTC; interpret in the location's IANA timezone via `shared/timezones.ts`. Don't use the server's local time.
- **Money**: integer tetri everywhere (`shared/money.ts`). No floats.
- **Authorization**: the server derives organization scope from the user's membership (`requireOrganizationRole` / `requireOrganizationAction`). Never trust an `organizationId` from the client on its own.
- **IDs**: opaque 36-char IDs; public routes use `publicSlug`.
- **History**: services/staff are archived, not deleted; past bookings keep snapshots.
- **User-facing copy is Georgian.** Keep new UI text in Georgian.

Background: `docs/domain-model.md` (roles, booking contract), `docs/customer-booking-lifecycle-plan-ka.md`, `docs/billing-payments-setup-ka.md`.

## Orchestration

The main session is the orchestrator. Agents live in `.claude/agents/`:

| agent | job | writes |
|---|---|---|
| `designer` | studies UI and flows, returns a UX/UI spec | nothing (read-only; the orchestrator saves specs to `docs/specs/`) |
| `fullstack` | implements features end to end: schema, procedures, pages, components, tests | code in its assigned area |
| `reviewer` | reviews risky changes: booking concurrency, auth, payments, personal data, migrations | nothing (read-only) |

Rules:
1. Look at the relevant code first. Do small or clear tasks yourself; delegate only when an agent's specialty or independent parallel work actually helps.
2. Give each agent only the context it needs, the exact files or area it may change, and ask for a short report: what it checked, what it changed, what is open.
3. Run agents in parallel only when their work is independent. Never let two agents edit the same file at the same time.
4. Order by dependency: designer spec → fullstack. Within fullstack work, the tRPC procedure signature comes before the UI that calls it.
5. Send changes to `reviewer` when they touch booking creation/rescheduling, auth or roles, payments/billing, personal data, or migrations.
6. Verification: agents run `pnpm check` and focused tests for what they touched. Run the full suite or e2e only when the user asks.
7. Migrations, prod data and Railway variables: prepare and explain, then wait for the user's confirmation.
8. Don't change the stack without a reason the user agrees with.
9. Finish with a summary of changes and any mismatches or open questions.

### Model choice and usage limits

Usage limits are tight; spend them where they change the result.

- `haiku` (or the built-in `Explore` agent): targeted searches, reading/summarising docs, simple checks, renames, copy fixes.
- `sonnet` (agent default): normal feature work, UI, API, tests, bug fixes.
- `opus`: only real deep analysis — architecture decisions, security, payments, data migrations, booking concurrency, a bug sonnet failed to crack. Many files alone is not a reason. `reviewer` is the only agent pinned to opus.
- Use the aliases, never version numbers.

Saving rules:
- Do small tasks in the main session; don't spawn an agent for something a few tool calls can do.
- One agent per task by default. Fan out in parallel only when the pieces are truly independent and big enough to pay for the extra context.
- Give agents a tight brief (files, goal, constraints) so they don't re-explore the repo; ask for short reports.
- Load skills only when the task needs them; don't chain several heavy skills on one task.
- Verify with focused tests, not the full suite, unless asked. Keep screenshot/review rounds to at most two.
- The main session's own model is the user's choice (`/model`); suggest `sonnet` for long routine stretches.

### Skills

Call skills only when the task needs them:
- UI audit / redesign / new screen: `impeccable` (primary). Don't stack it with other design skills (`hallmark`, `ui-ux-pro-max`, `design-taste-frontend`) in one task.
- Georgian copy: `georgian-grammar`.
- Library or API questions: `find-docs`.
- Bugs: `superpowers:systematic-debugging`. Charts: `dataviz`. Animation: `motion-dev-animations`.
- Review: `code-review`, `security-review`, `ponytail:ponytail-review` (over-engineering).
