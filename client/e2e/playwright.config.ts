import { defineConfig } from '@playwright/test';

// Config lives in client/e2e: server is ../../server, client is ..
// There is no root package.json — each app is started from its own folder.
export default defineConfig({
  testDir: './tests',
  webServer: [
    {
      command: 'npm run dev',
      cwd: '../../server',
      url: 'http://localhost:5000/api/v1/health',
      reuseExistingServer: true,
    },
    {
      command: 'npm run dev',
      cwd: '..',
      url: 'http://localhost:3001',
      reuseExistingServer: true,
    },
  ],
  use: { baseURL: 'http://localhost:3001' },
});
