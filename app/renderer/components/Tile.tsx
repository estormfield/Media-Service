import type { Launcher } from '@shared/schema';
import '../styles/launcher-grid.css';

type TileProps = {
  launcher: Launcher;
  isFocused: boolean;
  onFocus: () => void;
  onActivate: () => void;
};

export function Tile({ launcher, isFocused, onFocus, onActivate }: TileProps) {
  return (
    <button
      type="button"
      className={`button-reset launcher-tile${isFocused ? ' launcher-tile--focused' : ''}`}
      onMouseEnter={onFocus}
      onFocus={onFocus}
      onClick={onActivate}
    >
      <span className="launcher-tile__type">{launcher.type}</span>
      <h3 className="launcher-tile__title">{launcher.title}</h3>
    </button>
  );
}
