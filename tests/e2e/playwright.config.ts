import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../..');

export default defineConfig({
  testDir: './',
  timeout: 60_000,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    headless: true,
    viewport: { width: 2560, height: 1440 },
    baseURL: 'http://127.0.0.1:5173',
    video: 'on',
  },
  webServer: {
    command: `npx vite --config ${path.join(rootDir, 'vite.config.web.ts')} --host 0.0.0.0 --port 5173 --strictPort`,
    cwd: rootDir,
    port: 5173,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
