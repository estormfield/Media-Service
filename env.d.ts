import type { PreloadApi } from './app/preload/index';

declare global {
  interface Window {
    api: PreloadApi;
  }
}

export {};
