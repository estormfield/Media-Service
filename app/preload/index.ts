import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, type RendererApi } from '@shared/ipc';

const api: RendererApi = {
  getConfig: () => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET),
  launch: (profileId, launcherId) => ipcRenderer.invoke(IPC_CHANNELS.LAUNCH, profileId, launcherId),
  openProfilePicker: () => ipcRenderer.send(IPC_CHANNELS.PROFILE_PICKER_OPEN),
};

contextBridge.exposeInMainWorld('launcher', api);

ipcRenderer.on('profile-picker:show', () => {
  window.dispatchEvent(new CustomEvent('profile-picker:show'));
});

ipcRenderer.on('update:downloaded', () => {
  window.dispatchEvent(new CustomEvent('update:downloaded'));
});
