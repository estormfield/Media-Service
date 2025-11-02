import { useCallback, useEffect, useRef, useState } from 'react';

export interface DpadNavigationOptions {
  itemCount: number;
  columns?: number;
  isActive: boolean;
  onSelect?: (index: number) => void;
  onBack?: () => void;
}

export interface DpadNavigationResult {
  focusedIndex: number;
  isFocused: (index: number) => boolean;
  requestFocus: (index: number) => void;
}

const BACK_KEYS = new Set(['Backspace', 'Escape', 'BrowserBack', 'Home']);

export function useDpadNavigation(options: DpadNavigationOptions): DpadNavigationResult {
  const { itemCount, columns = 3, isActive, onSelect, onBack } = options;
  const [focusedIndex, setFocusedIndex] = useState(0);
  const focusedIndexRef = useRef(0);
  const itemCountRef = useRef(itemCount);

  useEffect(() => {
    itemCountRef.current = itemCount;
    if (focusedIndex >= itemCount) {
      const nextIndex = Math.max(0, itemCount - 1);
      focusedIndexRef.current = nextIndex;
      setFocusedIndex(nextIndex);
    }
  }, [itemCount, focusedIndex]);

  const moveFocus = useCallback(
    (delta: number) => {
      setFocusedIndex((prev) => {
        const next = Math.min(Math.max(prev + delta, 0), Math.max(itemCountRef.current - 1, 0));
        focusedIndexRef.current = next;
        return next;
      });
    },
    []
  );

  const jumpFocus = useCallback(
    (delta: number) => {
      setFocusedIndex((prev) => {
        const next = prev + delta;
        if (next < 0 || next >= itemCountRef.current) {
          return prev;
        }
        focusedIndexRef.current = next;
        return next;
      });
    },
    []
  );

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (itemCountRef.current === 0) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          moveFocus(-1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          moveFocus(1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          jumpFocus(-columns);
          break;
        case 'ArrowDown':
          event.preventDefault();
          jumpFocus(columns);
          break;
        case 'Enter':
        case 'NumpadEnter':
          event.preventDefault();
          onSelect?.(focusedIndexRef.current);
          break;
        default:
          if (BACK_KEYS.has(event.key)) {
            event.preventDefault();
            onBack?.();
          }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [columns, isActive, moveFocus, jumpFocus, onSelect, onBack, focusedIndex]);

  const requestFocus = useCallback((index: number) => {
    if (index >= 0 && index < itemCountRef.current) {
      focusedIndexRef.current = index;
      setFocusedIndex(index);
    }
  }, []);

  const isFocused = useCallback((index: number) => index === focusedIndex, [focusedIndex]);

  return {
    focusedIndex,
    isFocused,
    requestFocus
  };
}
