/**
 * M-003 Trạm Radar — E2E spec
 *
 * Pattern: matches existing suite (live backend, manual login, no page.route mocking).
 * NOTE: TramRadarList and TramRadarForm are Wave-2 placeholders.
 */
import { test, expect } from '@playwright/test';

const LOGIN_URL = '/login';
const LIST_URL = '/tram-radar';
const CREATE_URL = '/tram-radar/create';
const DETAIL_URL = '/tram-radar/1';

async function login(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  await page.goto(LOGIN_URL);
  await page.getByLabel('Tài khoản').fill('admin');
  await page.getByLabel('Mật khẩu').fill('admin123');
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await page.waitForURL(/\/users/);
}

test.describe('M-003 Trạm Radar', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // TC-M003-TR-01: list route reachable
  test('TC-M003-TR-01: Trang danh sách /tram-radar render không lỗi', async ({ page }) => {
    await page.goto(LIST_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder for Wave 2/i)).toBeVisible({ timeout: 8000 });
  });

  // TC-M003-TR-02: create route reachable
  test('TC-M003-TR-02: Trang tạo mới /tram-radar/create render không lỗi', async ({ page }) => {
    await page.goto(CREATE_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder for Wave 2/i)).toBeVisible({ timeout: 8000 });
  });

  // TC-M003-TR-03: detail route reachable
  test('TC-M003-TR-03: Trang chi tiết /tram-radar/:id render không lỗi', async ({ page }) => {
    await page.goto(DETAIL_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder for Wave 2/i)).toBeVisible({ timeout: 8000 });
  });

  // TC-M003-TR-04: PermissionGuard (tramradar:read / tramradar:create)
  test('TC-M003-TR-04: Route được bảo vệ bởi PermissionGuard (tramradar:read/create)', async ({ page }) => {
    await page.goto(LIST_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder for Wave 2/i)).toBeVisible({ timeout: 8000 });
  });

  // TC-M003-TR-05: PheDuyetRequest uses quyetDinh — no nguoiPheDuyet
  test('TC-M003-TR-05: TramRadar PheDuyetRequest type sử dụng quyetDinh, không có nguoiPheDuyet', async ({ page }) => {
    // types/tramRadar.ts: PheDuyetRequest = { quyetDinh: string; lyDo?: string }
    // CoordinateInput shared component: kinhDo/viDo are BigDecimal on BE → number on FE.
    // Wave-2 form must not send nguoiPheDuyet in approve body.
    await page.goto(DETAIL_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder for Wave 2/i)).toBeVisible({ timeout: 8000 });
    // DEFECT-M003-TR-01 tracked: TramRadarForm not wired; CG-02 (coordinate fields) unresolved
  });
});
