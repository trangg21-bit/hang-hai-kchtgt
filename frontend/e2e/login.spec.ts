import { test, expect } from '@playwright/test';

test.describe('Đăng nhập', () => {
  test.beforeEach(async ({ page }) => {
    // Clear login state — cookies AND localStorage before every navigation
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('Đăng nhập thành công với admin/admin123', async ({ page }) => {
    // 1. Vào trang login
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /Đăng nhập/i })).toBeVisible();

    // 2. Fill credentials
    await page.getByPlaceholder('Tên đăng nhập').fill('admin');
    await page.getByPlaceholder('Mật khẩu').fill('admin123');

    // 3. Submit form
    await page.getByRole('button', { name: /Đăng nhập/i }).click();

    // 4. Verify redirect — LoginPage redirects to '/' (home page), not /users
    await page.waitForURL(/\/$/);
    await expect(page).toHaveURL(/\/$/);
  });

  test('Đăng nhập thất bại — sai mật khẩu', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('Tên đăng nhập').fill('admin');
    await page.getByPlaceholder('Mật khẩu').fill('sai');

    await page.getByRole('button', { name: /Đăng nhập/i }).click();

    // Verify hiển thị error message
    await expect(page.locator('.ant-message-error').first()).toBeVisible({ timeout: 5000 });
  });

  test('Đăng nhập thất bại — tài khoản không tồn tại', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('Tên đăng nhập').fill('notexist');
    await page.getByPlaceholder('Mật khẩu').fill('admin123');

    await page.getByRole('button', { name: /Đăng nhập/i }).click();

    await expect(page.locator('.ant-message-error').first()).toBeVisible({ timeout: 5000 });
  });

  test('Logout sau khi đăng nhập', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByPlaceholder('Tên đăng nhập').fill('admin');
    await page.getByPlaceholder('Mật khẩu').fill('admin123');
    await page.getByRole('button', { name: /Đăng nhập/i }).click();
    // LoginPage redirects to '/' (home page)
    await page.waitForURL(/\/$/);

    // Logout — click avatar dropdown
    await page.locator('css=.ant-avatar').click();
    await page.getByText('Đăng xuất').click();
    await page.waitForURL(/\/login/);
  });
});
