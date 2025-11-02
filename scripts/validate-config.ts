import { loadConfig, getConfigPath } from '@shared/config';

async function main() {
  try {
    const config = await loadConfig();
    console.log('Configuration valid. Active profiles:', config.profiles.map((profile) => profile.name).join(', '));
    console.log('Loaded from:', getConfigPath());
  } catch (error) {
    console.error('Configuration invalid:', error);
    process.exitCode = 1;
  }
}

void main();
