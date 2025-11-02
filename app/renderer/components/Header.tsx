import AutoStartToggle from './AutoStartToggle.js';
import './Header.css';

interface HeaderProps {
  profileName: string;
  autoStartEnabled: boolean;
  onAutoStartChange: (enabled: boolean) => Promise<void>;
  onBack: () => void;
}

export default function Header({
  profileName,
  autoStartEnabled,
  onAutoStartChange,
  onBack,
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
      <AutoStartToggle enabled={autoStartEnabled} onToggle={onAutoStartChange} />
    </header>
  );
}
