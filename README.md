# Ki Shikhle? — Parent Learning Tracker

**NCTB-aware, Bangladesh-first, multi-country ready.** Parents see what their children actually learned; children log in under 1 minute; AI quizzes from real notes.

## Monorepo
```
ki-shikhle/
├── client/  Next.js 14 + Tailwind + shadcn/ui + Recharts + next-intl + next-themes
├── server/  Express + TypeScript + Prisma (PostgreSQL) + argon2id + JWT + Anthropic
├── docs/    PRD & decisions
└── docker-compose.yml (PostgreSQL 16 + Redis)
```

## Quick Start
```bash
# 1. Env
cp server/.env.example server/.env
cp client/.env.example client/.env.local

# 2. DB (requires Docker)
docker-compose up -d postgres
# Or use local PostgreSQL: set DATABASE_URL

# 3. Install
npm install

# 4. Prisma
npm run db:generate --workspace=server
npm run db:migrate --workspace=server
npm run db:seed --workspace=server

# 5. Dev
npm run dev
# Server: http://localhost:5000/api/v1/health
# Client: http://localhost:3000  (calls health via NEXT_PUBLIC_API_BASE_URL)
```

## Env
- `server/.env` — see `server/.env.example` (JWT, DB, Anthropic, SMTP, STORAGE_DRIVER)
- `client/.env` — `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1` (no hardcoded URLs)

## Theme
Indigo primary `#4F46E5` / `#818CF8` dark, amber accent, red only for errors. Light/dark/system via `next-themes`, CSS variables.

## i18n
`en` + `bn` (Noto Sans Bengali + Inter). `next-intl` messages in `client/src/messages/`.

## Pricing (per child/month, BDT)
Trial free 15d (Standard) • Starter ৳149 • Standard ৳299 • Premium ৳499. Sibling 25%/35% off. Annual pay 10 get 12. AI cost <20% via `ai_usage_logs`.

## Phases
- [x] Phase 0: Foundations (monorepo, health, theme, i18n, docker)
- [ ] Phase 1: Auth & Accounts
- [ ] Phase 2: Children, Subjects, App Shell
- [ ] Phase 3: Learning Log & Routines
- [ ] Phase 4: Notes & OCR (Tesseract.js ben+eng)
- [ ] Phase 5: AI Service & Quiz Engine
- [ ] Phase 6: Results, Explanations & Dashboards
- [ ] Phase 7: Billing (Demo), Trial & Entitlements
- [ ] Phase 8: Notifications, Admin, Polish
- [ ] Phase 9: Hardening & Release Prep

## API
Base: `/api/v1` envelope `{ success, data, error }`. Health: `GET /health`.

## Security
argon2id + pepper, JWT access (15m) + rotating refresh (httpOnly, reuse detection), rate limits, ownership checks at query level, zod validation everywhere.

## Decisions
See `docs/decisions.md`.
