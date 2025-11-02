import path from 'node:path';
import process from 'node:process';
import fs from 'fs-extra';
import { validateConfig } from '../app/shared/schema.js';

async function main() {
  const target = process.argv[2] ?? 'config/config.sample.json';
  const configPath = path.resolve(process.cwd(), target);
  const raw = await fs.readJSON(configPath);
  const config = validateConfig(raw);
  console.log(`Config at ${configPath} is valid with ${config.profiles.length} profile(s).`);
}

main().catch((error) => {
  console.error('Failed to validate configuration:', error);
  process.exit(1);
});
