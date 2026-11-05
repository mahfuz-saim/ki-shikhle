import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { env, clientOrigins } from './config/env';
import { logger } from './utils/logger';
import { onError, notFound } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimit';
import { mountRouter, wrap } from './platform/express-compat';

import authRouter from './modules/auth/auth.routes';
import childrenRouter from './modules/children/children.routes';
import subjectsRouter from './modules/subjects/subjects.routes';
import entriesRouter from './modules/entries/entries.routes';
import routinesRouter from './modules/routines/routines.routes';
import notesRouter from './modules/notes/notes.routes';
import quizzesRouter from './modules/quizzes/quizzes.routes';
import resultsRouter from './modules/results/results.routes';
import dashboardRouter from './modules/dashboard/dashboard.routes';
import billingRouter, { publicRouter as billingPublicRouter } from './modules/billing/billing.routes';
import notificationsRouter from './modules/notifications/notifications.routes';
import adminRouter from './modules/admin/admin.routes';
import filesRouter from './modules/files/files.routes';
import jobsRouter from './modules/jobs/jobs.routes';

/**
 * Hono app — runs unchanged on Cloudflare Workers (`app.fetch`) and on Node
 * (`@hono/node-server`). Express-style routers are mounted through the compat layer.
 */
export const app = new Hono();

// Security headers (helmet equivalent)
app.use('*', secureHeaders({ contentSecurityPolicy: undefined } as any));

// CORS: explicit origins from CLIENT_ORIGIN (comma separated), plus all Vercel and localhost origins
app.use(
  '*',
  cors({
    origin: (origin: string) => {
      if (!origin) return '*';
      if (clientOrigins.includes(origin) || clientOrigins.includes('*')) return origin;
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return origin;
      if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin)) return origin;
      if (/^https:\/\/[a-zA-Z0-9._-]+\.pages\.dev$/.test(origin)) return origin;
      return null as any;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-refresh-token', 'X-Requested-With'],
    exposeHeaders: ['Content-Length', 'x-refresh-token'],
    credentials: true,
    maxAge: 86400,
  })
);

app.use('*', async (c, next) => {
  const started = Date.now();
  await next();
  logger.info(
    { method: c.req.method, path: new URL(c.req.url).pathname, status: c.res.status, ms: Date.now() - started },
    'request'
  );
});

app.use('/api/v1/*', wrap(generalLimiter as any));

app.get('/api/v1/health', (c) =>
  c.json({
    success: true,
    data: { status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0', env: env.NODE_ENV },
    error: null,
  })
);

// Mounted first: several routers call router.use(auth()), which would otherwise
// swallow this endpoint (it authenticates with x-cron-secret instead of a JWT).
mountRouter(app, '/api/v1', jobsRouter);

mountRouter(app, '/api/v1/auth', authRouter);
mountRouter(app, '/api/v1/children', childrenRouter);
mountRouter(app, '/api/v1/subjects', subjectsRouter);
mountRouter(app, '/api/v1', entriesRouter);
mountRouter(app, '/api/v1', routinesRouter);
mountRouter(app, '/api/v1', notesRouter);
mountRouter(app, '/api/v1', quizzesRouter);
mountRouter(app, '/api/v1', resultsRouter);
mountRouter(app, '/api/v1', dashboardRouter);
mountRouter(app, '/api/v1/billing', billingPublicRouter);
mountRouter(app, '/api/v1/billing', billingRouter);
mountRouter(app, '/api/v1/notifications', notificationsRouter);
mountRouter(app, '/api/v1/admin', adminRouter);
mountRouter(app, '/api/v1', filesRouter);

app.notFound(notFound);
app.onError(onError);

export default app;
