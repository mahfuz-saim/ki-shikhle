# Ki Shikhle? — Product Requirements Document

**Parents see what their children actually learned; children log in under a minute; AI quizzes
from real notes.**

This PRD describes the product **as it is built**. It is not a wish list — every section
corresponds to code in `client/` and `server/`. Where a requirement is only partially met,
it says so under "Current gaps".

- **Status:** implemented and running
- **Last reviewed:** 2026-11-05
- **Audience:** engineering, product, support

---

## 1. Problem

A parent hears "I studied today" and has no way to check it. A child has a notebook full of
scattered notes. Neither side can see what was actually learned, when it was learned, or what
the child is weak at.

Existing tools solve this badly:

- **Photo-note apps** store the image and stop there. Nothing is searchable, nothing is
  quizzable, and the parent still learns nothing.
- **Homework trackers** record the child's self-report. The child marks it done; the parent
  has no independent signal.
- **Learning platforms** are built for the school, not the family — heavy, expensive, and
  require the school to participate.

## 2. Product

A family learning tracker with two doors:

- **The parent portal** — the parent's own account. Adds children, sees a live dashboard of
  what each child studied, generates AI quizzes from the child's real notes, and reads the
  results.
- **The child's portal** — a deliberately small surface. A child signs in with their own
  email (or a PIN their parent set), logs what they studied, and takes quizzes. Under a
  minute to use, because the child is the least motivated person in the loop.

The differentiator is that the **notes are the source of truth**. The child photographs a
class note; the app transcribes and structures it; the AI generates a quiz *from that note*;
the quiz result feeds the dashboard; the dashboard tells the parent what to ask about.

### 2.1 Non-goals

- Not a school LMS. No teacher accounts, no class rosters, no grading of other students.
- Not a homework help tool. It does not solve problems for the child.
- Not a general-purpose study timer. Study time is recorded **against a routine session**,
  not as an open stopwatch.

## 3. Users and roles

| Role | Who | Can do |
|---|---|---|
| **Parent** | The account owner | Everything about their own children. Sees the dashboard, notes, entries, routines, quizzes, billing, settings. |
| **Child** | A child profile, given their own login | Logs study entries, reads their own notes, takes quizzes, sees their own schedule. **Only their own data** — never a sibling's. |
| **Admin** | Platform operator | Platform metrics, AI usage, the user list, trial extensions. **Cannot read tenant content.** |

### 3.1 Account model

One account = one family = one or more children (plan-limited). A child's *login identity* is
a `users` row with `role: 'child'`; the child's *profile* is a `children` row. The two are
linked by email and must not diverge.

The child can reach their own portal two ways:

1. **Direct sign-in** — the child signs in with their own email and password.
2. **PIN entry** — the parent enters child mode from the parent portal, confirming with the
   child's PIN. The server issues a **child-scoped** token; the parent's token is not reused.

Both paths produce a token that resolves to exactly one child.

### 3.2 Tenancy rule

> A request may only ever touch the data of the account that owns it.

This is enforced in one place (`server/src/core/tenancy.ts`) rather than per-module, and
verified by an automated cross-tenant matrix (`server/src/__tests__/isolation.test.ts`).
Cross-tenant access returns **404**, not 403 — a 403 would confirm that the resource exists.

The demo account (`parent@demo.com`) is a **real, isolated tenant**. It is not a shared
fixture and not a fallback: no code path substitutes it for an unknown account.

### 3.3 Plan limits

> A plan grants exactly what its catalogue entry says, and a subscriber never gets less
> than what they were sold.

The four sold plans are `free`, `basic`, `premium` and `pro`. Each grants six limits:
children, AI quizzes per month, AI vision, history depth, AI explanations and
auto-quiz scheduling.

**One catalogue, one answer.** The limits live in `server/src/services/entitlements.ts`
and nowhere else. The `plans.limits_json` column is *derived* from it by the seed, and
the client renders what the server sends. This was not true before: the three sources
were written separately and disagreed — the database sold `standard` five children while
the entitlement code granted two, so a subscriber who paid ৳299 was blocked at two.

