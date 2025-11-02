import { test } from '@playwright/test';

test.describe('Profile picker', () => {
  test('shows profiles', async ({ page }) => {
    test.skip(true, 'E2E tests require running app environment');
    await page.goto('http://localhost:5173');
  });
});
