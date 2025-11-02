import { execFile } from 'node:child_process';
import path from 'node:path';
import { app } from 'electron';
import { writeLog } from './config';

const runScript = (command: string, args: string[]): Promise<void> =>
  new Promise((resolve, reject) => {
    execFile(command, args, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

export const ensureAutostart = async (): Promise<void> => {
  try {
    if (process.platform === 'win32') {
      const scriptPath = path.join(__dirname, '../../scripts/create-startup-shortcut.ps1');
      const exePath = process.execPath;
      await runScript('powershell.exe', [
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        scriptPath,
        '-ExecutablePath',
        exePath
      ]);
    } else if (process.platform === 'darwin') {
      const scriptPath = path.join(__dirname, '../../scripts/create-launchagent.mjs');
      await runScript(process.execPath, [scriptPath, app.getPath('exe')]);
    }
  } catch (error) {
    await writeLog(`Autostart setup failed: ${String(error)}`);
  }
};
