import type { LauncherSettings } from '@shared/schema.js';
import { logger } from './logger.js';

export function initializeAutoUpdater(_settings: LauncherSettings): void {
  logger.info('Auto updater disabled for this build');
}
