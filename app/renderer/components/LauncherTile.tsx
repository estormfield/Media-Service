import type { LauncherEntry } from '@shared/schema.js';
import './LauncherTile.css';

interface LauncherTileProps {
  entry: LauncherEntry;
  focused: boolean;
  onActivate: () => void;
  onFocus: () => void;
  editMode: boolean;
  onEdit: (entry: LauncherEntry) => void;
  onDelete: (entryId: string) => void;
}

export default function LauncherTile({
  entry,
  focused,
  onActivate,
  onFocus,
  editMode,
  onEdit,
  onDelete,
}: LauncherTileProps) {
  const className = focused ? 'launcher-tile launcher-tile--focused' : 'launcher-tile';

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(entry);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(entry.id);
  };

  return (
    <div className="launcher-tile-wrapper">
      <button
        type="button"
        className={className}
        onClick={editMode ? undefined : onActivate}
        onMouseEnter={onFocus}
        onFocus={onFocus}
        disabled={editMode}
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
          {entry.subtitle ? (
            <span className="launcher-tile__subtitle">{entry.subtitle}</span>
          ) : null}
          <span className="launcher-tile__badge">{entry.kind.toUpperCase()}</span>
        </div>
      </button>
      {editMode && (
        <div className="launcher-tile__overlay">
          <button
            type="button"
            className="launcher-tile__edit-btn"
            onClick={handleEditClick}
            aria-label={`Edit ${entry.title}`}
          >
            Edit
          </button>
          <button
            type="button"
            className="launcher-tile__delete-btn"
            onClick={handleDeleteClick}
            aria-label={`Delete ${entry.title}`}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
