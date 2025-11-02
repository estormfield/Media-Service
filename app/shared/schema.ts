import { z } from 'zod';

export const LauncherSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('youtube'),
    id: z.string().min(1),
    title: z.string().min(1),
    url: z.string().url(),
    browserPath: z.string().min(1).optional(),
    browserArgs: z.array(z.string()).optional(),
  }),
  z.object({
    type: z.literal('emby'),
    id: z.string().min(1),
    title: z.string().min(1),
    executablePath: z.string().min(1),
    args: z.array(z.string()).optional(),
  }),
  z.object({
    type: z.literal('game'),
    id: z.string().min(1),
    title: z.string().min(1),
    executablePath: z.string().min(1),
    args: z.array(z.string()).optional(),
    workingDirectory: z.string().optional(),
  }),
]);

export type Launcher = z.infer<typeof LauncherSchema>;

export const ProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  launchers: z.array(LauncherSchema).min(1),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const AppConfigSchema = z.object({
  defaultProfileId: z.string().min(1),
  profiles: z.array(ProfileSchema).min(1),
  youtubeBrowserPath: z.string().min(1).optional(),
  embyExecutablePath: z.string().min(1).optional(),
  gameBasePath: z.string().min(1).optional(),
  lastUpdated: z.string().optional(),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

export const PROFILE_PICKER_CHANNEL = 'profile-picker';
