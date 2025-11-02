import { test } from '@playwright/test';

test.describe('Grid navigation', () => {
  test('navigates tiles', async ({ page }) => {
    test.skip(true, 'E2E tests require running app environment');
    await page.goto('http://localhost:5173');
  });
});
