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
| 2026-11-01 | Client and server keep their own config (`.env.example`, `.eslintrc.json`, `.prettierrc`, `.gitignore`, `tsconfig.json`, `docker-compose.yml`, `e2e/`); root keeps only workspaces `package.json`, `.gitignore`, `README.md`, `docs/` | Frontend and backend are deployed to different platforms, so each folder must build and run standalone without root-level files |
| 2026-11-01 | No GitHub Actions CI workflow (removed `.github/workflows/ci.yml`) | Builds are done on the deploy platforms, not on GitHub, per request |
| 2026-11-01 | Server loads `.env` from its own directory as well as cwd | Works when started from `server/` (platform) or repo root (`npm run dev --workspace=server`) |
