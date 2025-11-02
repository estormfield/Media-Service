import fs from 'fs-extra';
import path from 'node:path';
import { app } from 'electron';
import { CONFIG_PATHS, FALLBACK_CONFIG_PATH } from '@shared/constants.js';
import { validateConfig, type AppConfig } from '@shared/schema.js';
import { logger } from './logger.js';

let cachedConfig: AppConfig | null = null;
let cachedConfigPath: string | null = null;

export function getConfigPath(): string {
  if (cachedConfigPath) {
    return cachedConfigPath;
  }

  const envPath = process.env.TENFOOT_CONFIG_PATH;
  if (envPath) {
    cachedConfigPath = envPath;
    return cachedConfigPath;
  }

  const platformPath = CONFIG_PATHS[process.platform] ?? FALLBACK_CONFIG_PATH;
  cachedConfigPath = platformPath;
  return cachedConfigPath;
}

export async function loadConfig(): Promise<AppConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configPath = getConfigPath();
  try {
    const raw = await fs.readJSON(configPath);
    cachedConfig = validateConfig(raw);
    return cachedConfig;
  } catch (error) {
    logger.warn('Failed to load system config from %s: %s', configPath, error);
  }

  const fallback = path.resolve(app.getAppPath(), FALLBACK_CONFIG_PATH);
  logger.info('Falling back to bundled config at %s', fallback);
  const bundled = await fs.readJSON(fallback);
  cachedConfig = validateConfig(bundled);
  return cachedConfig;
}

export function resetCachedConfig(): void {
  cachedConfig = null;
}
