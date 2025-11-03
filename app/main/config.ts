import fs from 'fs-extra';
import path from 'node:path';
import { app } from 'electron';
import { fileURLToPath } from 'node:url';
import { CONFIG_PATHS, FALLBACK_CONFIG_PATH } from '@shared/constants.js';
import { validateConfig, type AppConfig } from '@shared/schema.js';
import { logger } from './logger.js';

let cachedConfig: AppConfig | null = null;
let cachedConfigPath: string | null = null;

const __dirname = fileURLToPath(new URL('.', import.meta.url));

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

function getFallbackConfigPath(): string {
  // In packaged apps, try multiple paths to find the config
  if (app.isPackaged) {
    // Try app path first (config should be bundled with app, may be unpacked from asar)
    const appPath = path.resolve(app.getAppPath(), FALLBACK_CONFIG_PATH);
    // Try unpacked asar path (if config was unpacked)
    const appDir = path.dirname(app.getAppPath());
    const unpackedPath = path.join(appDir, 'app.asar.unpacked', FALLBACK_CONFIG_PATH);
    // Try resources path (for macOS .app bundles)
    const resourcesPath = path.join(process.resourcesPath, 'app', FALLBACK_CONFIG_PATH);
    // Try __dirname relative path (fallback)
    const dirnamePath = path.resolve(__dirname, '../../', FALLBACK_CONFIG_PATH);

    // Check each path in order
    for (const tryPath of [appPath, unpackedPath, resourcesPath, dirnamePath]) {
      try {
        if (fs.existsSync(tryPath)) {
          return tryPath;
        }
      } catch {
        // Continue to next path
      }
    }
    // If none exist, return appPath as default (will throw error if file doesn't exist)
    return appPath;
  }
  // In development, use __dirname relative path
  return path.resolve(__dirname, '../../', FALLBACK_CONFIG_PATH);
}

export async function loadConfig(): Promise<AppConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configPath = getConfigPath();
  try {
    const raw = await fs.readJSON(configPath);
    cachedConfig = validateConfig(raw);
    logger.info('Loaded config from %s', configPath);
    return cachedConfig;
  } catch (error) {
    logger.warn('Failed to load system config from %s: %s', configPath, error);
  }

  const fallback = getFallbackConfigPath();
  logger.info('Falling back to bundled config at %s', fallback);
  try {
    const bundled = await fs.readJSON(fallback);
    cachedConfig = validateConfig(bundled);
    logger.info('Successfully loaded fallback config');
    return cachedConfig;
  } catch (error) {
    logger.error('Failed to load fallback config from %s: %s', fallback, error);
    throw new Error(`Unable to load configuration: ${error}`);
  }
}

export function resetCachedConfig(): void {
  cachedConfig = null;
}
