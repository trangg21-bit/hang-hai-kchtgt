/**
 * M-005 E2E — Smoke tests for asset movement pages.
 * Admin account may lack granular permissions (asset:yeu-cau-tang etc.)
 * so full CRUD E2E is tested via backend unit/integration tests instead.
 * 
 * Run: npx playwright test e2e/m005-bien-dong-tai-san.spec.ts --project=desktop
 */
import { test, expect } from '@playwright/test';
import { loginAdmin } from './m002-helpers';

test.describe('M-005 Biến động tài sản — Smoke', () => {
  test('tăng tài sản: page loads (no crash)', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/asset/increase');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    // PermissionGuard có thể chặn nếu thiếu permission — page vẫn load, không crash
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('giảm tài sản: page loads (no crash)', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/asset/decrease');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('kiểm kê: page loads (no crash)', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/asset/inventory');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('khai thác: page loads (no crash)', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/asset/exploitation');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await expect(page).not.toHaveURL(/\/login/);
  });
});
