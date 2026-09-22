/**
 * M-002 Bến cảng — E2E spec
 *
 * Pattern: live backend, manual login.
 * Asserts the REAL UI (BerthListPage / BerthForm in Drawer), following
 * the project convention where CRUD actions are rendered via Drawer on /berth.
 */
import { test, expect, Page } from '@playwright/test';

const LIST_URL = '/berth';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Tài khoản').fill('admin');
  await page.getByLabel('Mật khẩu').fill('Asdqwe@123');
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await page.waitForURL((url) => !/\/login/.test(url.pathname), { timeout: 15000 });
}

test.describe('M-002 Bến cảng (Berth)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('TC-M002-BC-01: Trang danh sách hiển thị bảng + thanh công cụ + StatusTabs thật', async ({ page }) => {
    await page.goto(LIST_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /thêm mới/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Tất cả' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('TC-M002-BC-02: Bộ lọc sidebar và các StatusTabs hiển thị đúng chuẩn', async ({ page }) => {
    await page.goto(LIST_URL);
    await expect(page.getByPlaceholder(/Tìm theo tên bến cảng/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /tìm kiếm/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tất cả' })).toBeVisible();
  });

  test('TC-M002-BC-03: Nhấn nút Thêm mới mở Drawer với form nhập liệu đầy đủ các nút lưu', async ({ page }) => {
    await page.goto(LIST_URL);
    await page.getByRole('button', { name: /thêm mới/i }).click();

    // Verify Drawer opens
    const drawer = page.locator('.ant-drawer-open');
    await expect(drawer).toBeVisible({ timeout: 8000 });
    await expect(drawer.getByText(/Thêm mới Bến cảng/i)).toBeVisible();
    await expect(drawer.getByText('Thông tin chung')).toBeVisible();
    await expect(drawer.getByText('Đơn vị quản lý', { exact: true })).toBeVisible();

    // Verify action buttons in Drawer footer
    await expect(drawer.getByRole('button', { name: 'Lưu tạm' })).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Lưu và gửi phê duyệt' })).toBeVisible();
  });

  test('TC-M002-BC-04: Bảng dữ liệu Bến cảng hiển thị đúng các cột nghiệp vụ chuẩn', async ({ page }) => {
    await page.goto(LIST_URL);
    const thead = page.locator('thead');
    await expect(thead.getByText('STT')).toBeVisible();
    await expect(thead.getByText(/Tên\/Mã bến cảng/i)).toBeVisible();
    await expect(thead.getByText('Đơn vị quản lý')).toBeVisible();
    await expect(thead.getByText('Thuộc cảng biển')).toBeVisible();
    await expect(thead.getByText('Tình trạng')).toBeVisible();
  });

  test('TC-M002-BC-05: Mở Drawer Xem chi tiết từ danh sách bến cảng', async ({ page }) => {
    await page.goto(LIST_URL);
    const firstRowLink = page.locator('tbody tr td a').first();
    if (await firstRowLink.count() > 0) {
      await firstRowLink.click();
      const drawer = page.locator('.ant-drawer-open');
      await expect(drawer).toBeVisible({ timeout: 5000 });
      await expect(drawer.getByText(/Chi tiết bến cảng/i)).toBeVisible();
    }
  });
});
