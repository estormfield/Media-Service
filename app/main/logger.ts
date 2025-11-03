import log from 'electron-log';

// In unit test environments (no Electron), electron-log.initialize may not be available
try {
  if (process.versions?.electron) {
    log.initialize({ preload: true });
  }
} catch {
  // no-op in non-Electron environments
}

export const logger = log.create({ logId: 'main' });

logger.transports.console.level = 'info';
logger.transports.file.level = 'info';
