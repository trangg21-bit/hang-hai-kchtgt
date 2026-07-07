/**
 * M-003 Trạm Radar — E2E spec
 *
 * Pattern: live backend, manual login (no page.route mocking).
 * Asserts the REAL Wave-2 UI (TramRadarList / TramRadarForm), not placeholders.
 */
import { test, expect, Page } from '@playwright/test';

const LIST_URL = '/tram-radar';
const CREATE_URL = '/tram-radar/create';
const DETAIL_URL = '/tram-radar/1';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Tài khoản').fill('admin');
  await page.getByLabel('Mật khẩu').fill('admin123');
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await page.waitForURL(/\/users/);
}

test.describe('M-003 Trạm Radar', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('TC-M003-TR-01: Trang danh sách hiển thị bảng + thanh công cụ thật', async ({ page }) => {
    await page.goto(LIST_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder/i)).toHaveCount(0);
    await expect(page.getByPlaceholder('Tìm kiếm...')).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Thêm mới' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Tên trạm' })).toBeVisible();
  });

  test('TC-M003-TR-02: Trang tạo mới hiển thị form với field thật', async ({ page }) => {
    await page.goto(CREATE_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole('heading', { name: 'Tạo mới Trạm Radar' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Tên trạm')).toBeVisible();
  });

  test('TC-M003-TR-03: Trang chi tiết /tram-radar/:id reachable', async ({ page }) => {
    await page.goto(DETAIL_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder/i)).toHaveCount(0);
  });
});
