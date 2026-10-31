# Ki Shikhle? — Parent Learning Tracker

**NCTB-aware, Bangladesh-first, multi-country ready.** Parents see what their children actually learned; children log in under 1 minute; AI quizzes from real notes.

[![CI](https://github.com/mahfuz-saim/ki-shikhle/actions/workflows/ci.yml/badge.svg)](https://github.com/mahfuz-saim/ki-shikhle/actions/workflows/ci.yml)

## Monorepo
```
ki-shikhle/
├── client/  Next.js 14 + Tailwind + shadcn/ui + Recharts + next-intl + next-themes + Tesseract.js
├── server/  Express + TypeScript + Prisma (PostgreSQL) + argon2id + JWT + Anthropic Claude
├── docs/    PRD, decisions, security, deployment, load-test
├── e2e/     Playwright tests
└── docker-compose.yml (PostgreSQL 16 + Redis)
```

## Quick Start
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
docker-compose up -d postgres
npm install
npm run db:generate --workspace=server
npm run db:migrate --workspace=server
npm run db:seed --workspace=server   # plans + NCTB subjects
npx tsx server/scripts/demoSeed.ts  # parent@demo.com / DemoPass1 + child Rahim + 5 entries + quiz
npm run dev
# Client: http://localhost:3000 → NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
# Server: http://localhost:5000/api/v1/health
```

## Env
`server/.env.example` — JWT secrets, DATABASE_URL, ANTHROPIC_API_KEY, AI models (haiku/sonnet), SMTP, STORAGE_DRIVER local|s3, TRIAL_DAYS
`client/.env.example` — NEXT_PUBLIC_API_BASE_URL

No hardcoded URLs, secrets, plan prices or model names — all in env/DB. `.env` files are gitignored; examples are tracked.

## Pricing (per child/month, BDT)
| Plan | Price | Includes |
|------|-------|----------|
| Trial | Free 15d | Full Standard, 2 kids |
| Starter | ৳149 | 10 quizzes/mo, 3mo history |
| Standard | ৳299 | 40 quizzes/mo, explanations, 12mo |
| Premium | ৳499 | 120 quizzes/mo, vision OCR, unlimited |

Sibling 25% off 2nd, 35% off 3rd+. Annual pay 10 get 12. AI cost <20% via `ai_usage_logs`.

## API (envelope `{success,data,error}`)
`GET /health` • `POST /auth/*` (register/login/refresh/verify/forgot/reset/change/me/export/delete) • `GET/POST /children` + PIN + enter/exit • `GET/POST /subjects` • `GET/POST /children/:id/entries` + verify • Routines + exceptions + `GET /children/:id/schedule?from=&to=` • Notes (multipart, Tesseract ben+eng) + `POST /notes/:id/ai-ocr` • Quizzes generate/list/get/patch/regenerate/assign/attempts/answers/submit/report • Results + explanation • Dashboards summary/study-time/subjects/scores/topics/consistency/overview • Billing plans/subscription/demo-checkout/cancel/invoices • Notifications • Admin metrics/ai-usage/users/extend-trial

Every endpoint: zod + auth + ownership check + tests.

## Theme & i18n
Indigo `#4F46E5` primary, amber accent, red only for errors. Dark/light/system via next-themes, CSS variables, no flash. `en` + `bn` via next-intl, Noto Sans Bengali + Inter, Asia/Dhaka.

## Security
argon2id + pepper, JWT 15m + rotating refresh (reuse revokes family), rate limits, helmet, CORS, zod, Prisma, file validation, audit logs. See `docs/security.md`.

## Performance & Reliability
API p95 <300ms (non-AI), AI async with status, idempotency on quiz/checkout, retries/backoff, indexes on (child_id,date), stateless server, pino logging.

## Scripts & CI
`npm run dev | build | lint | typecheck | test` (workspaces) • `docker-compose up` • GitHub Actions CI (lint/typecheck/test/build) • Playwright e2e • k6 load test (docs/load-test.md)

## Phases
- [x] 0 Foundations — monorepo, health, env, gitignore
- [x] 1 Auth & Accounts — argon2id, JWT, verify/reset, 7d purge
- [x] 2 Children, Subjects, App Shell — PIN, seeded NCTB, sidebar/bottom nav
- [x] 3 Learning Log & Routines — entries+revisions, weekday+exceptions, schedule compute, missed
- [x] 4 Notes & OCR — Tesseract ben+eng, editable preview, hash, AI vision fallback
- [x] 5 AI Service & Quiz — digest, compact prompts, zod, cache, hidden answers, timer/resume
- [x] 6 Results & Dashboards — per-topic stats, cached explanation en/bn, Recharts (bar/donut/line/radar/heatmap)
- [x] 7 Billing — plans, trial 15d, DemoProvider, entitlements, expiry read-only, cron
- [x] 8 Notifications, Admin, Polish — bell, admin metrics, onboarding, a11y, demo seed
- [x] 9 Hardening — security, Playwright, load, CI, Docker, privacy/terms

## Decisions
See `docs/decisions.md`.

## Git & Branching
Work is on `arena/ba64f1fa-ki-shikhle` (tracked session branch). Each phase committed + pushed in order (10 commits). `main` is upstream. PR from arena branch → main. `.gitignore` properly maintains env, build, logs, OS, IDE, uploads.

## License
Proprietary — demo for Parent Learning Tracker.
