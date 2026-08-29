# SalonFlow Railway Deployment Guide

## Scope

SalonFlow can be deployed to Railway as a single Node.js service. The repository already contains a production build and start contract: `pnpm run build` creates the Vite frontend and bundled Express server, while `pnpm run start` runs `dist/index.js` in production mode. The added `railway.json` selects Railway Railpack, explicitly runs the existing build and start scripts, and checks `/health` after startup.

This preparation is additive. The Manus-hosted deployment remains unchanged, and no database schema, authentication, booking, billing, role, or organization-scope behavior was modified.

## Railway service setup

1. Create a Railway project and add a service from the connected GitHub repository.
2. Deploy the `main` branch. Railway will detect `railway.json` and use the repository's Railpack configuration.
3. Do not add a Dockerfile for this project. It is a plain Node.js application and Railway's native Node builder is sufficient; keeping the repository Dockerfile-free also avoids overriding Manus WebDev's managed build contract.
4. Add the required variables listed below before the first production deployment.
5. Add a Railway MySQL-compatible database or connect the existing TiDB/MySQL database. Set `DATABASE_URL` to the connection string supplied by that database.
6. Generate a Railway public domain and verify `GET /health`, `/`, `/login`, and one public booking route.

Railway's configuration-as-code reference documents `railway.json`/`railway.toml`, the `RAILPACK` builder, `startCommand`, `healthcheckPath`, and restart policies [1]. Railway injects the runtime `PORT`; the server now binds production traffic to that exact port on `0.0.0.0`, while retaining the local development port fallback [2].

## Required variables

The following values must be configured in Railway's Variables panel. Never commit literal secrets or a `.env` file.

| Variable | Required | Purpose | Railway value |
|---|---:|---|---|
| `DATABASE_URL` | Yes | MySQL/TiDB connection used by Drizzle and local auth/workspace data | Railway MySQL reference or external MySQL/TiDB URL |
| `JWT_SECRET` | Yes | Signs local SalonFlow sessions | A new long random secret; do not reuse a development value |
| `BUILT_IN_FORGE_API_URL` | Yes for current media/billing flows | Current storage adapter's presign and signed-URL endpoint | A Railway-reachable compatible Forge/storage service URL |
| `BUILT_IN_FORGE_API_KEY` | Yes for current media/billing flows | Server-side authorization for the current storage adapter | Secret key for the compatible storage service |
| `CANONICAL_ORIGIN` | Recommended | Canonical origin used by server-rendered/static metadata | `https://<railway-domain>` or the final custom domain |
| `PUBLIC_SITE_URL` | Recommended | Public SEO/sitemap origin | Same final public origin as above |
| `VITE_APP_TITLE` | Recommended | Browser/application title | `SalonFlow` |
| `VITE_APP_LOGO` | Optional | Application logo URL if configured | Final public asset URL |
| `VITE_ANALYTICS_ENDPOINT` | Optional | Consent-based analytics endpoint | Only if a privacy-compliant endpoint is intentionally retained |
| `VITE_ANALYTICS_WEBSITE_ID` | Optional | Consent-based analytics site identifier | Only when the analytics endpoint is configured |

`PORT`, `NODE_ENV`, and Railway system variables are supplied by Railway. Do not manually set `PORT`; doing so can conflict with the assigned service port. Railway's variable reference documents `RAILWAY_PUBLIC_DOMAIN`, deployment identifiers, and the platform-provided runtime variables [2].

## Database migration and data continuity

The Railway application service and the database are separate concerns. A new Railway database will not contain existing SalonFlow organizations, memberships, clients, bookings, reviews, billing submissions, audit history, or trial entitlements. Before switching traffic, choose one of these paths:

| Path | Result | Risk/requirement |
|---|---|---|
| Keep the existing MySQL/TiDB database | Railway application reads the current production data | Network access, TLS, allow-listing, and credentials must be confirmed |
| Create a new Railway database | Clean independent environment | Requires a tested export/import and schema/data verification before go-live |
| Staged migration | Copy data, validate read-only, then switch | Requires a maintenance window and a rollback plan |

Do not use `pnpm db:push` in production. Generate and review Drizzle migrations first, apply them in dependency order, and take a database backup before any destructive or structural operation. The current Railway configuration intentionally does not run migrations automatically during deploy, because automatic migration can make a release fail or create an irreversible schema change without an operator review.

## File storage limitation and required decision

The current `server/storage.ts` adapter uses the Manus Forge storage presign API and returns `/manus-storage/...` URLs. Those credentials are provided by Manus WebDev and are not automatically portable to an unrelated Railway project. If the Railway deployment does not have a Railway-reachable compatible Forge endpoint, media-dependent flows will fail: salon covers, staff avatars, client before/after images, feed media, and billing receipts.

Before Railway production cutover, replace or adapt this storage layer to an S3-compatible provider. Keep only object metadata and keys in the database, use private buckets for receipts/client media, and issue authorization-checked signed download URLs. Do not put file bytes in MySQL/TiDB and do not use a Railway volume as the primary source of truth for user media. A Railway volume is persistent only for that service and is not a substitute for durable, access-controlled object storage.

This migration is deliberately not guessed or auto-implemented here because it requires a confirmed provider, bucket/region policy, public/private object rules, and credentials. The existing Manus deployment continues to use its current storage path until that decision is made.

## Production verification checklist

After deployment, verify the following in order:

1. `GET /health` returns HTTP 200 and JSON containing `ok: true`.
2. The root page loads from the Railway public domain and static assets are served by Express.
3. Local registration and login establish a secure session through the Railway proxy.
4. A protected workspace request remains organization- and role-scoped.
5. A public salon profile and booking route load without exposing private billing, client, or audit data.
6. Booking availability is rechecked by the server at commit time.
7. Trial expiry and manual billing approval behavior remain unchanged.
8. Media upload and signed download are tested only after storage compatibility is confirmed.
9. Database connectivity is checked with a read-only application smoke test before any migration.
10. Railway logs are monitored during the first deploy and during one real authenticated/public smoke pass.

## Rollback and cutover

Keep the Manus deployment available until Railway has passed the complete smoke checklist and data consistency review. DNS/custom-domain cutover should be performed only after the application, database, storage, cookies, and public booking flow are verified. If Railway fails, restore traffic to the Manus domain and investigate the Railway deployment independently; do not reset or destructively alter the shared production database.

## References

[1]: https://docs.railway.com/config-as-code/reference "Railway Config as Code reference"
[2]: https://docs.railway.com/variables/reference "Railway Variables Reference"
