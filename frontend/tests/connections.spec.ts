import { test, expect } from '@playwright/test';

test.describe('Connections Page', () => {
  test.use({ storageState: { cookies: [], origins: [{ origin: 'http://localhost:3001', localStorage: [{ name: 'auth_token', value: 'mock-jwt-token-2026' }] }] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/connections');
  });

  test('should display connections page title', async ({ page }) => {
    // Page title in header is "Liên thông dữ liệu"
    await expect(page.getByRole('heading', { name: 'Liên thông dữ liệu' })).toBeVisible({ timeout: 15000 });
  });

  test('should display connection table', async ({ page }) => {
    await page.waitForTimeout(1500);
    await expect(page.locator('table').first()).toBeVisible({ timeout: 15000 });
  });

  test('should show search input and filters', async ({ page }) => {
    await expect(page.getByPlaceholder('Tìm theo tên, URL...')).toBeVisible();
    const selects = page.locator('.ant-select');
    await expect(selects.first()).toBeVisible();
  });

  test('should have add connection button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Thêm kết nối' })).toBeVisible();
  });

  test('should open add connection form and create successfully', async ({ page }) => {
    await page.getByRole('button', { name: 'Thêm kết nối' }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByRole('heading', { name: 'Thêm kết nối mới' })).toBeVisible();

    // Fill form
    await page.locator('input#name').fill('API Test E2E Connection');
    
    // Select type "REST API"
    const typeSelect = page.getByRole('combobox').first();
    await typeSelect.click();
    await page.locator('.ant-select-dropdown').locator('text=REST API').click();

    // Fill URL
    await page.locator('input#url').fill('http://localhost:8080/api/v1/integration/share/points');
    await page.locator('textarea#description').fill('For E2E Testing');

    // Click submit
    await page.getByRole('button', { name: 'Tạo kết nối' }).click();
    await page.waitForTimeout(2000);
    
    // Should return to connection list
    await expect(page.getByRole('heading', { name: 'Liên thông dữ liệu' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table').getByText('API Test E2E Connection').first()).toBeVisible({ timeout: 15000 });
  });
});
