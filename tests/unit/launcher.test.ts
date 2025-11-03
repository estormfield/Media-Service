import { describe, expect, it } from 'vitest';
import { isHostAllowed } from '../../app/main/launcher.js';

describe('isHostAllowed', () => {
  describe('exact hostname matching', () => {
    it('allows exact match of base host', () => {
      expect(isHostAllowed('example.com', 'example.com')).toBe(true);
    });

    it('allows exact match in extra hosts', () => {
      expect(isHostAllowed('accounts.google.com', 'youtube.com', ['accounts.google.com'])).toBe(
        true,
      );
    });

    it('rejects non-matching hostnames', () => {
      expect(isHostAllowed('evil.com', 'example.com')).toBe(false);
    });

    it('rejects non-matching hostnames with extra hosts', () => {
      expect(isHostAllowed('evil.com', 'example.com', ['accounts.google.com'])).toBe(false);
    });
  });

  describe('wildcard matching', () => {
    it('allows exact match of wildcard domain', () => {
      expect(isHostAllowed('nytimes.com', 'example.com', ['*.nytimes.com'])).toBe(true);
    });

    it('allows subdomain match of wildcard', () => {
      expect(isHostAllowed('myaccount.nytimes.com', 'example.com', ['*.nytimes.com'])).toBe(true);
    });

    it('allows nested subdomain match', () => {
      expect(isHostAllowed('api.v1.nytimes.com', 'example.com', ['*.nytimes.com'])).toBe(true);
    });

    it('rejects non-matching domain with wildcard', () => {
      expect(isHostAllowed('evil.com', 'example.com', ['*.nytimes.com'])).toBe(false);
    });

    it('rejects domain that ends with but is not subdomain', () => {
      expect(isHostAllowed('fakentimes.com', 'example.com', ['*.nytimes.com'])).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles empty extra hosts array', () => {
      expect(isHostAllowed('example.com', 'example.com', [])).toBe(true);
      expect(isHostAllowed('other.com', 'example.com', [])).toBe(false);
    });

    it('handles multiple extra hosts', () => {
      expect(
        isHostAllowed('accounts.google.com', 'youtube.com', [
          'accounts.google.com',
          'consent.youtube.com',
        ]),
      ).toBe(true);
      expect(
        isHostAllowed('consent.youtube.com', 'youtube.com', [
          'accounts.google.com',
          'consent.youtube.com',
        ]),
      ).toBe(true);
      expect(
        isHostAllowed('evil.com', 'youtube.com', ['accounts.google.com', 'consent.youtube.com']),
      ).toBe(false);
    });

    it('handles multiple wildcards', () => {
      expect(
        isHostAllowed('sub1.example.com', 'youtube.com', ['*.example.com', '*.test.com']),
      ).toBe(true);
      expect(isHostAllowed('sub2.test.com', 'youtube.com', ['*.example.com', '*.test.com'])).toBe(
        true,
      );
      expect(isHostAllowed('sub3.other.com', 'youtube.com', ['*.example.com', '*.test.com'])).toBe(
        false,
      );
    });
  });
});
