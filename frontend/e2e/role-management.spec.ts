import { test, expect } from '@playwright/test';

test.describe('Quản lý vai trò (Role)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Tài khoản').fill('admin');
    await page.getByLabel('Mật khẩu').fill('admin123');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL(/\/users/);
  });

  test('Hiển thị danh sách vai trò', async ({ page }) => {
    await page.goto('/roles');
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('Tạo mới vai trò', async ({ page }) => {
    await page.goto('/roles');
    await page.getByRole('button', { name: /thêm/i }).click();

    await page.getByLabel('Tên vai trò').fill('E2E Tester');
    await page.getByLabel('Mã vai trò').fill('E2E_TESTER');

    // Submit without permissions (optional field)
    await page.getByRole('button', { name: /lưu/i }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('Sửa vai trò', async ({ page }) => {
    await page.goto('/roles');
    const firstRow = page.locator('tr').first();
    await firstRow.getByRole('button', { name: /sửa/i }).click();

    await page.getByLabel('Tên vai trò').fill('Updated E2E Tester');
    await page.getByRole('button', { name: /lưu/i }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('Xóa vai trò', async ({ page }) => {
    await page.goto('/roles');
    const firstRow = page.locator('tr').first();
    await firstRow.getByRole('button', { name: /xóa/i }).click();
    await page.getByRole('button', { name: /xóa/i }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });
});
