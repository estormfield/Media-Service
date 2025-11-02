import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    setupFiles: ['tests/unit/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage/unit',
    },
  },
});
