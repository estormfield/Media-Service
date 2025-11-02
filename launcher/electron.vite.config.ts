import { defineConfig } from 'vite';
import electron from 'vite-electron-plugin';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export default defineConfig({
  plugins: [
    electron({
      include: ['app/main/**', 'app/preload/**'],
      transformOptions: {
        sourcemap: true
      }
    })
  ],
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./app/main/app.ts', import.meta.url)),
        preload: fileURLToPath(new URL('./app/preload/index.ts', import.meta.url))
      },
      output: {
        entryFileNames: '[name].js'
      }
    },
    outDir: 'dist/main'
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'app/shared'),
      '@renderer': path.resolve(__dirname, 'app/renderer')
    }
  }
});
