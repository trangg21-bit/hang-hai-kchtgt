import { test, expect } from '@playwright/test';

test.describe('Quản lý tài khoản admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Tài khoản').fill('admin');
    await page.getByLabel('Mật khẩu').fill('admin123');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL(/\/users/);
  });

  test('Hiển thị danh sách admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('Tạo mới admin account', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('button', { name: /thêm/i }).click();

    await page.getByLabel('Tên đăng nhập').fill('e2e_admin');
    await page.getByLabel('Mật khẩu').fill('Pass123456');
    await page.getByRole('button', { name: /lưu/i }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('Sửa admin account', async ({ page }) => {
    await page.goto('/admin');
    const firstRow = page.locator('tr').first();
    await firstRow.getByRole('button', { name: /sửa/i }).click();

    await page.getByRole('button', { name: /lưu/i }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });
});
