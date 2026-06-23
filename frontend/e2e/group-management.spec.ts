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
    await expect(page.getByRole('table').first()).toBeVisible();
  });

  test('Tạo mới nhóm', async ({ page }) => {
    await page.goto('/groups');
    await page.getByRole('button', { name: /thêm nhóm/i }).click();

    await page.getByLabel('Tên nhóm').fill('Nhóm E2E Test');
    await page.getByLabel('Mô tả').fill('Test group for E2E');

    await page.getByRole('button', { name: /tạo nhóm/i }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('Sửa thông tin nhóm', async ({ page }) => {
    await page.goto('/groups');
    await page.locator('.anticon-edit').first().click();

    const nameInput = page.getByLabel('Tên nhóm');
    await expect(nameInput).toHaveValue('Nhóm Quản trị viên', { timeout: 5000 });

    await page.getByLabel('Mô tả').fill('Updated E2E test group');
    await page.getByRole('button', { name: /cập nhật/i }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('Xóa nhóm', async ({ page }) => {
    await page.goto('/groups');
    await page.locator('.anticon-delete').first().click();
    await page.locator('.ant-modal-confirm-btns button:has-text("Xóa")').click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });
});