**Legacy plans are honoured, not sold.** `trial`, `starter` and `standard` came from an
abandoned pricing model. An existing subscription may still hold one, so each is mapped
onto the cheapest current plan that grants **at least** what it was sold — computed, not
hand-written, so it cannot drift from the catalogue. They are not purchasable: `standard`
at ৳299 grants five children while `premium` at ৳599 grants two, so selling it would
undercut the flagship plan.

## 4. Feature requirements

### 4.1 Authentication

| ID | Requirement | Status |
|---|---|---|
| A1 | Register with name, email, password (min 8). Free plan, no card. | ✅ |
| A2 | Sign in with email + password. | ✅ |
| A3 | Access token + rotating refresh token; refresh reuse revokes the token family. | ✅ |
| A4 | Refresh token in an `httpOnly` cookie; CSRF origin check on state-changing auth routes. | ✅ |
| A5 | Email verification, resend, forgot-password, reset-password, change-password. | ⚠️ Email is a console mock — see gaps. |
| A6 | Role taken from the **database**, not the JWT claim. | ✅ |
| A7 | A signed-out visitor is redirected to sign-in; a child is kept out of the parent portal; a parent is kept out of the admin console. | ✅ (client-side guard; the server enforces independently) |
| A8 | A failed sign-in shows the server's real error and does **not** sign the visitor in. | ✅ |

### 4.2 Children

| ID | Requirement | Status |
|---|---|---|
| C1 | Add a child: name, grade, curriculum, medium, optional email and PIN. | ✅ |
| C2 | A child belongs to the account that created them. | ✅ |
| C3 | Edit, soft-delete, restore. | ✅ |
| C4 | PIN set / change; PIN used for child-mode entry. | ✅ |
| C5 | "No study logged" alert — configurable window and message, with a test send. | ⚠️ The config is in-memory only, so it is lost on restart and is not shared across API instances. See gaps. |
| C6 | Responses never include `passwordHash`, `pinHash` or `password`. | ✅ |

### 4.3 Study logging (learning entries)

| ID | Requirement | Status |
|---|---|---|
| L1 | Log a study session: date, duration, topics, source (school / tuition / self-study / college). | ✅ |
| L2 | Entries are editable and deletable; edits keep a revision trail. | ✅ |
| L3 | Voice logging: record a spoken summary, structure it with AI into a topic/duration/source entry. | ✅ |
| L4 | A parent can mark an entry as verified. | ✅ |
| L5 | Entries belong to exactly one child and are visible to that child's owner and the child. | ✅ |

### 4.4 Notes

| ID | Requirement | Status |
|---|---|---|
| N1 | Upload a note photo/PDF, or paste text. | ✅ |
| N2 | The note is stored privately and served only through an authenticated, ownership-checked route. | ✅ |
| N3 | AI turns a note into a structured study note (concepts, formulas, revision checklist, self-test questions). | ✅ |
| N4 | AI re-formats and improves the note's text. | ⚠️ There is **no OCR**. `POST /notes/:id/ai-ocr` sends the note's *existing text* to the model to be cleaned up — it never reads the image. `tesseract.js` is a client dependency but is not imported anywhere. See gaps. |
| N5 | Notes are scoped to one child. | ✅ |
| N6 | Uploads are size-limited and magic-byte verified. | ✅ |

### 4.5 Routines and schedule

| ID | Requirement | Status |
|---|---|---|
| R1 | A routine: name, source, weekdays, start time, duration. | ✅ |
| R2 | Exceptions — skip or reschedule one occurrence. | ✅ |
| R3 | `GET /children/:id/schedule?from=&to=` returns the occurrences for a window. | ✅ |
| R4 | Marking a scheduled session as done is stored **on the server**, so the parent's dashboard reflects it. | ✅ |
| R5 | The client's `localStorage` is only an offline cache; the server is the source of truth. | ✅ |

### 4.6 Quizzes

| ID | Requirement | Status |
|---|---|---|
| Q1 | Generate a quiz from a child's real notes, by subject, difficulty, question count and type. | ✅ |
| Q2 | Question types: MCQ, true/false, fill-in-the-blank. | ✅ |
| Q3 | Edit a question, regenerate a single question. | ✅ |
| Q4 | Assign a quiz to a child. | ✅ |
| Q5 | Take a quiz: timer, one attempt, answers saved as you go. | ✅ |
| Q6 | Results show the **real** score, the per-topic breakdown and an AI explanation. | ✅ |
| Q7 | The answer key is never sent to a child actor. | ✅ |
| Q8 | Report a bad question. | ⚠️ Flag only — no review queue. See gaps. |
| Q9 | Automatic scheduled quiz generation. | ✅ |

