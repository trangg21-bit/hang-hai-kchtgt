import { test, expect } from '@playwright/test';

test.describe('Reports Page', () => {
  test.use({ storageState: { cookies: [], origins: [{ origin: 'http://localhost:3000', localStorage: [{ name: 'auth_token', value: 'mock-jwt-token-2026' }] }] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/reports');
  });

  test('should display reports page title', async ({ page }) => {
    await expect(page.getByText('Báo cáo & Thống kê số liệu').first()).toBeVisible({ timeout: 15000 });
  });

  test('should allow selecting different report templates', async ({ page }) => {
    await page.waitForTimeout(1000);
    const reportSelect = page.getByRole('combobox').first();
    await expect(reportSelect).toBeVisible();
    await reportSelect.click();
    
    // Select F-180
    await page.locator('div.ant-select-dropdown:not(.ant-select-dropdown-hidden)').getByText('[F-180]').first().click();
    await expect(page.getByText('Tổng hợp số lượng đối tượng điểm, đối tượng đường, đối tượng vùng, lớp bản đồ và tài khoản trong hệ thống.').first()).toBeVisible();
    
    // Select F-151
    await reportSelect.click();
    await page.locator('div.ant-select-dropdown:not(.ant-select-dropdown-hidden)').getByText('[F-151]').first().click();
    await expect(page.getByText('Thống kê danh sách các tuyến luồng hàng hải, độ dài chuỗi tọa độ (WKT) và trạng thái hoạt động.').first()).toBeVisible();
  });

  test('should display date picker and respect its enabled/disabled state', async ({ page }) => {
    await page.waitForTimeout(1000);
    const reportSelect = page.getByRole('combobox').first();
    
    // F-141 requires dates (it's the default one, but let's click it explicitly to be sure)
    await reportSelect.click();
    await page.locator('div.ant-select-dropdown:not(.ant-select-dropdown-hidden)').getByText('[F-141]').first().click();
    const dateRangePicker = page.locator('.ant-picker').first();
    await expect(dateRangePicker).not.toHaveClass(/ant-picker-disabled/);

    // F-180 does not require dates
    await reportSelect.click();
    await page.locator('div.ant-select-dropdown:not(.ant-select-dropdown-hidden)').getByText('[F-180]').first().click();
    await expect(dateRangePicker).toHaveClass(/ant-picker-disabled/);
  });

  test('should load preview data for F-180', async ({ page }) => {
    await page.waitForTimeout(1000);
    const reportSelect = page.getByRole('combobox').first();
    await reportSelect.click();
    await page.locator('div.ant-select-dropdown:not(.ant-select-dropdown-hidden)').getByText('[F-180]').first().click();
    
    await page.getByRole('button', { name: 'Xem trước' }).click();
    
    // Check table headers
    await expect(page.locator('table').getByText('STT').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table').getByText('Chỉ tiêu thống kê').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table').getByText('Số lượng').first()).toBeVisible({ timeout: 15000 });
    
    // Check table rows
    await expect(page.locator('table').getByText('Tổng số đối tượng điểm (Point Objects)').first()).toBeVisible();
  });

  test('should trigger Excel and PDF exports', async ({ page }) => {
    await page.waitForTimeout(1000);
    const reportSelect = page.getByRole('combobox').first();
    await reportSelect.click();
    await page.locator('div.ant-select-dropdown:not(.ant-select-dropdown-hidden)').getByText('[F-180]').first().click();
    await page.getByRole('button', { name: 'Xem trước' }).click();
    
    // Click Export Excel and capture download event
    const downloadPromiseExcel = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Xuất file Excel' }).click();
    const downloadExcel = await downloadPromiseExcel;
    expect(downloadExcel.suggestedFilename()).toContain('baocao_f-180');
    
    // Click Export Text and capture download event
    const downloadPromiseText = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Xuất file Text' }).click();
    const downloadText = await downloadPromiseText;
    expect(downloadText.suggestedFilename()).toContain('baocao_f-180');
  });
});
