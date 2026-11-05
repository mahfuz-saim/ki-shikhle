import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Prisma client.
 *
 * Two modes:
 *
 *  - **Node (local dev / `npm start`)** — one long-lived PrismaClient using the Rust
 *    engine, as usual.
 *  - **Cloudflare Workers (`DATABASE_ADAPTER=pg`)** — Prisma runs through the
 *    `@prisma/adapter-pg` driver adapter. Workers do not allow a socket opened while
 *    handling one request to be used by another ("Cannot perform I/O on behalf of a
 *    different request"), so a client + `pg` Pool is created **per request** by
 *    `withRequestPrisma()` (called from `worker.ts`) and the exported `prisma` resolves
 *    to that request's client through AsyncLocalStorage.
 *
 * Note: in Prisma 5.x, `PrismaPg` must be given a `pg.Pool` instance. Passing
 * `{ connectionString }` throws a TypeError — which previously was swallowed, leaving
 * production with no working database and every module on its in-memory fallback.
 *
 * If the client has not been generated (e.g. `npm install --ignore-scripts`), we fall
 * back to a proxy that rejects every call instead of crashing at import time, so
 * `npm run dev` and `GET /api/v1/health` still work with nothing configured.
 */
function unavailableProxy(path: string): any {
  const target = function () {} as any;
  return new Proxy(target, {
    get: (_t, prop) => {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined;
      return unavailableProxy(`${path}.${String(prop)}`);
    },
    apply: () => Promise.reject(new Error(`Prisma unavailable — run "npm run db:generate" (${path})`)),
  });
}

const useAdapter = () => process.env.DATABASE_ADAPTER === 'pg';

interface AdapterClient {
  client: any;
  pool: any;
}

function createAdapterClient(connectionString: string | undefined): AdapterClient {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require('@prisma/client');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Pool } = require('pg');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaPg } = require('@prisma/adapter-pg');
  const pool = new Pool({ connectionString, max: 5 });
  return { client: new PrismaClient({ adapter: new PrismaPg(pool) }), pool };
}

function createNodeClient(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require('@prisma/client');
    return new PrismaClient();
  } catch (e) {
    console.warn('⚠️  Prisma client is not generated yet — running without a database.');
    console.warn('   Fix: npm run db:generate && (docker compose up -d) && npm run db:migrate');
    return unavailableProxy('prisma');
  }
}

const requestClient = new AsyncLocalStorage<any>();

declare global {
  // eslint-disable-next-line no-var
  var __prisma: any | undefined;
}

let processClient: any | undefined = global.__prisma;

/** Client used outside a request scope (Node server, scripts, startup). */
function getProcessClient(): any {
  if (!processClient) {
    if (useAdapter()) {
      try {
        processClient = createAdapterClient(process.env.DATABASE_URL).client;
      } catch (e) {
        console.error('❌ Failed to create Prisma driver-adapter client:', (e as Error).message);
        processClient = unavailableProxy('prisma');
      }
    } else {
      processClient = createNodeClient();
    }
    if (process.env.NODE_ENV !== 'production') global.__prisma = processClient;
  }
  return processClient;
}

function current(): any {
  return requestClient.getStore() ?? getProcessClient();
}

/** Resolves to the per-request client on Workers, or the process-wide client on Node. */
export const prisma: any = new Proxy(
  {},
  {
    get(_t, prop) {
      const target = current();
      const value = target[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    },
  }
);

/**
 * Run `fn` with a fresh Prisma client bound to this request (Workers only).
 * The pool is closed after the response via `waitUntil`, when available.
 */
export async function withRequestPrisma<T>(
  fn: () => Promise<T>,
  ctx?: { waitUntil(p: Promise<unknown>): void }
): Promise<T> {
  if (!useAdapter()) return fn();

  let created: AdapterClient;
  try {
    created = createAdapterClient(process.env.DATABASE_URL);
  } catch (e) {
    console.error('❌ Failed to create Prisma driver-adapter client:', (e as Error).message);
    return fn();
  }

  const close = () => created.pool.end().catch(() => {});
  try {
    return await requestClient.run(created.client, fn);
  } finally {
    if (ctx?.waitUntil) ctx.waitUntil(close());
    else await close();
  }
}

export async function connectDb() {
  try {
    await prisma.$connect();
    console.log('✅ DB connected');
  } catch (e) {
    console.warn('⚠️  DB connection failed (running without DB):', (e as Error).message);
  }
}
