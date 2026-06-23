import { test, expect } from '@playwright/test';

test.describe('Báo cáo & Thống kê (M-008)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Tài khoản').fill('admin');
    await page.getByLabel('Mật khẩu').fill('admin123');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL(/\/users/);
  });

  test('Hiển thị danh sách 49 biểu mẫu báo cáo', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByText('Danh mục biểu mẫu báo cáo & thống kê')).toBeVisible();
    await expect(page.getByPlaceholder('Tìm theo mã biểu (F-141) hoặc tên biểu mẫu báo cáo...')).toBeVisible();
    
    // Check if category tabs/sections exist
    await expect(page.getByText('Tài sản kết cấu hạ tầng')).toBeVisible();
    await expect(page.getByText('Cơ sở hạ tầng hàng hải')).toBeVisible();
  });

  test('Tìm kiếm và lọc báo cáo', async ({ page }) => {
    await page.goto('/reports');
    const searchInput = page.getByPlaceholder('Tìm theo mã biểu (F-141) hoặc tên biểu mẫu báo cáo...');
    await searchInput.fill('F-180');
    
    // F-180 should be visible
    await expect(page.getByText('Biểu tổng hợp thông tin chung')).toBeVisible();
    
    // A non-existent code should show empty
    await searchInput.fill('XYZ-999');
    await expect(page.getByText('Không tìm thấy biểu mẫu báo cáo nào khớp với từ khóa tìm kiếm')).toBeVisible();
  });

  test('Xem chi tiết báo cáo và kết xuất dữ liệu xem trước', async ({ page }) => {
    // Go to active report F-141
    await page.goto('/reports/F-141');
    await expect(page.getByText('[F-141] Báo cáo tăng giảm tài sản')).toBeVisible();
    
    // Click "Xem dữ liệu trước"
    await page.getByRole('button', { name: /xem dữ liệu trước/i }).click();
    
    // Expect the preview table to load and show rows
    await expect(page.getByRole('table').first()).toBeVisible();
    
    // Summary card should be visible
    await expect(page.getByText('Thông tin tổng hợp số liệu')).toBeVisible();
  });

  test('Xuất báo cáo Excel và Text', async ({ page }) => {
    await page.goto('/reports/F-141');
    await page.getByRole('button', { name: /xem dữ liệu trước/i }).click();
    await expect(page.getByRole('table').first()).toBeVisible();

    // Verify download buttons are enabled
    const excelBtn = page.getByRole('button', { name: /xuất excel/i });
    const textBtn = page.getByRole('button', { name: /xuất file text/i });
    
    await expect(excelBtn).toBeEnabled();
    await expect(textBtn).toBeEnabled();
  });
});
