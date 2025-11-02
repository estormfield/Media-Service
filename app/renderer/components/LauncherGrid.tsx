import type { LauncherEntry } from '@shared/schema.js';
import { useDpadNavigation } from '../hooks/useDpadNavigation.js';
import LauncherTile from './LauncherTile.js';
import './LauncherGrid.css';

interface LauncherGridProps {
  profileId: string;
  tiles: LauncherEntry[];
  isActive: boolean;
  onLaunch: (entryId: string) => void;
  onBack: () => void;
}

export default function LauncherGrid({
  profileId,
  tiles,
  isActive,
  onLaunch,
  onBack,
}: LauncherGridProps) {
  const navigation = useDpadNavigation({
    itemCount: tiles.length,
    columns: 3,
    isActive,
    onSelect: (index) => {
      const tile = tiles[index];
      if (tile) {
        onLaunch(tile.id);
      }
    },
    onBack,
  });

  return (
    <section className="launcher-grid" aria-label={`Launcher tiles for profile ${profileId}`}>
      <div className="launcher-grid__tiles">
        {tiles.map((tile, index) => (
          <LauncherTile
            key={tile.id}
            entry={tile}
            focused={navigation.isFocused(index)}
            onActivate={() => onLaunch(tile.id)}
            onFocus={() => navigation.requestFocus(index)}
          />
        ))}
      </div>
      <div className="launcher-grid__hint">
        DPAD to navigate ? Enter to launch ? Back/Home to switch profiles
      </div>
    </section>
  );
}
