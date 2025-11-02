import { useEffect } from 'react';
import type { ConfigT } from '../../shared/types';
import { useLauncherStore, selectTiles } from '../state/store';
import { Tile } from './Tile';
import { useDpad } from '../hooks/useDpad';

interface GridProps {
  config: ConfigT;
}

export const Grid = ({ config }: GridProps) => {
  const tiles = useLauncherStore(selectTiles);
  const focusIndex = useLauncherStore((state) => state.focusIndex);
  const setFocusIndex = useLauncherStore((state) => state.setFocusIndex);
  const moveFocus = useLauncherStore((state) => state.moveFocus);
  const launchingTileId = useLauncherStore((state) => state.launchingTileId);
  const profileId = useLauncherStore((state) => state.activeProfileId);
  const setLaunchingTile = useLauncherStore((state) => state.setLaunchingTile);
  const showError = useLauncherStore((state) => state.showError);

  const triggerLaunch = (tileId: string) => {
    if (!profileId) return;
    setLaunchingTile(tileId);
    window.launcher
      .launchTile(profileId, tileId)
      .catch((error) => showError(error instanceof Error ? error.message : String(error)));
  };

  useDpad({
    cols: config.ui.cols,
    total: tiles.length,
    onMove: (delta) => moveFocus(delta),
    onSelect: () => {
      const tile = tiles[focusIndex];
      if (!tile) return;
      triggerLaunch(tile.id);
    },
    onBack: () => {
      useLauncherStore.getState().returnToPicker();
      window.launcher.notifyProfileChange('');
    }
  });

  useEffect(() => {
    const dispose = window.launcher.onChildExit((tileId) => {
      if (useLauncherStore.getState().launchingTileId === tileId) {
        setLaunchingTile(undefined);
      }
    });
    return () => dispose();
  }, [setLaunchingTile]);

  useEffect(() => {
    setFocusIndex(0);
  }, [profileId, setFocusIndex]);

  return (
    <div
      className="tile-grid"
      style={{
        gridTemplateColumns: `repeat(${config.ui.cols}, minmax(${config.ui.tileMinPx}px, 1fr))`
      }}
    >
      {tiles.map((tile, index) => (
        <Tile key={tile.id} tile={tile} focused={index === focusIndex} onActivate={() => triggerLaunch(tile.id)} />
      ))}
      {launchingTileId ? <div className="tile-grid__overlay">Launching…</div> : null}
    </div>
  );
};
