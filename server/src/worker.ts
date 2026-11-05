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
import { withRequestPrisma } from './db/client';

type Ctx = { waitUntil(p: Promise<unknown>): void; passThroughOnException?(): void };

export default {
  // Each request gets its own Prisma client: Workers forbid sharing DB sockets across requests.
  fetch(request: Request, env: unknown, ctx: Ctx) {
    return withRequestPrisma(() => Promise.resolve(app.fetch(request, env as any, ctx as any)), ctx);
  },
  async scheduled(_event: unknown, _env: unknown, ctx?: Ctx) {
    const work = withRequestPrisma(() => runAllJobs(), ctx);
    if (ctx?.waitUntil) ctx.waitUntil(work);
    else await work;
  },
};
