import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import shortcut from 'windows-shortcuts';
import { AUTO_LAUNCH_AGENT_ID, WINDOWS_STARTUP_SHORTCUT } from '@shared/constants.js';
import { logger } from './logger.js';

function getWindowsStartupFolder(): string {
  const programData = process.env.ProgramData ?? 'C:/ProgramData';
  return path.join(programData, 'Microsoft/Windows/Start Menu/Programs/StartUp');
}

async function ensureWindowsShortcut(): Promise<void> {
  const startupDir = getWindowsStartupFolder();
  await fs.ensureDir(startupDir);
  const shortcutPath = path.join(startupDir, WINDOWS_STARTUP_SHORTCUT);

  await new Promise<void>((resolve, reject) => {
    shortcut.create(
      shortcutPath,
      {
        target: process.execPath,
        workingDir: path.dirname(process.execPath),
        runStyle: 1,
      },
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      },
    );
  });
  logger.info('Ensured Windows startup shortcut at %s', shortcutPath);
}

async function hasWindowsShortcut(): Promise<boolean> {
  const startupDir = getWindowsStartupFolder();
  const shortcutPath = path.join(startupDir, WINDOWS_STARTUP_SHORTCUT);
  return fs.pathExists(shortcutPath);
}

function getLaunchAgentPath(): string {
  const home = os.homedir();
  return path.join(home, 'Library/LaunchAgents', `${AUTO_LAUNCH_AGENT_ID}.plist`);
}

async function ensureLaunchAgent(): Promise<void> {
  const plistPath = getLaunchAgentPath();
  await fs.ensureDir(path.dirname(plistPath));
  const contents = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>${AUTO_LAUNCH_AGENT_ID}</string>
    <key>ProgramArguments</key>
    <array>
      <string>${process.execPath}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
  </dict>
</plist>`;
  await fs.writeFile(plistPath, contents, 'utf8');
  logger.info('Ensured macOS LaunchAgent at %s', plistPath);
}

async function hasLaunchAgent(): Promise<boolean> {
  const plistPath = getLaunchAgentPath();
  return fs.pathExists(plistPath);
}

export async function ensureAutoLaunchEnabled(): Promise<boolean> {
  if (process.platform === 'win32') {
    await ensureWindowsShortcut();
    return true;
  }

  if (process.platform === 'darwin') {
    await ensureLaunchAgent();
    return true;
  }

  if (process.platform === 'linux') {
    // Use desktop entry in ~/.config/autostart
    const autopStartDir = path.join(os.homedir(), '.config/autostart');
    await fs.ensureDir(autopStartDir);
    const desktopFile = path.join(autopStartDir, 'tenfoot-launcher.desktop');
    const content = `[Desktop Entry]
Type=Application
Exec=${process.execPath}
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Name=TenFootLauncher
Comment=Start TenFoot Launcher at login
`;
    await fs.writeFile(desktopFile, content, 'utf8');
    logger.info('Ensured Linux autostart desktop file at %s', desktopFile);
    return true;
  }

  logger.warn('Auto launch not configured for platform %s', process.platform);
  return false;
}

export async function isAutoLaunchEnabled(): Promise<boolean> {
  if (process.platform === 'win32') {
    return hasWindowsShortcut();
  }
  if (process.platform === 'darwin') {
    return hasLaunchAgent();
  }
  if (process.platform === 'linux') {
    const desktopFile = path.join(os.homedir(), '.config/autostart/tenfoot-launcher.desktop');
    return fs.pathExists(desktopFile);
  }
  return false;
}

export async function disableAutoLaunch(): Promise<void> {
  if (process.platform === 'win32') {
    const shortcutPath = path.join(getWindowsStartupFolder(), WINDOWS_STARTUP_SHORTCUT);
    if (await fs.pathExists(shortcutPath)) {
      await fs.remove(shortcutPath);
    }
    return;
  }
  if (process.platform === 'darwin') {
    const plistPath = getLaunchAgentPath();
    if (await fs.pathExists(plistPath)) {
      await fs.remove(plistPath);
    }
    return;
  }
  if (process.platform === 'linux') {
    const desktopFile = path.join(os.homedir(), '.config/autostart/tenfoot-launcher.desktop');
    if (await fs.pathExists(desktopFile)) {
      await fs.remove(desktopFile);
    }
  }
}
