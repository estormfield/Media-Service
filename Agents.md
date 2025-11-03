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

## Setup (bootstraps pnpm automatically)

```bash
# Activate the pinned pnpm version from package.json → packageManager
corepack prepare pnpm@8.15.4 --activate || corepack enable || true

# Install dependencies (runs Playwright install via postinstall)
pnpm install --frozen-lockfile

# Optional: validate your system config JSON shape
pnpm validate:config
```

## Run the full local CI sequence and do a PR Review(required after every change!)

```bash
# ci:all now internally runs pm:activate and deps:install first
pnpm ci:all
```

- do a review of all unstaged changes. If important code was accidently deleted fix it.

- git commit and git push

2. **If you need to commit manually** (scripts handle this automatically, but if needed):

   ```bash
   git add package.json
   git commit -m "chore: bump version to $(node -p "require('./package.json').version")"
   ```

## What "done" looks like

- `pnpm ci:all` passes with zero errors.

## Troubleshooting

- Playwright browsers: `pnpm exec playwright install --with-deps`
- Clean build outputs: `pnpm clean`
- Node/pnpm versions: see `package.json` → `engines`
- Corepack/pnpm issues: run `corepack prepare pnpm@8.15.4 --activate` then `pnpm install`

## Response convention for agents

- End every response with: [emoji] SPACE `USING AGENTS FILE`
- Example shape (no emoji shown here by design):
  - "<your message> USING AGENTS FILE"
