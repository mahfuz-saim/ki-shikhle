/**
 * Prisma client.
 *
 * If the client has not been generated (e.g. `npm install --ignore-scripts`, or an
 * offline install), we fall back to a proxy that rejects every call instead of
 * crashing at import time. That keeps `npm run dev` and `GET /api/v1/health` working
 * with nothing configured: modules catch the failures and use their in-memory
 * fallbacks. Run `npm run db:generate` (and start Postgres) for real persistence.
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

function createClient(): any {
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

declare global {
  // eslint-disable-next-line no-var
  var __prisma: any | undefined;
}

export const prisma: any = global.__prisma || createClient();
if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;

export async function connectDb() {
  try {
    await prisma.$connect();
    console.log('✅ DB connected');
  } catch (e) {
    console.warn('⚠️  DB connection failed (running without DB):', (e as Error).message);
  }
}
