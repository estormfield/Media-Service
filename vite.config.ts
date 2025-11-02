import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import renderer from 'vite-plugin-electron-renderer';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'app/main/main.ts',
        vite: {
          build: {
            outDir: 'dist/main',
            emptyOutDir: false,
            sourcemap: mode !== 'production',
            rollupOptions: {
              external: [
                'electron',
                'electron-updater',
                'fs-extra',
                'path',
                'url',
                'child_process',
              ],
            },
          },
        },
      },
      preload: {
        input: {
          index: 'app/preload/index.ts',
        },
        vite: {
          build: {
            outDir: 'dist/preload',
            emptyOutDir: false,
            sourcemap: mode !== 'production',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    }),
    renderer(),
  ],
  resolve: {
    alias: {
      '@renderer': `${__dirname}/app/renderer`,
      '@shared': `${__dirname}/app/shared`,
      '@main': `${__dirname}/app/main`,
    },
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: false,
    sourcemap: mode !== 'production',
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
}));
