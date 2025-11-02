import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { existsSync } from 'node:fs';

const rendererEntry = path.resolve(__dirname, '../../dist/renderer/index.html');

let built = false;

test.beforeAll(() => {
  if (!built || !existsSync(rendererEntry)) {
    execSync('pnpm build:renderer', { stdio: 'inherit' });
    built = true;
  }
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.launcher = {
      async getConfig() {
        return {
          defaultProfileId: 'family',
          profiles: [
            {
              id: 'family',
              name: 'Family',
              description: 'Great for everyone',
              launchers: [
                { id: 'yt', type: 'youtube', title: 'YouTube', url: 'https://youtube.com' },
                { id: 'emby', type: 'emby', title: 'Emby Theater', executablePath: '/Applications/Emby.app' },
                { id: 'game', type: 'game', title: 'Stardew Valley', executablePath: 'stardew.exe' },
              ],
            },
            {
              id: 'adults',
              name: 'Adults',
              description: 'Movies and shows',
              launchers: [
                { id: 'yt2', type: 'youtube', title: 'YouTube Premium', url: 'https://youtube.com' },
              ],
            },
          ],
        } as const;
      },
      async launch() {
        // no-op for tests
      },
      openProfilePicker() {
        window.dispatchEvent(new CustomEvent('profile-picker:show'));
      },
    };
  });
});

test('renders launcher grid and switches profiles', async ({ page }) => {
  await page.goto(`file://${rendererEntry}`);
  await expect(page.getByText('Media Service Launcher')).toBeVisible();
  await expect(page.getByText('Family • 3 apps ready')).toBeVisible();

  await page.keyboard.press('Home');
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.getByRole('button', { name: 'Adults' }).click();
  await expect(page.getByText('Adults • 1 apps ready')).toBeVisible();
});
