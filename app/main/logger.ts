import log from 'electron-log';

log.initialize({ preload: true });

export const logger = log.create({ logId: 'main' });

logger.transports.console.level = 'info';
logger.transports.file.level = 'info';
