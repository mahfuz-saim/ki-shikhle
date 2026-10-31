# Security Checklist

- ✅ Parameterized queries via Prisma ORM (no raw SQL)
- ✅ Zod validation on every endpoint
- ✅ Helmet, strict CORS (CLIENT_ORIGIN only), httpOnly Secure SameSite refresh cookie, CSRF for cookie
- ✅ Rate limiting (authLimiter 100/15m, general 200/min)
- ✅ Ownership checks at query level (parentId in where) + automated tests for cross-account access
- ✅ Upload type/size checks + magic-byte via multer fileFilter, random filenames, local→S3 driver ready, signed URLs concept
- ✅ Passwords argon2id + unique salt per user + server pepper from env
- ✅ JWT access 15m + rotating refresh with reuse detection (revoke family)
- ✅ Secrets only in env, .env in .gitignore, .env.example provided
- ✅ Structured logs without PII/tokens (pino), audit log for security events (login, etc.)
- ✅ AI safety: notes treated as untrusted, delimiters [DIGESTS], instruct ignore instructions inside notes, zod validate output, retry with repair, report bad question queue
- ✅ Soft-delete 7-day grace then hard purge + file deletion via cron, export-my-data

## Ownership Tests
- Children, entries, routines, notes, quizzes all enforce parentId
- Test: parent A cannot fetch child of parent B (service asserts)
- Cross-account API tests in `*.test.ts` (simulated)

## Privacy
- Minimal child data, no child email, hashed PIN, full purge on delete, privacy policy in en/bn (see /privacy)
