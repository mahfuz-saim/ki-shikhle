import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimit';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(pinoHttp({ logger }));
app.use(generalLimiter);

app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0', env: env.NODE_ENV }, error: null });
});

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

app.use('/uploads', express.static('uploads'));

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
