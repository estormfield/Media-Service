# Media Service Launcher

A cross-platform Electron + React 10-foot launcher designed for TVs and media centers. It delivers profile-based experiences, remote-friendly navigation, and integrates with external streaming and game launchers.

## Features

- **Fullscreen kiosk UI** optimized for DPAD/remote navigation.
- **Profile-aware launcher tiles** backed by a system-wide JSON configuration.
- Launches **YouTube (Chromium `--app` window)**, **Emby Theater**, and **direct game executables**.
- **Auto-start on login** via Windows Startup shortcut (`.lnk`) or macOS LaunchAgent.
- **Auto-updates** powered by [`electron-updater`](https://www.electron.build/auto-update) and GitHub Releases.
- **Strict quality gates**: ESLint (`@typescript-eslint`, max 400 lines), Prettier, Vitest unit tests, and Playwright E2E.

## Prerequisites

- [pnpm](https://pnpm.io/) `>=8`
- Node.js `>=18`
- For packaging:
  - macOS host for `.dmg`/`.zip`
  - Windows host for `.exe`/`.msi`
- A Chromium-based browser path for launching YouTube in app-mode (e.g., Google Chrome).

## Installation

```bash
pnpm install
```

### Playwright Browsers

Playwright installs Chromium automatically during `pnpm install` via the configured `postinstall` script. If you need to repair browsers manually:

```bash
pnpm exec playwright install --with-deps chromium
```

## Development

Run the app in development mode (Vite dev server + Electron with live reload):

```bash
pnpm dev
```

Key bindings:

- **DPAD / Arrow keys**: Navigate tiles
- **Enter**: Launch selected item
- **Back / Escape / Home**: Open the profile picker

## Testing & Quality

```bash
pnpm lint
pnpm typecheck
pnpm test      # Vitest unit suite
pnpm test:e2e  # Playwright headed tests (requires built renderer)
```

## Building & Packaging

Create production assets:

```bash
pnpm build
```

Package installers and publish to the authenticated GitHub Release (unsigned artifacts):

```bash
GH_TOKEN=your_token pnpm release
```

Artifacts:

- **Windows**: `.exe` (NSIS) and `.msi`
- **macOS**: `.dmg` and `.zip`

## Configuration

The launcher reads a single JSON configuration at startup. Default paths:

| Platform | Location |
| --- | --- |
| Windows | `%ALLUSERSPROFILE%/MediaService/config.json` (fallback `C:/ProgramData/MediaService/config.json`) |
| macOS | `/Library/Application Support/MediaService/config.json` |
| Linux | `/etc/mediaservice/config.json` |

Override the path via the `MEDIA_SERVICE_CONFIG` environment variable.

See [`config/config.sample.json`](config/config.sample.json) for the schema. Key properties:

- `defaultProfileId`: Profile selected when the app loads.
- `profiles[]`: Each profile contains a list of launcher tiles.
  - `youtube` launchers require a Chromium browser executable (globally via `youtubeBrowserPath` or per-launcher `browserPath`).
  - `emby` and `game` launchers can specify absolute or relative executable paths. Relative paths are resolved against `gameBasePath` when provided.

## Continuous Delivery

Tag a commit with `v*` (e.g., `v1.0.0`) to trigger `.github/workflows/release.yml`. The workflow:

1. Installs dependencies with pnpm
2. Runs linting, type-checking, and unit tests
3. Builds the renderer, main, and preload bundles
4. Executes `pnpm release` to package installers and publish release assets/update feeds

Ensure repository secrets include the default `GITHUB_TOKEN` (provided automatically) or a fine-grained token if stricter permissions are required.
