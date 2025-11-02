import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppConfig, Profile } from '@shared/schema.js';
import LoadingScreen from './components/LoadingScreen.js';
import ProfilePicker from './components/ProfilePicker.js';
import LauncherGrid from './components/LauncherGrid.js';
import Header from './components/Header.js';

type View = 'profiles' | 'tiles';

export default function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);
  const [view, setView] = useState<View>('profiles');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    window.api
      .getBootstrap()
      .then((payload) => {
        if (!mounted) {
          return;
        }
        setConfig(payload.config);
        setAutoStartEnabled(payload.autoStartEnabled);
        setSelectedProfileId(payload.config.profiles[0]?.id ?? null);
      })
      .catch((err) => {
        console.error(err);
        if (mounted) {
          setError('Unable to load launcher configuration.');
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const selectedProfile: Profile | null = useMemo(() => {
    if (!config || !selectedProfileId) {
      return null;
    }
    return config.profiles.find((profile) => profile.id === selectedProfileId) ?? null;
  }, [config, selectedProfileId]);

  const handleProfileSelect = useCallback((profileId: string) => {
    setSelectedProfileId(profileId);
    setView('tiles');
  }, []);

  const handleLaunch = useCallback(
    async (entryId: string) => {
      if (!selectedProfileId) {
        return;
      }
      await window.api.launchEntry({ profileId: selectedProfileId, entryId });
    },
    [selectedProfileId],
  );

  const handleBackToProfiles = useCallback(() => {
    setView('profiles');
  }, []);

  const handleAutoStartChange = useCallback(async (nextEnabled: boolean) => {
    const confirmed = await window.api.setAutoStart(nextEnabled);
    setAutoStartEnabled(confirmed);
  }, []);

  if (error) {
    return (
      <div className="app-error" role="alert">
        <h1>Something went wrong</h1>
        <p>{error}</p>
        <p>Check that the system-wide config file is valid.</p>
      </div>
    );
  }

  if (!config) {
    return <LoadingScreen />;
  }

  if (view === 'profiles') {
    return <ProfilePicker profiles={config.profiles} isActive onSelect={handleProfileSelect} />;
  }

  if (!selectedProfile) {
    return <LoadingScreen />;
  }

  return (
    <div className="launcher-screen">
      <Header
        profileName={selectedProfile.displayName}
        autoStartEnabled={autoStartEnabled}
        onAutoStartChange={handleAutoStartChange}
        onBack={handleBackToProfiles}
      />
      <LauncherGrid
        profileId={selectedProfile.id}
        tiles={selectedProfile.tiles}
        isActive
        onLaunch={handleLaunch}
        onBack={handleBackToProfiles}
      />
    </div>
  );
}
