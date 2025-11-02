import type { AppConfig, Launcher, Profile } from './schema';

export function findProfile(config: AppConfig, profileId: string): Profile {
  const profile = config.profiles.find((item) => item.id === profileId);
  if (!profile) {
    throw new Error(`Profile ${profileId} not found`);
  }

  return profile;
}

export function findLauncher(profile: Profile, launcherId: string): Launcher {
  const launcher = profile.launchers.find((item) => item.id === launcherId);
  if (!launcher) {
    throw new Error(`Launcher ${launcherId} not found in profile ${profile.id}`);
  }

  return launcher;
}
