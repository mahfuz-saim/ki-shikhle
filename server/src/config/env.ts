import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { randomHex } from '../utils/crypto';
import { z } from 'zod';

// Load `server/.env` whether the process is started from `server/` (deploy, standalone)
// or from the repo root. A missing .env is fine — everything has a local default.
const serverDir = path.resolve(__dirname, '..', '..');
for (const file of [path.resolve(process.cwd(), '.env'), path.join(serverDir, '.env')]) {
  if (fs.existsSync(file)) dotenv.config({ path: file });
}

const isProd = (process.env.NODE_ENV || 'development') === 'production';

/** Required in production, falls back to a clearly-labelled dev value locally. */
function devSecret(name: string, devValue: string) {
  const v = process.env[name];
  if (v && v.length >= 16) return v;
  if (isProd) throw new Error(`${name} is required in production (>= 16 chars)`);
  if (v) console.warn(`⚠️  ${name} is shorter than 16 chars — using the dev secret instead`);
  return devValue;
}

// Stable dev secrets (so a restart doesn't log everyone out); never used in production.
if (!isProd) {
  process.env.JWT_ACCESS_SECRET = devSecret('JWT_ACCESS_SECRET', 'dev_access_secret_kishikhle_local_only_0001');
  process.env.JWT_REFRESH_SECRET = devSecret('JWT_REFRESH_SECRET', 'dev_refresh_secret_kishikhle_local_only_0001');
  if (!process.env.PASSWORD_PEPPER) process.env.PASSWORD_PEPPER = 'dev_pepper_local_only';
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://kishikhle:kishikhle_dev_password@localhost:5432/learntrack';
  }
} else {
  devSecret('JWT_ACCESS_SECRET', '');
  devSecret('JWT_REFRESH_SECRET', '');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required in production');
}

if (isProd && process.env.JWT_ACCESS_SECRET?.includes('dev_access_secret')) {
  throw new Error('JWT_ACCESS_SECRET still has the local dev value — set a real secret');
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1),
  // Comma-separated list: Vercel production URL + preview URLs, e.g.
  // https://kishikhle.com,https://ki-shikhle-git-main.vercel.app
  CLIENT_ORIGIN: z.string().default('http://localhost:3000'),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  REFRESH_TTL_DAYS: z.coerce.number().default(30),
  PASSWORD_PEPPER: z.string().optional(),

  // Optional integrations — the app runs without any of them (see README)
  ANTHROPIC_API_KEY: z.string().optional(), // absent → deterministic mock AI
  AI_MODEL_FAST: z.string().default('claude-3-5-haiku-latest'),
  AI_MODEL_SMART: z.string().default('claude-sonnet-4-20250514'),
  AI_MONTHLY_BUDGET_USD: z.coerce.number().optional(),
  SMTP_URL: z.string().optional(), // absent → emails logged to console

  // Storage: local disk (default) or S3-compatible (Cloudflare R2, S3, B2, MinIO…)
  STORAGE_DRIVER: z.enum(['local', 's3', 'r2']).default('local'),
  LOCAL_STORAGE_DIR: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),
  R2_REGION: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
  R2_FORCE_PATH_STYLE: z.string().optional(),

  // Scheduled jobs: in-process node-cron (default) and/or HTTP trigger from the platform
  ENABLE_CRON: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  CRON_SECRET: z.string().optional(), // when set, POST /api/v1/jobs/run requires it

  TRUST_PROXY: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  COOKIE_DOMAIN: z.string().optional(),

  TRIAL_DAYS: z.coerce.number().default(15),
});

export type Env = z.infer<typeof envSchema>;

let parsed: Env;
try {
  parsed = envSchema.parse(process.env);
} catch (e) {
  console.warn('⚠️  Env validation warning:', (e as Error).message);
  parsed = {
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    PORT: Number(process.env.PORT) || 5000,
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://kishikhle:kishikhle_dev_password@localhost:5432/learntrack',
    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev_access_secret_kishikhle_local_only_0001',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_kishikhle_local_only_0001',
    JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL || '15m',
    REFRESH_TTL_DAYS: Number(process.env.REFRESH_TTL_DAYS) || 30,
    PASSWORD_PEPPER: process.env.PASSWORD_PEPPER,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    AI_MODEL_FAST: process.env.AI_MODEL_FAST || 'claude-3-5-haiku-latest',
    AI_MODEL_SMART: process.env.AI_MODEL_SMART || 'claude-sonnet-4-20250514',
    AI_MONTHLY_BUDGET_USD: Number(process.env.AI_MONTHLY_BUDGET_USD) || 50,
    SMTP_URL: process.env.SMTP_URL,
    STORAGE_DRIVER: (process.env.STORAGE_DRIVER as any) || 'local',
    LOCAL_STORAGE_DIR: process.env.LOCAL_STORAGE_DIR,
    R2_BUCKET: process.env.R2_BUCKET,
    R2_ENDPOINT: process.env.R2_ENDPOINT,
    R2_REGION: process.env.R2_REGION,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
    R2_FORCE_PATH_STYLE: process.env.R2_FORCE_PATH_STYLE,
    ENABLE_CRON: process.env.ENABLE_CRON !== 'false',
    CRON_SECRET: process.env.CRON_SECRET,
    TRUST_PROXY: process.env.TRUST_PROXY !== 'false',
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
    TRIAL_DAYS: Number(process.env.TRIAL_DAYS) || 15,
  };
}

/** Allowed browser origins for CORS (comma-separated CLIENT_ORIGIN). */
export const clientOrigins = parsed.CLIENT_ORIGIN.split(',')
  .map((o) => o.trim())
  .filter(Boolean);

/** Cross-site cookies are required once the API (Cloudflare) and web (Vercel) differ. */
export const cookieOptions = {
  httpOnly: true,
  secure: parsed.NODE_ENV === 'production',
  sameSite: (parsed.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  domain: parsed.COOKIE_DOMAIN,
  path: '/',
};

/** Random secret helper (used by scripts/tests). */
export const randomSecret = () => randomHex(32);

export const env = parsed;
