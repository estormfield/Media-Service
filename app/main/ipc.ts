import { ipcMain } from 'electron';
import { IPC_CHANNELS, type LaunchEntryPayload } from '@shared/ipc.js';
import { loadConfig } from './config.js';
import { launchConfiguredEntry } from './launcher.js';
import { ensureAutoLaunchEnabled, isAutoLaunchEnabled, disableAutoLaunch } from './autoLaunch.js';
import { logger } from './logger.js';

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, async () => {
    const config = await loadConfig();
    const autoStartEnabled = await isAutoLaunchEnabled();
    return { config, autoStartEnabled };
  });

  ipcMain.handle(IPC_CHANNELS.LAUNCH_ENTRY, async (_event, payload: LaunchEntryPayload) => {
    const config = await loadConfig();
    launchConfiguredEntry(config, payload);
  });

  ipcMain.handle(IPC_CHANNELS.AUTO_START_ENABLE, async (_event, enabled: boolean) => {
    try {
      if (enabled) {
        await ensureAutoLaunchEnabled();
        return true;
      }
      await disableAutoLaunch();
      return false;
    } catch (error) {
      logger.error('Failed to toggle auto start: %s', error);
      throw error;
    }
  });
}
