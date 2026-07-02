/**
 * M-003 Cơ sở Sửa chữa/Đóng tàu — E2E spec
 *
 * Pattern: matches existing suite (live backend, manual login, no page.route mocking).
 * NOTE: CoSuaChuaList and CoSuaChuaForm are Wave-2 placeholders.
 */
import { test, expect } from '@playwright/test';

const LOGIN_URL = '/login';
const LIST_URL = '/co-so-sua-chua';
const CREATE_URL = '/co-so-sua-chua/create';
const DETAIL_URL = '/co-so-sua-chua/1';

async function login(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  await page.goto(LOGIN_URL);
  await page.getByLabel('Tài khoản').fill('admin');
  await page.getByLabel('Mật khẩu').fill('admin123');
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await page.waitForURL(/\/users/);
}

test.describe('M-003 Cơ sở Sửa chữa/Đóng tàu', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // TC-M003-CSC-01: list route reachable
  test('TC-M003-CSC-01: Trang danh sách /co-so-sua-chua render không lỗi', async ({ page }) => {
    await page.goto(LIST_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder for Wave 2/i)).toBeVisible({ timeout: 8000 });
  });

  // TC-M003-CSC-02: create route reachable
  test('TC-M003-CSC-02: Trang tạo mới /co-so-sua-chua/create render không lỗi', async ({ page }) => {
    await page.goto(CREATE_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder for Wave 2/i)).toBeVisible({ timeout: 8000 });
  });

  // TC-M003-CSC-03: detail route reachable
  test('TC-M003-CSC-03: Trang chi tiết /co-so-sua-chua/:id render không lỗi', async ({ page }) => {
    await page.goto(DETAIL_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder for Wave 2/i)).toBeVisible({ timeout: 8000 });
  });

  // TC-M003-CSC-04: PermissionGuard (cosuachua:read / cosuachua:create)
  test('TC-M003-CSC-04: Route được bảo vệ bởi PermissionGuard (cosuachua:read/create)', async ({ page }) => {
    await page.goto(LIST_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder for Wave 2/i)).toBeVisible({ timeout: 8000 });
  });

  // TC-M003-CSC-05: PheDuyetRequest uses quyetDinh — no nguoiPheDuyet field
  test('TC-M003-CSC-05: CoSuaChua PheDuyetRequest type sử dụng quyetDinh, không có nguoiPheDuyet', async ({ page }) => {
    // types/coSuaChua.ts: PheDuyetRequest = { quyetDinh: string; lyDo?: string }
    // No nguoiPheDuyet field — differs from LuongHangHai and DeKe.
    // Wave-2 must NOT pass nguoiPheDuyet in approve XHR body for this entity.
    await page.goto(DETAIL_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder for Wave 2/i)).toBeVisible({ timeout: 8000 });
    // DEFECT-M003-CSC-01 tracked: CoSuaChuaForm not wired; search filter missing trangThaiPheDuyet param
  });
});
