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
    await expect(page.getByRole('table').first()).toBeVisible();
  });

  test('Tạo mới vai trò', async ({ page }) => {
    await page.goto('/roles');
    await page.getByRole('button', { name: /tạo vai trò/i }).click();

    await page.getByLabel('Tên vai trò').fill('E2E Tester');
    await page.getByLabel('Mô tả').fill('Test role description');
    
    // Check at least one permission in the tree
    await page.locator('.ant-tree-checkbox').first().click();

    await page.getByRole('button', { name: 'Tạo mới', exact: true }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('Sửa vai trò', async ({ page }) => {
    await page.goto('/roles');
    await page.locator('.anticon-edit').first().click();

    const nameInput = page.getByLabel('Tên vai trò');
    await expect(nameInput).toHaveValue('Quản trị viên (Super Admin)', { timeout: 5000 });

    await nameInput.fill('Updated E2E Tester');
    await page.getByRole('button', { name: 'Cập nhật', exact: true }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('Xóa vai trò', async ({ page }) => {
    await page.goto('/roles');
    
    // Create a temporary role with 0 users
    await page.getByRole('button', { name: /tạo vai trò/i }).click();
    await page.getByLabel('Tên vai trò').fill('To Be Deleted');
    await page.getByLabel('Mô tả').fill('Temp role description');
    await page.locator('.ant-tree-checkbox').first().click();
    await page.getByRole('button', { name: 'Tạo mới', exact: true }).click();
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
    
    // Click delete on the newly created role
    const row = page.locator('tr', { hasText: 'To Be Deleted' });
    await row.locator('.anticon-delete').click();
    await page.locator('.ant-modal-confirm-btns button:has-text("Xóa")').click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });
});
