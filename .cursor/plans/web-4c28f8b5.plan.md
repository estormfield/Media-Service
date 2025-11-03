<!-- 4c28f8b5-db62-42e2-96ce-bc252eef30e0 62cf45b8-0f52-4720-bbce-417139deb29d -->

# Enable persistent web tile logins and cross‑domain auth

### Summary

- Login persistence already works via Electron’s default persistent session (no changes needed).
- To ensure sign-in flows (e.g., accounts.google.com for YouTube, myaccount.nytimes.com for NYT) work, add a per-tile `allowedHosts` allowlist and update navigation/popup handling to permit only those.

### Changes

1. Schema: add optional `allowedHosts` to web tiles
   - File: `app/shared/schema.ts`
   - `type WebLauncherEntry = { kind: 'web'; url: string; title: string; artwork?: string; allowedHosts?: string[] }`
   - Validation: each string must be a hostname; support `*.example.com` wildcard suffix.

2. Main process: enforce allowlist for navigation and popups
   - File: `app/main/launcher.ts`
   - Add helper and use in handlers:

```ts
function isHostAllowed(target: string, baseHost: string, extra: string[] = []): boolean {
  const tests = [baseHost, ...extra];
  return tests.some((h) => {
    if (h.startsWith('*.')) return target === h.slice(2) || target.endsWith(`.${h.slice(2)}`);
    return target === h;
  });
}

// Inside launchWeb(...)
const baseHost = new URL(entry.url).host;
const extra = entry.allowedHosts ?? [];

win.webContents.on('will-navigate', (e, navUrl) => {
  const host = new URL(navUrl).host;
  if (!isHostAllowed(host, baseHost, extra)) e.preventDefault();
});

win.webContents.on('will-redirect', (e, navUrl) => {
  const host = new URL(navUrl).host;
  if (!isHostAllowed(host, baseHost, extra)) e.preventDefault();
});

win.webContents.setWindowOpenHandler(({ url }) => {
  const host = new URL(url).host;
  if (isHostAllowed(host, baseHost, extra)) {
    // Load in same window to keep kiosk lock
    win.webContents.loadURL(url);
  }
  return { action: 'deny' }; // always block new windows
});
```

3. Renderer: expose `Allowed hosts` field in add/edit modals (comma-separated)
   - Files: `app/renderer/components/AddTileModal.tsx`, `app/renderer/components/EditTileModal.tsx`
   - Store as `allowedHosts?: string[]` on save; simple parsing: split on comma, trim, filter empty.
   - Help text: “Optional. e.g., accounts.google.com, \*.nytimes.com”.

4. Sample config updates
   - File: `config/config.sample.json`
   - Add examples:
     - YouTube: `allowedHosts: ["accounts.google.com", "consent.youtube.com"]`
     - NYTimes: `allowedHosts: ["*.nytimes.com"]`

5. Tests
   - Unit (host matching): add tests for exact and wildcard matches.
   - E2E: basic regression that allows navigation to an allowlisted host and blocks a non-allowlisted host.

6. Run local CI sequence
   - `pnpm format && pnpm lint:fix && pnpm typecheck && pnpm test && pnpm package`

### Acceptance criteria

- Closing/reopening a web tile and restarting the app preserves login state.
- Sign-in flows for YouTube (accounts.google.com) and NYTimes (\*.nytimes.com) complete successfully.
- Navigation/popup attempts to non-allowlisted hosts are blocked.
- CI passes and package artifacts are produced in `release/`.

### To-dos

- [ ] Add allowedHosts?: string[] to WebLauncherEntry in app/shared/schema.ts
- [ ] Permit navigate/redirect/window-open to allowed hosts in app/main/launcher.ts
- [ ] Add Allowed hosts input to AddTileModal and persist to entry
- [ ] Add Allowed hosts input to EditTileModal and persist updates
- [ ] Add YouTube and NYTimes allowedHosts examples in config/config.sample.json
- [ ] Add unit tests for isHostAllowed exact/wildcard matches
- [ ] Add basic E2E test for allowed vs blocked navigation
- [ ] Run format, lint:fix, typecheck, tests, and package
