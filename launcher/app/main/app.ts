import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { autoUpdater } from 'electron-updater';
import { ensureAutostart } from './autostart';
import { setupMenu } from './menu';
import { clearCache, loadConfig, writeLog } from './config';
import { IpcChannels, type ConfigT, type Tile } from '../shared/types';
import { launchTile, onChildExit } from './childLaunch';

let mainWindow: BrowserWindow | null = null;
let cursorCssKey: string | null = null;
let config: ConfigT | null = null;

const resolveTile = (profileId: string, tileId: string): Tile | undefined => {
  if (!config) return undefined;
  const profile = config.profiles.find((p) => p.id === profileId);
  return profile?.tiles.find((t) => t.id === tileId);
};

const sendConfigToRenderer = async (): Promise<void> => {
  if (!mainWindow) return;
  try {
    config = await loadConfig();
    mainWindow.webContents.send(IpcChannels.getConfig, config);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    mainWindow.webContents.send(IpcChannels.configError, { message });
    await writeLog(`Config load failed: ${message}`);
  }
};

const createWindow = async (): Promise<void> => {
  const ui = config?.ui ?? { rows: 2, cols: 5, tileMinPx: 160, resolutionHint: '1440p' as const };

  setupMenu();

  mainWindow = new BrowserWindow({
    width: ui.cols * ui.tileMinPx + 400,
    height: ui.rows * ui.tileMinPx + 400,
    fullscreen: true,
    kiosk: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: false
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow?.hide();
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (['Escape', 'F4'].includes(input.code) || input.key === 'Escape') {
      event.preventDefault();
    }
    if (process.platform === 'darwin' && input.meta && input.key?.toLowerCase() === 'q') {
      event.preventDefault();
    }
  });

  const url = process.env.VITE_DEV_SERVER_URL;
  if (url) {
    await mainWindow.loadURL(url);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
  }

  await ensureAutostart();
  await sendConfigToRenderer();
  void autoUpdater.checkForUpdatesAndNotify();
};

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }
  await createWindow();
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  } else {
    mainWindow?.show();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle(IpcChannels.getConfig, async () => {
  try {
    config = await loadConfig();
    return config;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await writeLog(`Config IPC load failed: ${message}`);
    throw error;
  }
});

ipcMain.handle(IpcChannels.launchTile, async (_event, profileId: string, tileId: string) => {
  const tile = resolveTile(profileId, tileId);
  if (!tile) {
    throw new Error('Tile not found');
  }
  await launchTile(tile);
});

ipcMain.on(IpcChannels.profileChanged, async (_event, profileId: string) => {
  await writeLog(`Profile changed to ${profileId}`);
});

ipcMain.on(IpcChannels.cursorHide, () => {
  if (!mainWindow) return;
  if (cursorCssKey) return;
  mainWindow.webContents
    .insertCSS('body, * { cursor: none !important; }')
    .then((key) => {
      cursorCssKey = key;
    })
    .catch((error) => {
      void writeLog(`Failed to hide cursor: ${String(error)}`);
    });
});

ipcMain.on(IpcChannels.cursorShow, () => {
  if (!mainWindow) return;
  if (!cursorCssKey) return;
  mainWindow.webContents
    .removeInsertedCSS(cursorCssKey)
    .then(() => {
      cursorCssKey = null;
    })
    .catch((error) => {
      void writeLog(`Failed to show cursor: ${String(error)}`);
    });
});

onChildExit((tileId) => {
  if (!mainWindow) return;
  mainWindow.webContents.send(IpcChannels.childExit, tileId);
  mainWindow.focus();
});

autoUpdater.on('error', async (error) => {
  await writeLog(`Auto updater error: ${error.message}`);
});

autoUpdater.on('update-downloaded', async () => {
  await writeLog('Update downloaded, will apply on restart');
});

export const reloadConfig = async (): Promise<void> => {
  clearCache();
  await sendConfigToRenderer();
};
