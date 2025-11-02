# Quick Release Downloads

- Every merge to `main` triggers `.github/workflows/release.yml`, which builds macOS (`dmg` + `zip`) and Windows (`nsis` + `msi`) installers and attaches them to the latest GitHub release.
- In the repository settings, set **Actions ? General ? Workflow permissions** to ?Read and write? so the default `GITHUB_TOKEN` can publish release assets; no extra secrets are required unless you override the owner/repo via `GITHUB_OWNER`/`GITHUB_REPO`.
- After the workflow finishes, open the Releases tab and download the artifact you need (for example `tenfoot-launcher-<version>-mac-x64.dmg` or `?-win-x64.exe`).
- If you fork this project, update `settings.githubOwner` and `settings.githubRepo` in your config or set `GITHUB_OWNER`/`GITHUB_REPO` so electron-builder publishes to the correct GitHub repository.

# TenFoot Launcher

Cross-platform Electron 10-foot launcher with a React/Vite front-end, GitHub-based auto updates, and kiosk-ready controls for DPAD/IR remotes.

## Prerequisites

- Node.js 18.17+
- pnpm 8+
- GitHub personal access token (with `repo` scope) in `GH_TOKEN` when publishing releases

## Install

```bash
pnpm install
pnpm validate:config   # optional: validate your system config JSON
```

## Development Workflow

- `pnpm dev` ? start Vite + Electron in development mode
- `pnpm lint` ? run ESLint with TypeScript + Prettier rules
- `pnpm typecheck` ? strict TypeScript validation (renderer & main)
- `pnpm test` ? Vitest unit tests (with RTL) + Playwright headed E2E tests (via Xvfb on Linux)
- `pnpm format` ? format sources with Prettier

### E2E testing notes

- Runs Playwright in headed mode at 2560x1440 viewport
- Uses a renderer-only Vite config and stubs `window.api`
- On Linux, wrap commands with `xvfb-run -a` to provide a virtual display
- Video recordings for each run are saved in `test-results/` (ignored by git) and uploaded as artifacts in GitHub Actions

## Configuration

The launcher reads a system-wide JSON config at startup only. Default lookup order:

| Platform                     | Path                                                       |
| ---------------------------- | ---------------------------------------------------------- |
| Windows                      | `C:\ProgramData\TenFootLauncher\config.json`               |
| macOS                        | `/Library/Application Support/TenFootLauncher/config.json` |
| Linux/Unix (inc. BSD, Haiku) | `/etc/tenfoot-launcher/config.json`                        |

Override with `TENFOOT_CONFIG_PATH=/path/to/config.json`.

Bundled sample: `config/config.sample.json`

Schema enforced via `zod` (`app/shared/schema.ts`). Tiles support YouTube (browser app window), Emby Theater, and arbitrary executables.

## Auto-start behaviour

- Windows: writes `TenFootLauncher.lnk` to the Startup folder (per-machine)
- macOS: installs `~/Library/LaunchAgents/com.example.tenfootlauncher.plist`
- Linux: installs `~/.config/autostart/tenfoot-launcher.desktop`

Respectfully disabled when `settings.autoStart` is false.

## Packaging & Releases

- `pnpm build` ? bundle renderer, main, and preload via Vite+Electron
- `pnpm package` ? create unsigned Windows (NSIS/MSI) and macOS (DMG/ZIP) artifacts in `release/`
- `pnpm package:publish` ? same as above plus publish update assets to GitHub Releases (`GH_TOKEN` required)

Electron Builder configuration lives in `electron-builder.config.js`. Auto updates rely on GitHub releases via `electron-updater`.

### GitHub Release & Auto-update Setup

1. **Personal access token** ? create a classic PAT with `repo` scope (or use a GitHub App token) and add it to the repository as the `GH_TOKEN` secret so the workflow can publish releases.
2. **Update the config file** ? in your deployed config (copy from `config/config.sample.json`), the defaults already target `estormfield/Media-Service`. Adjust `settings.githubOwner` and `settings.githubRepo` only if you fork and publish elsewhere; the running app uses these values to resolve update feeds.
3. **Ensure repo metadata matches** ? the Electron Builder config defaults to the public repo `estormfield/Media-Service`, but still honours `GITHUB_REPOSITORY` (or `GITHUB_OWNER`/`GITHUB_REPO`) if you override them in CI.
4. **Tag to publish** ? after merging to `main`, bump `package.json` version, commit, then tag and push:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
   The `release.yml` workflow will build unsigned macOS (`.dmg` + `.zip`) and Windows (`.exe` + `.msi`) installers, upload them to the tagged GitHub Release, and publish `latest.yml`/`latest.json` for auto-update.
5. **Ship future updates** ? repeat the bump/tag process for each release. Clients that have installed a previous build will see update prompts from `electron-updater` once the new release assets are available.

## Continuous Integration

`/.github/workflows/release.yml` builds on tag pushes (`v*`) across macOS and Windows:

1. Install deps, validate config, lint, typecheck, run unit + E2E suites
2. Package + publish per-platform artifacts to the tagged GitHub Release
3. Upload build artifacts for archival

## Project Layout

```
app/
  main/        # Electron main process (window, auto-launch, updater, IPC)
  preload/     # Context bridge exposing the IPC surface
  renderer/    # React 10-foot UI (components, hooks, state)
  shared/      # Types, schema, IPC channel constants
config/        # Sample system-wide configuration
scripts/       # Tooling scripts (e.g., config validation)
tests/
  unit/        # Vitest + RTL suites
  e2e/         # Playwright headed E2E specs
```

## Launch Targets

- **YouTube tiles**: launches `browserPath` with templated `browserArgs` (`%URL%` substituted)
- **Emby**: executes configured Emby Theater binary
- **Game/Executable**: spawns provided process with args, detaching from the launcher

Home/Back keys (including IR remote equivalents) return to the profile picker; Enter launches focused tiles. DPAD support provided via `useDpadNavigation` hook.
