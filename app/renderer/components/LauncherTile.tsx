import type { LauncherEntry } from '@shared/schema.js';
import './LauncherTile.css';

interface LauncherTileProps {
  entry: LauncherEntry;
  focused: boolean;
  onActivate: () => void;
  onFocus: () => void;
}

export default function LauncherTile({ entry, focused, onActivate, onFocus }: LauncherTileProps) {
  const className = focused ? 'launcher-tile launcher-tile--focused' : 'launcher-tile';

  return (
    <button
      type="button"
      className={className}
      onClick={onActivate}
      onMouseEnter={onFocus}
      onFocus={onFocus}
    >
      {entry.artwork ? (
        <img className="launcher-tile__art" src={entry.artwork} alt="" aria-hidden="true" />
      ) : (
        <div className="launcher-tile__placeholder" aria-hidden="true">
          {entry.title.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="launcher-tile__meta">
        <span className="launcher-tile__title">{entry.title}</span>
        {entry.subtitle ? <span className="launcher-tile__subtitle">{entry.subtitle}</span> : null}
        <span className="launcher-tile__badge">{entry.kind.toUpperCase()}</span>
      </div>
    </button>
  );
}
