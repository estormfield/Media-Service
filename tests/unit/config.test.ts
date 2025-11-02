import { describe, expect, it } from 'vitest';
import { AppConfigSchema } from '@shared/schema';
import sample from '../../config/config.sample.json';

describe('AppConfigSchema', () => {
  it('validates sample configuration', () => {
    const parsed = AppConfigSchema.safeParse(sample);
    expect(parsed.success).toBe(true);
  });
});
