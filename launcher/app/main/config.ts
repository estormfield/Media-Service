import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { app } from 'electron';
import { Config, type ConfigT } from '../shared/schema';

const CONFIG_PATHS: Record<NodeJS.Platform, string> = {
  win32: 'C:/ProgramData/TVLauncher/config.json',
  darwin: '/Library/Application Support/TVLauncher/config.json',
  linux: path.join(os.homedir(), '.config', 'tvlauncher', 'config.json'),
  aix: '',
  android: '',
  freebsd: '',
  openbsd: '',
  sunos: ''
};

let cachedConfig: ConfigT | undefined;

export const getConfigPath = (): string => {
  const platform = process.platform;
  const specific = CONFIG_PATHS[platform];
  if (specific) {
    return specific;
  }
  return path.join(app.getPath('userData'), 'config.json');
};

export const loadConfig = async (): Promise<ConfigT> => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configPath = getConfigPath();
  const raw = await fs.readFile(configPath, 'utf8');
  const json = JSON.parse(raw);
  const parsed = Config.safeParse(json);
  if (!parsed.success) {
    const errorText = parsed.error.toString();
    await writeLog(`Config validation failed:\n${errorText}`);
    throw new Error(errorText);
  }
  cachedConfig = parsed.data;
  return parsed.data;
};

export const writeLog = async (message: string): Promise<void> => {
  const logDir = app.getPath('logs');
  await fs.mkdir(logDir, { recursive: true });
  const logPath = path.join(logDir, 'tv-launcher.log');
  const stamp = new Date().toISOString();
  await fs.appendFile(logPath, `[${stamp}] ${message}\n`, 'utf8');
};

export const clearCache = (): void => {
  cachedConfig = undefined;
};
