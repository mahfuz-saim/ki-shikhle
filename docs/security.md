# Security Checklist

This document describes the security posture **as it is actually implemented**. Every line
below was checked against the code; where a protection is partial or missing, it says so.

## Implemented

- ✅ **Parameterized queries** via Prisma — there is no raw SQL anywhere in `server/src`
- ✅ **Zod validation** on the endpoints that accept a body or path parameters, via
  `middleware/validate.ts` (`src/modules/*/*.schema.ts`)
- ✅ **Security headers** — `hono/secure-headers` (`app.ts`)
- ✅ **CORS allowlist** — explicit `CLIENT_ORIGIN` list plus localhost / Vercel / Pages
  preview origins; credentials allowed (`app.ts`)
- ✅ **Refresh cookie** — `httpOnly`, `Secure` + `SameSite=None` in production,
  `SameSite=Lax` in development (`config/env.ts`, `modules/auth/auth.controller.ts`)
- ✅ **CSRF origin check** — the refresh cookie is `SameSite=None`, so it *is* attached to
  cross-site requests. Every state-changing route on the auth router therefore checks the
  `Origin` header against the allowlist (`middleware/csrf.ts`). Requests with no `Origin`
  (curl, native apps) pass: there is nothing for a cross-site attacker to forge.
- ✅ **Rate limiting** — `authLimiter` (100 / 15 min) on the auth routes, `generalLimiter`
  (200 / min) on all of `/api/v1` (`middleware/rateLimit.ts`). In-memory per instance —
  put a WAF rule in front for a globally enforced limit.
- ✅ **Single ownership choke point** — `core/tenancy.ts` resolves a token into an `Actor`
  and every tenant-scoped read/write goes through `assertChildAccess` /
  `assertEntityAccess`. Cross-tenant access returns **404**, never 403, so existence is
  not disclosed. Admins may read platform metrics only, never tenant content.
- ✅ **Upload validation** — size ceiling (5 MB) and **magic-byte** verification before a
  file is stored (`middleware/upload.ts`). The client's `Content-Type` is treated as a
  claim; the bytes are the truth. The inline `imageBase64` path is validated separately,
  because it bypasses the multipart parser.
- ✅ **Random filenames, private storage** — files are served only through the
  authenticated `GET /api/v1/files/:key` route; there is no public uploads folder.
  Local disk or S3/R2 via the `StorageProvider` interface (`services/storage.ts`).
- ✅ **Passwords** — argon2id via `hash-wasm` (unique salt per hash) plus a server-side
  pepper from the environment (`services/password.ts`)
- ✅ **JWT access + rotating refresh with reuse detection** — a reused refresh token
  revokes its whole family (`modules/auth/auth.service.ts`)
- ✅ **Audit log** — logins are recorded in the `audit_log` table with the user id and
  IP (`modules/auth/auth.service.ts`). The logger is structured JSON with no PII and no
  tokens (`utils/logger.ts`).
- ✅ **No published secrets** — `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` and
  `PASSWORD_PEPPER` have no fallback constants. A missing secret is a **startup failure in
  production**; in development a random per-process secret is generated
  (`config/env.ts`). `.env` is gitignored, `.env.example` is committed.
- ✅ **Role from the database** — `resolveActor` re-reads the account row, so a token
  minted before a role change does not keep its old powers for its whole lifetime.
  `middleware/auth.ts` verifies the signature and nothing else — there is no
  demo-token or substring backdoor.
- ✅ **Credential stripping** — `passwordHash`, `pinHash` and `password` are excluded from
  every child and user response (`core/store.ts:sanitizeChild`, explicit `select`
  projections, and the admin user list).
- ✅ **Scheduled jobs gated** — `POST /jobs/run` requires `x-cron-secret`
  unconditionally. When `CRON_SECRET` is unset the endpoint is disabled.
- ✅ **Account lifecycle** — soft delete with a 7-day grace period, then a hard purge by
  the cleanup job; `POST /auth/account/restore` requires a session and always restores
  *the caller's own* account; `GET /auth/export` returns the caller's own data.
- ✅ **AI prompt-injection defence** — note content is delimited (`[DIGESTS] … [/DIGESTS]`)
  and explicitly treated as untrusted data; quiz output is parsed and validated with a
  zod schema, with one repair retry.
- ✅ **Mock AI is flagged** — `callAI` returns `mocked: true` for deterministic mock
  output, and the quiz service records it as `status: 'mock'`, not `'success'`. A
  production outage cannot silently persist fake quizzes as real AI output.

## Ownership tests

The isolation matrix is enforced by the test suite, not by inspection:

| Suite | What it pins down |
|---|---|
| `src/__tests__/isolation.test.ts` | For every tenant-scoped endpoint, a valid token for tenant A against tenant B's ids returns **404**. Real rows are seeded for tenant B, so "404 because it does not exist" cannot pass trivially. |
| `src/__tests__/auth-bypass.test.ts` | Every legacy demo token (`demo-parent-token`, anything containing `tasnim` / `rahim` / `fahim` / `parent`, malformed JWTs) → **401**. `mock-refresh-*` → **401**. A wrong password → **401** for every account, including the demo one. |
| `src/__tests__/tenant-scope.test.ts` | The same matrix with Prisma forced to fail, against the in-memory store. The degraded path is **not** a bypass. |
| `src/__tests__/child-identity.test.ts` | A child token can only act as its own child, never a sibling. |
| `src/__tests__/upload.test.ts` | Size ceiling, magic-byte verification, and the base64 image path. |
| `src/__tests__/csrf.test.ts` | The origin allowlist and the cross-site rejection. |
| `src/modules/*/*.test.ts` | Per-module behaviour, including a 404-based ownership test in `children.test.ts`. |

`npx playwright test` in `client/e2e` additionally asserts end-to-end that a brand-new
parent sees none of the demo family's children, and that a wrong password is rejected
instead of logging the visitor in.

## Known gaps

These are **not** implemented. They are listed so nobody mistakes this document for a
claim that they are.

- ⚠️ **Email is a console mock.** `services/email.ts` only logs. `SMTP_URL` is read from
  the environment but is not used to send anything — verification, reset and trial
  emails never reach a real inbox. A real transport is required before launch.
- ⚠️ **Access-token TTL is `7d` by default** in `config/env.ts`, not the `15m` that
  `.env.example` suggests. Set `JWT_ACCESS_TTL=15m` in the deployment environment.
  (A short access-token life is mitigated by the rotating refresh token, but it is the
  window in which a stolen token is usable.)
- ⚠️ **Rate limiting is per instance**, held in memory. It does not coordinate across
  replicas or Workers isolates.
- ⚠️ **No reported-question queue.** `POST /questions/:id/report` sets a `reported` flag
  on the question row; there is no review queue, no admin view and no notification.
- ⚠️ **The 7-day purge does not delete uploaded files.** `runCleanup` deletes the account
  rows; the stored objects are only removed when a note is deleted individually
  (`notes.service.ts`). A deleted account can leave orphaned files in the bucket.
- ⚠️ **AI output is validated, not filtered.** The quiz schema checks structure, not
  whether the generated content is appropriate.
- ⚠️ **The admin API has no impersonation flow.** An admin cannot read a tenant's data
  through the API at all — deliberately. Support access would need a separate, audited
  mechanism.