### 4.7 Dashboard

Seven panels for one child, all from real data: summary KPIs (study days, total time, quizzes
taken, average score, streak), weekly study time split by source, subject distribution, score
trend, subject mastery radar, a daily consistency calendar, and weakest/strongest topics.

| ID | Requirement | Status |
|---|---|---|
| D1 | Every panel is derived from the child's own data. | ✅ |
| D2 | A child with no data shows an empty state, not somebody else's numbers. | ✅ |
| D3 | The demo dataset renders only for the three seeded demo children. | ✅ |
| D4 | A failed request is reported as a failure, not replaced with fabricated numbers. | ✅ |

### 4.8 Subjects, notifications, billing

| ID | Requirement | Status |
|---|---|---|
| S1 | Curated NCTB subjects, plus custom subjects owned by the parent. | ✅ |
| S2 | Notifications: trial reminders, unread badge, mark-read. | ✅ |
| S3 | Plans list is public; subscription, checkout, cancel and invoices are account-scoped. | ✅ |
| S4 | Plan limits are enforced: children per account, AI quizzes per month, auto-quiz scheduling, history depth, AI vision, AI explanations. | ✅ All six declared limits are enforced from one catalogue (`server/src/services/entitlements.ts`). |

### 4.9 Admin

| ID | Requirement | Status |
|---|---|---|
| M1 | Platform metrics, AI usage with cost estimates, the user list. | ✅ |
| M2 | Admin-only. A parent token gets 403. | ✅ |
| M3 | The user list never includes credential hashes. | ✅ |
| M4 | Extend a trial. | ✅ (the client reports the real result) |

## 5. Data model

`User` · `RefreshToken` · `AuthToken` · `Child` · `Subject` · `LearningEntry` ·
`EntryRevision` · `Routine` · `RoutineCompletion` · `RoutineException` · `Note` ·
`TopicDigest` · `Quiz` · `QuizQuestion` · `QuizAttempt` · `QuizAnswer` · `AttemptExplanation` ·
`Plan` · `Subscription` · `Payment` · `AiUsageLog` · `Notification` · `AuditLog`

Every tenant-scoped table hangs off `Child`, which hangs off `User`. That is the ownership
graph the tenancy helper walks.

## 6. API

All responses use one envelope: `{ success, data, error }`.

```
POST   /auth/register | login | refresh | logout | verify-email | resend-verification
       | forgot-password | reset-password | change-password
GET    /auth/me                     DELETE /auth/account
POST   /auth/account/restore        GET  /auth/export
GET    /children                    POST /children
GET    /children/:id                PATCH|DELETE /children/:id
POST   /children/:id/pin | enter    POST /children/exit
GET    /children/:id/unlogged-alert PUT  /children/:id/unlogged-alert
POST   /children/:id/unlogged-alert/test
GET    /subjects                    POST /subjects
PATCH|DELETE /subjects/:id
GET|POST /children/:id/entries      PATCH|DELETE /entries/:id
POST   /entries/:id/verify          POST /entries/:id/voice-structure
GET|POST /children/:id/notes        PATCH|DELETE /notes/:id
POST   /notes/:id/ai-ocr            POST /children/:id/notes/ai-make
GET|POST /children/:id/routines     PATCH|DELETE /routines/:id
POST   /routines/:id/exceptions     DELETE /exceptions/:id
GET    /children/:id/schedule
GET|POST /children/:id/routines/completions
POST   /children/:id/quizzes/generate
GET    /children/:id/quizzes        GET|PATCH /quizzes/:id
PATCH  /quizzes/:id/questions/:qid  POST /quizzes/:id/questions/:qid/regenerate
POST   /quizzes/:id/assign          POST /quizzes/:id/attempts
PUT    /attempts/:id/answers        POST /attempts/:id/submit
GET    /attempts/:id                POST /attempts/:id/explanation
POST   /questions/:id/report
GET    /children/:id/dashboard/{summary|study-time|subjects|scores|topics|mastery|consistency}
GET    /dashboard/overview
GET    /billing/plans (public)     GET /billing/subscription
POST   /billing/demo-checkout | cancel   GET /billing/invoices
GET    /notifications               POST /notifications/:id/read | read-all
GET    /admin/metrics | ai-usage | users    POST /admin/users/:id/extend-trial
GET    /files/:key
POST   /jobs/run  (x-cron-secret)
```

