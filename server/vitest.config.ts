import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Check the database is reachable before any test runs. Without this, an
    // unreachable database makes the API fall back to the in-memory store, and
    // the isolation suites fail with 401s that look like auth bugs — after
    // waiting out every Prisma connect timeout.
    globalSetup: ['src/test-utils/global-setup.ts'],
    // The regression suites create real rows in the local Postgres database. Vitest runs
    // test files in parallel by default, and two files touching the same tables can
    // delete each other's fixtures mid-run — which produced flaky, order-dependent
    // failures. `fileParallelism: false` runs the files one at a time.
    fileParallelism: false,
    // A generous timeout: the suites hash passwords (argon2id) and talk to Postgres.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
