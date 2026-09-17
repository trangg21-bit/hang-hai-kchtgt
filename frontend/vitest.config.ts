import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 20000,
    include: [
      'src/store/**/*.test.ts',
      'src/services/**/*.test.ts',
      'src/utils/**/*.test.ts',
      'src/components/AppLayout.test.tsx',
      'src/components/reports/**/*.test.tsx',
      'src/components/kcht/**/*.test.tsx',
      'src/config/**/*.test.ts',
      'src/pages/**/*.test.tsx',
      'src/hooks/useKcht*.test.ts',
      'src/hooks/usePermissions.test.ts',
    ],
    exclude: ['node_modules', 'dist', 'tests/**', 'e2e/**', 'src/hooks/useUsers.test.ts'],
  },
});
