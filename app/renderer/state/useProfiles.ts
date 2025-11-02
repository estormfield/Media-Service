import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppConfig, Profile } from '@shared/schema';

export function useProfiles() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isPickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    void window.launcher
      .getConfig()
      .then((loadedConfig) => {
        setConfig(loadedConfig);
        setActiveProfileId(loadedConfig.defaultProfileId);
      })
      .catch((error) => {
        console.error('Failed to load configuration', error);
      });
  }, []);

  useEffect(() => {
    function handlePickerOpen() {
      setPickerOpen(true);
    }

    window.addEventListener('profile-picker:show', handlePickerOpen);
    return () => {
      window.removeEventListener('profile-picker:show', handlePickerOpen);
    };
  }, []);

  const profiles = config?.profiles ?? [];
  const activeProfile = useMemo<Profile | null>(() => {
    if (!config || !activeProfileId) {
      return null;
    }

    return config.profiles.find((profile) => profile.id === activeProfileId) ?? null;
  }, [config, activeProfileId]);

  const selectProfile = useCallback((profileId: string) => {
    setActiveProfileId(profileId);
    setPickerOpen(false);
  }, []);

  const openProfilePicker = useCallback(() => setPickerOpen(true), []);
  const closeProfilePicker = useCallback(() => setPickerOpen(false), []);

  return {
    config,
    profiles,
    activeProfile,
    activeProfileId,
    selectProfile,
    openProfilePicker,
    closeProfilePicker,
    isPickerOpen,
    ready: Boolean(config && activeProfile),
  } as const;
}
