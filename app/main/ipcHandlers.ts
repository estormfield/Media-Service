import { ipcMain, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc';
import type { AppConfig } from '@shared/schema';
import { findLauncher, findProfile } from '@shared/launchers';
import { launchTarget, openProfilePicker } from './launcherService';
import { logger } from './logger';

export function registerIpcHandlers(config: AppConfig, window: BrowserWindow): void {
  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, async () => config);

  ipcMain.handle(IPC_CHANNELS.LAUNCH, async (_event, profileId: string, launcherId: string) => {
    try {
      const profile = findProfile(config, profileId);
      const launcher = findLauncher(profile, launcherId);
      await launchTarget(config, profileId, launcher);
    } catch (error) {
      logger.error('Launch failed', error);
      throw error;
    }
  });

  ipcMain.on(IPC_CHANNELS.PROFILE_PICKER_OPEN, () => {
    openProfilePicker(window);
  });

  window.on('closed', () => {
    ipcMain.removeHandler(IPC_CHANNELS.CONFIG_GET);
    ipcMain.removeHandler(IPC_CHANNELS.LAUNCH);
    ipcMain.removeAllListeners(IPC_CHANNELS.PROFILE_PICKER_OPEN);
  });
}
