import { test, expect } from '@playwright/test';

test.describe('Users Page', () => {
  test.use({ storageState: { cookies: [], origins: [{ origin: 'http://localhost:3001', localStorage: [{ name: 'auth_token', value: 'mock-jwt-token-2026' }] }] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/users');
  });

  test('should display users page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Quản lý người dùng' })).toBeVisible({ timeout: 15000 });
  });

  test('should display user table with mock data', async ({ page }) => {
    await page.waitForTimeout(1500);
    await expect(page.locator('table').first()).toBeVisible({ timeout: 15000 });
  });

  test('should show user names in the table', async ({ page }) => {
    await page.waitForTimeout(1500);
    await expect(page.locator('table').getByText('Nguyễn Văn An').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table').getByText('Lê Anh Tuấn').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table').getByText('Nguyễn Thị Hương').first()).toBeVisible({ timeout: 15000 });
  });

  test('should show role tags in the table', async ({ page }) => {
    await page.waitForTimeout(1500);
    await expect(page.locator('table').getByText('Quản trị viên').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table').getByText('Quản lý người dùng').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table').getByText('Người xem').first()).toBeVisible({ timeout: 15000 });
  });

  test('should show status tags with correct colors', async ({ page }) => {
    await page.waitForTimeout(1500);
    await expect(page.getByText('Hoạt động').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Đã khóa').first()).toBeVisible({ timeout: 15000 });
  });

  test('should have search input', async ({ page }) => {
    await page.waitForTimeout(1500);
    await expect(page.getByPlaceholder(/Tìm theo tên/)).toBeVisible();
  });

  test('should have role filter dropdown', async ({ page }) => {
    await page.waitForTimeout(1500);
    const roleSelect = page.getByRole('combobox').first();
    await expect(roleSelect).toBeVisible();
  });

  test('should have status filter dropdown', async ({ page }) => {
    await page.waitForTimeout(1500);
    const statusSelect = page.getByRole('combobox').nth(1);
    await expect(statusSelect).toBeVisible();
  });

  test('should have add user button', async ({ page }) => {
    await page.waitForTimeout(1500);
    await expect(page.getByRole('button', { name: 'Thêm người dùng' })).toBeVisible({ timeout: 15000 });
  });

  test('should have refresh button', async ({ page }) => {
    await page.waitForTimeout(1500);
    await expect(page.getByRole('button', { name: 'Thêm người dùng' })).toBeVisible({ timeout: 15000 });
    // Refresh button is icon-only with aria-label "reload"
    await expect(page.getByRole('button', { name: 'reload' })).toBeVisible({ timeout: 15000 });
  });

  test('should have pagination controls', async ({ page }) => {
    await page.waitForTimeout(1500);
    const pagination = page.locator('css=.ant-pagination');
    await expect(pagination).toBeVisible();
  });

  test('should show action buttons (edit, lock, reset password, delete)', async ({ page }) => {
    await page.waitForTimeout(1500);
    // Action buttons are icon-only with aria-label: edit, lock, key, delete
    await expect(page.getByRole('row', { name: 'Nguyễn Văn An' }).getByRole('button', { name: 'edit' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('row', { name: 'Nguyễn Văn An' }).getByRole('button', { name: 'lock' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('row', { name: 'Nguyễn Văn An' }).getByRole('button', { name: 'key' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('row', { name: 'Nguyễn Văn An' }).getByRole('button', { name: 'delete' })).toBeVisible({ timeout: 15000 });
  });

  test('should filter users by search', async ({ page }) => {
    await page.waitForTimeout(1500);
    const searchInput = page.getByPlaceholder(/Tìm theo tên/);
    await searchInput.fill('Tuan');
    await searchInput.press('Enter');
    await expect(page.getByText('Lê Anh Tuấn')).toBeVisible({ timeout: 15000 });
  });

  test('should filter users by status', async ({ page }) => {
    await page.waitForTimeout(1500);
    const statusSelect = page.getByRole('combobox').nth(1);
    await statusSelect.click();
    // Wait for dropdown to be fully rendered and click the visible option element
    await page.locator('.ant-select-dropdown').locator('text=Đã khóa').click();
    await page.waitForTimeout(1500);
    // The first match is a hidden aria-live announcement; use .nth(1) for the visible one
    await expect(page.getByText('Đã khóa').nth(1)).toBeVisible({ timeout: 15000 });
  });
});
