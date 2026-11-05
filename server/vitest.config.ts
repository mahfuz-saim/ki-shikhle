import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
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
