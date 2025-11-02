import type { Profile } from '@shared/schema';
import '../styles/profile-picker.css';

type ProfilePickerProps = {
  profiles: Profile[];
  activeProfileId: string;
  isOpen: boolean;
  onSelect: (profileId: string) => void;
  onClose: () => void;
};

export function ProfilePicker({ profiles, activeProfileId, isOpen, onSelect, onClose }: ProfilePickerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="profile-picker__backdrop" role="dialog" aria-modal>
      <div className="profile-picker">
        <h2>Select Profile</h2>
        <div className="profile-picker__list">
          {profiles.map((profile) => {
            const isActive = profile.id === activeProfileId;
            return (
              <button
                key={profile.id}
                type="button"
                className={`profile-picker__button${isActive ? ' profile-picker__button--active' : ''}`}
                onClick={() => {
                  onSelect(profile.id);
                  onClose();
                }}
              >
                <div>{profile.name}</div>
                {profile.description ? (
                  <div className="profile-picker__description">{profile.description}</div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
