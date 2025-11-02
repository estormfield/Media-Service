import { app, BrowserWindow } from 'electron';
import { loadConfig } from '@shared/config';
import type { AppConfig } from '@shared/schema';
import { createMainWindow } from './window';
import { registerIpcHandlers } from './ipcHandlers';
import { ensureAutoStart } from './autostart';
import { initializeAutoUpdater } from './updater';
import { logger } from './logger';
import { focusWindow } from './launcherService';

let mainWindow: BrowserWindow | null = null;
let configCache: AppConfig | null = null;

const hasLock = app.requestSingleInstanceLock();

if (!hasLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      focusWindow(mainWindow);
    }
  });

  app.whenReady().then(async () => {
    try {
      configCache = await loadConfig();
      await ensureAutoStart();
      mainWindow = await createMainWindow();
      registerIpcHandlers(configCache, mainWindow);
      initializeAutoUpdater(mainWindow);
    } catch (error) {
      logger.error('Failed to launch application', error);
      app.quit();
    }
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (mainWindow === null && configCache) {
    mainWindow = await createMainWindow();
    registerIpcHandlers(configCache, mainWindow);
    initializeAutoUpdater(mainWindow);
  }
});
