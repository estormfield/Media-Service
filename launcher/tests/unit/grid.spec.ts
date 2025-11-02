import { describe, expect, it } from 'vitest';
import { wrapIndex } from '../../app/renderer/state/store';

describe('wrapIndex', () => {
  it('wraps forward across bounds', () => {
    expect(wrapIndex(4, 1, 5)).toBe(0);
  });

  it('wraps backward across bounds', () => {
    expect(wrapIndex(0, -1, 5)).toBe(4);
  });

  it('handles zero total', () => {
    expect(wrapIndex(0, 1, 0)).toBe(0);
  });
});
