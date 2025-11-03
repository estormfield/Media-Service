import { useState, useCallback, FormEvent } from 'react';
import type { LauncherEntry } from '@shared/schema.js';
import './AddTileModal.css';

type Tab = 'web' | 'app';

interface AddTileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: LauncherEntry) => Promise<void>;
}

export default function AddTileModal({ isOpen, onClose, onSave }: AddTileModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('web');
  const [saving, setSaving] = useState(false);

  // Web form state
  const [webTitle, setWebTitle] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [webArtwork, setWebArtwork] = useState('');

  // App form state
  const [appTitle, setAppTitle] = useState('');
  const [appExecutable, setAppExecutable] = useState('');
  const [appArgs, setAppArgs] = useState('');
  const [appWorkingDir, setAppWorkingDir] = useState('');
  const [appArtwork, setAppArtwork] = useState('');

  const handlePickFile = useCallback(async () => {
    const path = await window.api.pickFile();
    if (path) {
      setAppExecutable(path);
    }
  }, []);

  const handleWebSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!webTitle.trim() || !webUrl.trim()) {
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
        const entry: LauncherEntry = {
          kind: 'web',
          id: `web-${Date.now()}`,
          url: webUrl.trim(),
          title: webTitle.trim(),
          subtitle: undefined,
          artwork: webArtwork.trim() || undefined,
        };
        await onSave(entry);
        // Reset form
        setWebTitle('');
        setWebUrl('');
        setWebArtwork('');
        onClose();
      } catch (error) {
        console.error('Failed to save web tile:', error);
        alert('Failed to save tile. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [webTitle, webUrl, webArtwork, onSave, onClose],
  );

  const handleAppSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!appTitle.trim() || !appExecutable.trim()) {
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
          kind: 'game',
          id: `app-${Date.now()}`,
          executable: appExecutable.trim(),
          args,
          title: appTitle.trim(),
          subtitle: undefined,
          artwork: appArtwork.trim() || undefined,
          workingDirectory: appWorkingDir.trim() || undefined,
        };
        await onSave(entry);
        // Reset form
        setAppTitle('');
        setAppExecutable('');
        setAppArgs('');
        setAppWorkingDir('');
        setAppArtwork('');
        onClose();
      } catch (error) {
        console.error('Failed to save app tile:', error);
        alert('Failed to save tile. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [appTitle, appExecutable, appArgs, appWorkingDir, appArtwork, onSave, onClose],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="add-tile-modal-overlay" onClick={onClose}>
      <div className="add-tile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-tile-modal__header">
          <h2>Add New Tile</h2>
          <button type="button" className="add-tile-modal__close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="add-tile-modal__tabs">
          <button
            type="button"
            className={`add-tile-modal__tab ${activeTab === 'web' ? 'add-tile-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('web')}
          >
            Web
          </button>
          <button
            type="button"
            className={`add-tile-modal__tab ${activeTab === 'app' ? 'add-tile-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('app')}
          >
            App
          </button>
        </div>

        <div className="add-tile-modal__content">
          {activeTab === 'web' ? (
            <form onSubmit={handleWebSubmit} className="add-tile-modal__form">
              <div className="add-tile-modal__field">
                <label htmlFor="web-title">Title *</label>
                <input
                  id="web-title"
                  type="text"
                  value={webTitle}
                  onChange={(e) => setWebTitle(e.target.value)}
                  required
                  placeholder="e.g., YouTube TV"
                />
              </div>
              <div className="add-tile-modal__field">
                <label htmlFor="web-url">URL *</label>
                <input
                  id="web-url"
                  type="url"
                  value={webUrl}
                  onChange={(e) => setWebUrl(e.target.value)}
                  required
                  placeholder="https://www.youtube.com/tv"
                />
              </div>
              <div className="add-tile-modal__field">
                <label htmlFor="web-artwork">Artwork URL (optional)</label>
                <input
                  id="web-artwork"
                  type="url"
                  value={webArtwork}
                  onChange={(e) => setWebArtwork(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="add-tile-modal__actions">
                <button type="button" onClick={onClose} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Add Tile'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAppSubmit} className="add-tile-modal__form">
              <div className="add-tile-modal__field">
                <label htmlFor="app-title">Title *</label>
                <input
                  id="app-title"
                  type="text"
                  value={appTitle}
                  onChange={(e) => setAppTitle(e.target.value)}
                  required
                  placeholder="e.g., My App"
                />
              </div>
              <div className="add-tile-modal__field">
                <label htmlFor="app-executable">Executable *</label>
                <div className="add-tile-modal__file-picker">
                  <input
                    id="app-executable"
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
                <label htmlFor="app-args">Arguments (optional, comma-separated)</label>
                <input
                  id="app-args"
                  type="text"
                  value={appArgs}
                  onChange={(e) => setAppArgs(e.target.value)}
                  placeholder="--fullscreen, --windowed"
                />
              </div>
              <div className="add-tile-modal__field">
                <label htmlFor="app-working-dir">Working Directory (optional)</label>
                <input
                  id="app-working-dir"
                  type="text"
                  value={appWorkingDir}
                  onChange={(e) => setAppWorkingDir(e.target.value)}
                  placeholder="/path/to/directory"
                />
              </div>
              <div className="add-tile-modal__field">
                <label htmlFor="app-artwork">Artwork URL (optional)</label>
                <input
                  id="app-artwork"
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
                  {saving ? 'Saving...' : 'Add Tile'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
