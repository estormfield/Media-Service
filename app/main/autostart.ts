import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import shortcuts from 'windows-shortcuts';
import { logger } from './logger';

export async function ensureAutoStart(): Promise<void> {
  if (process.platform === 'win32') {
    await createWindowsShortcut();
  } else if (process.platform === 'darwin') {
    createLaunchAgent();
  } else {
    logger.info('Auto-start is managed via desktop environment for platform', process.platform);
  }
}

async function createWindowsShortcut(): Promise<void> {
  const appData = process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming');
  const startupDir = path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
  mkdirSync(startupDir, { recursive: true });
  const shortcutPath = path.join(startupDir, 'Media Service Launcher.lnk');
  if (existsSync(shortcutPath)) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    shortcuts.create(
      shortcutPath,
      {
        target: process.execPath,
        args: '',
        workingDir: path.dirname(process.execPath),
        desc: 'Media Service Launcher',
      },
      (error) => {
        if (error) {
          logger.error('Failed to create Windows startup shortcut', error);
          reject(error);
        } else {
          resolve();
        }
      },
    );
  });
}

function createLaunchAgent(): void {
  const agentsDir = path.join(os.homedir(), 'Library', 'LaunchAgents');
  mkdirSync(agentsDir, { recursive: true });
  const plistPath = path.join(agentsDir, 'com.mediaservice.launcher.plist');
  if (existsSync(plistPath)) {
    return;
  }

  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.mediaservice.launcher</string>
    <key>ProgramArguments</key>
    <array>
      <string>${process.execPath}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
  </dict>
</plist>`;
  writeFileSync(plistPath, plist);
  logger.info('Created LaunchAgent at', plistPath);
}

export function removeAutoStartArtifacts(): void {
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming');
    const startupDir = path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
    const shortcutPath = path.join(startupDir, 'Media Service Launcher.lnk');
    if (existsSync(shortcutPath)) {
      try {
        require('node:fs').unlinkSync(shortcutPath);
      } catch (error) {
        logger.warn('Failed to remove startup shortcut', error);
      }
    }
  }
}
