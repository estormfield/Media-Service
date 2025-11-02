import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sampleConfig = require('../../config/config.sample.json');

const primaryProfile = sampleConfig.profiles[0];
const primaryTile = primaryProfile.tiles[0];

test.describe('TenFoot Launcher UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((config) => {
      const launches: Array<{ profileId: string; entryId: string }> = [];

      // Expose helpers on window for assertions later in the test.
      window.__playwrightLaunches__ = launches;
      window.api = {
        getBootstrap: () => Promise.resolve({ config, autoStartEnabled: true }),
        launchEntry: (payload) => {
          launches.push(payload);
          return Promise.resolve();
        },
        setAutoStart: () => Promise.resolve(true),
      } as typeof window.api;
    }, sampleConfig);
  });

  test('launches the default YouTube experience via DPAD workflow', async ({ page }) => {
    expect(primaryTile.kind).toBe('youtube');

    await page.goto('/');

    await expect(page.getByText('Who is using TenFoot Launcher?')).toBeVisible();
    const profileChoice = page.getByRole('menuitemradio', { name: primaryProfile.displayName });
    await expect(profileChoice).toBeVisible();
    await expect(profileChoice).toHaveClass(/profile-card--focused/);

    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'TenFoot Launcher' })).toBeVisible();
    await expect(page.getByText(primaryProfile.displayName)).toBeVisible();

    const firstTile = page.getByRole('button', { name: primaryTile.title });
    await expect(firstTile).toBeVisible();
    await expect(firstTile).toHaveClass(/launcher-tile--focused/);

    await page.keyboard.press('Enter');

    await expect
      .poll(async () => {
        return page.evaluate(() => window.__playwrightLaunches__?.length ?? 0);
      })
      .toBe(1);

    const launches = await page.evaluate(() => window.__playwrightLaunches__ ?? []);
    expect(launches).toEqual([
      {
        profileId: primaryProfile.id,
        entryId: primaryTile.id,
      },
    ]);

    // Navigate back to ensure the video captures profile screen transition as well.
    await page.keyboard.press('Backspace');
    await expect(page.getByText('Who is using TenFoot Launcher?')).toBeVisible();
  });
});
