import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './',
  timeout: 60_000,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    headless: false,
    viewport: { width: 2560, height: 1440 },
    baseURL: 'http://127.0.0.1:5173'
  },
  webServer: {
    command: 'pnpm vite --config vite.config.web.ts --host 0.0.0.0 --port 5173 --strictPort',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe'
  }
});
