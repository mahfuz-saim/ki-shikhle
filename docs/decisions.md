# Architecture Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-10-31 | Use Prisma with PostgreSQL | Type-safe ORM, migrations, as per PRD |
| 2026-10-31 | argon2id for passwords | PHC winner, memory-hard, per PRD |
| 2026-10-31 | JWT access (15m) + rotating refresh (30d, httpOnly cookie) | Standard, supports logout-everywhere, reuse detection |
| 2026-10-31 | Tesseract.js client-side first | Cost saving, privacy; AI vision only fallback |
| 2026-10-31 | Anthropic Claude haiku for digests/quizzes, sonnet for explanations | Cost control, env-configurable |
| 2026-10-31 | Indigo primary + amber accent, red only for errors | Trust/focus, avoids alarm fatigue for parents |
| 2026-10-31 | Monorepo with npm workspaces | Simple, no extra tooling, matches PRD |
| 2026-10-31 | Phase 1 auth: argon2id + pepper, JWT 15m + rotating refresh httpOnly lax cookie, reuse detection revokes family | Security & UX |
| 2026-10-31 | Forgot/reset tokens single-use hashed, 60m expiry, soft-delete 7-day grace | PRD 5.1 |
