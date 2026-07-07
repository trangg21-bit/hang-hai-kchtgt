import { test, expect } from '@playwright/test';

test.describe('Quản lý vai trò (Role)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Tên đăng nhập').fill('admin');
    await page.getByPlaceholder('Mật khẩu').fill('admin123');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    // After login, we land on home page (/)
    await page.waitForURL(/\/$/);
  });

  test('Hiển thị danh sách vai trò', async ({ page }) => {
    await page.goto('/roles');
    await expect(page.locator('.ant-table')).toBeVisible();
  });

  test('Tạo mới vai trò', async ({ page }) => {
    await page.goto('/roles');
    await page.getByRole('button', { name: /Tạo vai trò/ }).click();

    await page.getByLabel('Tên vai trò').fill('E2E Tester');
    await page.getByLabel('Mã vai trò').fill('e2e_tester_' + Date.now());
    await page.getByLabel('Mô tả').fill('Mô tả cho E2E Tester');
    
    // Select at least one permission in the tree — Tree uses .ant-tree-node-content-wrapper
    await page.locator('.ant-tree-node-content-wrapper .ant-tree-checkbox').first().click();

    await page.getByRole('button', { name: /Tạo mới/ }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('Sửa vai trò', async ({ page }) => {
    await page.goto('/roles');
    // Wait for table body
    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 10000 });
    const tableBody = page.locator('.ant-table-tbody');
    await tableBody.scrollIntoViewIfNeeded();

    const firstRow = page.locator('.ant-table-row').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    
    await firstRow.locator('button[title="Sửa"]').first().click();

    await page.getByLabel('Tên vai trò').fill('Updated E2E Tester');
    await page.getByRole('button', { name: /Cập nhật/ }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('Tạo và xóa vai trò', async ({ page }) => {
    await page.goto('/roles');
    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 10000 });
    
    // 1. Tạo mới
    await page.getByRole('button', { name: /Tạo vai trò/ }).click();
    const roleName = 'Delete Test Role ' + Date.now();
    await page.getByLabel('Tên vai trò').fill(roleName);
    await page.getByLabel('Mã vai trò').fill('del_role_' + Date.now());
    await page.getByLabel('Mô tả').fill('Mô tả cho Delete Test Role');
    await page.locator('.ant-tree-node-content-wrapper .ant-tree-checkbox').first().click();
    await page.getByRole('button', { name: /Tạo mới/ }).click();
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
    
    // Wait for message to disappear
    await page.waitForTimeout(1000);

    // 2. Tìm hàng vừa tạo và xóa
    const tableBody = page.locator('.ant-table-tbody');
    await tableBody.scrollIntoViewIfNeeded();
    const newRow = page.locator(`.ant-table-row:has-text("${roleName}")`).first();
    await expect(newRow).toBeVisible({ timeout: 5000 });
    await newRow.locator('button[title="Xóa"]').first().click();
    await page.locator('.ant-modal-confirm-btns button:has-text("Xóa")').first().click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });
});
