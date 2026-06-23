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
    await page.getByRole('button', { name: /thêm/i }).click();

    const uniqueId = Date.now();
    await page.locator('#username').fill('e2e_admin_' + uniqueId);
    await page.locator('#fullName').fill('E2E Admin Full Name');
    await page.locator('#password').fill('Pass123456');
    await page.locator('#email').fill('e2e_admin_' + uniqueId + '@hh.gov.vn');
    
    const roleSelect = page.locator('.ant-form-item:has(label:has-text("Vai trò")) .ant-select').first();
    await roleSelect.click();
    await page.locator('.ant-select-item-option:has-text("System Admin")').first().click();

    await page.getByRole('button', { name: /tạo mới/i }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('Sửa admin account', async ({ page }) => {
    await page.goto('/admins');
    const firstRow = page.locator('.ant-table-row').first();
    await expect(firstRow).toBeVisible({ timeout: 5000 });
    
    await firstRow.locator('.anticon-edit').click();

    // Wait for the form to load initial data
    await expect(page.locator('#email')).not.toHaveValue('');

    await page.locator('#fullName').fill('E2E Admin Edited');
    await page.getByRole('button', { name: /cập nhật/i }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });
});
