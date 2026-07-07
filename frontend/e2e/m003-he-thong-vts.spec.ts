/**
 * M-003 Hệ thống VTS — E2E spec
 *
 * Pattern: live backend, manual login (no page.route mocking) except the dedicated
 * F1-regression test which mocks the list endpoint to assert the Page-unwrap fix.
 * Asserts the REAL Wave-2 UI (HeThongVTSList / HeThongVTSForm), not placeholders.
 */
import { test, expect, Page } from '@playwright/test';

const LIST_URL = '/he-thong-vts';
const CREATE_URL = '/he-thong-vts/create';
const DETAIL_URL = '/he-thong-vts/1';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Tài khoản').fill('admin');
  await page.getByLabel('Mật khẩu').fill('admin123');
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await page.waitForURL((url) => !/\/login/.test(url.pathname), { timeout: 15000 });
}

test.describe('M-003 Hệ thống VTS', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('TC-M003-VTS-01: Trang danh sách render UI thật (không phải placeholder)', async ({ page }) => {
    await page.goto(LIST_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Thêm mới' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Trạng thái phê duyệt')).toBeVisible();
  });

  // REGRESSION F1: VTS.findAll trả ApiResponse<Page<T>>; toArray phải unwrap
  // envelope.data.content thì bảng mới hiển thị dữ liệu (trước đây rỗng-giả).
  test('TC-M003-VTS-02: Bảng render dữ liệu từ Spring Page (unwrap envelope.data.content)', async ({ page }) => {
    await page.route(/\/v1\/he-thong-vts\?/, (route) =>
      route.fulfill({
        json: {
          success: true,
          message: 'ok',
          data: {
            content: [
              {
                id: 1,
                tenHeThong: 'VTS-E2E-MOCK',
                viTri: 'Hải Phòng',
                tinhTrang: 'Tốt',
                mucDoPhuTrach: 'Cao',
                doiTac: 'Đối tác X',
                trangThai: 'PROPOSED',
              },
            ],
            totalElements: 1,
            totalPages: 1,
            size: 20,
            number: 0,
            first: true,
            last: true,
            numberOfElements: 1,
            empty: false,
          },
          timestamp: '2026-07-08T00:00:00',
        },
      }),
    );
    await page.goto(LIST_URL);
    await expect(page.getByText('VTS-E2E-MOCK')).toBeVisible({ timeout: 8000 });
  });

  test('TC-M003-VTS-03: Trang tạo mới hiển thị form với field thật', async ({ page }) => {
    await page.goto(CREATE_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole('heading', { name: 'Tạo mới Hệ thống VTS' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Tên hệ thống', { exact: true })).toBeVisible();
    await expect(page.getByText('Đối tác', { exact: true })).toBeVisible();
  });

  test('TC-M003-VTS-04: Trang chi tiết /he-thong-vts/:id reachable', async ({ page }) => {
    await page.goto(DETAIL_URL);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/Placeholder/i)).toHaveCount(0);
  });
});