## 7. Non-functional requirements

| Area | Requirement |
|---|---|
| Platform | The API runs unchanged on Node and on Cloudflare Workers (Hono + an Express-compat layer). No native modules, no filesystem dependency. |
| Deploy | `client/` and `server/` are independently deployable — each owns its own config, env, lint and build. |
| Performance | p95 < 300 ms for non-AI endpoints. AI calls are the slow path and report their status. |
| Storage | Local disk by default; S3/R2/B2/MinIO via one interface. Files are always private. |
| Offline | The app degrades to an in-memory store when the database is unreachable — **without** weakening isolation. |
| AI | No API key → deterministic mock. A mocked response is flagged as such and never recorded as a successful AI call. |
| i18n | English and Bangla throughout. |
| Accessibility | Every form control has an associated label; the app is keyboard-navigable. |

## 8. Success criteria

1. A parent can go from "I have no idea what my child studied" to a specific, defensible
   answer in under a minute.
2. A child can log a session or take a quiz in under a minute.
3. Every quiz question traces back to a note the child actually has.
4. **No account can see another account's data.** Enforced in one place and verified by an
   automated matrix, in both database and degraded modes.
5. The app never displays a number it did not get from the server.

## 9. Current gaps

Honest list of what the implementation does not yet do.

| Gap | Impact | Where |
|---|---|---|
| **Email is a console mock.** `SMTP_URL` is read but never used to send. | Verification, password reset and trial emails never arrive. Users cannot self-recover a password. | `server/src/services/email.ts` |
| **There is no OCR.** `POST /notes/:id/ai-ocr` re-formats the note's existing text; it never reads the uploaded image. `tesseract.js` is installed in `client/package.json` but not imported anywhere, and the endpoint is still named `ai-ocr`. | Handwritten notes are never transcribed, so a photo-only note has no searchable text and cannot seed a quiz. | `server/src/modules/notes/notes.service.ts:aiOcrFallback` |
| **No reported-question review queue.** The flag is set and nothing reads it. | Bad questions stay in the pool. | `server/src/modules/quizzes` |
| **The purge job does not delete uploaded files.** | Orphaned objects accumulate in the bucket. | `server/src/jobs/jobs.ts` |
| **Billing is simulated.** `POST /billing/demo-checkout` activates a plan without taking money. | No revenue path yet. | `server/src/modules/billing` |
| **Most copy is inline `isBn ? '…' : '…'` ternaries** rather than message-dictionary entries. | ~1300 strings bypass the i18n dictionaries; translations are hard to audit. | `client/src/app/**` |
| **The "no study logged" alert config is in-memory.** `memUnloggedAlertConfigs` is a module-level map. | The parent's configured alert window is lost on every restart and is not shared across instances. | `server/src/modules/children/children.service.ts:385` |
| ~~**Two plan limits are declared but never enforced**~~ — **Closed.** `historyMonths`, `aiVisionOCR` and `aiExplanation` are now enforced (`entries.service.ts`, `notes.service.ts`, `results.service.ts`). The three sources of plan limits — the code catalogue, the `plans.limits_json` column and the client's billing page — were also reconciled; they disagreed, and a `standard` subscriber was sold five children but blocked at two. | — | `server/src/services/entitlements.ts` |
| **The uploaded-image path and the note-text path diverge.** A note uploaded as an image gets a file URL, but `ai-ocr` only ever sees `textClean`, which is empty for an image-only note. | The "improve this note" button silently does nothing for a photo-only note. | `server/src/modules/notes/notes.service.ts` |
| **Single-currency BDT pricing** in the plan data, though `Plan` carries a USD price too. | International pricing is not wired up. | `server/prisma/seed.ts` |

## 10. Related documents

- `docs/decisions.md` — architecture decisions and their rationale
- `docs/security.md` — the implemented security posture, and what is *not* implemented
- `docs/deployment.md` — platform-specific deployment
- `docs/load-test.md` — load-test methodology and results
