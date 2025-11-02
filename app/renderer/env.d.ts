/// <reference types="vite/client" />

interface Window {
  launcher: import('@shared/ipc').RendererApi;
}
