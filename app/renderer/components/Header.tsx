import AutoStartToggle from './AutoStartToggle.js';
import './Header.css';

interface HeaderProps {
  profileName: string;
  autoStartEnabled: boolean;
  onAutoStartChange: (enabled: boolean) => Promise<void>;
  onBack: () => void;
  onAddTile?: () => void;
  editMode?: boolean;
  onToggleEditMode?: (next: boolean) => void;
}

export default function Header({
  profileName,
  autoStartEnabled,
  onAutoStartChange,
  onBack,
  onAddTile,
  editMode = false,
  onToggleEditMode,
}: HeaderProps) {
  return (
    <header className="launcher-header">
      <button type="button" className="launcher-header__back" onClick={onBack}>
        ? Profiles
      </button>
      <div className="launcher-header__titles">
        <h1 className="launcher-header__title">TenFoot Launcher</h1>
        <p className="launcher-header__subtitle">Active profile: {profileName}</p>
      </div>
      <div className="launcher-header__actions">
        {onAddTile && (
          <button type="button" className="launcher-header__add-tile" onClick={onAddTile}>
            + Add Tile
          </button>
        )}
        {onToggleEditMode && (
          <button
            type="button"
            className="launcher-header__edit-mode"
            onClick={() => onToggleEditMode(!editMode)}
          >
            {editMode ? 'Done' : 'Edit Mode'}
          </button>
        )}
        <AutoStartToggle enabled={autoStartEnabled} onToggle={onAutoStartChange} />
      </div>
    </header>
  );
}
