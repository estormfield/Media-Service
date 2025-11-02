import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Launcher } from '@shared/schema';
import { LauncherGrid } from './components/LauncherGrid';
import { ProfilePicker } from './components/ProfilePicker';
import { useProfiles } from './state/useProfiles';
import { useDpadNavigation } from './hooks/useDpadNavigation';
import './styles/app.css';

export default function App() {
  const {
    activeProfile,
    activeProfileId,
    profiles,
    selectProfile,
    openProfilePicker,
    closeProfilePicker,
    isPickerOpen,
    ready,
  } = useProfiles();
  const [hasUpdate, setHasUpdate] = useState(false);

  const launchers = activeProfile?.launchers ?? [];

  const handleActivate = useCallback(
    (launcher: Launcher) => {
      if (!activeProfileId) {
        return;
      }

      void window.launcher.launch(activeProfileId, launcher.id);
    },
    [activeProfileId],
  );

  const { focusedIndex, setFocusedIndex } = useDpadNavigation({
    itemCount: launchers.length,
    columns: 3,
    onActivate: (index) => {
      const launcher = launchers[index];
      if (launcher) {
        handleActivate(launcher);
      }
    },
    onOpenProfilePicker: openProfilePicker,
  });

  useEffect(() => {
    setFocusedIndex(0);
  }, [activeProfileId, setFocusedIndex]);

  useEffect(() => {
    function handleUpdate() {
      setHasUpdate(true);
    }

    window.addEventListener('update:downloaded', handleUpdate);
    return () => {
      window.removeEventListener('update:downloaded', handleUpdate);
    };
  }, []);

  const subtitle = useMemo(() => {
    if (!activeProfile) {
      return 'Loading profiles...';
    }

    return `${activeProfile.name} • ${activeProfile.launchers.length} apps ready`;
  }, [activeProfile]);

  if (!ready) {
    return (
      <div className="app">
        <div className="app__header">
          <h1 className="app__title">Media Service Launcher</h1>
          <div className="app__subtitle">Loading configuration...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {hasUpdate ? <div className="app__status-banner">Update downloaded. Restart to apply.</div> : null}
      <div className="app__header">
        <div>
          <h1 className="app__title">Media Service Launcher</h1>
          <div className="app__subtitle">{subtitle}</div>
        </div>
        <div className="app__subtitle">Press Home or Back to change profiles</div>
      </div>
      <div className="app__body">
        <LauncherGrid
          launchers={launchers}
          focusedIndex={focusedIndex}
          onFocus={setFocusedIndex}
          onActivate={handleActivate}
        />
      </div>
      <ProfilePicker
        profiles={profiles}
        activeProfileId={activeProfileId ?? ''}
        isOpen={isPickerOpen}
        onSelect={selectProfile}
        onClose={closeProfilePicker}
      />
    </div>
  );
}
