# Ki Shikhle?
**The AI Learning Tracker for Families**

**Make daily learning visible. Turn classroom notes into meaningful revision.**

An AI-assisted platform connecting students’ class routines, notebook photos, revision quizzes, and parents’ understanding of learning progress.

[Web App](https://ki-shikhle.vercel.app) · [Getting Started](#getting-started) · [How It Works](#how-it-works) · [Documentation](#documentation)

---

## Why Ki Shikhle?

**“What did you learn today?”**

Parents ask this question every day, but attendance, study hours, and occasional exam marks do not tell the whole story. Students need help revisiting what they learned, while parents need a practical way to understand where encouragement or support is needed.

**Ki Shikhle? (কি শিখলে?)** means “What did you learn?” It brings daily learning records and revision into one connected workflow, designed with Bangladeshi families, handwritten notebooks, school and tuition routines, and NCTB-focused learning in mind.

> Our goal is not to replace teachers. It is to make recorded learning easier to revisit and progress easier for families to discuss.

## How It Works

```text
Record a class → Upload notebook photos → Review AI study notes
                                                ↓
Review progress ← Submit answers ← Take a lesson-based quiz
```

1. **Record the lesson.** Students log topics, homework, and confidence against their class routine.
2. **Capture the notes.** Upload a notebook or board photo, then review and edit the generated study note.
3. **Connect revision to learning.** Parents generate quizzes from class logs and notes.
4. **Practise and submit.** Students take assigned quizzes through their own portal.
5. **Review the result.** Parents see submitted scores, study consistency, and topics that may need another look.

## Features

### For Students

- **Routine-based class logging** for school, tuition, and self-study.
- **Image-assisted AI notes** with editable previews and mathematical formatting.
- **Connected notebook library:** notes uploaded with a class stay linked to that lesson.
- **Assigned quizzes** with timers, answer submission, and collapsible past-quiz history.
- **Learning dashboard** with revision topics, stronger areas, and a monthly study-consistency calendar.
- **Voice input** for class topics where browser speech recognition is supported.

### For Parents

- **Separate parent portal** with navbar-based student selection.
- **Class-level visibility** into recorded topics, homework, notes, and confidence.
- **AI quiz generation** from the student’s recorded learning.
- **Yesterday-based revision:** auto-quiz defaults to 20 MCQs from yesterday’s class topics and notes, using the Asia/Dhaka calendar date.
- **Topic coverage allocation:** every logged topic receives a question allocation. The total increases when necessary to include all topics, up to 100 questions.
- **Submitted results** showing the actual score and total rather than an assumed denominator.
- **Progress visualizations** for study consistency, quiz performance, and subject-level insights.
- **Configurable unlogged-study alerts.**

### Built for Bangla and English Learning

The interface supports Bangla and English. Quiz language follows the student’s medium and subject—not the language selected for the interface.

For **Bangla-version students**:

- English-subject questions are generated in **English**.
- Other subjects are generated in **Bangla**.
- Mixed-subject quizzes apply this rule **question by question**.

## Where AI Fits

AI is used to reduce the work between capturing a lesson and revising it:

| Workflow | AI’s role | Application safeguards |
| --- | --- | --- |
| Notebook photo → study note | Interpret the image and organize study material | Editable preview before saving |
| Class logs and notes → quiz | Generate questions using the supplied learning context | Subject and language instructions, output validation |
| Yesterday’s learning → MCQ revision | Generate questions against an explicit topic allocation | Batched generation, four distinct options, valid answer index, coverage checks |
| Quiz submission → score | **No LLM grading** | Application code compares answers with the stored answer key |

**AI-generated educational content can be wrong.** Structural validation and coverage checks do not prove factual accuracy. Parents and educators should review questions and explanations when using them for consequential assessment.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js 14, React 18, TypeScript |
| Styling and interface | Tailwind CSS, Lucide icons, light/dark themes |
| Charts and mathematical content | Recharts, KaTeX |
| API | Hono with an Express-compatible routing layer; Node.js support |
| Database | PostgreSQL, Prisma |
| AI | Anthropic Claude API |
| Authentication | JWT access/refresh flows, Argon2id password hashing |
| Validation | Zod |
| File storage | Local development storage or S3-compatible storage, including Cloudflare R2 |
| Deployment | Vercel or Cloudflare Pages for the frontend; Cloudflare Workers or a Node.js host for the API |
| Development tools | Docker Compose, Vitest, Playwright |

## Project Structure

The frontend and backend are independently deployable applications. **Run package commands inside `client/` or `server/`; there is no root package installation.**

```text
ki-shikhle/
├── client/
│   ├── src/app/             # Parent and student pages
│   ├── src/components/      # Shared UI, layouts, charts, and learning components
│   ├── src/lib/             # API client and frontend utilities
│   ├── src/messages/        # Bangla and English translations
│   ├── public/              # Branding and static assets
│   └── .env.example
├── server/
│   ├── src/modules/         # API feature modules
│   ├── src/services/        # AI, storage, authentication support, and integrations
│   ├── src/jobs/            # Background jobs and scheduling
│   ├── src/worker.ts        # Cloudflare Worker entry point
│   ├── prisma/              # Database schema, migrations, and seed data
│   ├── scripts/             # Local setup and demo seeding
│   ├── docker-compose.yml
│   ├── wrangler.toml
│   └── .env.example
└── docs/                    # Product, deployment, security, and architecture notes
```

## Getting Started

### Prerequisites

- **Node.js 22** recommended, matching the deployment workflow.
- npm.
- PostgreSQL, or Docker Compose for the included local database.
- An Anthropic API key for genuine AI note and quiz generation.

### 1. Clone the Repository

```bash
git clone https://github.com/mahfuz-saim/ki-shikhle.git
cd ki-shikhle
```

### 2. Set Up the API

```bash
cd server
npm ci
npm run setup
docker compose up -d
```

`npm run setup` creates `server/.env` with fresh random JWT secrets and a password pepper. It does not overwrite an existing `.env`.

**Check `DATABASE_URL` before continuing.** The included Docker Compose configuration creates a database named `kishikhle`; some environment-template defaults use `learntrack`. For the included local Docker database, use:

```dotenv
DATABASE_URL=postgresql://kishikhle:kishikhle_dev_password@localhost:5432/kishikhle
```

These credentials are for **local development only**. Configure your own credentials for any hosted environment.

In `server/.env`, also set:

```dotenv
ANTHROPIC_API_KEY=your_anthropic_api_key
CLIENT_ORIGIN=http://localhost:3000
```

Choose AI model IDs available to your Anthropic account through `AI_MODEL_FAST` and `AI_MODEL_SMART`.

Then initialize the database and start the API:

```bash
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

API health endpoint: **http://localhost:5000/api/v1/health**

For local schema development, use `npm run db:migrate` to create new migrations. Review and commit migration files when changing the schema.

### 3. Start the Frontend

Open another terminal from the repository root:

```bash
cd client
npm ci
cp .env.example .env.local
npm run dev
```

Check `client/.env.local`:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Open **http://localhost:3000**.

### Optional: Seed Demo Data

From `server/`:

```bash
npm run demo:seed
```

Use demo seeding for an isolated development or demonstration environment. Do not rely on seeded accounts or example credentials for production.

## Environment and Secrets

| Variable | Location | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Server | PostgreSQL connection |
| `JWT_ACCESS_SECRET` | Server secret | Access-token signing |
| `JWT_REFRESH_SECRET` | Server secret | Refresh-token signing |
| `PASSWORD_PEPPER` | Server secret | Additional secret used during password hashing and verification |
| `ANTHROPIC_API_KEY` | Server secret | Genuine AI requests |
| `CLIENT_ORIGIN` | Server | Allowed browser origins; supports a comma-separated list |
| `STORAGE_DRIVER` | Server | `local`, `s3`, or `r2` |
| `R2_BUCKET`, `R2_ENDPOINT`, `R2_REGION` | Server | S3-compatible storage configuration |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Server secrets | Storage credentials |
| `SMTP_URL` | Server secret | Email delivery |
| `CRON_SECRET` | Server secret | Protection for the HTTP job trigger when configured |
| `NEXT_PUBLIC_API_BASE_URL` | Client | Browser-accessible API URL, including `/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | Client | Public frontend URL |

See each application’s `.env.example` for the complete configuration.

> **Never commit `.env` files, API keys, signing secrets, storage credentials, or your password pepper.** Keep the production pepper stable across deployments: changing it prevents existing password hashes from verifying unless you implement a migration or password-reset process. Variables prefixed with `NEXT_PUBLIC_` are public browser configuration, not secret storage.

## Deployment

### Frontend: Vercel

- Set the project root directory to **`client`**.
- Use the Next.js framework preset and `npm run build`.
- Configure `NEXT_PUBLIC_API_BASE_URL` with the deployed API URL.
- Configure `NEXT_PUBLIC_SITE_URL` with the frontend URL.
- Redeploy after changing public environment values; they are embedded at build time.
- Add the frontend origin to the API’s `CLIENT_ORIGIN` configuration.

### API: Cloudflare Workers

The repository includes a Worker entry point, Hyperdrive configuration, and Wrangler settings.

Before deploying:

1. Configure your own Hyperdrive resource in `server/wrangler.toml`.
2. Configure the database connection and required application secrets.
3. Set up R2/S3-compatible storage credentials for image uploads; Workers cannot use local disk storage.
4. Apply database migrations against the intended production database.

Add secrets from an authenticated local checkout:

```bash
cd server
npx wrangler secret put JWT_ACCESS_SECRET
npx wrangler secret put JWT_REFRESH_SECRET
npx wrangler secret put PASSWORD_PEPPER
npx wrangler secret put DATABASE_URL
npx wrangler secret put ANTHROPIC_API_KEY
```

Add the required storage secrets and any email or job-trigger credentials for your deployment, then:

```bash
npx prisma generate --no-engine
npm run deploy
```

**Cloudflare secret tip:** If using the dashboard, choose **Secret**, not a plain-text variable, for sensitive values. Dashboard-only plain-text variables can be removed when Wrangler deploys the `[vars]` configuration from the repository. GitHub Actions secrets are not automatically copied into Worker runtime secrets.

The included GitHub Actions workflow applies database migrations and deploys the API. Set its required GitHub secrets and provision Worker runtime secrets separately. Never copy another deployment’s resource IDs or credentials without configuring your own resources.

### Alternative: Node.js Hosting

The API can also run on a Node.js host:

```bash
cd server
npm ci
npm run build
npm start
```

See [Deployment Documentation](docs/deployment.md) for additional guidance.

## Development Commands

Run these from the indicated directory:

| Directory | Command | Purpose |
| --- | --- | --- |
| `client/` | `npm run dev` | Start the frontend |
| `client/` | `npm run build` | Build the frontend |
| `client/` | `npm run lint` | Run frontend linting |
| `client/` | `npm run typecheck` | Check frontend TypeScript |
| `server/` | `npm run dev` | Start the Node.js API in development |
| `server/` | `npm run dev:worker` | Run the Worker locally |
| `server/` | `npm run build` | Build the Node.js API |
| `server/` | `npm run typecheck` | Check backend TypeScript |
| `server/` | `npm test` | Run the backend test suite |
| `server/` | `npm run db:studio` | Open Prisma Studio |

## Project Status and Limitations

Ki Shikhle? is an actively developed product. Its core workflow connects class logging, notes, quizzes, submissions, and dashboards, but implementation should not be confused with independently verified learning outcomes.

- Genuine AI features require a configured provider. Mock/degraded development paths are not evidence that a real notebook was read or a real AI quiz was generated; some generation flows deliberately reject mock output.
- Some alert and auto-quiz configuration currently uses in-memory state. Durable settings, per-student execution timing, and stronger scheduling reliability are improvement priorities.
- In-memory fallback data is not durable storage. Use PostgreSQL and suitable object storage for real deployments.
- Topic insights are signals from recorded activity and quiz performance, not a definitive assessment of mastery.
- Verify your configured models, uploads, authentication, language rules, and complete learning workflow in the deployment you intend to demonstrate or use.

## Roadmap

- [ ] Durable quiz and alert scheduling with better execution visibility.
- [ ] Clearer source references between generated questions and learning material.
- [ ] Easier parent/educator review and question-quality reporting.
- [ ] More robust curriculum and subject-language handling.
- [ ] Better accessibility, camera-upload UX, and low-bandwidth experiences.
- [ ] Evaluation with students, parents, and educators using real learning material.

## Documentation

- [Product Requirements](docs/prd.md)
- [Deployment Guide](docs/deployment.md)
- [Security Notes](docs/security.md)
- [Architecture Decisions](docs/decisions.md)
- [Load Testing Notes](docs/load-test.md)

## Feedback and Contributions

Found a bug or have a suggestion? Open an issue with the relevant portal, steps to reproduce, and expected behavior. Keep private notebook images, student information, passwords, and credentials out of public issues.

For code contributions, keep changes focused, describe the affected workflow, and state which checks you ran. Database changes should include reviewed migrations where required.

---

**Ki Shikhle? — Turn “What did you learn today?” into a useful conversation.**
