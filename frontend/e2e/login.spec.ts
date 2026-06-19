import { test, expect } from '@playwright/test';

test.describe('Đăng nhập', () => {
  test.beforeEach(async ({ page }) => {
    // Clear login state
    await page.context().clearCookies();
  });

  test('Đăng nhập thành công với admin/admin123', async ({ page }) => {
    // 1. Vào trang login
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /đăng nhập/i })).toBeVisible();

    // 2. Fill credentials
    await page.getByLabel('Tài khoản').fill('admin');
    await page.getByLabel('Mật khẩu').fill('admin123');

    // 3. Submit form
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    // 4. Verify redirect
    await page.waitForURL(/\/users/);
    await expect(page).toHaveURL(/\/users/);
  });

  test('Đăng nhập thất bại — sai mật khẩu', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Tài khoản').fill('admin');
    await page.getByLabel('Mật khẩu').fill('sai');

    await page.getByRole('button', { name: /đăng nhập/i }).click();

    // Verify hiển thị error message
    await expect(page.locator('.ant-message-error').first()).toBeVisible({ timeout: 5000 });
  });

  test('Đăng nhập thất bại — tài khoản không tồn tại', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Tài khoản').fill('notexist');
    await page.getByLabel('Mật khẩu').fill('admin123');

    await page.getByRole('button', { name: /đăng nhập/i }).click();

    await expect(page.locator('.ant-message-error').first()).toBeVisible({ timeout: 5000 });
  });

  test('Logout sau khi đăng nhập', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('Tài khoản').fill('admin');
    await page.getByLabel('Mật khẩu').fill('admin123');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL(/\/users/);

    // Logout
    await page.getByRole('button', { name: /đăng xuất/i, exact: false }).click();
    await page.waitForURL(/\/login/);
  });
});
