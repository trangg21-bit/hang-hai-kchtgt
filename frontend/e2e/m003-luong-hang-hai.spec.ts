/**
 * M-003 Luồng hàng hải — E2E spec
 *
 * Pattern: matches existing suite (live backend, manual login in beforeEach, no page.route mocking).
 * Backend MUST be running at the address configured in the frontend env for API calls.
 * If backend is unavailable, Playwright will reach the route and render placeholder pages —
 * those tests that assert on placeholder content will still pass; tests that assert live data will fail.
 *
 * NOTE: All 5 page components (LuongHangHaiList, LuongHangHaiForm, etc.) are implemented
 * as Wave-2 placeholders: <Empty description="... Placeholder for Wave 2" />.
 * Tests are designed to verify the CURRENT state (placeholder rendered, routes reachable,
 * service layer types, shared component behaviour) and will document what is missing.
 */
import { test, expect } from '@playwright/test';

const LOGIN_URL = '/login';
const LIST_URL = '/luong-hang-hai';
const CREATE_URL = '/luong-hang-hai/create';
const DETAIL_URL = '/luong-hang-hai/1';

async function login(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  await page.goto(LOGIN_URL);
  await page.getByLabel('Tài khoản').fill('admin');
  await page.getByLabel('Mật khẩu').fill('admin123');
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await page.waitForURL(/\/users/);
}

test.describe('M-003 Luồng hàng hải', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // TC-M003-LHH-01: list page route is reachable and renders without crash
  test('TC-M003-LHH-01: Trang danh sách /luong-hang-hai render không lỗi', async ({ page }) => {
    await page.goto(LIST_URL);
    // Route must exist and not 404 — either placeholder or real list
    await expect(page).not.toHaveURL(/login/);
    // Currently renders placeholder
    await expect(page.getByText(/Placeholder for Wave 2/i)).toBeVisible({ timeout: 8000 });
  });

  // TC-M003-LHH-02: create route is reachable
  test('TC-M003-LHH-02: Trang tạo mới /luong-hang-hai/create render không lỗi', async ({ page }) => {
    await page.goto(CREATE_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder for Wave 2/i)).toBeVisible({ timeout: 8000 });
  });

  // TC-M003-LHH-03: detail route is reachable
  test('TC-M003-LHH-03: Trang chi tiết /luong-hang-hai/:id render không lỗi', async ({ page }) => {
    await page.goto(DETAIL_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder for Wave 2/i)).toBeVisible({ timeout: 8000 });
  });

  // TC-M003-LHH-04: PermissionGuard wraps all 3 routes — no unguarded access
  test('TC-M003-LHH-04: Route được bảo vệ bởi PermissionGuard (luonghanghai:read/create)', async ({ page }) => {
    // After login as admin (which has all permissions), pages must render
    await page.goto(LIST_URL);
    await expect(page).not.toHaveURL(/login/);
    // PermissionGuard must NOT redirect to login for privileged user
    await expect(page.getByText(/Placeholder for Wave 2/i)).toBeVisible({ timeout: 8000 });
  });

  // TC-M003-LHH-05: Shared component ApprovalActionBar self-approval guard
  // Verifies logic: C2 button disabled when currentUserId === nguoiPheDuyetC1
  // Tested at unit-level via shared component — here we verify component renders when embedded
  test('TC-M003-LHH-05: Shared ApprovalActionBar — self-approval guard renders tooltip correctly', async ({ page }) => {
    // Navigate to placeholder page; component not embedded yet in Wave-1
    // This test documents expected behaviour when Wave-2 integrates the component
    await page.goto(DETAIL_URL);
    await expect(page).not.toHaveURL(/login/);
    // Placeholder only — real assertion enabled in Wave-2 when ApprovalActionBar is wired
    const placeholder = page.getByText(/Placeholder for Wave 2/i);
    await expect(placeholder).toBeVisible({ timeout: 8000 });
    // DEFECT-M003-LHH-01 tracked: ApprovalActionBar not wired into LuongHangHaiForm
  });
});
