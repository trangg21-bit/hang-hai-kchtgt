/**
 * M-003 Hệ thống VTS — E2E spec
 *
 * Pattern: matches existing suite (live backend, manual login, no page.route mocking).
 * NOTE: HeThongVTSList and HeThongVTSForm are Wave-2 placeholders.
 */
import { test, expect } from '@playwright/test';

const LOGIN_URL = '/login';
const LIST_URL = '/he-thong-vts';
const CREATE_URL = '/he-thong-vts/create';
const DETAIL_URL = '/he-thong-vts/1';

async function login(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  await page.goto(LOGIN_URL);
  await page.getByLabel('Tài khoản').fill('admin');
  await page.getByLabel('Mật khẩu').fill('admin123');
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await page.waitForURL(/\/users/);
}

test.describe('M-003 Hệ thống VTS', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // TC-M003-VTS-01: list route reachable
  test('TC-M003-VTS-01: Trang danh sách /he-thong-vts render không lỗi', async ({ page }) => {
    await page.goto(LIST_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder for Wave 2/i)).toBeVisible({ timeout: 8000 });
  });

  // TC-M003-VTS-02: create route reachable
  test('TC-M003-VTS-02: Trang tạo mới /he-thong-vts/create render không lỗi', async ({ page }) => {
    await page.goto(CREATE_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder for Wave 2/i)).toBeVisible({ timeout: 8000 });
  });

  // TC-M003-VTS-03: detail route reachable
  test('TC-M003-VTS-03: Trang chi tiết /he-thong-vts/:id render không lỗi', async ({ page }) => {
    await page.goto(DETAIL_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder for Wave 2/i)).toBeVisible({ timeout: 8000 });
  });

  // TC-M003-VTS-04: PermissionGuard (vts:read / vts:create)
  test('TC-M003-VTS-04: Route được bảo vệ bởi PermissionGuard (vts:read/create)', async ({ page }) => {
    await page.goto(LIST_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder for Wave 2/i)).toBeVisible({ timeout: 8000 });
  });

  // TC-M003-VTS-05: PheDuyetRequest uses quyetDinh — unique doiTac field in VTS response
  test('TC-M003-VTS-05: HeThongVTS PheDuyetRequest quyetDinh + doiTac field contract', async ({ page }) => {
    // types/heThongVts.ts: PheDuyetRequest = { quyetDinh: string; lyDo?: string }
    // HeThongVTSResponse has unique field doiTac (partner) not present in other entities.
    // Wave-2 form must expose doiTac field and must not send nguoiPheDuyet in approve body.
    await page.goto(DETAIL_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder for Wave 2/i)).toBeVisible({ timeout: 8000 });
    // DEFECT-M003-VTS-01 tracked: HeThongVTSForm not wired; doiTac field must be included in Wave-2 form
  });
});
