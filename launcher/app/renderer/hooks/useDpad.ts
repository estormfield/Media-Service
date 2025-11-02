import { useEffect } from 'react';

interface UseDpadOptions {
  cols: number;
  total: number;
  onMove: (delta: number) => void;
  onSelect: () => void;
  onBack?: () => void;
}

const keyMap: Record<string, number> = {
  ArrowUp: -1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowRight: 1
};

export const useDpad = ({ cols, total, onMove, onSelect, onBack }: UseDpadOptions): void => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (total === 0) return;
      if (event.key === 'Enter') {
        event.preventDefault();
        onSelect();
        return;
      }
      if (event.key === 'Backspace' || event.key === 'Escape' || event.key === 'Home') {
        event.preventDefault();
        onBack?.();
        return;
      }
      if (!keyMap[event.key]) {
        return;
      }

      event.preventDefault();
      switch (event.key) {
        case 'ArrowUp':
          onMove(-cols);
          break;
        case 'ArrowDown':
          onMove(cols);
          break;
        case 'ArrowLeft':
          onMove(-1);
          break;
        case 'ArrowRight':
          onMove(1);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cols, onBack, onMove, onSelect, total]);
};
