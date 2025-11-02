import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sampleConfig = require('../../config/config.sample.json');

test.describe('TenFoot Launcher UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((config) => {
      window.api = {
        getBootstrap: () => Promise.resolve({ config, autoStartEnabled: true }),
        launchEntry: () => Promise.resolve(),
        setAutoStart: () => Promise.resolve(true),
      } as typeof window.api;
    }, sampleConfig);
  });

  test('navigates profiles and launches tile using DPAD keys', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Who is using TenFoot Launcher?')).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(page.getByText('TenFoot Launcher')).toBeVisible();
    await expect(page.getByText('Family')).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    await page.keyboard.press('Backspace');
    await expect(page.getByText('Who is using TenFoot Launcher?')).toBeVisible();
  });
});
