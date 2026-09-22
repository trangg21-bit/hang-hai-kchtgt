/**
 * M-003 Trạm radar — E2E spec
 *
 * Pattern: live backend, manual login (no page.route mocking).
 * Asserts the REAL Wave-2 UI (TramRadarList / TramRadarForm), not placeholders.
 */
import { test, expect, Page } from '@playwright/test';

const LIST_URL = '/radar-station';
const CREATE_URL = '/radar-station/create';
const DETAIL_URL = '/radar-station/1';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Tài khoản').fill('admin');
  await page.getByLabel('Mật khẩu').fill('Asdqwe@123');
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await page.waitForURL((url) => !/\/login/.test(url.pathname), { timeout: 15000 });
}

test.describe('M-003 Trạm radar', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('TC-M003-TR-01: Trang danh sách hiển thị bảng + thanh công cụ thật', async ({ page }) => {
    await page.goto(LIST_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Thêm mới' })).toBeVisible({ timeout: 8000 });
    await expect(page.locator('thead').getByText('Trạng thái')).toBeVisible();
  });

  test('TC-M003-TR-02: Trang tạo mới hiển thị form với field thật', async ({ page }) => {
    await page.goto(CREATE_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Tạo trạm radar mới|Thêm mới trạm radar/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Tên trạm radar')).toBeVisible();
  });

  test('TC-M003-TR-03: Trang chi tiết /radar-station/:id reachable', async ({ page }) => {
    await page.goto(DETAIL_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder/i)).toHaveCount(0);
  });
});
