import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../app/renderer/App.js';
import type { PreloadApi } from '../../app/preload/index.js';
import sampleConfigRaw from '../../config/config.sample.json';
import { validateConfig } from '../../app/shared/schema.js';

const sampleConfig = validateConfig(sampleConfigRaw);
const primaryProfile = sampleConfig.profiles[0];
const primaryTile = primaryProfile.tiles[0];

describe('App renderer integration', () => {
  let getBootstrapMock: PreloadApi['getBootstrap'];
  let launchEntryMock: PreloadApi['launchEntry'];
  let setAutoStartMock: PreloadApi['setAutoStart'];

  beforeEach(() => {
    getBootstrapMock = vi.fn<
      Parameters<PreloadApi['getBootstrap']>,
      ReturnType<PreloadApi['getBootstrap']>
    >(async () => ({ config: sampleConfig, autoStartEnabled: false }));
    launchEntryMock = vi.fn<
      Parameters<PreloadApi['launchEntry']>,
      ReturnType<PreloadApi['launchEntry']>
    >(async () => {});
    setAutoStartMock = vi.fn<
      Parameters<PreloadApi['setAutoStart']>,
      ReturnType<PreloadApi['setAutoStart']>
    >(async (enabled) => enabled);

    const api: PreloadApi = {
      getBootstrap: getBootstrapMock,
      launchEntry: launchEntryMock,
      setAutoStart: setAutoStartMock,
    };

    window.api = api;
  });

  it('selects the first profile and launches the default tile via DPAD', async () => {
    render(<App />);

    await screen.findByText('Who is using TenFoot Launcher?');

    fireEvent.keyDown(window, { key: 'Enter' });

    await screen.findByRole('heading', { name: 'TenFoot Launcher' });

    fireEvent.keyDown(window, { key: 'Enter' });

    await waitFor(() => {
      expect(launchEntryMock).toHaveBeenCalledWith({
        profileId: primaryProfile.id,
        entryId: primaryTile.id,
      });
    });
  });

  it('allows toggling auto-start from the header control', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('Who is using TenFoot Launcher?');
    fireEvent.keyDown(window, { key: 'Enter' });

    const toggle = (await screen.findAllByRole('button', { name: /Auto-start on login/i })).at(-1);
    expect(toggle).toBeDefined();
    expect(toggle!).toHaveTextContent(/Auto-start on login\s*OFF/i);

    await user.click(toggle!);

    await waitFor(() => {
      expect(setAutoStartMock).toHaveBeenCalledWith(true);
      expect(toggle!).toHaveTextContent(/Auto-start on login\s*ON/i);
    });

    await user.click(toggle!);

    await waitFor(() => {
      expect(setAutoStartMock).toHaveBeenLastCalledWith(false);
      expect(toggle!).toHaveTextContent(/Auto-start on login\s*OFF/i);
    });

    expect(setAutoStartMock).toHaveBeenCalledTimes(2);
  });
});
