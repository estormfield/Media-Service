import { app, BrowserWindow } from 'electron';
import { registerIpcHandlers } from './ipc.js';
import { createMainWindow } from './window.js';
import { loadConfig } from './config.js';
import { initializeAutoUpdater } from './updater.js';
import { ensureAutoLaunchEnabled, disableAutoLaunch } from './autoLaunch.js';
import { killOtherInstances } from './processKiller.js';
import { logger } from './logger.js';

registerIpcHandlers();

app.whenReady().then(async () => {
  try {
    // Kill any other instances before initializing
    await killOtherInstances();

    const config = await loadConfig();
    if (config.settings.autoStart) {
      await ensureAutoLaunchEnabled();
    } else {
      await disableAutoLaunch();
    }
    initializeAutoUpdater(config.settings);
    await createMainWindow();
  } catch (error) {
    logger.error('Failed to initialize application', error);
    app.exit(1);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createMainWindow();
  }
});
