import { spawn } from 'node:child_process';
import path from 'node:path';
import type { AppConfig, Launcher } from '@shared/schema';
import { logger } from './logger';

export async function launchTarget(config: AppConfig, profileId: string, launcher: Launcher): Promise<void> {
  logger.info('Launching', { profileId, launcherId: launcher.id, type: launcher.type });
  switch (launcher.type) {
    case 'youtube':
      await launchYouTube(config, launcher);
      break;
    case 'emby':
      await launchExecutable(launcher.executablePath ?? config.embyExecutablePath, launcher.args);
      break;
    case 'game':
      await launchExecutable(
        resolveGamePath(config, launcher.executablePath),
        launcher.args,
        launcher.workingDirectory,
      );
      break;
    default:
      throw new Error(`Unsupported launcher type ${(launcher as Launcher).type}`);
  }
}

async function launchYouTube(config: AppConfig, launcher: Extract<Launcher, { type: 'youtube' }>): Promise<void> {
  const executable = launcher.browserPath ?? config.youtubeBrowserPath;
  if (!executable) {
    throw new Error('YouTube launcher requires a configured Chromium-based browser path');
  }

  const args = [...(launcher.browserArgs ?? []), `--app=${launcher.url}`];
  await launchExecutable(executable, args);
}

function resolveGamePath(config: AppConfig, executable: string): string {
  if (path.isAbsolute(executable) || !config.gameBasePath) {
    return executable;
  }

  return path.join(config.gameBasePath, executable);
}

async function launchExecutable(
  executable: string | undefined,
  args: ReadonlyArray<string> | undefined,
  cwd?: string,
): Promise<void> {
  if (!executable) {
    throw new Error('Launcher executable path is not configured');
  }

  const child = spawn(executable, args, {
    cwd,
    detached: true,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });

  child.on('error', (error) => {
    logger.error('Failed to launch process', error);
  });

  child.unref();
}

export function openProfilePicker(window: Electron.BrowserWindow): void {
  window.webContents.send('profile-picker:show');
}

export function focusWindow(window: Electron.BrowserWindow): void {
  if (window.isMinimized()) {
    window.restore();
  }
  window.focus();
}
