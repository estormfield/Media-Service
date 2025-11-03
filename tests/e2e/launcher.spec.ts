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
      const savedConfigs: Array<unknown> = [];

      // Expose helpers on window for assertions later in the test.
      window.__playwrightLaunches__ = launches;
      window.__playwrightSavedConfigs__ = savedConfigs;
      window.api = {
        getBootstrap: () => Promise.resolve({ config, autoStartEnabled: true }),
        launchEntry: (payload) => {
          launches.push(payload);
          return Promise.resolve();
        },
        setAutoStart: (_enabled: boolean) => Promise.resolve(true),
        pickFile: () => Promise.resolve(null),
        getDefaultBrowser: () => Promise.resolve(null),
        saveConfig: (cfg) => {
          savedConfigs.push(JSON.parse(JSON.stringify(cfg)));
          return Promise.resolve(cfg);
        },
      } as typeof window.api;
    }, sampleConfig);
  });

  test('launches the default YouTube experience via DPAD workflow', async ({ page }) => {
    expect(primaryTile.kind).toBe('web');

    await page.goto('/');

    await expect(page.getByText('Who is using TenFoot Launcher?')).toBeVisible();
    const profileChoice = page.getByRole('menuitemradio', { name: primaryProfile.displayName });
    await expect(profileChoice).toBeVisible();
    // Wait a bit for focus to be applied
    await page.waitForTimeout(100);
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

  test('deletes a tile in edit mode', async ({ page }) => {
    await page.goto('/');

    // Navigate to tiles view
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'TenFoot Launcher' })).toBeVisible();

    const tileToDelete = primaryProfile.tiles[0];
    const remainingTiles = primaryProfile.tiles.slice(1);

    // Wait for header action to be visible, then enter edit mode
    const editModeButton = page.getByRole('button', { name: 'Edit Mode' });
    await expect(editModeButton).toBeVisible();
    await editModeButton.click();
    await expect(page.getByRole('button', { name: 'Done' })).toBeVisible();

    // Wait for overlay buttons to appear and find Delete button
    const deleteButton = page.getByRole('button', { name: `Delete ${tileToDelete.title}` });
    await expect(deleteButton).toBeVisible();

    // Handle confirmation dialog
    page.once('dialog', (dialog) => {
      expect(dialog.message()).toBe('Are you sure you want to delete this tile?');
      dialog.accept();
    });

    await deleteButton.click();

    // Verify tile is removed from UI (check by title)
    await expect(page.getByRole('button', { name: tileToDelete.title }).first()).not.toBeVisible();

    // Verify config was saved with filtered tiles
    await expect
      .poll(async () => {
        return page.evaluate(() => window.__playwrightSavedConfigs__?.length ?? 0);
      })
      .toBeGreaterThan(0);

    const savedConfigs = await page.evaluate(() => window.__playwrightSavedConfigs__ ?? []);
    const lastSavedConfig = savedConfigs[savedConfigs.length - 1] as typeof sampleConfig;
    const updatedProfile = lastSavedConfig.profiles.find(
      (p: { id: string }) => p.id === primaryProfile.id,
    );
    expect(updatedProfile.tiles).toHaveLength(remainingTiles.length);
    expect(
      updatedProfile.tiles.find((t: { id: string }) => t.id === tileToDelete.id),
    ).toBeUndefined();
  });

  test('edits a tile title in edit mode', async ({ page }) => {
    await page.goto('/');

    // Navigate to tiles view
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'TenFoot Launcher' })).toBeVisible();

    const tileToEdit = primaryProfile.tiles[0];
    const newTitle = 'Updated Tile Title';

    // Wait for header actions to be visible, then enter edit mode
    await expect(page.getByRole('button', { name: '+ Add Tile' })).toBeVisible();
    const editModeButton = page.getByRole('button', { name: 'Edit Mode' });
    await expect(editModeButton).toBeVisible();
    await editModeButton.click();

    // Find and click Edit on the first tile
    const editButton = page.getByRole('button', { name: `Edit ${tileToEdit.title}` });
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Wait for edit modal
    await expect(page.getByRole('heading', { name: 'Edit Tile' })).toBeVisible();

    // Update title field
    const titleInput = page.getByLabel('Title *');
    await expect(titleInput).toHaveValue(tileToEdit.title);
    await titleInput.fill(newTitle);

    // Save changes
    const saveButton = page.getByRole('button', { name: 'Save Changes' });
    await saveButton.click();

    // Verify modal closes
    await expect(page.getByRole('heading', { name: 'Edit Tile' })).not.toBeVisible();

    // Verify updated title is rendered (use first to avoid strict mode violation)
    await expect(page.getByRole('button', { name: newTitle }).first()).toBeVisible();

    // Verify config was saved with updated tile
    await expect
      .poll(async () => {
        return page.evaluate(() => window.__playwrightSavedConfigs__?.length ?? 0);
      })
      .toBeGreaterThan(0);

    const savedConfigs = await page.evaluate(() => window.__playwrightSavedConfigs__ ?? []);
    const lastSavedConfig = savedConfigs[savedConfigs.length - 1] as typeof sampleConfig;
    const updatedProfile = lastSavedConfig.profiles.find(
      (p: { id: string }) => p.id === primaryProfile.id,
    );
    const updatedTile = updatedProfile.tiles.find((t: { id: string }) => t.id === tileToEdit.id);
    expect(updatedTile).toBeDefined();
    expect(updatedTile.title).toBe(newTitle);
  });

  test('adds a web tile with allowed hosts', async ({ page }) => {
    await page.goto('/');

    // Navigate to tiles view
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'TenFoot Launcher' })).toBeVisible();

    // Click Add Tile button
    const addTileButton = page.getByRole('button', { name: '+ Add Tile' });
    await expect(addTileButton).toBeVisible();
    await addTileButton.click();

    // Wait for add modal
    await expect(page.getByRole('heading', { name: 'Add New Tile' })).toBeVisible();

    // Fill in web tile form
    const titleInput = page.getByLabel('Title *');
    await titleInput.fill('Test Web Tile');

    const urlInput = page.getByLabel('URL *');
    await urlInput.fill('https://example.com');

    const allowedHostsInput = page.getByLabel('Allowed hosts (optional, comma-separated)');
    await allowedHostsInput.fill('accounts.google.com, *.example.com');

    // Save (scope to modal to avoid header button name collision)
    const modal = page.locator('.add-tile-modal');
    const saveButton = modal.getByRole('button', { name: 'Add Tile' });
    await saveButton.click();

    // Verify modal closes
    await expect(page.getByRole('heading', { name: 'Add New Tile' })).not.toBeVisible();

    // Verify config was saved with allowedHosts
    await expect
      .poll(async () => {
        return page.evaluate(() => window.__playwrightSavedConfigs__?.length ?? 0);
      })
      .toBeGreaterThan(0);

    const savedConfigs = await page.evaluate(() => window.__playwrightSavedConfigs__ ?? []);
    const lastSavedConfig = savedConfigs[savedConfigs.length - 1] as typeof sampleConfig;
    const updatedProfile = lastSavedConfig.profiles.find(
      (p: { id: string }) => p.id === primaryProfile.id,
    );
    const newTile = updatedProfile.tiles.find(
      (t: { title: string }) => t.title === 'Test Web Tile',
    );
    expect(newTile).toBeDefined();
    expect(newTile.kind).toBe('web');
    expect(newTile.allowedHosts).toEqual(['accounts.google.com', '*.example.com']);
  });

  test('edits a web tile to add allowed hosts', async ({ page }) => {
    await page.goto('/');

    // Navigate to tiles view
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'TenFoot Launcher' })).toBeVisible();

    const tileToEdit = primaryProfile.tiles.find((t: { kind: string }) => t.kind === 'web');
    if (!tileToEdit) {
      test.skip();
      return;
    }

    // Enter edit mode
    const editModeButton = page.getByRole('button', { name: 'Edit Mode' });
    await expect(editModeButton).toBeVisible();
    await editModeButton.click();

    // Find and click Edit on the web tile
    const editButton = page.getByRole('button', { name: `Edit ${tileToEdit.title}` });
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Wait for edit modal
    await expect(page.getByRole('heading', { name: 'Edit Tile' })).toBeVisible();

    // Add allowed hosts
    const allowedHostsInput = page.getByLabel('Allowed hosts (optional, comma-separated)');
    await allowedHostsInput.fill('accounts.google.com');

    // Save changes
    const saveButton = page.getByRole('button', { name: 'Save Changes' });
    await saveButton.click();

    // Verify config was saved with allowedHosts
    await expect
      .poll(async () => {
        return page.evaluate(() => window.__playwrightSavedConfigs__?.length ?? 0);
      })
      .toBeGreaterThan(0);

    const savedConfigs = await page.evaluate(() => window.__playwrightSavedConfigs__ ?? []);
    const lastSavedConfig = savedConfigs[savedConfigs.length - 1] as typeof sampleConfig;
    const updatedProfile = lastSavedConfig.profiles.find(
      (p: { id: string }) => p.id === primaryProfile.id,
    );
    const updatedTile = updatedProfile.tiles.find((t: { id: string }) => t.id === tileToEdit.id);
    expect(updatedTile).toBeDefined();
    expect(updatedTile.allowedHosts).toEqual(['accounts.google.com']);
  });
});
