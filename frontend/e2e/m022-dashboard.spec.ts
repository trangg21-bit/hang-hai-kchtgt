/**
 * M-022 — Trang chủ Dashboard E2E
 * Validates that the dashboard page renders correctly after login:
 *   login → 6-card KPI grid → FilterBar → charts → exploitation table → map
 */
import { test, expect } from '@playwright/test';

test.describe('M-022 Trang chủ Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.getByPlaceholder('Tên đăng nhập').fill('admin');
    await page.getByPlaceholder('Mật khẩu').fill('admin123');
    await page.getByRole('button', { name: /Đăng nhập/i }).click();
    await page.waitForURL(/\/$/);
    // Wait for initial render
    await page.waitForTimeout(2000);
  });

  // ------------------------------------------------------------------
  // Test 1: Dashboard page loads after login
  // ------------------------------------------------------------------
  test('dashboard page loads after login', async ({ page }) => {
    await expect(page).toHaveURL(/\/$/);
    // Verify dashboard content is visible (not error page)
    await expect(page.getByText('Hàng hóa thông qua cảng theo tháng')).toBeVisible({
      timeout: 15_000,
    });
  });

  // ------------------------------------------------------------------
  // Test 2: Dashboard has KPI cards and chart blocks
  // ------------------------------------------------------------------
  test('dashboard renders KPI and chart blocks', async ({ page }) => {
    // Verify the Hero card with Sản lượng label is visible
    await expect(page.getByText('nghìn tấn')).toBeVisible({ timeout: 10_000 });

    // Verify approval cards are present
    await expect(page.getByText('Phê duyệt tài sản')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Phê duyệt KCHT')).toBeVisible({ timeout: 10_000 });

    // Verify charts rendered (ECharts creates canvas elements)
    const canvases = page.locator('canvas');
    const canvasCount = await canvases.count();
    expect(canvasCount).toBeGreaterThanOrEqual(2);
  });

  // ------------------------------------------------------------------
  // Test 3: FilterBar renders with 3 dropdowns
  // ------------------------------------------------------------------
  test('FilterBar renders with year, province, infraType dropdowns', async ({ page }) => {
    await expect(page.getByText('Bộ lọc')).toBeVisible({ timeout: 10_000 });

    // Verify 3 Select dropdowns exist
    const selects = page.locator('.ant-select');
    await expect(selects).toHaveCount(3);

    await expect(page.getByText('Cập nhật lúc')).toBeVisible({ timeout: 10_000 });
  });

  // ------------------------------------------------------------------
  // Test 4: Charts render
  // ------------------------------------------------------------------
  test('cargo and passenger charts render', async ({ page }) => {
    await expect(page.getByText('Hàng hóa thông qua cảng theo tháng')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('Lượt hành khách qua cảng')).toBeVisible({
      timeout: 10_000,
    });
  });

  // ------------------------------------------------------------------
  // Test 5: Exploitation table renders
  // ------------------------------------------------------------------
  test('exploitation table renders with data', async ({ page }) => {
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Verify table title
    await expect(page.getByText('Bảng chi tiết thông số kỹ thuật')).toBeVisible({
      timeout: 10_000,
    });

    // Verify Ant Design table body exists
    const tableBody = page.locator('.ant-table-tbody');
    await expect(tableBody).toBeVisible({ timeout: 10_000 });

    // Verify rows exist
    const rowCount = await tableBody.locator('tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(5);
  });

  // ------------------------------------------------------------------
  // Test 6: Map renders
  // ------------------------------------------------------------------
  test('map container renders', async ({ page }) => {
    await expect(page.getByText('Bản đồ tra cứu Kết cấu hạ tầng')).toBeVisible({
      timeout: 10_000,
    });

    // Verify Leaflet map container
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10_000 });
  });
});
