import type { ConfigT } from '../shared/types';

export interface RendererAPI {
  getConfig: () => Promise<ConfigT>;
  launchTile: (profileId: string, tileId: string) => Promise<void>;
  onChildExit: (callback: (tileId: string) => void) => () => void;
  onConfigUpdate: (callback: (config: ConfigT) => void) => () => void;
  onConfigError: (callback: (message: string) => void) => () => void;
  notifyProfileChange: (profileId: string) => void;
  requestCursorHide: () => void;
  requestCursorShow: () => void;
}

declare global {
  interface Window {
    launcher: RendererAPI;
  }
}
