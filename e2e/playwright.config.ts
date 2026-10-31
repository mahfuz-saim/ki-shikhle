import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  webServer: [
    { command: 'npm run dev --workspace=server', port: 5000, reuseExistingServer: !process.env.CI },
    { command: 'npm run dev --workspace=client', port: 3000, reuseExistingServer: !process.env.CI },
  ],
  use: { baseURL: 'http://localhost:3000' },
});
