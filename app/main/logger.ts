import log from 'electron-log/main';

log.initialize({ preload: true });

export const logger = log;
