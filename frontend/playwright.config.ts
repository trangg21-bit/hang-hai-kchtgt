import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config cho HH.KCHT E2E testing.
 * Chạy: npm run e2e
 * UI mode: npm run e2e-ui
 */
export default defineConfig({
  testDir: '.',
  testMatch: [
    'tests/**/*.spec.ts',
    'e2e/**/*.spec.ts'
  ],
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    storageState: 'e2e/.auth/state.json',
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    cwd: '.',
    timeout: 30000,
  },
});
