import { z } from 'zod';

export const launcherEntrySchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('youtube'),
    id: z.string().min(1),
    url: z.string().url(),
    browserPath: z.string().min(1).optional(),
    browserArgs: z.array(z.string()).default(() => ['--app=%URL%']),
    title: z.string().min(1),
    subtitle: z.string().optional(),
    artwork: z.string().optional(),
  }),
  z.object({
    kind: z.literal('web'),
    id: z.string().min(1),
    url: z.string().url(),
    title: z.string().min(1),
    subtitle: z.string().optional(),
    artwork: z.string().optional(),
    allowedHosts: z
      .array(z.string().min(1))
      .optional()
      .refine(
        (hosts) => {
          if (!hosts) return true;
          return hosts.every((h) => {
            // Allow exact hostnames or wildcard patterns like *.example.com
            return /^(\*\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(
              h,
            );
          });
        },
        {
          message: 'Each allowed host must be a valid hostname or wildcard pattern (*.example.com)',
        },
      ),
  }),
  z.object({
    kind: z.literal('emby'),
    id: z.string().min(1),
    executable: z.string().min(1),
    args: z.array(z.string()).default(() => []),
    workingDirectory: z.string().optional(),
    title: z.string().min(1),
    subtitle: z.string().optional(),
    artwork: z.string().optional(),
  }),
  z.object({
    kind: z.literal('game'),
    id: z.string().min(1),
    executable: z.string().min(1),
    args: z.array(z.string()).default(() => []),
    workingDirectory: z.string().optional(),
    title: z.string().min(1),
    subtitle: z.string().optional(),
    artwork: z.string().optional(),
  }),
]);

export const profileSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  tiles: z.array(launcherEntrySchema).default([]),
});

export const settingsSchema = z.object({
  autoStart: z.boolean().default(true),
  githubOwner: z.string().min(1),
  githubRepo: z.string().min(1),
  updateChannel: z.enum(['stable', 'beta']).default('stable'),
  window: z
    .object({
      width: z.number().int().positive().default(2560),
      height: z.number().int().positive().default(1440),
    })
    .default({ width: 2560, height: 1440 }),
});

export const appConfigSchema = z.object({
  version: z.string().default('1'),
  profiles: z.array(profileSchema).min(1),
  settings: settingsSchema,
});

export type LauncherEntry = z.infer<typeof launcherEntrySchema>;
export type Profile = z.infer<typeof profileSchema>;
export type LauncherSettings = z.infer<typeof settingsSchema>;
export type AppConfig = z.infer<typeof appConfigSchema>;

export function validateConfig(raw: unknown): AppConfig {
  return appConfigSchema.parse(raw);
}
