import type { ConfigT, Profile, Tile } from '../shared/types';

export interface LaunchRequest {
  tile: Tile;
  profile: Profile;
}

export interface LaunchResponse {
  success: boolean;
  error?: string;
}

export interface ConfigErrorPayload {
  message: string;
}

export type ConfigListener = (config: ConfigT) => void;
