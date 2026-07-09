import { defineConfig, devices } from '@playwright/test';

// M-004 E2E — runs the working-tree Vite dev server on port 3004 (Docker FE holds 3001),
// which proxies /api -> http://localhost:8080 (running Docker backend).
export default defineConfig({
  testDir: './e2e',
  testMatch: /m004-.*\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3004',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1920, height: 1080 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev -- --port 3004 --strictPort',
    url: 'http://localhost:3004',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
