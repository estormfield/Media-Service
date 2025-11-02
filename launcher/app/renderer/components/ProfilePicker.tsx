import { useEffect, useMemo, useState } from 'react';
import type { ConfigT, Profile } from '../../shared/types';
import { useLauncherStore } from '../state/store';

interface ProfilePickerProps {
  config?: ConfigT;
}

export const ProfilePicker = ({ config }: ProfilePickerProps) => {
  const selectProfile = useLauncherStore((state) => state.selectProfile);
  const showError = useLauncherStore((state) => state.showError);
  const [pinCandidate, setPinCandidate] = useState('');
  const [pendingProfile, setPendingProfile] = useState<Profile | null>(null);

  const profiles = useMemo(() => config?.profiles ?? [], [config]);

  useEffect(() => {
    setPinCandidate('');
    setPendingProfile(null);
  }, [config]);

  const attemptSelect = (profile: Profile) => {
    if (profile.pin) {
      setPendingProfile(profile);
    } else {
      selectProfile(profile.id);
      window.launcher.notifyProfileChange(profile.id);
    }
  };

  const submitPin = () => {
    if (!pendingProfile) return;
    if (pendingProfile.pin === pinCandidate) {
      selectProfile(pendingProfile.id);
      window.launcher.notifyProfileChange(pendingProfile.id);
      setPinCandidate('');
      setPendingProfile(null);
    } else {
      showError('Incorrect PIN');
      setPinCandidate('');
    }
  };

  return (
    <div className="profile-picker">
      <h1 className="profile-picker__title">Who\'s watching?</h1>
      <div className="profile-picker__grid">
        {profiles.map((profile) => (
          <button key={profile.id} className="profile-picker__option" onClick={() => attemptSelect(profile)}>
            {profile.name}
          </button>
        ))}
      </div>
      {pendingProfile ? (
        <div className="profile-picker__pin">
          <p>Enter PIN for {pendingProfile.name}</p>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pinCandidate}
            onChange={(event) => setPinCandidate(event.target.value)}
            maxLength={8}
          />
          <div className="profile-picker__actions">
            <button onClick={submitPin}>Unlock</button>
            <button onClick={() => setPendingProfile(null)}>Cancel</button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
