import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const [executablePath] = process.argv.slice(2);
if (!executablePath) {
  console.error('Usage: node create-launchagent.mjs /Applications/TVLauncher.app');
  process.exit(1);
}

const agentsDir = path.join(os.homedir(), 'Library', 'LaunchAgents');
await fs.mkdir(agentsDir, { recursive: true });

const plistPath = path.join(agentsDir, 'com.tvlauncher.autostart.plist');
const plistContents = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.tvlauncher.autostart</string>
    <key>ProgramArguments</key>
    <array>
      <string>open</string>
      <string>${executablePath}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
  </dict>
</plist>`;

await fs.writeFile(plistPath, plistContents, 'utf8');
console.log(`LaunchAgent written to ${plistPath}`);
