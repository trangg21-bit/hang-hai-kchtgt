import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/store/**/*.test.ts', 'src/services/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'tests/**', 'e2e/**', 'src/**/*.test.tsx', 'src/hooks/**'],
  },
});
