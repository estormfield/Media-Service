import { describe, expect, it } from 'vitest';
import { validateConfig } from '../../app/shared/schema.js';

describe('validateConfig', () => {
  it('accepts a valid configuration object', () => {
    const config = validateConfig({
      version: '1',
      settings: {
        autoStart: true,
        githubOwner: 'test-owner',
        githubRepo: 'test-repo',
        updateChannel: 'stable'
      },
      profiles: [
        {
          id: 'primary',
          displayName: 'Primary',
          tiles: [
            {
              kind: 'youtube',
              id: 'yt-main',
              title: 'YouTube',
              url: 'https://youtube.com/tv',
              browserPath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
            }
          ]
        }
      ]
    });

    expect(config.profiles[0]?.displayName).toBe('Primary');
  });

  it('throws on invalid configuration', () => {
    expect(() =>
      validateConfig({
        version: '1',
        settings: {
          githubOwner: '',
          githubRepo: '',
          updateChannel: 'stable'
        },
        profiles: []
      })
    ).toThrowError();
  });
});
