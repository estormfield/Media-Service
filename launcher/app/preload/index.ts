import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels, type ConfigT } from '../shared/types';
import type { RendererAPI } from './api.d.ts';

const api: RendererAPI = {
  getConfig: () => ipcRenderer.invoke(IpcChannels.getConfig) as Promise<ConfigT>,
  launchTile: (profileId, tileId) => ipcRenderer.invoke(IpcChannels.launchTile, profileId, tileId),
  onChildExit: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, tileId: string) => callback(tileId);
    ipcRenderer.on(IpcChannels.childExit, handler);
    return () => ipcRenderer.off(IpcChannels.childExit, handler);
  },
  onConfigUpdate: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: ConfigT) => callback(payload);
    ipcRenderer.on(IpcChannels.getConfig, handler);
    return () => ipcRenderer.off(IpcChannels.getConfig, handler);
  },
  onConfigError: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: { message: string }) =>
      callback(payload.message);
    ipcRenderer.on(IpcChannels.configError, handler);
    return () => ipcRenderer.off(IpcChannels.configError, handler);
  },
  notifyProfileChange: (profileId) => {
    ipcRenderer.send(IpcChannels.profileChanged, profileId);
  },
  requestCursorHide: () => {
    ipcRenderer.send(IpcChannels.cursorHide);
  },
  requestCursorShow: () => {
    ipcRenderer.send(IpcChannels.cursorShow);
  }
};

contextBridge.exposeInMainWorld('launcher', api);
