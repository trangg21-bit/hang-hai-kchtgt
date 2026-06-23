import { test, expect } from '@playwright/test';

test.describe('Quản lý đơn vị', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Tài khoản').fill('admin');
    await page.getByLabel('Mật khẩu').fill('admin123');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL(/\/users/);
  });

  test('Hiển thị danh sách đơn vị', async ({ page }) => {
    await page.goto('/organizations');
    await expect(page.getByRole('table').first()).toBeVisible();
  });

  test('Tạo mới đơn vị', async ({ page }) => {
    await page.goto('/organizations');
    await page.getByRole('button', { name: /thêm/i }).click();

    await page.getByLabel('Tên đơn vị').fill('Phòng E2E Test');
    await page.locator('#code').fill('e2e_org_' + Date.now());
    await page.getByRole('button', { name: /tạo mới/i }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('Sửa đơn vị', async ({ page }) => {
    await page.goto('/organizations');
    const firstRow = page.locator('.ant-table-row').first();
    await expect(firstRow).toBeVisible({ timeout: 5000 });
    
    await firstRow.locator('.anticon-edit').click();

    // Wait for the form to load initial data
    await expect(page.locator('#name')).not.toHaveValue('');

    await page.getByLabel('Tên đơn vị').fill('Updated E2E Dept');
    await page.getByRole('button', { name: /cập nhật/i }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });
});
