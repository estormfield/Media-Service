import { spawn } from 'node:child_process';
import { BrowserWindow } from 'electron';
import type { AppConfig, LauncherEntry } from '@shared/schema.js';
import type { LaunchEntryPayload } from '@shared/ipc.js';
import { logger } from './logger.js';

function resolveEntry(config: AppConfig, payload: LaunchEntryPayload): LauncherEntry | null {
  const profile = config.profiles.find((p) => p.id === payload.profileId);
  if (!profile) {
    logger.error('Profile %s not found for launch', payload.profileId);
    return null;
  }
  const entry = profile.tiles.find((tile) => tile.id === payload.entryId);
  if (!entry) {
    logger.error('Entry %s not found in profile %s', payload.entryId, payload.profileId);
    return null;
  }
  return entry;
}

function spawnDetached(command: string, args: string[], workingDirectory?: string) {
  logger.info('Launching: %s %s', command, args.join(' '));
  const child = spawn(command, args, {
    cwd: workingDirectory,
    windowsHide: false,
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

export async function getDefaultBrowser(): Promise<string> {
  const platform = process.platform;

  if (platform === 'darwin') {
    // macOS: Try common browsers in order
    const commonBrowsers = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Safari.app/Contents/MacOS/Safari',
      '/Applications/Firefox.app/Contents/MacOS/firefox',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    ];
    for (const browser of commonBrowsers) {
      try {
        const fs = await import('fs-extra');
        if (await fs.pathExists(browser)) {
          return browser;
        }
      } catch {
        // Continue
      }
    }
  } else if (platform === 'win32') {
    // Windows: Try common browser paths
    const commonBrowsers = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    ];
    for (const browser of commonBrowsers) {
      try {
        const fs = await import('fs-extra');
        if (await fs.pathExists(browser)) {
          return browser;
        }
      } catch {
        // Continue
      }
    }
  } else {
    // Linux: Try common browser commands
    const commonBrowsers = ['google-chrome', 'chromium-browser', 'firefox', 'brave-browser'];
    for (const browser of commonBrowsers) {
      try {
        const { execSync } = await import('node:child_process');
        execSync(`which ${browser}`, { stdio: 'ignore' });
        return browser;
      } catch {
        // Continue
      }
    }
  }

  throw new Error('No default browser found');
}

function launchWeb(entry: Extract<LauncherEntry, { kind: 'web' }>) {
  const url = new URL(entry.url);
  const allowedHost = url.host;

  const win = new BrowserWindow({
    kiosk: true,
    fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Block navigation outside the domain
  win.webContents.on('will-navigate', (event, navigationUrl) => {
    try {
      const navUrl = new URL(navigationUrl);
      if (navUrl.host !== allowedHost) {
        event.preventDefault();
        logger.warn('Blocked navigation to %s (allowed: %s)', navigationUrl, allowedHost);
      }
    } catch {
      event.preventDefault();
    }
  });

  // Block new window opens
  win.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // Close on back navigation keys (IR remote, keyboard, gamepad)
  win.webContents.on('before-input-event', (event, input) => {
    const key = input.key.toLowerCase();
    const code = input.code.toLowerCase();

    // Escape, Backspace, BrowserBack
    if (key === 'escape' || key === 'backspace' || code === 'browserback') {
      win.close();
      event.preventDefault();
      return;
    }

    // Gamepad B button (common on TV remotes)
    if (code === 'keyb' && input.type === 'keyDown') {
      win.close();
      event.preventDefault();
      return;
    }
  });

  // Create overlay window with back button
  const overlay = new BrowserWindow({
    width: 200,
    height: 60,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Position overlay at top-left
  const overlayHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            font-family: system-ui, sans-serif;
          }
          button {
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.5);
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            margin: 8px;
            transition: all 120ms ease;
          }
          button:hover {
            background: rgba(0, 0, 0, 0.9);
            border-color: rgba(255, 255, 255, 0.8);
          }
        </style>
      </head>
      <body>
        <button id="back-btn">← Back to Home</button>
        <script>
          document.getElementById('back-btn').addEventListener('click', () => {
            window.close();
          });
        </script>
      </body>
    </html>
  `;

  overlay.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(overlayHTML)}`);

  // Close overlay when kiosk window closes
  win.on('closed', () => {
    if (!overlay.isDestroyed()) {
      overlay.close();
    }
  });

  // Close kiosk when overlay window closes
  overlay.on('closed', () => {
    if (!win.isDestroyed()) {
      win.close();
    }
  });

  win.loadURL(entry.url);
  logger.info('Launched web kiosk window for %s', entry.url);
}

async function launchYoutube(entry: Extract<LauncherEntry, { kind: 'youtube' }>) {
  let browserPath = entry.browserPath;

  if (!browserPath) {
    try {
      browserPath = await getDefaultBrowser();
      logger.info('Using default browser: %s', browserPath);
    } catch (error) {
      logger.error('Failed to get default browser: %s', error);
      throw new Error('No browser configured and default browser not found');
    }
  }

  const preparedArgs = entry.browserArgs.map((value) => value.replace('%URL%', entry.url));
  spawnDetached(browserPath, preparedArgs);
}

function launchExecutable(entry: Extract<LauncherEntry, { kind: 'emby' | 'game' }>) {
  spawnDetached(entry.executable, entry.args, entry.workingDirectory);
}

export async function launchConfiguredEntry(
  config: AppConfig,
  payload: LaunchEntryPayload,
): Promise<void> {
  const entry = resolveEntry(config, payload);
  if (!entry) {
    return;
  }

  switch (entry.kind) {
    case 'youtube':
      await launchYoutube(entry);
      break;
    case 'web':
      launchWeb(entry);
      break;
    case 'emby':
    case 'game':
      launchExecutable(entry);
      break;
    default:
      logger.error('Unknown launch entry kind %s', (entry as LauncherEntry).kind);
  }
}
