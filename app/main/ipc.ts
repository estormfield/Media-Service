import { ipcMain, dialog, BrowserWindow } from 'electron';
import { IPC_CHANNELS, type LaunchEntryPayload } from '@shared/ipc.js';
import { loadConfig } from './config.js';
import { launchConfiguredEntry, getDefaultBrowser } from './launcher.js';
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
    await launchConfiguredEntry(config, payload);
  });
  
  ipcMain.handle(IPC_CHANNELS.DIALOG_PICK_FILE, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) {
      throw new Error('No window found');
    }
    
    const platform = process.platform;
    const filters: Electron.FileFilter[] = [];
    
    if (platform === 'darwin') {
      filters.push({ name: 'Applications', extensions: ['app'] });
      filters.push({ name: 'All Files', extensions: ['*'] });
    } else if (platform === 'win32') {
      filters.push({ name: 'Executables', extensions: ['exe', 'msi'] });
      filters.push({ name: 'All Files', extensions: ['*'] });
    } else {
      filters.push({ name: 'All Files', extensions: ['*'] });
    }
    
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters,
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    return result.filePaths[0];
  });
  
  ipcMain.handle(IPC_CHANNELS.GET_DEFAULT_BROWSER, async () => {
    try {
      return await getDefaultBrowser();
    } catch (error) {
      logger.error('Failed to get default browser: %s', error);
      return null;
    }
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
