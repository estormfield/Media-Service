import type { AppConfig } from './schema';

export type RendererApi = {
  getConfig: () => Promise<AppConfig>;
  launch: (profileId: string, launcherId: string) => Promise<void>;
  openProfilePicker: () => void;
};

export const IPC_CHANNELS = {
  CONFIG_GET: 'config:get',
  LAUNCH: 'launcher:launch',
  PROFILE_PICKER_OPEN: 'profile-picker:open',
} as const;
