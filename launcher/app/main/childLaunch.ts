import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { app, shell } from 'electron';
import type { Tile } from '../shared/types';
import { TileKind } from '../shared/types';
import { writeLog } from './config';

export interface LaunchHandle {
  kill: () => void;
  onExit: (callback: () => void) => void;
}

const browserCandidatesWin = [
  path.join(process.env['ProgramFiles(x86)'] ?? '', 'Microsoft/Edge/Application/msedge.exe'),
  path.join(process.env.PROGRAMFILES ?? '', 'Google/Chrome/Application/chrome.exe')
];

const browserCandidatesMac = [
  '/Applications/Google Chrome.app',
  '/Applications/Microsoft Edge.app'
];

const listeners = new Set<(tileId: string) => void>();

export const onChildExit = (handler: (tileId: string) => void): (() => void) => {
  listeners.add(handler);
  return () => listeners.delete(handler);
};

const notifyExit = (tileId: string): void => {
  listeners.forEach((listener) => listener(tileId));
};

const spawnDetached = (command: string, args: string[]): LaunchHandle => {
  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();
  const callbacks = new Set<() => void>();
  child.on('exit', () => {
    callbacks.forEach((cb) => cb());
  });
  return {
    kill: () => {
      try {
        process.kill(child.pid);
      } catch (error) {
        console.error('Failed to kill child', error);
      }
    },
    onExit: (callback: () => void) => {
      callbacks.add(callback);
    }
  };
};

const findBrowser = async (): Promise<string | undefined> => {
  if (process.platform === 'win32') {
    for (const candidate of browserCandidatesWin) {
      if (!candidate.trim()) continue;
      try {
        await fs.access(candidate);
        return candidate;
      } catch {}
    }
  }

  if (process.platform === 'darwin') {
    for (const candidate of browserCandidatesMac) {
      try {
        await fs.access(candidate);
        return candidate;
      } catch {}
    }
  }

  return undefined;
};

const launchYouTube = async (tileId: string): Promise<void> => {
  const url = 'https://youtube.com/tv';
  if (process.platform === 'win32') {
    const browser = await findBrowser();
    if (browser) {
      const args = browser.includes('msedge')
        ? ['--app=' + url]
        : ['--app=' + url, '--kiosk'];
      spawnDetached(browser, args).onExit(() => notifyExit(tileId));
      return;
    }
  }
  if (process.platform === 'darwin') {
    const browser = await findBrowser();
    if (browser) {
      const args = ['-a', browser, '--args', `--app=${url}`];
      spawnDetached('open', args).onExit(() => notifyExit(tileId));
      return;
    }
  }
  await shell.openExternal(url);
  notifyExit(tileId);
};

const launchExec = (tileId: string, tile: Tile): void => {
  const command = process.platform === 'win32' ? tile.winPath : tile.macPath;
  if (!command) {
    throw new Error('Executable path missing for tile ' + tile.id);
  }
  if (process.platform === 'darwin') {
    spawnDetached('open', ['-a', command]).onExit(() => notifyExit(tileId));
    return;
  }
  spawnDetached(command, []).onExit(() => notifyExit(tileId));
};

export const launchTile = async (tile: Tile): Promise<void> => {
  try {
    switch (tile.kind) {
      case TileKind.youtube:
        await launchYouTube(tile.id);
        break;
      case TileKind.emby:
      case TileKind.exec:
        launchExec(tile.id, tile);
        break;
      case TileKind.uri:
        if (!tile.uri) {
          throw new Error('Missing URI');
        }
        await shell.openExternal(tile.uri);
        notifyExit(tile.id);
        break;
      default:
        throw new Error(`Unsupported tile kind: ${tile.kind}`);
    }
  } catch (error) {
    await writeLog(`Failed to launch tile ${tile.id}: ${String(error)}`);
    throw error;
  }
};

app.on('will-quit', () => {
  listeners.clear();
});
