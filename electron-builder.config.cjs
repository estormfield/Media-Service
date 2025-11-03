const repoSlug = process.env.GITHUB_REPOSITORY ?? 'estormfield/Media-Service';
const [defaultOwner, defaultRepo] = repoSlug.split('/') ?? [];

const publishOwner = process.env.GITHUB_OWNER ?? defaultOwner ?? 'estormfield';
const publishRepo = process.env.GITHUB_REPO ?? defaultRepo ?? 'Media-Service';
const publishReleaseType = process.env.UPDATE_CHANNEL === 'beta' ? 'prerelease' : 'release';

/** @type {import('electron-builder').Configuration} */
const config = {
  appId: 'com.example.tenfootlauncher',
  productName: 'TenFoot Launcher',
  directories: {
    output: 'release',
    buildResources: 'resources',
  },
  files: ['dist/main/**/*', 'dist/preload/**/*', 'dist/renderer/**/*', 'config/**', 'package.json'],
  asarUnpack: ['config/**'],
  extraMetadata: {
    main: 'dist/main/index.js',
  },
  beforePack: async () => {
    const fs = require('fs');
    const path = require('path');
    const projectRoot = __dirname;
    const destDir = path.join(projectRoot, 'resources');
    const dest = path.join(destDir, 'icon.ico');
    if (!fs.existsSync(dest)) {
      // Try to find Electron's built-in icon
      const electronPath = require.resolve('electron/package.json');
      const electronDir = path.dirname(electronPath);
      const electronIco = path.join(electronDir, 'dist', 'resources', 'electron.ico');
      if (fs.existsSync(electronIco)) {
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(electronIco, dest);
      }
    }
  },
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64'],
      },
    ],
    icon: 'icon.ico',
    artifactName: 'tenfoot-launcher-${version}-${os}-${arch}.${ext}',
    publish: ['github'],
  },
  nsis: {
    oneClick: false,
    perMachine: true,
    allowToChangeInstallationDirectory: true,
  },
  mac: {
    category: 'public.app-category.games',
    target: [
      { target: 'dmg', arch: ['universal'] },
      { target: 'zip', arch: ['universal'] },
    ],
    artifactName: 'tenfoot-launcher-${version}-mac.${ext}',
    hardenedRuntime: false,
    gatekeeperAssess: false,
    entitlements: null,
    publish: ['github'],
  },
  dmg: {
    sign: false,
  },
  publish: [
    {
      provider: 'github',
      owner: publishOwner,
      repo: publishRepo,
      releaseType: publishReleaseType,
    },
  ],
};

module.exports = config;
