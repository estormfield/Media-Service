import type { PreloadApi } from './app/preload/index';

declare global {
  interface Window {
    api: PreloadApi;
    __playwrightLaunches__?: Array<{ profileId: string; entryId: string }>;
    __playwrightAutoStartCalls__?: boolean[];
  }
}

export {};
