/**
 * M-003 Luồng Hàng Hải — E2E spec
 *
 * Pattern: live backend, manual login (no page.route mocking).
 * Asserts the REAL Wave-2 UI (LuongHangHaiList / LuongHangHaiForm), not placeholders.
 */
import { test, expect, Page } from '@playwright/test';

const LIST_URL = '/luong-hang-hai';
const CREATE_URL = '/luong-hang-hai/create';
const DETAIL_URL = '/luong-hang-hai/1';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Tài khoản').fill('admin');
  await page.getByLabel('Mật khẩu').fill('admin123');
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await page.waitForURL(/\/users/);
}

test.describe('M-003 Luồng Hàng Hải', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('TC-M003-LHH-01: Trang danh sách hiển thị bảng + thanh công cụ thật', async ({ page }) => {
    await page.goto(LIST_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder/i)).toHaveCount(0);
    await expect(page.getByPlaceholder('Tìm kiếm...')).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Thêm mới' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Loại tàu' })).toBeVisible();
  });

  test('TC-M003-LHH-02: Trang tạo mới hiển thị form với field thật', async ({ page }) => {
    await page.goto(CREATE_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole('heading', { name: 'Tạo mới Luồng Hàng Hải' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Loại tàu')).toBeVisible();
  });

  test('TC-M003-LHH-03: Trang chi tiết /luong-hang-hai/:id reachable', async ({ page }) => {
    await page.goto(DETAIL_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder/i)).toHaveCount(0);
  });
});
