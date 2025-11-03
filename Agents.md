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
pnpm ci:all
```

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

## Response convention for agents

- End every response with: [emoji] SPACE `USING AGENTS FILE`
- Example shape (no emoji shown here by design):
  - "<your message> USING AGENTS FILE"
