import type { FC } from 'react';
import type { Tile as TileType } from '../../shared/types';
import { FocusRing } from './FocusRing';

interface TileProps {
  tile: TileType;
  focused: boolean;
  onActivate: () => void;
}

export const Tile: FC<TileProps> = ({ tile, focused, onActivate }) => {
  return (
    <button
      className={`tile${focused ? ' tile--focused' : ''}`}
      onClick={onActivate}
      data-tile-id={tile.id}
      style={{ borderColor: tile.accent ?? 'transparent', position: 'relative', overflow: 'hidden' }}
    >
      <FocusRing visible={focused} />
      {tile.icon ? <img src={tile.icon} alt="" className="tile__icon" /> : null}
      <span className="tile__label">{tile.label}</span>
    </button>
  );
};
