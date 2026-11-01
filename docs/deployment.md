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

---

## Client → Vercel

| Setting | Value |
|---------|-------|
| Root directory | `client` |
| Build command | `npm install && npm run build` |
| Output | `.next` (auto-detected) |
| Install command | `npm install` |

Env (Project Settings → Environment Variables):
- `NEXT_PUBLIC_API_BASE_URL` = `https://<your-api-host>/api/v1`
- `NEXT_PUBLIC_SITE_URL` = `https://<your-web-host>`

These are inlined at build time — redeploy after changing them. Preview deployments get a
random `*.vercel.app` origin; add it to the API's `CLIENT_ORIGIN` (or allow `*.vercel.app` in
non-production) or previews can't call the API.

## Server → Cloudflare

You have two targets, and they are very different amounts of work for this stack
(Express + Prisma + argon2id + node-cron):

### Option A — Cloudflare **Containers** (recommended, keeps the code as-is)

Your app runs as a Docker container, so Express, Prisma, argon2 and node-cron all work unchanged.

1. `cd server && docker build -t ki-shikhle-api .` (Dockerfile below)
2. `wrangler.toml` (in `server/`) declares the container + routes:
   ```toml
   name = "ki-shikhle-api"
   main = "src/worker.ts"        # thin proxy Worker → container
   compatibility_date = "2026-01-01"

   [[containers]]
   class_name = "ApiContainer"
   image = "./Dockerfile"
   max_instances = 1            # single instance: cron + in-process jobs stay simple

   [[durable_objects.bindings]]
   name = "API_CONTAINER"
   class_name = "ApiContainer"
   ```
3. Database: any managed Postgres (Neon/Supabase/RDS) — optionally front it with **Cloudflare
   Hyperdrive** for connection pooling from the edge.
4. Uploads: **R2** (`STORAGE_DRIVER=r2`, see README “File storage”). Container disks are not durable.
5. Cron: `ENABLE_CRON=true` works as long as you keep `max_instances = 1`; otherwise set
   `ENABLE_CRON=false` and add a Cron Trigger calling `POST /api/v1/jobs/run`.

### Option B — Cloudflare **Workers** (serverless; requires porting)

Workers have no filesystem, no long-lived process and no native modules, so these need replacing:

| Today | On Workers |
|---|---|
| Express | Hono (or Express 5 with `nodejs_compat`) |
| `argon2` (native) | Web Crypto PBKDF2 / `hash-wasm` argon2id (WASM) |
| Prisma + TCP Postgres | Prisma driver adapter + Hyperdrive (`@prisma/adapter-pg`) |
| `node-cron` | Cloudflare Cron Triggers → `POST /api/v1/jobs/run` |
| multer + local disk | R2 (`STORAGE_DRIVER=r2`) — already supported |

Everything else (modules, services, schemas, tests) stays the same.

### Env on Cloudflare (either option)

```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put JWT_ACCESS_SECRET
npx wrangler secret put JWT_REFRESH_SECRET
npx wrangler secret put PASSWORD_PEPPER
npx wrangler secret put CRON_SECRET
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
# non-secret values (NODE_ENV, PORT, CLIENT_ORIGIN, STORAGE_DRIVER, R2_BUCKET,
# R2_ENDPOINT, R2_REGION, ENABLE_CRON, TRUST_PROXY) go in [vars] in wrangler.toml
```

`NODE_ENV=production` is required — it switches the refresh cookie to `SameSite=None; Secure`
(needed because Vercel and Cloudflare are different domains) and enforces real secrets.

### Post-deploy checks
- `curl https://<api>/api/v1/health` → `{ "success": true }`
- Log in from the Vercel app: the refresh cookie must be set (check `SameSite=None; Secure`
  and that `CLIENT_ORIGIN` matches the Vercel origin exactly)
- Upload a note photo → object appears in the R2 bucket, and `/api/v1/files/<key>` opens when
  logged in (401 when not)
- Run migrations once: `npx prisma migrate deploy`, then seed: `npm run db:seed`
