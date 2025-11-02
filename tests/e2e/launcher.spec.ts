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
      const autoStartCalls: boolean[] = [];

      // Expose helpers on window for assertions later in the test.
      window.__playwrightLaunches__ = launches;
      window.__playwrightAutoStartCalls__ = autoStartCalls;
      window.api = {
        getBootstrap: () => Promise.resolve({ config, autoStartEnabled: false }),
        launchEntry: (payload) => {
          launches.push(payload);
          return Promise.resolve();
        },
        setAutoStart: async (nextEnabled: boolean) => {
          autoStartCalls.push(nextEnabled);
          return nextEnabled;
        },
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

  test('toggles auto-start from the header controls', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Who is using TenFoot Launcher?')).toBeVisible();
    await page.keyboard.press('Enter');

    const toggle = page.getByRole('button', { name: /Auto-start on login/i });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveText(/Auto-start on login\s*OFF/i);

    await toggle.click();

    await expect
      .poll(async () => page.evaluate(() => window.__playwrightAutoStartCalls__?.length ?? 0))
      .toBe(1);
    await expect(toggle).toHaveText(/Auto-start on login\s*ON/i);

    await toggle.click();

    await expect
      .poll(async () => page.evaluate(() => window.__playwrightAutoStartCalls__?.length ?? 0))
      .toBe(2);
    await expect(toggle).toHaveText(/Auto-start on login\s*OFF/i);

    const autoStartCalls = await page.evaluate(() => window.__playwrightAutoStartCalls__ ?? []);
    expect(autoStartCalls).toEqual([true, false]);
  });
});
