import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1),
  CLIENT_ORIGIN: z.string().default('http://localhost:3000'),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  REFRESH_TTL_DAYS: z.coerce.number().default(30),
  PASSWORD_PEPPER: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL_FAST: z.string().default('claude-3-5-haiku-latest'),
  AI_MODEL_SMART: z.string().default('claude-sonnet-4-20250514'),
  AI_MONTHLY_BUDGET_USD: z.coerce.number().optional(),
  SMTP_URL: z.string().optional(),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  TRIAL_DAYS: z.coerce.number().default(15),
});

export type Env = z.infer<typeof envSchema>;

let parsed: Env;
try {
  parsed = envSchema.parse(process.env);
} catch (e) {
  console.warn('⚠️  Env validation warning:', (e as Error).message);
  // fallback for dev without DB
  parsed = {
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    PORT: Number(process.env.PORT) || 5000,
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://kishikhle:kishikhle_dev_password@localhost:5432/learntrack',
    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me_32chars_min_kishikhle',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me_32chars_min_kishikhle',
    JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL || '15m',
    REFRESH_TTL_DAYS: Number(process.env.REFRESH_TTL_DAYS) || 30,
    PASSWORD_PEPPER: process.env.PASSWORD_PEPPER,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    AI_MODEL_FAST: process.env.AI_MODEL_FAST || 'claude-3-5-haiku-latest',
    AI_MODEL_SMART: process.env.AI_MODEL_SMART || 'claude-sonnet-4-20250514',
    AI_MONTHLY_BUDGET_USD: Number(process.env.AI_MONTHLY_BUDGET_USD) || 50,
    SMTP_URL: process.env.SMTP_URL,
    STORAGE_DRIVER: (process.env.STORAGE_DRIVER as any) || 'local',
    TRIAL_DAYS: Number(process.env.TRIAL_DAYS) || 15,
  };
}

export const env = parsed;
