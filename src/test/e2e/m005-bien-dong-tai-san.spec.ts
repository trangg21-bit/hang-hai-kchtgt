/**
 * M-005 smoke — validates harness: Vite dev (3001) + proxy -> BE (8080) + admin login + M-005 route access.
 * Module: Quản lý biến động tài sản KCHTGT (F-122 through F-127)
 * 
 * NOTE: Move this file to frontend/e2e/ directory before running.
 */
import { test, expect } from '@playwright/test';
import { loginAdmin } from './m002-helpers';

test('M-005 smoke: admin login reaches app', async ({ page }) => {
  await loginAdmin(page);
  await expect(page).not.toHaveURL(/login/);
});

test('M-005 smoke: /tai-san route accessible to admin (no permission wall)', async ({ page }) => {
  await loginAdmin(page);
  await page.goto('/tai-san');
  await expect(page.getByText('Không có quyền truy cập')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /tạo mới|thêm/i }).first()).toBeVisible({ timeout: 15_000 });
});

test('M-005 smoke: /bien-dong-tai-san route accessible to admin', async ({ page }) => {
  await loginAdmin(page);
  await page.goto('/bien-dong-tai-san');
  await expect(page.getByText('Không có quyền truy cập')).toHaveCount(0);
});

test('M-005 smoke: /kiem-ke route accessible to admin', async ({ page }) => {
  await loginAdmin(page);
  await page.goto('/kiem-ke');
  await expect(page.getByText('Không có quyền truy cập')).toHaveCount(0);
});
