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
    await page.getByLabel('Mã đơn vị').fill('E2E_DEPT');
    await page.getByRole('button', { name: /lưu/i }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('Sửa đơn vị', async ({ page }) => {
    await page.goto('/organizations');
    await page.locator('.anticon-edit').first().click();

    // Wait for the form to load existing data
    const nameInput = page.getByLabel('Tên đơn vị');
    await expect(nameInput).toHaveValue('Cơ quan Đầu não', { timeout: 5000 });

    await nameInput.fill('Updated E2E Dept');
    await page.getByRole('button', { name: /lưu/i }).click();

    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });
});
