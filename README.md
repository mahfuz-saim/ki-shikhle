# Ki Shikhle? — Parent Learning Tracker

**NCTB-aware, Bangladesh-first, multi-country ready.** Parents see what their children actually learned; children log in under 1 minute; AI quizzes from real notes.

## Repo layout — `client/` and `server/` are self-contained

Each app owns **all** of its configuration so it can be deployed to a different platform
(Vercel/Netlify for the web app, Render/Railway/Fly/VPS for the API) without anything from the repo root.

```
ki-shikhle/
├── client/                 # Next.js 14 web app — deploy this folder
│   ├── .env.example        # NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_SITE_URL
│   ├── .eslintrc.json      # next/core-web-vitals + prettier
│   ├── .prettierrc / .prettierignore
│   ├── .gitignore          # env + build ignores for this app
│   ├── next.config.mjs, postcss.config.js, tailwind.config.ts, tsconfig.json
│   ├── e2e/                # Playwright (drives the frontend, boots both apps locally)
│   └── src/
├── server/                 # Express + Prisma API — deploy this folder
│   ├── .env.example        # DB, JWT, Anthropic, SMTP, storage, trial
│   ├── .eslintrc.json      # @typescript-eslint + prettier
│   ├── .prettierrc / .prettierignore
│   ├── .gitignore
│   ├── docker-compose.yml  # local PostgreSQL 16 + Redis (dev only)
│   ├── tsconfig.json, vitest.config.ts
│   ├── prisma/             # schema.prisma + seed.ts (run `db:migrate` to create migrations/)
│   ├── scripts/            # demoSeed.ts
│   └── src/
└── docs/                   # PRD, decisions, security, deployment, load-test
```

There is **no `package.json` and no `.gitignore` at the root**: `client/` and `server/` are two
independent apps, each with its own dependencies, scripts, `.gitignore`, `tsconfig`, eslint/prettier
config and `.env.example`. Install and run each one from its own folder. The root holds only
`README.md` and `docs/`.

Each app's `.gitignore` covers its own env files, `node_modules`, build output, uploads, logs,
caches and OS/IDE files, so secrets and artifacts stay out of Git with no repo-root rules.

## Quick start (two terminals — no root install)

**Terminal 1 — API**
```bash
cd server
cp .env.example .env           # edit secrets (DATABASE_URL, JWT_*, ANTHROPIC_API_KEY…)
npm install
docker compose up -d           # local PostgreSQL 16 + Redis — or point DATABASE_URL at a managed DB
npm run db:generate
npm run db:migrate             # creates prisma/migrations — commit them
npm run db:seed                # plans + NCTB subjects
npm run demo:seed              # optional: parent@demo.com / DemoPass1 + demo child
npm run dev                    # http://localhost:5000/api/v1/health
```

**Terminal 2 — Web**
```bash
cd client
cp .env.example .env.local     # NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
npm install
npm run dev                    # http://localhost:3000
```

### Production build

```bash
# server
cd server && npm ci && npm run build && npm start   # tsc → dist/index.js
# client
cd client && npm ci && npm run build && npm start   # .next
```

## Local development with **no env file at all**

Both apps ship with working defaults, so you can clone and run without configuring anything.
Anything you leave unset degrades instead of crashing:

| Left unset | What happens |
|---|---|
| `server/.env` (nothing set) | Dev JWT secrets/pepper are used automatically; `DATABASE_URL` defaults to the docker-compose Postgres |
| Postgres not running | `⚠️ DB connection failed (running without DB)` — the API still serves `/api/v1/health`, and modules fall back to in-memory data |
| Prisma client not generated | Same fallback, with a hint to run `npm run db:generate` |
| `ANTHROPIC_API_KEY` | AI returns deterministic **mock** digests/quizzes/explanations (logged as `AI mock response`) — perfect for UI work, costs nothing |
| `SMTP_URL` | Emails are printed to the server console instead of sent |
| `STORAGE_DRIVER` | `local` — uploads go to `server/uploads/` |
| `client/.env.local` | The client defaults to `http://localhost:5000/api/v1` |

