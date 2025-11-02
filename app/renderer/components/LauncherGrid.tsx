import type { Launcher } from '@shared/schema';
import { Tile } from './Tile';

export type LauncherGridProps = {
  launchers: Launcher[];
  focusedIndex: number;
  onFocus: (index: number) => void;
  onActivate: (launcher: Launcher) => void;
};

export function LauncherGrid({ launchers, focusedIndex, onFocus, onActivate }: LauncherGridProps) {
  return (
    <div className="launcher-grid" role="list">
      {launchers.map((launcher, index) => (
        <Tile
          key={launcher.id}
          launcher={launcher}
          isFocused={index === focusedIndex}
          onFocus={() => onFocus(index)}
          onActivate={() => onActivate(launcher)}
        />
      ))}
    </div>
  );
}
