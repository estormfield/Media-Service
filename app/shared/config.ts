import { readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { AppConfigSchema, type AppConfig } from './schema';

export const CONFIG_PATHS = {
  win32: path.join(process.env.ALLUSERSPROFILE ?? 'C:/ProgramData', 'MediaService', 'config.json'),
  darwin: '/Library/Application Support/MediaService/config.json',
  linux: '/etc/mediaservice/config.json',
} as const;

let cachedConfig: AppConfig | undefined;

export async function loadConfig(): Promise<AppConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  const targetPath = getConfigPath();
  const raw = await readFile(targetPath, 'utf-8');
  const parsed = AppConfigSchema.parse(JSON.parse(raw));
  cachedConfig = parsed;
  return parsed;
}

export function getConfigPath(): string {
  if (process.env.MEDIA_SERVICE_CONFIG) {
    return process.env.MEDIA_SERVICE_CONFIG;
  }

  const platform = process.platform as keyof typeof CONFIG_PATHS;
  return CONFIG_PATHS[platform] ?? path.join(os.homedir(), '.config', 'mediaservice', 'config.json');
}

export function resetCache(): void {
  cachedConfig = undefined;
}
