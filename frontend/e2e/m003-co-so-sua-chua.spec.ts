/**
 * M-003 Cơ sở Sửa chữa/Đóng tàu — E2E spec
 *
 * Pattern: live backend, manual login (no page.route mocking).
 * Asserts the REAL Wave-2 UI (CoSuaChuaList / CoSuaChuaForm), not placeholders.
 */
import { test, expect, Page } from '@playwright/test';

const LIST_URL = '/ship-repair-facility';
const CREATE_URL = '/ship-repair-facility/create';
const DETAIL_URL = '/ship-repair-facility/1';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Tài khoản').fill('admin');
  await page.getByLabel('Mật khẩu').fill('Asdqwe@123');
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await page.waitForURL((url) => !/\/login/.test(url.pathname), { timeout: 15000 });
}

test.describe('M-003 Cơ sở Sửa chữa/Đóng tàu', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('TC-M003-CSC-01: Trang danh sách hiển thị bảng + thanh công cụ thật', async ({ page }) => {
    await page.goto(LIST_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Thêm mới' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Trạng thái phê duyệt')).toBeVisible();
  });

  test('TC-M003-CSC-02: Trang tạo mới hiển thị form với field thật', async ({ page }) => {
    await page.goto(CREATE_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole('heading', { name: 'Tạo mới Cơ sở Sửa chữa' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Tên cơ sở', { exact: true })).toBeVisible();
  });

  test('TC-M003-CSC-03: Trang chi tiết /co-so-sua-chua/:id reachable', async ({ page }) => {
    await page.goto(DETAIL_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder/i)).toHaveCount(0);
  });
});
