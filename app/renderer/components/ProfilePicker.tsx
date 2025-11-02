import type { Profile } from '@shared/schema.js';
import { useDpadNavigation } from '../hooks/useDpadNavigation.js';
import './ProfilePicker.css';

interface ProfilePickerProps {
  profiles: Profile[];
  isActive: boolean;
  onSelect: (profileId: string) => void;
}

export default function ProfilePicker({ profiles, isActive, onSelect }: ProfilePickerProps) {
  const navigation = useDpadNavigation({
    itemCount: profiles.length,
    columns: 1,
    isActive,
    onSelect: (index) => {
      const profile = profiles[index];
      if (profile) {
        onSelect(profile.id);
      }
    }
  });

  return (
    <div className="profile-picker" role="menu" aria-label="Select profile">
      <h1 className="profile-picker__title">Who is using TenFoot Launcher?</h1>
      <div className="profile-picker__grid">
        {profiles.map((profile, index) => {
          const focused = navigation.isFocused(index);
          return (
            <button
              key={profile.id}
              type="button"
              role="menuitemradio"
              aria-checked={focused}
              className={focused ? 'profile-card profile-card--focused' : 'profile-card'}
              onFocus={() => navigation.requestFocus(index)}
              onMouseEnter={() => navigation.requestFocus(index)}
              onClick={() => onSelect(profile.id)}
            >
              <span className="profile-card__avatar" aria-hidden="true">
                {profile.displayName.slice(0, 1).toUpperCase()}
              </span>
              <span className="profile-card__name">{profile.displayName}</span>
            </button>
          );
        })}
      </div>
      <p className="profile-picker__hint">Use DPAD to navigate ? Enter to confirm</p>
    </div>
  );
}
