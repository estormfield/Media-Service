import type { ConfigT, ProfileT, TileT } from './schema';

export type { ConfigT, ProfileT as Profile, TileT as Tile };

export enum IpcChannels {
  getConfig = 'config:get',
  launchTile = 'tile:launch',
  childExit = 'child:exit',
  configError = 'config:error',
  profileChanged = 'profile:changed',
  cursorHide = 'cursor:hide',
  cursorShow = 'cursor:show'
}

export enum TileKind {
  uri = 'uri',
  exec = 'exec',
  youtube = 'youtube',
  emby = 'emby'
}
