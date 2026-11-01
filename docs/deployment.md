# Deployment — frontend and backend on separate platforms

`client/` and `server/` are self-contained: each folder has its own `package.json`, `tsconfig`,
eslint/prettier config, `.env.example` and `.gitignore`. Point each platform at one folder as its
**root directory** and nothing from the repo root is required — there is no root `package.json`,
so install/run each app from inside its own folder (`cd server && npm install`, `cd client && npm install`).

## 1. Database (PostgreSQL 16)

Managed options: Neon, Supabase, RDS, Render Postgres. Create a database, copy the connection
string into the server's `DATABASE_URL`.

Local instead:
```bash
cd server && docker compose up -d     # postgres:16 (5432) + redis (6379)
```

## 2. Server (API) — Render / Railway / Fly.io / VPS

| Setting | Value |
|---------|-------|
| Root directory | `server` |
| Build command | `npm install && npx prisma generate && npx prisma migrate deploy && npm run build` |
| Start command | `npm start` (or `npm run start`) |
| Health check | `GET /api/v1/health` |
| Node | 20.x |

Environment variables (from `server/.env.example`):
`NODE_ENV=production`, `PORT`, `DATABASE_URL`, `CLIENT_ORIGIN` (exact frontend origin, no trailing slash),
`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `REFRESH_TTL_DAYS`, `PASSWORD_PEPPER`,
`ANTHROPIC_API_KEY`, `AI_MODEL_FAST`, `AI_MODEL_SMART`, `AI_MONTHLY_BUDGET_USD`, `SMTP_URL`,
`STORAGE_DRIVER=s3` (+ `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`), `TRIAL_DAYS`.

Notes:
- Prisma migrations are **not** committed yet (the dev DB was never migrated in this environment).
  Create them locally with `cd server && npm run db:migrate` and commit `server/prisma/migrations/`,
  then `prisma migrate deploy` applies them in production. As a shortcut (no migration history) use
  `npx prisma db push` against an empty database.
- Refresh cookies are `httpOnly`/`secure`/`sameSite=none` in production — the API and web app are on
  different domains, so serve both over HTTPS and keep `CLIENT_ORIGIN` exact.
- File uploads: use `STORAGE_DRIVER=s3` (or any S3-compatible bucket) on platforms with ephemeral disks.
- Cron jobs (trial reminders, expiry, 7-day account purge) run inside the server process via `node-cron`;
  keep exactly one instance running, or move them to a scheduled job calling an admin endpoint later.

## 3. Client (web) — Vercel / Netlify / Cloudflare Pages

| Setting | Value |
|---------|-------|
| Root directory | `client` |
| Build command | `npm install && npm run build` |
| Output | `.next` (Next.js default) |
| Start (self-host) | `npm start` |

Environment variables (from `client/.env.example`):
- `NEXT_PUBLIC_API_BASE_URL` — e.g. `https://api.kishikhle.com/api/v1`
- `NEXT_PUBLIC_SITE_URL` — e.g. `https://kishikhle.com`

These are inlined at build time, so redeploy/rebuild after changing them.

## 4. Post-deploy checklist
- `GET https://<api>/api/v1/health` returns `{ "success": true }`
- `CLIENT_ORIGIN` matches the deployed frontend exactly (check login/refresh cookies)
- Seed plans/subjects once: `npm run db:seed` (then optionally `npm run demo:seed` for demo data)
- Object storage write/read works (upload a note image)
- Verify-email / password-reset links use `NEXT_PUBLIC_SITE_URL`

## Backups & restore
- Provider snapshots daily + `pg_dump` to object storage:
  ```bash
  pg_dump "$DATABASE_URL" | gzip > backup-$(date +%F).sql.gz
  gunzip -c backup-2026-01-01.sql.gz | psql "$DATABASE_URL"
  ```
- Test restore quarterly.

## Scaling
Stateless API (scale horizontally), files in object storage, DB connection pooling (PgBouncer or provider
pooler), AI calls async with status polling, cron in a single instance. See `docs/load-test.md`.
