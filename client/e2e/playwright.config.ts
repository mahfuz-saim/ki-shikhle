import { defineConfig } from '@playwright/test';

// Config lives in client/e2e: repo root is `../..`, client is `..`
export default defineConfig({
  testDir: './tests',
  webServer: [
    {
      command: 'npm run dev --workspace=server',
      cwd: '../..',
      url: 'http://localhost:5000/api/v1/health',
      reuseExistingServer: true,
    },
    {
      command: 'npm run dev --workspace=client',
      cwd: '../..',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
    },
  ],
  use: { baseURL: 'http://localhost:3000' },
});
