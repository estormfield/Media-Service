import { BrowserWindow, shell } from 'electron';
import path from 'node:path';
import { logger } from './logger';

const isDev = process.env.NODE_ENV === 'development';

export async function createMainWindow(): Promise<BrowserWindow> {
  const preloadPath = isDev
    ? path.join(process.cwd(), 'dist/preload/index.js')
    : path.join(__dirname, '../preload/index.js');

  const window = new BrowserWindow({
    fullscreen: true,
    kiosk: true,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    logger.info('Opening external url', url);
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    await window.loadURL(process.env.VITE_DEV_SERVER_URL);
    window.webContents.openDevTools({ mode: 'detach' });
  } else {
    await window.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  return window;
}
