/**
 * M-003 Hệ thống VTS — E2E spec
 *
 * Pattern: live backend, manual login.
 * Asserts the REAL UI (VtsSystemList / VtsSystemForm in Drawer), following
 * the project convention where CRUD actions are rendered via Drawer on /vts-system.
 */
import { test, expect, Page } from '@playwright/test';

const LIST_URL = '/vts-system';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Tài khoản').fill('admin');
  await page.getByLabel('Mật khẩu').fill('Asdqwe@123');
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await page.waitForURL((url) => !/\/login/.test(url.pathname), { timeout: 15000 });
}

test.describe('M-003 Hệ thống VTS', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('TC-M003-VTS-01: Trang danh sách render UI thật đầy đủ các thành phần', async ({ page }) => {
    await page.goto(LIST_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /thêm mới/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Tất cả' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('TC-M003-VTS-02: Bộ lọc sidebar và các StatusTabs hiển thị đúng chuẩn', async ({ page }) => {
    await page.goto(LIST_URL);
    await expect(page.getByPlaceholder(/Tìm theo tên hệ thống VTS/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /tìm kiếm/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tất cả' })).toBeVisible();
  });

  test('TC-M003-VTS-03: Nhấn nút Thêm mới mở Drawer với form nhập liệu đầy đủ trường', async ({ page }) => {
    await page.goto(LIST_URL);
    await page.getByRole('button', { name: /thêm mới/i }).click();

    // Verify Drawer opens
    const drawer = page.locator('.ant-drawer-open');
    await expect(drawer).toBeVisible({ timeout: 8000 });
    await expect(drawer.getByText('Thêm mới hệ thống VTS')).toBeVisible();
    await expect(drawer.getByText('Thông tin chung')).toBeVisible();
    await expect(drawer.getByText('Mã hệ thống VTS', { exact: true })).toBeVisible();
    await expect(drawer.getByText('Tên hệ thống VTS', { exact: true })).toBeVisible();
    await expect(drawer.getByText('Đơn vị quản lý', { exact: true })).toBeVisible();

    // Verify action buttons in Drawer footer
    await expect(drawer.getByRole('button', { name: 'Lưu tạm' })).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Lưu và phê duyệt' })).toBeVisible();
  });

  test('TC-M003-VTS-04: Bảng dữ liệu VTS hiển thị đúng các cột nghiệp vụ chuẩn', async ({ page }) => {
    await page.goto(LIST_URL);
    await expect(page.getByRole('columnheader', { name: /TÊN\/MÃ HỆ THỐNG VTS/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /ĐƠN VỊ QUẢN LÝ/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /TÌNH TRẠNG/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /TRẠNG THÁI/i })).toBeVisible();
  });
});
