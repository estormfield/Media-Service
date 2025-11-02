import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'node:path';

export default defineConfig({
  root: path.resolve(__dirname, 'app/renderer'),
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: path.resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@renderer': path.resolve(__dirname, 'app/renderer'),
      '@shared': path.resolve(__dirname, 'app/shared'),
    },
  },
});
