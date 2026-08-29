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
| `R2_ACCOUNT_ID` | Yes for media/billing flows | Cloudflare account identifier used to construct the S3 endpoint | Cloudflare Account ID |
| `R2_BUCKET_NAME` | Yes for media/billing flows | Private object bucket | `salonflow-media` |
| `R2_ACCESS_KEY_ID` | Yes for media/billing flows | R2 Account API Token access key | Cloudflare R2 Access Key ID |
| `R2_SECRET_ACCESS_KEY` | Yes for media/billing flows | R2 Account API Token secret | Cloudflare R2 Secret Access Key |
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

## File storage configuration

The storage adapter now uses Cloudflare R2 through its S3-compatible API. Uploads are written to the private `salonflow-media` bucket, while public salon cover/avatar/feed routes are served through a narrow signed redirect proxy. Protected client before/after media and billing receipts are not allowed through that public proxy; they are returned only as short-lived signed URLs after the existing organization/role checks.

Keep only object metadata and keys in MySQL/TiDB. Do not put file bytes in the database and do not use a Railway volume as the primary source of truth for user media. A Railway volume is not a substitute for durable, access-controlled object storage.

The R2 Account API Token should have `Object Read & Write` permission scoped only to `salonflow-media`. Rotate the token if it is exposed, and never commit it to GitHub, a Dockerfile, a screenshot, or a client-side variable.

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
