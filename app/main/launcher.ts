import { spawn } from 'node:child_process';
import { BrowserWindow } from 'electron';
import type { AppConfig, LauncherEntry } from '@shared/schema.js';
import type { LaunchEntryPayload } from '@shared/ipc.js';
import { logger } from './logger.js';

let externalLaunchInProgress = false;
export function setExternalLaunchInProgress(next: boolean): void {
  externalLaunchInProgress = next;
}
export function isExternalLaunchInProgress(): boolean {
  return externalLaunchInProgress;
}

function focusMainWindowAggressive() {
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) return;
  try {
    win.setAlwaysOnTop(true, 'screen-saver');
    win.show();
    win.moveTop();
    win.focus();
  } finally {
    setTimeout(() => {
      if (!win.isDestroyed()) win.setAlwaysOnTop(false);
    }, 300);
  }
}

function restoreLauncher(mainWindow: BrowserWindow | undefined): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setKiosk(true);
  mainWindow.show();
  focusMainWindowAggressive();
}

function hideLauncher(mainWindow: BrowserWindow | undefined): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setKiosk(false);
  mainWindow.hide();
}

function createFocusWatcher(
  appName: string,
  mainWindow: BrowserWindow | undefined,
): NodeJS.Timeout | null {
  if (!mainWindow || mainWindow.isDestroyed()) return null;
  return setInterval(() => {
    if (!externalLaunchInProgress || !mainWindow || mainWindow.isDestroyed()) return;
    const checkScript = spawn(
      'osascript',
      [
        '-e',
        'tell application "System Events" to get name of (first application process whose frontmost is true)',
      ],
      { stdio: ['ignore', 'pipe', 'ignore'] },
    );
    let output = '';
    checkScript.stdout?.on('data', (data) => {
      output += data.toString();
    });
    checkScript.on('close', (code) => {
      if (code === 0 && externalLaunchInProgress && output.trim() !== appName) {
        logger.info('Launched app %s is no longer frontmost, restoring launcher', appName);
        setExternalLaunchInProgress(false);
        restoreLauncher(mainWindow);
      }
    });
    checkScript.unref();
  }, 700);
}

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
  // Guard: skip if external launch already in progress
  if (externalLaunchInProgress) {
    logger.info('External launch already in progress, skipping duplicate launch');
    return;
  }

  setExternalLaunchInProgress(true);

  // Get main window to hide/show it
  const mainWindow = BrowserWindow.getAllWindows()[0];

  // macOS: Handle .app bundles using 'open -a <AppName> -W' (omit -n to reuse existing instance)
  if (process.platform === 'darwin' && /\.app$/i.test(command)) {
    logger.info('Launching macOS app bundle: %s', command);

    // Extract app name from path (e.g., /Applications/Comet.app -> Comet)
    const pathParts = command.split('/');
    const appBundleName = pathParts[pathParts.length - 1];
    const appName = appBundleName.replace(/\.app$/i, '');

    hideLauncher(mainWindow);

    const openArgs = ['-a', appName, '-W'];
    if (args.length > 0) {
      openArgs.push('--args', ...args);
    }

    const child = spawn('open', openArgs, {
      cwd: workingDirectory,
      detached: false,
      stdio: 'ignore',
    });

    const focusWatcher = createFocusWatcher(appName, mainWindow);

    child.on('close', () => {
      if (focusWatcher) clearInterval(focusWatcher);
      if (externalLaunchInProgress) {
        setExternalLaunchInProgress(false);
        restoreLauncher(mainWindow);
      }
    });

    child.unref();
    return;
  }

  // Windows: Use PowerShell to launch with WindowStyle Maximized
  if (process.platform === 'win32') {
    logger.info('Launching Windows app (maximized): %s %s', command, args.join(' '));

    hideLauncher(mainWindow);

    // Escape arguments for PowerShell
    const escapedArgs = args.map((arg) => {
      if (arg.includes(' ') || arg.includes('"') || arg.includes('$')) {
        return `"${arg.replace(/"/g, '`"')}"`;
      }
      return arg;
    });
    const argsStr = escapedArgs.length > 0 ? escapedArgs.join(',') : '';
    const escapedCommand = command.includes(' ') ? `"${command.replace(/"/g, '`"')}"` : command;
    const escapedCwd = workingDirectory
      ? workingDirectory.includes(' ')
        ? `"${workingDirectory.replace(/"/g, '`"')}"`
        : workingDirectory
      : '';

    const psScript = `
      $proc = Start-Process -FilePath ${escapedCommand} -ArgumentList ${argsStr} ${
        escapedCwd ? `-WorkingDirectory ${escapedCwd}` : ''
      } -WindowStyle Maximized -PassThru
      if ($proc) {
        Wait-Process -Id $proc.Id
      }
    `.trim();

    const child = spawn('powershell', ['-NoProfile', '-Command', psScript], {
      cwd: workingDirectory,
      detached: false,
      stdio: 'ignore',
      windowsHide: true,
    });
    child.on('close', () => {
      setExternalLaunchInProgress(false);
      restoreLauncher(mainWindow);
    });
    child.unref();
    return;
  }

  // Default behavior for binaries and other platforms (Linux, macOS non-bundle)
  logger.info('Launching: %s %s', command, args.join(' '));
  hideLauncher(mainWindow);

  const child = spawn(command, args, {
    cwd: workingDirectory,
    windowsHide: false,
    detached: true,
    stdio: 'ignore',
  });
  child.on('close', () => {
    setExternalLaunchInProgress(false);
    restoreLauncher(mainWindow);
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

export function isHostAllowed(target: string, baseHost: string, extra: string[] = []): boolean {
  const tests = [baseHost, ...extra];
  return tests.some((h) => {
    if (h.startsWith('*.')) {
      const domain = h.slice(2);
      return target === domain || target.endsWith(`.${domain}`);
    }
    return target === h;
  });
}

function launchWeb(entry: Extract<LauncherEntry, { kind: 'web' }>) {
  const url = new URL(entry.url);
  const baseHost = url.host;
  const extra = entry.allowedHosts ?? [];

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

  // Block navigation outside allowed domains
  win.webContents.on('will-navigate', (event, navigationUrl) => {
    try {
      const navUrl = new URL(navigationUrl);
      if (!isHostAllowed(navUrl.host, baseHost, extra)) {
        event.preventDefault();
        logger.warn(
          'Blocked navigation to %s (allowed: %s, %s)',
          navigationUrl,
          baseHost,
          extra.join(', '),
        );
      }
    } catch {
      event.preventDefault();
    }
  });

  // Block redirects outside allowed domains
  win.webContents.on('will-redirect', (event, redirectUrl) => {
    try {
      const redirect = new URL(redirectUrl);
      if (!isHostAllowed(redirect.host, baseHost, extra)) {
        event.preventDefault();
        logger.warn(
          'Blocked redirect to %s (allowed: %s, %s)',
          redirectUrl,
          baseHost,
          extra.join(', '),
        );
      }
    } catch {
      event.preventDefault();
    }
  });

  // Handle window opens - load in same window if allowed, otherwise block
  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const openUrl = new URL(url);
      if (isHostAllowed(openUrl.host, baseHost, extra)) {
        // Load in same window to keep kiosk lock
        win.webContents.loadURL(url);
      }
    } catch {
      // Invalid URL, block
    }
    return { action: 'deny' }; // always block new windows
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

  const overlayHTML = `<!DOCTYPE html><html><head><style>body{margin:0;padding:0;background:transparent;display:flex;align-items:center;justify-content:flex-start;font-family:system-ui,sans-serif}button{background:rgba(0,0,0,0.7);color:white;border:2px solid rgba(255,255,255,0.5);padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;margin:8px;transition:all 120ms ease}button:hover{background:rgba(0,0,0,0.9);border-color:rgba(255,255,255,0.8)}</style></head><body><button id="back-btn">← Back to Home</button><script>document.getElementById('back-btn').addEventListener('click',()=>{window.close()})</script></body></html>`;

  overlay.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(overlayHTML)}`);
  win.on('closed', () => {
    if (!overlay.isDestroyed()) overlay.close();
  });
  overlay.on('closed', () => {
    if (!win.isDestroyed()) win.close();
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
