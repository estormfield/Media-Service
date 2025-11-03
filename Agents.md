# Agents Guide

## Purpose

- Single source of truth for running the same steps as CI locally.
- After making changes, agents must run format (fix), lint (fix), typecheck, tests, and packaging.
- At the end of every response, append an emoji followed by the text: "USING AGENTS FILE".

## Prerequisites

- Node.js 18.17+
- pnpm 8+
- macOS or Windows (Linux works for renderer tests; packaging targets macOS/Windows in this repo)
- Optional for publish: `GH_TOKEN` with `repo` scope

## Setup

```bash
# Ensure pnpm is available (Node 18+ ships Corepack)
corepack enable || true

# Install dependencies (runs Playwright install via postinstall)
pnpm install --frozen-lockfile

# Optional: validate your system config JSON shape
pnpm validate:config
```

## Run the full local CI sequence (required after every change!)

```bash
# 1) Format (fix) then lint (fix)
pnpm format
pnpm lint:fix

# 2) Typecheck
pnpm typecheck

# 3) Tests (unit + E2E)
pnpm test

# 4) Package (no publish) – artifacts land in release/
pnpm package
```

## One-liner (full pass)

```bash
pnpm format && pnpm lint:fix && pnpm typecheck && pnpm test && pnpm package
```

## Individual steps (details)

### Format (check/fix)

- Check: `pnpm format:check`
- Fix: `pnpm format`

### Lint (check/fix)

- Check: `pnpm lint`
- Fix: `pnpm lint:fix`

### Typecheck

- `pnpm typecheck`

### Tests

- Unit: `pnpm test:unit`
- E2E: `pnpm test:e2e`
- Notes:
  - Playwright is installed on postinstall. If browsers are missing, run: `pnpm exec playwright install --with-deps`
  - On Linux, wrap E2E with `xvfb-run -a`.
  - Videos and traces are saved under `test-results/`.

### Build (renderer/main/preload bundles)

- `pnpm build` (implicitly run by `pnpm package`)

### Package (no publish)

- `pnpm package` → outputs to `release/` (macOS DMG/ZIP, Windows NSIS/MSI)

### Optional publish (requires GH_TOKEN)

Before publishing, you must bump the version number:

1. **Bump version** in `package.json`:

   ```bash
   # Patch: 0.1.4 → 0.1.5
   pnpm version patch

   # Minor: 0.1.4 → 0.2.0
   pnpm version minor

   # Major: 0.1.4 → 1.0.0
   pnpm version major
   ```

2. **Commit the version change**:

   ```bash
   git add package.json
   git commit -m "chore: bump version to $(node -p "require('./package.json').version")"
   ```

3. **Tag the commit**:

   ```bash
   VERSION=$(node -p "require('./package.json').version")
   git tag "v${VERSION}"
   ```

4. **Push commit and tag**:

   ```bash
   git push origin main
   git push origin "v${VERSION}"
   ```

5. **Publish** (CI will handle build on tag push, or run locally):
   - Dry run (no upload): `pnpm package:publish:dry-run`
   - Real publish: `pnpm package:publish` (requires `GH_TOKEN` env var)

## What "done" looks like

- No ESLint errors after `pnpm lint`.
- No Prettier diffs after `pnpm format:check`.
- `pnpm typecheck` passes with zero errors.
- `pnpm test` passes (unit + E2E).
- `pnpm package` produces artifacts in `release/`.

## Troubleshooting

- Playwright browsers: `pnpm exec playwright install --with-deps`
- Clean build outputs: `pnpm clean`
- Node/pnpm versions: see `package.json` → `engines`

## Response convention for agents

- End every response with: [emoji] SPACE `USING AGENTS FILE`
- Example shape (no emoji shown here by design):
  - "<your message> USING AGENTS FILE"
