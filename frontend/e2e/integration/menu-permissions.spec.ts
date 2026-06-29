import { type Page, test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

/**
 * Decode JWT payload (base64url — middle segment) into JSON.
 * Uses atob() available in both browsers and Node.js.
 */
function parseJwt(token: string): any {
  const parts = token.split('.');
  if (parts.length < 2) return {};
  let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return JSON.parse(atob(b64));
}

/**
 * Login helper: visits /login, fills admin credentials, waits for redirect to /users.
 */
async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Tài khoản').fill('admin');
  await page.getByLabel('Mật khẩu').fill('admin123');
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await page.waitForURL(/\/users/);
}

test.describe('Quản lý tích hợp — M-001', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  // ──────────────────────────────────────────────
  // Test 1: JWT token contains 'permissions' claim after login
  // ──────────────────────────────────────────────
  test('Đăng nhập thành công → JWT token trong localStorage có claim "permissions"', async ({
    page,
  }) => {
    // 1. Vào trang login
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /đăng nhập/i })).toBeVisible({
      timeout: 5000,
    });

    // 2. Điền thông tin đăng nhập
    await page.getByLabel('Tài khoản').fill('admin');
    await page.getByLabel('Mật khẩu').fill('admin123');

    // 3. Submit form
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    // 4. Đợi chuyển hướng đến trang chủ (/users)
    await page.waitForURL(/\/users/);
    await expect(page).toHaveURL(/\/users/);

    // 5. Đọc auth_token từ localStorage
    const token: string | null = await page.evaluate(() => {
      return window.localStorage.getItem('auth_token');
    });

    expect(token, 'auth_token phải tồn tại trong localStorage sau khi đăng nhập').toBeTruthy();
    expect(token, 'token phải có đúng 3 phần').toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);

    // 6. Giải mã JWT và kiểm tra claim 'permissions'
    const payload = parseJwt(token!);
    expect(payload, 'JWT payload phải parse được').toBeDefined();
    expect(
      payload.permissions,
      'JWT payload phải chứa key "permissions" — nếu không backend tạo token thiếu claim này',
    ).toBeDefined();
  });

  // ──────────────────────────────────────────────
  // Test 2: Admin có đủ permissions để thấy toàn bộ sidebar menu items
  // ──────────────────────────────────────────────
  test(
    'Sau khi đăng nhập, admin có đầy đủ permissions để hiển thị sidebar menu items',
    async ({ page }) => {
      // 1. Login
      await loginAsAdmin(page);

      // 2. Đọc JWT từ localStorage
      const token: string | null = await page.evaluate(() => {
        return window.localStorage.getItem('auth_token');
      });
      expect(token, 'auth_token phải tồn tại sau khi đăng nhập').toBeTruthy();

      // 3. Parse JWT và verify permissions claim
      const payload = parseJwt(token!);
      expect(payload.permissions, 'JWT phải có claim "permissions"').toBeDefined();
      expect(Array.isArray(payload.permissions), 'claim "permissions" phải là một mảng').toBe(true);

      // 4. Admin phải có ít nhất các permissions cơ bản
      const requiredPermissions = [
        'user:manage',
        'group:manage',
        'admin:manage',
        'role:manage',
        'orgunit:manage',
      ];
      for (const perm of requiredPermissions) {
        expect(
          payload.permissions,
          `admin phải có permission "${perm}"`,
        ).toContain(perm);
      }

      // 5. Verify các sidebar menu items tương ứng được hiển thị
      const menuItems = [
        { label: 'Quản lý người dùng', perm: 'user:manage' },
        { label: 'Quản lý nhóm', perm: 'group:manage' },
        { label: 'Quản trị viên', perm: 'admin:manage' },
        { label: 'Phân quyền', perm: 'role:manage' },
        { label: 'Quản lý đơn vị', perm: 'orgunit:manage' },
      ];

      for (const item of menuItems) {
        const locator = page.locator(`nav .ant-menu-item:has-text("${item.label}")`);
        await expect(locator, `Sidebar phải hiển thị mục "${item.label}" — tương ứng với permission "${item.perm}"`).toBeVisible({
          timeout: 5000,
        });
      }
    },
    { timeout: 30000 },
  );

  // ──────────────────────────────────────────────
  // Test 3: Sidebar menu chứa đủ tất cả items cho super admin
  // ──────────────────────────────────────────────
  test(
    'Sidebar menu chứa đầy đủ các mục cho super admin',
    async ({ page }) => {
      // 1. Login
      await loginAsAdmin(page);

      // 2. Đợi sidebar render hoàn tất
      await expect(page.locator('nav')).toBeVisible({ timeout: 5000 });

      // 3. Verify từng menu item của sidebar (permission-gated)
      const permissionMenuItems = [
        'Quản lý người dùng',
        'Quản lý đơn vị',
        'Quản lý nhóm',
        'Quản trị viên',
        'Phân quyền',
      ];

      for (const menuItem of permissionMenuItems) {
        const locator = page.locator(`nav .ant-menu-item:has-text("${menuItem}")`);
        await expect(locator, `Sidebar phải hiển thị mục "${menuItem}"`).toBeVisible({
          timeout: 5000,
        });
      }

      // 4. Verify các mục menu bổ sung (không phải permission-gated)
      const extraMenuItems = [
        'GIS • Bản đồ',
        'Báo cáo & Thống kê',
      ];

      for (const item of extraMenuItems) {
        const locator = page.locator(`nav :text-is("${item}")`);
        await expect(locator, `Sidebar phải hiển thị mục "${item}"`).toBeVisible({
          timeout: 5000,
        });
      }
    },
    { timeout: 30000 },
  );
});
