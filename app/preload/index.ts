import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, type LaunchEntryPayload, type AppBootstrapPayload } from '@shared/ipc.js';
import type { AppConfig } from '@shared/schema.js';

const api = {
  getBootstrap: (): Promise<AppBootstrapPayload> => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET),
  launchEntry: (payload: LaunchEntryPayload): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.LAUNCH_ENTRY, payload),
  setAutoStart: (enabled: boolean): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.AUTO_START_ENABLE, enabled),
  pickFile: (): Promise<string | null> => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_PICK_FILE),
  getDefaultBrowser: (): Promise<string | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_DEFAULT_BROWSER),
  saveConfig: (config: AppConfig): Promise<AppConfig> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SAVE, config),
};

contextBridge.exposeInMainWorld('api', api);

export type PreloadApi = typeof api;
