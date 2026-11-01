import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env, clientOrigins } from './config/env';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimit';

const app = express();

// Behind Cloudflare/Vercel the real client IP and protocol come from proxy headers.
if (env.TRUST_PROXY) app.set('trust proxy', true);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    // Comma-separated CLIENT_ORIGIN: allow the Vercel production URL plus preview URLs.
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // curl/health checks
      if (clientOrigins.includes(origin) || clientOrigins.includes('*')) return cb(null, true);
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin) && env.NODE_ENV !== 'production') return cb(null, true);
      if (/\.vercel\.app$/.test(origin) && env.NODE_ENV !== 'production') return cb(null, true);
      return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(pinoHttp({ logger }));
app.use(generalLimiter);

app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0', env: env.NODE_ENV }, error: null });
});

// Mounted before the module routers: several of them call router.use(auth()), which
// would otherwise swallow this endpoint (it authenticates with x-cron-secret instead).
app.use('/api/v1', jobsRouter); // POST /api/v1/jobs/run — platform cron trigger

import authRouter from './modules/auth/auth.routes';
import childrenRouter from './modules/children/children.routes';
import subjectsRouter from './modules/subjects/subjects.routes';
import entriesRouter from './modules/entries/entries.routes';
import routinesRouter from './modules/routines/routines.routes';
import notesRouter from './modules/notes/notes.routes';
import quizzesRouter from './modules/quizzes/quizzes.routes';
import resultsRouter from './modules/results/results.routes';
import dashboardRouter from './modules/dashboard/dashboard.routes';
import billingRouter from './modules/billing/billing.routes';
import notificationsRouter from './modules/notifications/notifications.routes';
import adminRouter from './modules/admin/admin.routes';
import filesRouter from './modules/files/files.routes';
import jobsRouter from './modules/jobs/jobs.routes';

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/children', childrenRouter);
app.use('/api/v1/subjects', subjectsRouter);
app.use('/api/v1', entriesRouter);
app.use('/api/v1', routinesRouter);
app.use('/api/v1', notesRouter);
app.use('/api/v1', quizzesRouter);
app.use('/api/v1', resultsRouter);
app.use('/api/v1', dashboardRouter);
app.use('/api/v1/billing', billingRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1', filesRouter); // authenticated note files (local disk or R2 presigned redirect)

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
