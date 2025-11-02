# TV Launcher

Cross-platform Electron + React 10-foot launcher targeted at IR-remote driven TVs. This repository contains the application source under `launcher/` with Electron main process, preload, and React renderer implementations, along with configuration samples, scripts, and automated tests.

## Getting Started

```bash
pnpm install
pnpm dev
```

The `dev` script starts the renderer Vite dev server and Electron main process via `vite-electron`.

## Building

```bash
pnpm build
pnpm release
```

Artifacts are generated via `electron-builder` and configured to publish to GitHub Releases.

## Testing

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Playwright E2E specs are provided as skipped placeholders that require a running application instance.
