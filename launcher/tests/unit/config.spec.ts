import { describe, expect, it } from 'vitest';
import { Config } from '../../app/shared/schema';

describe('Config schema', () => {
  it('accepts valid config', () => {
    const result = Config.safeParse({
      version: '1.0.0',
      ui: { rows: 2, cols: 5, tileMinPx: 128, resolutionHint: '1440p' },
      profiles: [
        {
          id: 'default',
          name: 'Default',
          tiles: [{ id: 'yt', label: 'YouTube', kind: 'youtube' }]
        }
      ],
      paths: { youtubeBrowser: 'auto' }
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing profiles', () => {
    const result = Config.safeParse({ version: '1.0.0', profiles: [] });
    expect(result.success).toBe(false);
  });
});
