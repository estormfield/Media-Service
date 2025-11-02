export const CONFIG_PATHS: Record<NodeJS.Platform, string> = {
  win32: 'C:/ProgramData/TenFootLauncher/config.json',
  darwin: '/Library/Application Support/TenFootLauncher/config.json',
  linux: '/etc/tenfoot-launcher/config.json',
  aix: '/etc/tenfoot-launcher/config.json',
  android: '/etc/tenfoot-launcher/config.json',
  freebsd: '/etc/tenfoot-launcher/config.json',
  openbsd: '/etc/tenfoot-launcher/config.json',
  sunos: '/etc/tenfoot-launcher/config.json',
  haiku: '/etc/tenfoot-launcher/config.json',
  cygwin: '/etc/tenfoot-launcher/config.json',
  netbsd: '/etc/tenfoot-launcher/config.json'
};

export const FALLBACK_CONFIG_PATH = './config/config.sample.json';

export const AUTO_LAUNCH_AGENT_ID = 'com.example.tenfootlauncher';
export const WINDOWS_STARTUP_SHORTCUT = 'TenFootLauncher.lnk';
