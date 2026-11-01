/**
 * Cloudflare Workers entry point.
 *
 *   fetch     → the Hono app (Express-style routers run through the compat layer)
 *   scheduled → Cloudflare Cron Triggers run the trial/expiry/purge jobs directly
 *
 * Config lives in `wrangler.toml`: Hyperdrive (Postgres) + R2 (uploads) bindings,
 * `[vars]` for non-secret env, and `wrangler secret put` for the rest.
 */
import app from './app';
import { runAllJobs } from './jobs/jobs';

export default {
  fetch: app.fetch,
  async scheduled(_event: unknown, _env: unknown, ctx?: { waitUntil(p: Promise<unknown>): void }) {
    const work = runAllJobs();
    if (ctx?.waitUntil) ctx.waitUntil(work);
    else await work;
  },
};
