import { useState, useCallback, FormEvent, useEffect } from 'react';
import type { LauncherEntry } from '@shared/schema.js';
import './AddTileModal.css';

type Tab = 'web' | 'app';

interface EditTileModalProps {
  isOpen: boolean;
  tile: LauncherEntry | null;
  onClose: () => void;
  onSave: (entry: LauncherEntry) => Promise<void>;
}

export default function EditTileModal({ isOpen, tile, onClose, onSave }: EditTileModalProps) {
  const isWebKind = tile?.kind === 'web' || tile?.kind === 'youtube';
  const [activeTab, setActiveTab] = useState<Tab>(isWebKind ? 'web' : 'app');
  const [saving, setSaving] = useState(false);

  // Web form state
  const [webTitle, setWebTitle] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [webArtwork, setWebArtwork] = useState('');
  const [webAllowedHosts, setWebAllowedHosts] = useState('');

  // App form state
  const [appTitle, setAppTitle] = useState('');
  const [appExecutable, setAppExecutable] = useState('');
  const [appArgs, setAppArgs] = useState('');
  const [appWorkingDir, setAppWorkingDir] = useState('');
  const [appArtwork, setAppArtwork] = useState('');

  // Prefill form when tile changes
  useEffect(() => {
    if (!tile) {
      return;
    }

    if (tile.kind === 'web' || tile.kind === 'youtube') {
      setActiveTab('web');
      setWebTitle(tile.title);
      setWebUrl(tile.url);
      setWebArtwork(tile.artwork || '');
      setWebAllowedHosts(
        tile.kind === 'web' && tile.allowedHosts ? tile.allowedHosts.join(', ') : '',
      );
    } else if (tile.kind === 'game' || tile.kind === 'emby') {
      setActiveTab('app');
      setAppTitle(tile.title);
      setAppExecutable(tile.executable);
      setAppArgs(tile.args?.join(', ') || '');
      setAppWorkingDir(tile.workingDirectory || '');
      setAppArtwork(tile.artwork || '');
    }
  }, [tile]);

  const handlePickFile = useCallback(async () => {
    const path = await window.api.pickFile();
    if (path) {
      setAppExecutable(path);
    }
  }, []);

  const handleWebSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!webTitle.trim() || !webUrl.trim() || !tile) {
        return;
      }

      // Validate URL
      try {
        new URL(webUrl);
      } catch {
        alert('Please enter a valid URL');
        return;
      }

      setSaving(true);
      try {
        let entry: LauncherEntry;
        if (tile.kind === 'youtube') {
          entry = {
            kind: 'youtube',
            id: tile.id,
            url: webUrl.trim(),
            title: webTitle.trim(),
            subtitle: tile.subtitle,
            artwork: webArtwork.trim() || undefined,
            browserPath: tile.browserPath,
            browserArgs: tile.browserArgs,
          };
        } else {
          const allowedHosts = webAllowedHosts.trim()
            ? webAllowedHosts
                .split(',')
                .map((h) => h.trim())
                .filter(Boolean)
            : undefined;
          entry = {
            kind: 'web',
            id: tile.id,
            url: webUrl.trim(),
            title: webTitle.trim(),
            subtitle: tile.subtitle,
            artwork: webArtwork.trim() || undefined,
            allowedHosts,
          };
        }
        await onSave(entry);
        onClose();
      } catch (error) {
        console.error('Failed to save web tile:', error);
        alert('Failed to save tile. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [webTitle, webUrl, webArtwork, webAllowedHosts, tile, onSave, onClose],
  );

  const handleAppSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!appTitle.trim() || !appExecutable.trim() || !tile) {
        return;
      }

      setSaving(true);
      try {
        const args = appArgs.trim()
          ? appArgs
              .split(',')
              .map((a) => a.trim())
              .filter(Boolean)
          : [];
        const entry: LauncherEntry = {
          kind: tile.kind === 'emby' ? 'emby' : 'game',
          id: tile.id,
          executable: appExecutable.trim(),
          args,
          title: appTitle.trim(),
          subtitle: tile.subtitle,
          artwork: appArtwork.trim() || undefined,
          workingDirectory: appWorkingDir.trim() || undefined,
        };
        await onSave(entry);
        onClose();
      } catch (error) {
        console.error('Failed to save app tile:', error);
        alert('Failed to save tile. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [appTitle, appExecutable, appArgs, appWorkingDir, appArtwork, tile, onSave, onClose],
  );

  if (!isOpen || !tile) {
    return null;
  }

  return (
    <div className="add-tile-modal-overlay" onClick={onClose}>
      <div className="add-tile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-tile-modal__header">
          <h2>Edit Tile</h2>
          <button type="button" className="add-tile-modal__close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="add-tile-modal__tabs">
          <button
            type="button"
            className={`add-tile-modal__tab ${activeTab === 'web' ? 'add-tile-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('web')}
            disabled={tile.kind !== 'web' && tile.kind !== 'youtube'}
          >
            Web
          </button>
          <button
            type="button"
            className={`add-tile-modal__tab ${activeTab === 'app' ? 'add-tile-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('app')}
            disabled={tile.kind !== 'game' && tile.kind !== 'emby'}
          >
            App
          </button>
        </div>

        <div className="add-tile-modal__content">
          {activeTab === 'web' ? (
            <form onSubmit={handleWebSubmit} className="add-tile-modal__form">
              <div className="add-tile-modal__field">
                <label htmlFor="edit-web-title">Title *</label>
                <input
                  id="edit-web-title"
                  type="text"
                  value={webTitle}
                  onChange={(e) => setWebTitle(e.target.value)}
                  required
                  placeholder="e.g., YouTube TV"
                />
              </div>
              <div className="add-tile-modal__field">
                <label htmlFor="edit-web-url">URL *</label>
                <input
                  id="edit-web-url"
                  type="url"
                  value={webUrl}
                  onChange={(e) => setWebUrl(e.target.value)}
                  required
                  placeholder="https://www.youtube.com/tv"
                />
              </div>
              <div className="add-tile-modal__field">
                <label htmlFor="edit-web-artwork">Artwork URL (optional)</label>
                <input
                  id="edit-web-artwork"
                  type="url"
                  value={webArtwork}
                  onChange={(e) => setWebArtwork(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="add-tile-modal__field">
                <label htmlFor="edit-web-allowed-hosts">
                  Allowed hosts (optional, comma-separated)
                </label>
                <input
                  id="edit-web-allowed-hosts"
                  type="text"
                  value={webAllowedHosts}
                  onChange={(e) => setWebAllowedHosts(e.target.value)}
                  placeholder="e.g., accounts.google.com, *.nytimes.com"
                />
                <small style={{ display: 'block', marginTop: '4px', color: '#999' }}>
                  Optional. Allow navigation to additional domains for login flows.
                </small>
              </div>
              <div className="add-tile-modal__actions">
                <button type="button" onClick={onClose} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAppSubmit} className="add-tile-modal__form">
              <div className="add-tile-modal__field">
                <label htmlFor="edit-app-title">Title *</label>
                <input
                  id="edit-app-title"
                  type="text"
                  value={appTitle}
                  onChange={(e) => setAppTitle(e.target.value)}
                  required
                  placeholder="e.g., My App"
                />
              </div>
              <div className="add-tile-modal__field">
                <label htmlFor="edit-app-executable">Executable *</label>
                <div className="add-tile-modal__file-picker">
                  <input
                    id="edit-app-executable"
                    type="text"
                    value={appExecutable}
                    onChange={(e) => setAppExecutable(e.target.value)}
                    required
                    placeholder="Select application..."
                    readOnly
                  />
                  <button type="button" onClick={handlePickFile}>
                    Browse
                  </button>
                </div>
              </div>
              <div className="add-tile-modal__field">
                <label htmlFor="edit-app-args">Arguments (optional, comma-separated)</label>
                <input
                  id="edit-app-args"
                  type="text"
                  value={appArgs}
                  onChange={(e) => setAppArgs(e.target.value)}
                  placeholder="--fullscreen, --windowed"
                />
              </div>
              <div className="add-tile-modal__field">
                <label htmlFor="edit-app-working-dir">Working Directory (optional)</label>
                <input
                  id="edit-app-working-dir"
                  type="text"
                  value={appWorkingDir}
                  onChange={(e) => setAppWorkingDir(e.target.value)}
                  placeholder="/path/to/directory"
                />
              </div>
              <div className="add-tile-modal__field">
                <label htmlFor="edit-app-artwork">Artwork URL (optional)</label>
                <input
                  id="edit-app-artwork"
                  type="url"
                  value={appArtwork}
                  onChange={(e) => setAppArtwork(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="add-tile-modal__actions">
                <button type="button" onClick={onClose} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
