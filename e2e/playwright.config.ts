import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'cd ../backend && node dist/src/main.js',
      port: 3001,
      reuseExistingServer: true,
    },
    {
      command: 'cd ../mobile && npx vite --port 5173',
      port: 5173,
      reuseExistingServer: true,
    },
  ],
});
