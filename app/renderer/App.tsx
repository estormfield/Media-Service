import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppConfig, Profile, LauncherEntry } from '@shared/schema.js';
import LoadingScreen from './components/LoadingScreen.js';
import ProfilePicker from './components/ProfilePicker.js';
import LauncherGrid from './components/LauncherGrid.js';
import Header from './components/Header.js';
import AddTileModal from './components/AddTileModal.js';
import EditTileModal from './components/EditTileModal.js';

type View = 'profiles' | 'tiles';

export default function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);
  const [view, setView] = useState<View>('profiles');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingTile, setEditingTile] = useState<LauncherEntry | null>(null);

  useEffect(() => {
    let mounted = true;

    // Check if window.api is available (preload script loaded correctly)
    if (!window.api) {
      console.error('window.api is not available. Preload script may have failed to load.');
      if (mounted) {
        setError('Preload script failed to load. The application cannot function without it.');
      }
      return () => {
        mounted = false;
      };
    }

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

  const handleAddTile = useCallback(
    async (entry: LauncherEntry) => {
      if (!config || !selectedProfileId) {
        return;
      }

      const updatedConfig: AppConfig = {
        ...config,
        profiles: config.profiles.map((profile) =>
          profile.id === selectedProfileId
            ? {
                ...profile,
                tiles: [...profile.tiles, entry],
              }
            : profile,
        ),
      };

      try {
        const savedConfig = await window.api.saveConfig(updatedConfig);
        setConfig(savedConfig);
      } catch (error) {
        console.error('Failed to save config:', error);
        throw error;
      }
    },
    [config, selectedProfileId],
  );

  const handleToggleEditMode = useCallback((next: boolean) => {
    setEditMode(next);
    if (!next) {
      setEditingTile(null);
    }
  }, []);

  const handleStartEdit = useCallback((entry: LauncherEntry) => {
    setEditingTile(entry);
  }, []);

  const handleUpdateTile = useCallback(
    async (updated: LauncherEntry) => {
      if (!config || !selectedProfileId) {
        return;
      }

      const updatedConfig: AppConfig = {
        ...config,
        profiles: config.profiles.map((profile) =>
          profile.id === selectedProfileId
            ? {
                ...profile,
                tiles: profile.tiles.map((tile) => (tile.id === updated.id ? updated : tile)),
              }
            : profile,
        ),
      };

      try {
        const savedConfig = await window.api.saveConfig(updatedConfig);
        setConfig(savedConfig);
        setEditingTile(null);
      } catch (error) {
        console.error('Failed to save config:', error);
        throw error;
      }
    },
    [config, selectedProfileId],
  );

  const handleDeleteTile = useCallback(
    async (entryId: string) => {
      if (!config || !selectedProfileId) {
        return;
      }

      if (!confirm('Are you sure you want to delete this tile?')) {
        return;
      }

      const updatedConfig: AppConfig = {
        ...config,
        profiles: config.profiles.map((profile) =>
          profile.id === selectedProfileId
            ? {
                ...profile,
                tiles: profile.tiles.filter((tile) => tile.id !== entryId),
              }
            : profile,
        ),
      };

      try {
        const savedConfig = await window.api.saveConfig(updatedConfig);
        setConfig(savedConfig);
      } catch (error) {
        console.error('Failed to save config:', error);
        throw error;
      }
    },
    [config, selectedProfileId],
  );

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
        onAddTile={() => setShowAddModal(true)}
        editMode={editMode}
        onToggleEditMode={handleToggleEditMode}
      />
      <LauncherGrid
        profileId={selectedProfile.id}
        tiles={selectedProfile.tiles}
        isActive
        onLaunch={handleLaunch}
        onBack={handleBackToProfiles}
        editMode={editMode}
        onEdit={handleStartEdit}
        onDelete={handleDeleteTile}
      />
      <AddTileModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddTile}
      />
      <EditTileModal
        isOpen={editingTile !== null}
        tile={editingTile}
        onClose={() => setEditingTile(null)}
        onSave={handleUpdateTile}
      />
    </div>
  );
}
