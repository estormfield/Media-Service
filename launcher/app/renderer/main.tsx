import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useLauncherStore, selectActiveProfile } from './state/store';
import { ProfilePicker } from './components/ProfilePicker';
import { Grid } from './components/Grid';
import './styles/global.css';
import { useIdleCursorHide } from './hooks/useIdleCursorHide';

const App = () => {
  const config = useLauncherStore((state) => state.config);
  const setConfig = useLauncherStore((state) => state.setConfig);
  const isPickerVisible = useLauncherStore((state) => state.isPickerVisible);
  const error = useLauncherStore((state) => state.error);
  const showError = useLauncherStore((state) => state.showError);
  const clearError = useLauncherStore((state) => state.clearError);
  const activeProfile = useLauncherStore(selectActiveProfile);

  useIdleCursorHide();

  useEffect(() => {
    void window.launcher
      .getConfig()
      .then((loaded) => {
        setConfig(loaded);
      })
      .catch((err) => {
        showError(err instanceof Error ? err.message : String(err));
      });

    const offConfigUpdate = window.launcher.onConfigUpdate((freshConfig) => {
      setConfig(freshConfig);
    });
    const offConfigError = window.launcher.onConfigError((message) => {
      showError(message);
    });

    return () => {
      offConfigUpdate();
      offConfigError();
    };
  }, [setConfig, showError]);

  useEffect(() => {
    const offChildExit = window.launcher.onChildExit(() => {
      useLauncherStore.getState().setLaunchingTile(undefined);
    });
    return () => offChildExit();
  }, []);

  useEffect(() => {
    if (error) {
      const handleKey = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === 'Escape') {
          event.preventDefault();
          clearError();
        }
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }
    return undefined;
  }, [error, clearError]);

  return (
    <div className="app">
      {error ? <div className="app__error">{error}</div> : null}
      {isPickerVisible || !config ? <ProfilePicker config={config} /> : null}
      {!isPickerVisible && config && activeProfile ? <Grid config={config} /> : null}
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
