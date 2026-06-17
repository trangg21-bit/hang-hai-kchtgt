import { test, expect } from '@playwright/test';

test.describe('Quản lý nhóm', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Tài khoản').fill('admin');
    await page.getByLabel('Mật khẩu').fill('admin123');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL(/\/users/);
  });

  test('Hiển thị danh sách nhóm', async ({ page }) => {
    await page.goto('/groups');
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('Tạo mới nhóm', async ({ page }) => {
    // Navigate to groups
    await page.goto('/groups');

    // Click create button
    await page.getByRole('button', { name: /thêm/i }).click();

    // Fill form
    await page.getByLabel('Tên nhóm').fill('Nhóm E2E Test');
    await page.getByLabel('Mã nhóm').fill('E2E_TEST');
    await page.getByLabel('Mô tả').fill('Test group for E2E');

    // Submit
    await page.getByRole('button', { name: /lưu/i }).click();

    // Verify success
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('Sửa thông tin nhóm', async ({ page }) => {
    await page.goto('/groups');
    const firstRow = page.locator('tr').first();
    await firstRow.getByRole('button', { name: /sửa/i }).click();

    await page.getByLabel('Mô tả').fill('Updated E2E test group');
    await page.getByRole('button', { name: /lưu/i }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('Xóa nhóm', async ({ page }) => {
    await page.goto('/groups');
    const firstRow = page.locator('tr').first();
    await firstRow.getByRole('button', { name: /xóa/i }).click();
    await page.getByRole('button', { name: /xóa/i }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });
});
