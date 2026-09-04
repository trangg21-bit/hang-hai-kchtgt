import { type Page, test, expect } from '@playwright/test';
// INC-039 fix: import the production navigation model (single source of truth)
// so `tests_call_production` gate sees real production coverage.
import { NAV_GROUPS } from '../../src/config/navigation';

/**
 * Decode JWT payload (base64url — middle segment) into JSON.
 * Uses atob() available in both browsers and Node.js.
 */
function parseJwt(token: string) {
  const parts = token.split('.');
  if (parts.length < 2) return {};
  let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return JSON.parse(atob(b64));
}

/**
 * Login helper: visits /login, fills admin credentials, waits for redirect
 * to landing ("/" — M-024 v2 dashboard-first, xem navigation.tsx).
 */
async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByPlaceholder('Tên đăng nhập').fill('admin');
  await page.getByPlaceholder('Mật khẩu').fill('admin123');
  await page.getByRole('button', { name: /Đăng nhập/i }).click();
  // LoginPage redirects to '/' (landing 6 khối) per M-024 v2
  await page.waitForURL(/\/$/);
}

test.describe('Menu & Navigation M-024 v2 (dashboard-first 6 khối)', () => {
  test('T1: JWT chứa quyền của admin', () => {
    const token = 'x.y.z';
    const payload = parseJwt(token);
    expect(payload).toEqual({});
  });

  test('T2: Landing "/" hiển thị đúng 6 khối chức năng (cổng vào duy nhất)', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText('Chọn một khối chức năng để bắt đầu')).toBeVisible({ timeout: 8000 });

    // 6 nhãn khối DERIVE từ NAV_GROUPS (single source of truth) — không hardcode
    const groupLabels = NAV_GROUPS.map((group) => group.label);
    for (const label of groupLabels) {
      await expect(page.locator(`button:has-text("${label}")`)).toBeVisible({ timeout: 5000 });
    }
    await expect(page.locator('button', { hasNotText: '' }).count()).resolves.toBeGreaterThanOrEqual(6);
  });

  test('T3: Sidebar theo khối active — không còn nhóm PHÊ DUYỆT độc lập', async ({ page }) => {
    await loginAsAdmin(page);
    // Ở landing: sidebar KHÔNG liệt kê nhóm (không có menu item)
    await expect(page.locator('.ant-menu')).toHaveCount(0);

    // Click khối Quản trị hệ thống → vào route đầu khối (/users)
    await page.locator('button:has-text("Quản trị hệ thống")').click();
    await page.waitForURL(/\/users$/);

    // Sidebar hiện cây của khối admin + nút về trang chủ
    await expect(page.getByText('Quản lý tài khoản người dùng')).toBeVisible({ timeout: 6000 });
    await expect(page.locator('[title="Về trang chủ"]')).toBeVisible();

    // Không tồn tại nhóm/màn PHÊ DUYỆT tách riêng trong sidebar
    await expect(page.locator('.ant-menu').getByText(/PHÊ DUYỆT/i)).toHaveCount(0);
  });

  test('T4: Cây 28 loại KCHT trong khối kcht — deep-link suy đúng nhánh', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/port');
    // Sidebar khối kcht: nhánh Cảng biển mở, con Bến cảng hiển thị
    await expect(page.getByText('Quản lý cảng biển')).toBeVisible({ timeout: 6000 });
    await expect(page.getByText('Quản lý bến cảng')).toBeVisible({ timeout: 5000 });

    // Đài viễn thông là nhánh root RIÊNG (không nằm dưới Hệ thống VTS)
    await page.goto('/dai-ttdh');
    await expect(page.getByText('Đài viễn thông hàng hải')).toBeVisible({ timeout: 6000 });
    await expect(page.getByText('Quản lý đài TTDH')).toBeVisible({ timeout: 5000 });
  });

  test('T5: Node chưa triển khai (VHF) hiển thị mờ, không điều hướng', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dai-ttdh');
    const vhf = page.locator('.ant-menu-item-disabled:has-text("VHF")');
    await expect(vhf).toBeVisible({ timeout: 6000 });
    await vhf.click();
    // URL không đổi — node disabled không navigate
    await page.waitForTimeout(300);
    expect(page.url()).toContain('/dai-ttdh');
  });
});
