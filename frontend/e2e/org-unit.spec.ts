import { test, expect } from '@playwright/test';

test.describe('Quản lý đơn vị', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Tên đăng nhập').fill('admin');
    await page.getByPlaceholder('Mật khẩu').fill('admin123');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL(/\/$/);
  });

  test('Hiển thị danh sách đơn vị', async ({ page }) => {
    await page.goto('/organizations');
    await expect(page.locator('.ant-table')).toBeVisible();
  });

  test('Tạo mới đơn vị', async ({ page }) => {
    await page.goto('/organizations');
    await page.getByRole('button', { name: /Tạo đơn vị/ }).click();

    await page.getByLabel('Tên đơn vị').fill('Phòng E2E Test');
    await page.locator('#maDonVi').fill('e2e_org_' + Date.now());
    await page.getByRole('button', { name: /Tạo mới/ }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('Sửa đơn vị', async ({ page }) => {
    await page.goto('/organizations');
    // Wait for table to be visible
    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 10000 });
    // Scroll to table body to find rows
    const tableBody = page.locator('.ant-table-tbody');
    await tableBody.scrollIntoViewIfNeeded();
    
    // Find first row with data
    const firstRow = page.locator('.ant-table-row').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    
    // Click edit button
    await firstRow.locator('button[title="Sửa"]').first().click();

    // Wait for the form to load initial data
    await expect(page.locator('#tenDonVi')).not.toHaveValue('', { timeout: 5000 });

    await page.getByLabel('Tên đơn vị').fill('Updated E2E Dept');
    await page.getByRole('button', { name: /Cập nhật/ }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });
});
