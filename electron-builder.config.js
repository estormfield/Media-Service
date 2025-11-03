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
  extraMetadata: {
    main: 'dist/main/index.js',
  },
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64'],
      },
      {
        target: 'msi',
        arch: ['x64'],
      },
    ],
    artifactName: 'tenfoot-launcher-${version}-${os}-${arch}.${ext}',
    publish: ['github'],
  },
  nsis: {
    oneClick: false,
    perMachine: true,
    allowToChangeInstallationDirectory: true,
  },
  msi: {
    perMachine: true,
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
    universalApp: {
      archs: ['x64', 'arm64'],
      mergeASARs: true,
    },
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

export default config;
