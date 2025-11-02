import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDpadNavigation } from '../../app/renderer/hooks/useDpadNavigation.js';

describe('useDpadNavigation', () => {
  it('moves focus within bounds using arrow keys', () => {
    const { result, unmount } = renderHook(() =>
      useDpadNavigation({ itemCount: 5, columns: 3, isActive: true })
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });
    expect(result.current.focusedIndex).toBe(1);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    });
    expect(result.current.focusedIndex).toBe(4);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    });
    expect(result.current.focusedIndex).toBe(4);

    unmount();
  });

  it('invokes select callback on Enter', () => {
    const onSelect = vi.fn();
    const { unmount } = renderHook(() =>
      useDpadNavigation({ itemCount: 3, columns: 3, isActive: true, onSelect })
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(onSelect).toHaveBeenCalledWith(1);
    unmount();
  });
});
