/**
 * M-002 smoke — validates harness: Vite dev (3002) + proxy -> BE (8080) + admin login + M-002 route access.
 */
import { test, expect } from '@playwright/test';
import { loginAdmin } from './m002-helpers';

test('M-002 smoke: admin login reaches app', async ({ page }) => {
  await loginAdmin(page);
  await expect(page).not.toHaveURL(/login/);
});

test('M-002 smoke: /cangbien route accessible to admin (no permission wall)', async ({ page }) => {
  await loginAdmin(page);
  await page.goto('/cangbien');
  await expect(page.getByText('Không có quyền truy cập')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /tạo mới|thêm/i }).first()).toBeVisible({ timeout: 15_000 });
});
