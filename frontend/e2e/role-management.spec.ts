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
    await page.getByLabel('Mô tả').fill('Mô tả cho E2E Tester');
    
    // Select at least one permission in the tree
    await page.locator('.ant-tree-checkbox').first().click();

    await page.getByRole('button', { name: /tạo mới/i }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('Sửa vai trò', async ({ page }) => {
    await page.goto('/roles');
    const firstRow = page.locator('.ant-table-row').first();
    await expect(firstRow).toBeVisible({ timeout: 5000 });
    
    await firstRow.locator('.anticon-edit').click();

    await page.getByLabel('Tên vai trò').fill('Updated E2E Tester');
    await page.getByRole('button', { name: /cập nhật/i }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('Tạo và xóa vai trò', async ({ page }) => {
    await page.goto('/roles');
    
    // 1. Tạo mới
    await page.getByRole('button', { name: /tạo vai trò/i }).click();
    const roleName = 'Delete Test Role ' + Date.now();
    await page.getByLabel('Tên vai trò').fill(roleName);
    await page.getByLabel('Mô tả').fill('Mô tả cho Delete Test Role');
    await page.locator('.ant-tree-checkbox').first().click();
    await page.getByRole('button', { name: /tạo mới/i }).click();
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
    
    // Wait for message to disappear
    await page.waitForTimeout(1000);

    // 2. Tìm hàng vừa tạo và xóa
    const newRow = page.locator(`.ant-table-row:has-text("${roleName}")`).first();
    await expect(newRow).toBeVisible({ timeout: 5000 });
    await newRow.locator('.anticon-delete').click();
    await page.locator('.ant-modal-confirm-btns button:has-text("Xóa")').first().click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });
});
