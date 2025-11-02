import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    headless: false,
    viewport: { width: 2560, height: 1440 },
    ignoreHTTPSErrors: true,
  },
  reporter: [['list']],
});