Zero-config run (no database, mock AI):
```bash
cd server && npm install && npm run db:generate && npm run dev   # http://localhost:5000/api/v1/health
cd client && npm install && npm run dev                          # http://localhost:3000
```

With a real database (recommended as soon as you touch data):
```bash
cd server
npm run setup                 # writes .env with fresh random JWT secrets (never overwrites)
docker compose up -d          # PostgreSQL 16 + Redis
npm run db:generate && npm run db:migrate && npm run db:seed
npm run demo:seed             # parent@demo.com / DemoPass1 + demo child
npm run dev
```

Add real services only when you need them — edit `server/.env`:
```bash
ANTHROPIC_API_KEY=sk-ant-...      # real AI
SMTP_URL=smtp://user:pass@host:587
STORAGE_DRIVER=r2                 # Cloudflare R2 / any S3-compatible bucket
CRON_SECRET=$(openssl rand -hex 32)
```
Health check: `GET /api/v1/health`. The client talks to the API only through
`NEXT_PUBLIC_API_BASE_URL`; there are no hardcoded URLs.

See `docs/deployment.md` for platform-specific steps (Vercel/Netlify + Render/Railway/Fly/VPS),
env tables, migrations on deploy, CORS, backups and scaling.

## Env

| App | Example file | Key variables |
|-----|--------------|---------------|
| server | `server/.env.example` | `DATABASE_URL`, `CLIENT_ORIGIN`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PASSWORD_PEPPER`, `ANTHROPIC_API_KEY`, `AI_MODEL_FAST/SMART`, `SMTP_URL`, `STORAGE_DRIVER` (`local`\|`s3`), `TRIAL_DAYS` |
| client | `client/.env.example` | `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SITE_URL` (both optional locally) |
| storage | `server/.env.example` | `STORAGE_DRIVER=local\|r2\|s3`, `R2_BUCKET`, `R2_ENDPOINT`, `R2_REGION`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_URL` |
| jobs/net | `server/.env.example` | `ENABLE_CRON`, `CRON_SECRET`, `TRUST_PROXY`, `COOKIE_DOMAIN` |

Secrets are never committed: `client/.gitignore` and `server/.gitignore` ignore `.env*` in their own
folder (with `!.env.example`), so only the example files are tracked.

## Pricing (per child/month, BDT)

| Plan | Price | Includes |
|------|-------|----------|
| Trial | Free 15d | Full Standard, 2 kids |
| Starter | ৳149 | 10 quizzes/mo, 3mo history |
| Standard | ৳299 | 40 quizzes/mo, explanations, 12mo |
| Premium | ৳499 | 120 quizzes/mo, vision OCR, unlimited |

Sibling 25% off 2nd, 35% off 3rd+. Annual pay 10 get 12. Plans are seeded rows — prices are data, not code.

## API (envelope `{success,data,error}`)

`GET /health` • `POST /auth/*` (register/login/refresh/verify/forgot/reset/change/me/export/delete) •
`GET/POST /children` + PIN + enter/exit • `GET/POST /subjects` • `GET/POST /children/:id/entries` + verify •
Routines + exceptions + `GET /children/:id/schedule?from=&to=` • Notes (multipart, Tesseract ben+eng) +
`POST /notes/:id/ai-ocr` • Quizzes generate/list/get/patch/regenerate/assign/attempts/answers/submit/report •
Results + explanation • Dashboards summary/study-time/subjects/scores/topics/consistency/overview •
Billing plans/subscription/demo-checkout/cancel/invoices • Notifications • Admin metrics/ai-usage/users/extend-trial

Every endpoint: zod validation + auth + ownership check at the query level + tests.

## Theme & i18n
Indigo `#4F46E5` primary, amber accent, red only for errors. Dark/light/system via next-themes, CSS variables, no flash.
`en` + `bn` via next-intl, Noto Sans Bengali + Inter, Asia/Dhaka.

## Security
argon2id + pepper, JWT 15m + rotating refresh (reuse revokes family), rate limits, helmet, CORS allowlist, zod,
Prisma parameterised queries, upload magic-byte validation, audit logs. See `docs/security.md`.

