import { z } from 'zod';

export const Tile = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(['uri', 'exec', 'youtube', 'emby']),
  winPath: z.string().optional(),
  macPath: z.string().optional(),
  uri: z.string().url().optional(),
  icon: z.string().optional(),
  accent: z.string().optional()
});

export const Profile = z.object({
  id: z.string(),
  name: z.string(),
  pin: z.string().optional(),
  tiles: z.array(Tile).min(1)
});

export const Config = z.object({
  version: z.string(),
  ui: z
    .object({
      rows: z.number().int().min(1).default(2),
      cols: z.number().int().min(3).default(5),
      tileMinPx: z.number().int().min(64).default(128),
      resolutionHint: z.enum(['1440p', '4k']).default('1440p')
    })
    .default({ rows: 2, cols: 5, tileMinPx: 128, resolutionHint: '1440p' }),
  profiles: z.array(Profile).min(1),
  paths: z
    .object({
      youtubeBrowser: z.enum(['edge', 'chrome', 'auto']).default('auto')
    })
    .default({ youtubeBrowser: 'auto' })
});

export type ConfigT = z.infer<typeof Config>;
export type ProfileT = z.infer<typeof Profile>;
export type TileT = z.infer<typeof Tile>;
