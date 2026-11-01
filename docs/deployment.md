# Deployment — frontend and backend on separate platforms

`client/` and `server/` are self-contained: each folder has its own `package.json`, `tsconfig`,
eslint/prettier config, `.env.example` and `.gitignore`. Point each platform at one folder as its
**root directory** and nothing from the repo root is required — there is no root `package.json`,
so install/run each app from inside its own folder (`cd server && npm install`, `cd client && npm install`).

## 1. Database (PostgreSQL 16)

Managed Postgres: **Neon**, Supabase or RDS work from anywhere. On Cloudflare, front it with
**Hyperdrive** so Workers (which cannot hold TCP pools) reuse connections:

```bash
cd server
npx wrangler hyperdrive create ki-shikhle-pg --connection-string "$DATABASE_URL"
# → returns an id; put it in wrangler.toml [[hyperdrive]] and use the connection string
#   it prints as the DATABASE_URL secret
```

Local instead:
```bash
cd server && docker compose up -d     # postgres:16 (5432) + redis (6379)
```

## 2. Web app → Vercel

| Setting | Value |
|---------|-------|
| Root directory | `client` |
| Install command | `npm install` |
| Build command | `npm install && npm run build` |
| Output | `.next` (auto-detected) |

Environment variables:
- `NEXT_PUBLIC_API_BASE_URL` — `https://<your-worker-host>/api/v1`
- `NEXT_PUBLIC_SITE_URL` — `https://<your-web-host>`

Both are inlined at build time → redeploy after changing them. Vercel preview deployments get a
random `*.vercel.app` origin, so add the preview origin to the API's `CLIENT_ORIGIN` (in
non-production the API also accepts any `*.vercel.app`).

## 3. Server (API) → Cloudflare **Workers**

`server/` already ships the Workers entry point (`src/worker.ts`), `wrangler.toml` and a
Workers-safe dependency set — no Express, no native modules, no filesystem:

| Replaced | Now |
|---|---|
| Express (+ helmet, cors, cookie-parser, multer, express-rate-limit) | **Hono** + a thin Express-compat layer so every controller/route file is unchanged |
| `argon2` (native, needs node-gyp) | **`hash-wasm`** argon2id (WASM, same cost parameters) |
| `pino` / `pino-http` (Node streams) | Small structured console logger (`src/utils/logger.ts`) |
| `node:crypto` | Web Crypto + a synchronous SHA-256 (`src/utils/crypto.ts`) |
| `node-cron` inside the process | **Cron Triggers** → the `scheduled()` handler (or `POST /api/v1/jobs/run`) |
| Prisma Rust engine | `DATABASE_ADAPTER=pg` → `@prisma/adapter-pg` over **Hyperdrive** |
| Local disk uploads | **R2** via the S3 API (`STORAGE_DRIVER=r2`) |

### Deploy steps

```bash
cd server
npm install

# 1. Generate a Workers-friendly Prisma client (no Rust engine; uses the driver adapter)
npx prisma generate --no-engine
npx prisma migrate deploy            # apply migrations to the real database
npm run db:seed                      # plans + NCTB subjects

# 2. Secrets (never commit; `.dev.vars` is for `wrangler dev` only)
npx wrangler secret put DATABASE_URL            # Hyperdrive connection string
npx wrangler secret put JWT_ACCESS_SECRET
npx wrangler secret put JWT_REFRESH_SECRET
npx wrangler secret put PASSWORD_PEPPER
npx wrangler secret put CRON_SECRET
npx wrangler secret put R2_ENDPOINT             # https://<account-id>.r2.cloudflarestorage.com
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
# optional: ANTHROPIC_API_KEY (omit → mock AI), SMTP_URL (omit → console email)

# 3. Edit non-secret config in wrangler.toml [vars]:
#    CLIENT_ORIGIN (comma-separated Vercel origins), R2_BUCKET, DATABASE_ADAPTER=pg,
#    ENABLE_CRON=false, TRUST_PROXY=true

# 4. Deploy
npx wrangler deploy
curl https://<worker-host>/api/v1/health
```

Local Workers run (workerd, closest to production):
```bash
cd server
cp .dev.vars.example .dev.vars       # fill in locally
npx prisma generate --no-engine
npm run dev:worker                   # wrangler dev
```
Node run (default, easiest):
```bash
cd server && npm run dev             # @hono/node-server on :5000
```

### Notes that matter on Workers
- `wrangler.toml` sets `nodejs_compat` **and** `nodejs_compat_populate_process_env`, so
  `process.env` is filled from `[vars]` and secrets — that is how `src/config/env.ts` reads config.
- The refresh cookie is `SameSite=None; Secure` in production (Vercel ↔ Workers are cross-site).
- Uploads: the DB stores `/api/v1/files/<key>`; that route checks ownership and 302-redirects to a
  short-lived R2 presigned URL. Nothing is served from disk.
- Scheduled jobs run once daily via `[triggers].crons` → `scheduled()`; there is no in-process cron
  (`ENABLE_CRON=false`).
- Rate limiting is per-isolate in-memory; add Cloudflare WAF rate-limiting rules for global limits.
- After a Workers deploy, regenerate the normal client for local work: `npx prisma generate`.

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

## Alternative: Cloudflare Containers

If you ever want the API to run as-is on Docker (Express, native modules, disk), Cloudflare
Containers needs only a `Dockerfile` plus a `[[containers]]` block in `wrangler.toml`; the code in
`server/` works there unchanged because `src/index.ts` serves the Hono app with
`@hono/node-server` and `src/worker.ts` can proxy to the container. Keep `ENABLE_CRON=true` with
`max_instances = 1` (or use the HTTP job trigger) and mount a volume **or** use R2 for uploads.
