# SalonFlow

SalonFlow is a Georgian-first, multi-location salon operations and public booking platform built with React, Express, tRPC, Drizzle, and MySQL/TiDB.

## Product boundaries

The product uses local email/password access, signed local sessions, scoped organization/location data, IANA timezones, integer tetri money, and server-enforced booking integrity. Manus OAuth is not part of the product. Email/SMS provider delivery is intentionally disabled until verified owner credentials are supplied.

## Local development

```bash
pnpm install
pnpm dev
pnpm test
pnpm check
pnpm build
```

The development-only `/preview-demo` route is isolated in memory and never writes demo records into a production organization. See `docs/` for the reference-led foundation, QA checklist, booking rules, and deferred integration status.
