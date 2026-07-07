import { test, expect } from '@playwright/test';

test.describe('Roles Page', () => {
  test.use({ storageState: { cookies: [], origins: [{ origin: 'http://localhost:3001', localStorage: [{ name: 'auth_token', value: 'mock-jwt-token-2026' }] }] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/roles');
  });

  test('should display roles page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Phân quyền' })).toBeVisible({ timeout: 15000 });
  });

  test('should display roles table with mock data', async ({ page }) => {
    await page.waitForTimeout(1500);
    await expect(page.locator('table').first()).toBeVisible({ timeout: 15000 });
  });

  test('should show role names in the table', async ({ page }) => {
    await page.waitForTimeout(1500);
    await expect(page.locator('table').locator('text=/Quản trị viên \\(Super Admin\\)|Updated E2E Tester/')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table').getByText('Quản trị viên (Admin)')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table').getByText('Quản lý người dùng').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table').getByText('Người xem (Viewer)')).toBeVisible({ timeout: 15000 });
  });

  test('should have search input', async ({ page }) => {
    await page.waitForTimeout(1500);
    await expect(page.getByPlaceholder(/Tìm vai trò/)).toBeVisible();
  });

  test('should have create role button', async ({ page }) => {
    await page.waitForTimeout(1500);
    await expect(page.getByRole('button', { name: 'Tạo vai trò' })).toBeVisible({ timeout: 15000 });
  });

  test('should have refresh button', async ({ page }) => {
    await page.waitForTimeout(1500);
    await expect(page.getByRole('button', { name: 'reload' })).toBeVisible({ timeout: 15000 });
  });

  test('should filter roles by search', async ({ page }) => {
    await page.waitForTimeout(1500);
    // Get the name of the first role in the table dynamically (first column of the first data row in tbody)
    const firstRowText = await page.locator('.ant-table-tbody tr.ant-table-row').first().locator('td').first().innerText();
    const searchString = firstRowText.substring(0, Math.min(5, firstRowText.length));

    const searchInput = page.getByPlaceholder(/Tìm vai trò/);
    await searchInput.fill(searchString);
    await searchInput.press('Enter');
    await page.waitForTimeout(500);
    await expect(page.locator('.ant-table-tbody').getByText(firstRowText)).toBeVisible({ timeout: 15000 });
  });
});