## Performance & reliability
API p95 <300ms (non-AI), AI async with status polling, idempotency on quiz generation/checkout,
retries with backoff, indexes on `(child_id, date)`, stateless server, pino logging. See `docs/load-test.md`.

## File storage (note uploads)

Uploads (notebook photos/PDFs) go through one `StorageProvider` interface
(`server/src/services/storage.ts`):

- `STORAGE_DRIVER=local` (default) — writes to `server/uploads/`. Good for local dev and
  any host with a persistent disk.
- `STORAGE_DRIVER=r2` (or `s3`) — any S3-compatible bucket: Cloudflare R2, AWS S3,
  Backblaze B2, MinIO, DO Spaces. Uses `@aws-sdk/client-s3` (optional dependency, imported
  lazily) so nothing is loaded when you stay on `local`.

Either way files are **private**: the DB stores `/api/v1/files/<key>`, and that route
checks the note belongs to your child before streaming the file (local) or redirecting to a
short-lived presigned URL (R2). There is no public `/uploads` folder.

```bash
# .env for R2 (create the bucket + API token in the Cloudflare dashboard)
STORAGE_DRIVER=r2
R2_BUCKET=kishikhle-notes
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_REGION=auto
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
# R2_PUBLIC_URL=https://cdn.example.com   # only if the bucket is public
```

## Deployment: web on Vercel, API on Cloudflare

See `docs/deployment.md` for the full walkthrough. The short version:

| | Vercel (client) | Cloudflare (server) |
|---|---|---|
| Root directory | `client` | `server` |
| Build | `npm install && npm run build` | `npm install && npx prisma generate && npx prisma migrate deploy && npm run build` |
| Start | (Next.js managed) | `npm start` |
| Env | `NEXT_PUBLIC_API_BASE_URL=https://<api-host>/api/v1`, `NEXT_PUBLIC_SITE_URL` | see `server/.env.example` |

Cross-origin set-up that matters (API and web are on different domains):
- `CLIENT_ORIGIN` — comma-separated list of web origins (production + `*.vercel.app` previews)
- Refresh cookie is `SameSite=None; Secure` automatically when `NODE_ENV=production`
- `TRUST_PROXY=true` so `req.ip`/protocol come from Cloudflare's headers
- Scheduled jobs: keep in-process cron (`ENABLE_CRON=true`) **or** disable it and call
  `POST /api/v1/jobs/run` with header `x-cron-secret: $CRON_SECRET` from a Cloudflare Cron Trigger

## Scripts (run from inside each folder)

Server: `dev | build | start | lint | format | typecheck | test | db:generate | db:migrate | db:deploy | db:push | db:seed | db:studio | demo:seed`
Client: `dev | build | start | lint | format | typecheck`
E2E: `cd client/e2e && npm install && npm test`

## Phases
- [x] 0 Foundations — app folders, health, env examples, per-app gitignore
- [x] 1 Auth & Accounts — argon2id, JWT, verify/reset, 7d purge
- [x] 2 Children, Subjects, App Shell — PIN, seeded NCTB, sidebar/bottom nav
- [x] 3 Learning Log & Routines — entries+revisions, weekday+exceptions, schedule compute, missed
- [x] 4 Notes & OCR — Tesseract ben+eng, editable preview, hash, AI vision fallback
- [x] 5 AI Service & Quiz — digest, compact prompts, zod, cache, hidden answers, timer/resume
- [x] 6 Results & Dashboards — per-topic stats, cached explanation en/bn, Recharts (bar/donut/line/radar/heatmap)
- [x] 7 Billing — plans, trial 15d, DemoProvider, entitlements, expiry read-only, cron
- [x] 8 Notifications, Admin, Polish — bell, admin metrics, onboarding, a11y, demo seed
- [x] 9 Hardening — security, Playwright, load, deployment docs, privacy/terms, per-app config split

## Decisions
See `docs/decisions.md`.

## Git & branching
Work is on `arena/ba64f1fa-ki-shikhle` (tracked session branch); each phase was committed and pushed in order.
Open a PR from this branch into `main`.

## License
Proprietary — demo for Parent Learning Tracker.
