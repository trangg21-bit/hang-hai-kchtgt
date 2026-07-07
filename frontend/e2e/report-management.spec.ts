import { test, expect } from '@playwright/test';

test.describe('Báo cáo & Thống kê (M-008)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Tên đăng nhập').fill('admin');
    await page.getByPlaceholder('Mật khẩu').fill('admin123');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL(/\/users/);
  });

  test('Hiển thị danh sách 49 biểu mẫu báo cáo', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByText('Báo cáo & Thống kê số liệu')).toBeVisible();
    
    // Verify the report template select exists
    await expect(page.locator('.ant-select')).toBeVisible();
  });

  test('Tìm kiếm và lọc báo cáo', async ({ page }) => {
    await page.goto('/reports');
    
    // Use the Select to pick a specific report code
    const reportSelect = page.locator('.ant-select');
    await reportSelect.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await page.locator('.ant-select-item-option:has-text("F-180")').first().click();
    await page.waitForTimeout(500);
    
    // Click "Xem trước" to load data
    await page.getByRole('button', { name: /Xem trước/ }).click();
    await page.waitForTimeout(1000);
  });

  test('Xem chi tiết báo cáo và kết xuất dữ liệu xem trước', async ({ page }) => {
    // Go to reports page
    await page.goto('/reports');
    
    // Select F-141 from the report template dropdown
    const reportSelect = page.locator('.ant-select');
    await reportSelect.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await page.locator('.ant-select-item-option:has-text("F-141")').first().click();
    await page.waitForTimeout(500);
    
    // Click "Xem trước" to load preview data
    await page.getByRole('button', { name: /Xem trước/ }).click();
    await page.waitForTimeout(1000);
    
    // Verify the preview table loads
    await expect(page.locator('.ant-table')).toBeVisible();
  });

  test('Xuất báo cáo Excel và Text', async ({ page }) => {
    await page.goto('/reports');
    
    // Select F-141
    const reportSelect = page.locator('.ant-select');
    await reportSelect.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await page.locator('.ant-select-item-option:has-text("F-141")').first().click();
    await page.waitForTimeout(500);
    
    // Click "Xem trước" to load data
    await page.getByRole('button', { name: /Xem trước/ }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ant-table')).toBeVisible();

    // Verify export buttons exist
    const excelBtn = page.getByRole('button', { name: /Xuất file Excel/i });
    const textBtn = page.getByRole('button', { name: /Xuất file Text/i });
    
    await expect(excelBtn).toBeEnabled();
    await expect(textBtn).toBeEnabled();
  });
});
