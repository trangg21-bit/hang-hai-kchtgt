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
    await page.goto('/admins');
    await expect(page.getByRole('table').first()).toBeVisible();
  });

  test('Tạo mới admin account', async ({ page }) => {
    await page.goto('/admins');
    await page.getByRole('button', { name: /thêm admin/i }).click();

    await page.getByLabel('Tên đăng nhập').fill('e2e_admin');
    await page.getByLabel('Họ và tên').fill('E2E Admin');
    await page.getByLabel('Mật khẩu').fill('Pass123456');
    await page.getByLabel('Email').fill('e2e_admin@hh.gov.vn');
    
    // Choose Role
    await page.locator('.ant-form-item:has(label:has-text("Vai trò")) .ant-select').click();
    await page.locator('.ant-select-item-option').first().click();

    await page.getByRole('button', { name: /tạo admin/i }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('Sửa admin account', async ({ page }) => {
    await page.goto('/admins');
    await page.locator('.anticon-edit').first().click();

    // Wait for form data to load
    const nameInput = page.getByLabel('Họ và tên');
    await expect(nameInput).toHaveValue('Nguyễn Văn An', { timeout: 5000 });

    await page.getByRole('button', { name: /cập nhật/i }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });
});
