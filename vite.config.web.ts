import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@renderer': `${__dirname}/app/renderer`,
      '@shared': `${__dirname}/app/shared`,
    },
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
});
