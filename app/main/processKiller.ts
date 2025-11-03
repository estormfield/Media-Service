import psList from 'ps-list';
import fkill from 'fkill';
import { app } from 'electron';
import { logger } from './logger.js';

/**
 * Kills all other instances of this application by matching executable path
 * or product name. Excludes the current process.
 */
export async function killOtherInstances(): Promise<void> {
  try {
    const currentPid = process.pid;
    const currentExecPath = process.execPath;
    const productName = app.getName(); // "TenFoot Launcher" from electron-builder config

    logger.info('Checking for other instances (current PID: %d)', currentPid);

    const processes = await psList();
    const processesToKill: number[] = [];

    for (const proc of processes) {
      // Skip current process
      if (proc.pid === currentPid) {
        continue;
      }

      const cmd = proc.cmd?.toLowerCase() || '';
      const name = proc.name?.toLowerCase() || '';

      // Match by executable path (most reliable)
      if (cmd.includes(currentExecPath.toLowerCase())) {
        logger.info('Found instance by exec path: PID %d, cmd: %s', proc.pid, proc.cmd);
        processesToKill.push(proc.pid);
        continue;
      }

      // Fallback: match by product name
      if (name.includes(productName.toLowerCase()) || cmd.includes(productName.toLowerCase())) {
        logger.info('Found instance by product name: PID %d, name: %s', proc.pid, proc.name);
        processesToKill.push(proc.pid);
        continue;
      }
    }

    if (processesToKill.length === 0) {
      logger.info('No other instances found');
      return;
    }

    logger.info('Killing %d other instance(s)', processesToKill.length);

    // Kill all matching processes with force
    await fkill(processesToKill, {
      force: true,
      tree: true,
      silent: true,
    });

    logger.info('Successfully killed other instances');
  } catch (error) {
    logger.error('Failed to kill other instances: %s', error);
    // Don't throw - allow app to continue even if kill fails
  }
}
