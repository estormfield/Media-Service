import { autoUpdater } from 'electron-updater';
import type { BrowserWindow } from 'electron';
import { logger } from './logger';

export function initializeAutoUpdater(window: BrowserWindow): void {
  autoUpdater.logger = logger;
  autoUpdater.autoDownload = true;

  autoUpdater.on('update-downloaded', () => {
    window.webContents.send('update:downloaded');
  });

  void autoUpdater.checkForUpdatesAndNotify().catch((error) => {
    logger.error('Auto-updater failed', error);
  });
}
