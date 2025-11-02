import { spawn } from 'node:child_process';
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
    stdio: 'ignore'
  });
  child.unref();
}

function launchYoutube(entry: Extract<LauncherEntry, { kind: 'youtube' }>) {
  const preparedArgs = entry.browserArgs.map((value) => value.replace('%URL%', entry.url));
  spawnDetached(entry.browserPath, preparedArgs);
}

function launchExecutable(entry: Extract<LauncherEntry, { kind: 'emby' | 'game' }>) {
  spawnDetached(entry.executable, entry.args, entry.workingDirectory);
}

export function launchConfiguredEntry(
  config: AppConfig,
  payload: LaunchEntryPayload
): void {
  const entry = resolveEntry(config, payload);
  if (!entry) {
    return;
  }

  switch (entry.kind) {
    case 'youtube':
      launchYoutube(entry);
      break;
    case 'emby':
    case 'game':
      launchExecutable(entry);
      break;
    default:
      logger.error('Unknown launch entry kind %s', (entry as LauncherEntry).kind);
  }
}
