import create from 'zustand';
import type { ConfigT, Profile, Tile } from '../../shared/types';

interface LauncherState {
  config?: ConfigT;
  activeProfileId?: string;
  focusIndex: number;
  isPickerVisible: boolean;
  error?: string;
  launchingTileId?: string;
  setConfig: (config: ConfigT) => void;
  showError: (message: string) => void;
  clearError: () => void;
  selectProfile: (profileId: string) => void;
  returnToPicker: () => void;
  moveFocus: (delta: number) => void;
  setFocusIndex: (updater: number | ((current: number) => number)) => void;
  setLaunchingTile: (tileId?: string) => void;
}

export const wrapIndex = (current: number, delta: number, total: number): number => {
  if (total === 0) return 0;
  const next = (current + delta) % total;
  return next < 0 ? next + total : next;
};

export const useLauncherStore = create<LauncherState>((set) => ({
  focusIndex: 0,
  isPickerVisible: true,
  setConfig: (config) => set({ config }),
  showError: (message) => set({ error: message }),
  clearError: () => set({ error: undefined }),
  selectProfile: (profileId) => set({ activeProfileId: profileId, isPickerVisible: false, focusIndex: 0 }),
  returnToPicker: () => set({ isPickerVisible: true, launchingTileId: undefined, activeProfileId: undefined }),
  moveFocus: (delta) =>
    set((state) => {
      const profile = state.config?.profiles.find((p) => p.id === state.activeProfileId);
      if (!profile) return state;
      const total = profile.tiles.length;
      const next = wrapIndex(state.focusIndex, delta, total);
      return { ...state, focusIndex: next };
    }),
  setFocusIndex: (updater) =>
    set((state) => ({ focusIndex: typeof updater === 'function' ? updater(state.focusIndex) : updater })),
  setLaunchingTile: (tileId) => set({ launchingTileId: tileId })
}));

export const selectActiveProfile = (state: LauncherState): Profile | undefined =>
  state.config?.profiles.find((p) => p.id === state.activeProfileId);

export const selectTiles = (state: LauncherState): Tile[] =>
  selectActiveProfile(state)?.tiles ?? [];
