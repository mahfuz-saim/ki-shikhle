/**
 * Vitest global setup — runs once before any test file.
 *
 * The regression suites create real rows in the local Postgres database. If the
 * database is unreachable, every Prisma call rejects, and the API silently falls
 * back to the in-memory store. That fallback does not contain the tenants the
 * tests create, so isolation tests fail with a 401 ("unknown account") that looks
 * like an authentication bug but is really a missing database — and each Prisma
 * call waits out its connect timeout, which turned a ten-second suite into a
 * sixty-minute one.
 *
 * Checking once here turns that into an immediate, unambiguous error.
 */
export async function setup(): Promise<void> {
  // Import inside the function so a missing Prisma client does not break the
  // import phase of the setup file itself.
  const { prisma } = await import('../db/client');

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e: any) {
    throw new Error(
      [
        '',
        'The test database is unreachable.',
        '',
        `  ${(e as Error).message}`,
        '',
        'The regression suites write to a real Postgres database, so they need one:',
        '',
        '  1. Start Postgres        — docker compose up -d   (or your local instance)',
        '  2. Apply the schema      — npm run db:migrate',
        '  3. Seed it               — npm run db:seed',
        '  4. Re-run the tests      — npm test',
        '',
        'Without a database the API falls back to the in-memory store, which does',
        'not contain the accounts these tests create — so they cannot pass.',
        '',
      ].join('\n')
    );
  }
}
