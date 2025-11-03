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

**IMPORTANT**: Before packaging, bump the version if this is a release. See "Version bumping" section below.

```bash
# 1) Format (fix) then lint (fix)
pnpm format
pnpm lint:fix

# 2) Typecheck
pnpm typecheck

# 3) Tests (unit + E2E)
pnpm test

# 4) Version bump (if this is a release)
# For minor releases:
npm run version:bump:minor
# OR for patch releases:
npm run version:bump:patch
# OR for major releases:
npm run version:bump:major

# 5) Package (no publish) – artifacts land in release/
pnpm package
```

## One-liner (full pass)

```bash
pnpm format && pnpm lint:fix && pnpm typecheck && pnpm test && pnpm package
```

## Individual steps (quick)

- Format: `pnpm format`
- Lint: `pnpm lint:fix`
- Typecheck: `pnpm typecheck`
- Tests: `pnpm test` (unit: `pnpm test:unit`, e2e: `pnpm test:e2e`)
  - Playwright browsers: `pnpm exec playwright install --with-deps`
  - Linux E2E: `xvfb-run -a`
  - Artifacts: `test-results/`
- Package: `pnpm package` (runs build; outputs to `release/`)
- Note: bump version before packaging (see Version bumping)

### Version bumping

**Required before packaging**: Bump the version number in `package.json`:

1. **Bump version** in `package.json` using the npm scripts:

   ```bash
   # Patch: 0.1.4 → 0.1.5
   npm run version:bump:patch

   # Minor: 0.1.4 → 0.2.0
   npm run version:bump:minor

   # Major: 0.1.4 → 1.0.0
   npm run version:bump:major
   ```

   These scripts automatically update `package.json` and create a git commit with the version change.

2. **If you need to commit manually** (scripts handle this automatically, but if needed):

   ```bash
   git add package.json
   git commit -m "chore: bump version to $(node -p "require('./package.json').version")"
   ```

### Optional publish (requires GH_TOKEN)

After version bumping (see "Version bumping" section above) and packaging, you can publish:

1. **Tag the commit**:

   ```bash
   VERSION=$(node -p "require('./package.json').version")
   git tag "v${VERSION}"
   ```

2. **Push commit and tag**:

   ```bash
   git push origin main
   git push origin "v${VERSION}"
   ```

3. **Publish** (CI will handle build on tag push, or run locally):
   - Dry run (no upload): `pnpm package:publish:dry-run`
   - Real publish: `pnpm package:publish` (requires `GH_TOKEN` env var)

## What "done" looks like

- No ESLint errors after `pnpm lint`.
- No Prettier diffs after `pnpm format`.
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
