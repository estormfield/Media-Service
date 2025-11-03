import { BrowserWindow, app } from 'electron';
import { isExternalLaunchInProgress } from './launcher.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from './logger.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export async function createMainWindow(): Promise<BrowserWindow> {
  const preloadPath = path.join(__dirname, '../preload/index.js');

  const win = new BrowserWindow({
    width: 2560,
    height: 1440,
    backgroundColor: '#000000',
    fullscreen: true,
    kiosk: true,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: !app.isPackaged,
      disableHtmlFullscreenWindowResize: false,
    },
  });

  const url = process.env.VITE_DEV_SERVER_URL;
  if (url) {
    await win.loadURL(url);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = path.join(app.getAppPath(), 'dist/renderer/index.html');
    await win.loadFile(indexPath);
  }

  win.once('ready-to-show', () => {
    win.show();
  });

  win.on('closed', () => {
    logger.info('Main window closed');
  });

  // Guarded auto-refocus: only if no app window is focused AND no external launch is in progress
  win.on('blur', () => {
    if (isExternalLaunchInProgress()) return; // do not fight external apps
    const focused = BrowserWindow.getFocusedWindow();
    if (focused) return; // another window of this app is focused (e.g., kiosk)
    setTimeout(() => {
      if (!BrowserWindow.getFocusedWindow() && !win.isDestroyed()) {
        win.setAlwaysOnTop(true, 'screen-saver');
        win.show();
        win.moveTop();
        win.focus();
        setTimeout(() => {
          if (!win.isDestroyed()) win.setAlwaysOnTop(false);
        }, 300);
      }
    }, 200);
  });

  return win;
}
