# Architecture Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-10-31 | Use Prisma with PostgreSQL | Type-safe ORM, migrations, as per PRD |
| 2026-10-31 | argon2id for passwords | PHC winner, memory-hard, per PRD |
| 2026-10-31 | JWT access (15m) + rotating refresh (30d, httpOnly cookie) | Standard, supports logout-everywhere, reuse detection |
| 2026-10-31 | Tesseract.js client-side first | Cost saving, privacy; AI vision only fallback |
| 2026-10-31 | Anthropic Claude haiku for digests/quizzes, sonnet for explanations | Cost control, env-configurable |
| 2026-10-31 | Indigo primary + amber accent, red only for errors | Trust/focus, avoids alarm fatigue for parents |
| 2026-10-31 | Monorepo layout (`client/` + `server/`) | Simple folder split, matches PRD |
| 2026-10-31 | Phase 1 auth: argon2id + pepper, JWT 15m + rotating refresh httpOnly lax cookie, reuse detection revokes family | Security & UX |
| 2026-10-31 | Forgot/reset tokens single-use hashed, 60m expiry, soft-delete 7-day grace | PRD 5.1 |
| 2026-11-01 | Client and server keep their own config (`.env.example`, `.eslintrc.json`, `.prettierrc`, `.gitignore`, `tsconfig.json`, `docker-compose.yml`, `e2e/`); root keeps only `README.md` and `docs/` | Frontend and backend are deployed to different platforms, so each folder must build and run standalone without root-level files |
| 2026-11-01 | No GitHub Actions CI workflow (removed `.github/workflows/ci.yml`) | Builds are done on the deploy platforms, not on GitHub, per request |
| 2026-11-01 | Server loads `.env` from its own directory as well as cwd | Works when started from `server/` (platform) or from the repo root |
| 2026-11-01 | Removed the root `package.json` (no npm workspaces): install and run `client/` and `server/` independently; Playwright in `client/e2e` starts each app from its own folder | The two apps are deployed and run separately, so a shared root install/scripts added nothing |
| 2026-11-01 | Removed the repo-root `.gitignore`; `client/.gitignore` and `server/.gitignore` each cover env, deps, build output, uploads, logs, caches and OS/IDE files | Each app is installed and deployed on its own, so ignore rules belong to the app; verified no tracked file becomes ignored |
| 2026-11-01 | Storage is an interface with two drivers: `local` (default, zero setup) and S3-compatible (`r2`/`s3`) for Cloudflare R2, B2, MinIO…; files are always served through the authenticated `/api/v1/files/:key` route | No persistent disk on Cloudflare, and the old public `/uploads` folder exposed children's notebook photos |
| 2026-11-01 | Added `POST /api/v1/jobs/run` (protected by `x-cron-secret`) and `ENABLE_CRON` | Cloudflare Workers/containers need an HTTP trigger for trial reminders, expiry and the 7-day purge |
| 2026-11-01 | Dev defaults for every optional env var (mock AI, console email, local storage, in-memory DB fallback) so `npm install && npm run dev` works with no `.env` | Local development shouldn't require configuring paid third-party services first |
| 2026-11-01 | Removed the unused native `bcrypt` dependency and bumped `argon2` to ^0.45.1 | bcrypt was dead weight; argon2 0.31 had no prebuilt binaries for Node 22 and failed to install |
| 2026-11-01 | Refresh cookie is `SameSite=None; Secure` and `CLIENT_ORIGIN` accepts a comma-separated list | Web app (Vercel) and API (Cloudflare) are on different domains, so the cookie is cross-site; preview deployments need multiple origins |
