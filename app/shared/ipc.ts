import type { AppConfig } from './schema.js';

export const IPC_CHANNELS = {
  CONFIG_GET: 'config:get',
  LAUNCH_ENTRY: 'launcher:launch',
  PROFILE_SELECTED: 'profile:selected',
  OPEN_PROFILE_PICKER: 'ui:openProfilePicker',
  AUTO_START_STATUS: 'system:autoStartStatus',
  AUTO_START_ENABLE: 'system:autoStartEnable',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

export interface LaunchEntryPayload {
  profileId: string;
  entryId: string;
}

export interface ProfileSelectionPayload {
  profileId: string;
}

export interface AutoStartStatusPayload {
  enabled: boolean;
}

export interface AppBootstrapPayload {
  config: AppConfig;
  autoStartEnabled: boolean;
}
