/**
 * Node entry point (local dev / Docker / any Node host).
 * On Cloudflare Workers the entry point is `src/worker.ts` instead.
 */
import './config/loadEnv'; // must come first: fills process.env from server/.env
import { serve } from '@hono/node-server';
import app from './app';
import { env, clientOrigins } from './config/env';
import { connectDb } from './db/client';
import { startCrons } from './jobs/cron';

async function main() {
  await connectDb();
  startCrons();
  serve({ fetch: app.fetch, port: env.PORT, hostname: '0.0.0.0' }, () => {
    console.log(`🚀 Server running on http://0.0.0.0:${env.PORT}`);
    console.log(`   Health:  http://localhost:${env.PORT}/api/v1/health`);
    console.log(`   Origins: ${clientOrigins.join(', ')}`);
    console.log(`   Storage: ${env.STORAGE_DRIVER}${env.STORAGE_DRIVER !== 'local' ? ` (bucket ${env.R2_BUCKET})` : ' (local disk)'}`);
    console.log(`   AI:      ${env.ANTHROPIC_API_KEY && !env.ANTHROPIC_API_KEY.includes('test-key') ? 'live Anthropic calls' : 'mock responses (no ANTHROPIC_API_KEY)'}`);
    console.log(`   Cron:    ${env.ENABLE_CRON ? 'in-process node-cron' : 'disabled — use POST /api/v1/jobs/run'}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
