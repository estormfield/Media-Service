import { useEffect, useState } from 'react';

type UseDpadNavigationArgs = {
  itemCount: number;
  columns: number;
  onActivate: (index: number) => void;
  onOpenProfilePicker: () => void;
};

export function useDpadNavigation({ itemCount, columns, onActivate, onOpenProfilePicker }: UseDpadNavigationArgs) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    setFocusedIndex((current) => Math.min(current, Math.max(itemCount - 1, 0)));
  }, [itemCount]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          setFocusedIndex((index) => Math.min(index + 1, itemCount - 1));
          break;
        case 'ArrowLeft':
          event.preventDefault();
          setFocusedIndex((index) => Math.max(index - 1, 0));
          break;
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((index) => Math.min(index + columns, itemCount - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((index) => Math.max(index - columns, 0));
          break;
        case 'Enter':
        case 'NumpadEnter':
          event.preventDefault();
          onActivate(focusedIndex);
          break;
        case 'Backspace':
        case 'Escape':
        case 'BrowserBack':
        case 'GoBack':
        case 'MediaStop':
        case 'F1':
          event.preventDefault();
          onOpenProfilePicker();
          break;
        case 'Home':
        case 'BrowserHome':
          event.preventDefault();
          onOpenProfilePicker();
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [columns, focusedIndex, itemCount, onActivate, onOpenProfilePicker]);

  return { focusedIndex, setFocusedIndex } as const;
}
