import { app, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import type { LauncherSettings } from '@shared/schema.js';
import { logger } from './logger.js';

export function initializeAutoUpdater(settings: LauncherSettings): void {
  if (!app.isPackaged) {
    logger.info('Auto updater disabled in development mode');
    return;
  }

  autoUpdater.logger = logger;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;

  autoUpdater.setFeedURL({
    provider: 'github',
    owner: settings.githubOwner,
    repo: settings.githubRepo,
    releaseType: settings.updateChannel === 'beta' ? 'prerelease' : 'release',
  });

  autoUpdater.on('update-available', () => {
    logger.info('Update available, downloading...');
  });

  autoUpdater.on('update-not-available', () => {
    logger.info('Launcher is up to date');
  });

  autoUpdater.on('error', (error) => {
    logger.error('Auto updater error: %s', error);
  });

  autoUpdater.on('update-downloaded', async () => {
    const response = await dialog.showMessageBox({
      type: 'info',
      buttons: ['Install and Restart', 'Later'],
      title: 'Update Ready',
      message: 'A new version has been downloaded. Install on next restart?',
    });
    if (response.response === 0) {
      autoUpdater.quitAndInstall(true, true);
    }
  });

  void autoUpdater.checkForUpdatesAndNotify();
}
