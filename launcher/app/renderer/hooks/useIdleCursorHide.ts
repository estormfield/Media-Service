import { useEffect } from 'react';

const IDLE_MS = 3000;

export const useIdleCursorHide = (): void => {
  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;

    const showCursor = () => {
      window.launcher.requestCursorShow();
    };

    const hideCursor = () => {
      window.launcher.requestCursorHide();
    };

    const handleActivity = () => {
      showCursor();
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(hideCursor, IDLE_MS);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);

    handleActivity();

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, []);
};
