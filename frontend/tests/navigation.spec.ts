import { test, expect } from '@playwright/test';

test.describe('Navigation and Sidebar', () => {
  test.use({ storageState: { cookies: [], origins: [{ origin: 'http://localhost:3000', localStorage: [{ name: 'auth_token', value: 'mock-jwt-token-2026' }] }] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/users');
    await expect(page.getByRole('heading', { name: 'Quản lý người dùng' })).toBeVisible({ timeout: 15000 });
  });

  test('should display sidebar with all menu items', async ({ page }) => {
    await expect(page.locator('css=.ant-menu-title-content').getByText('Quản lý người dùng').first()).toBeVisible();
    await expect(page.locator('css=.ant-menu-title-content').getByText('Quản trị viên').first()).toBeVisible();
    await expect(page.locator('css=.ant-menu-title-content').getByText('Phân quyền').first()).toBeVisible();
    await expect(page.locator('css=.ant-menu-title-content').getByText('GIS • Bản đồ').first()).toBeVisible();
  });

  test('should navigate to admin page when clicking admin menu', async ({ page }) => {
    await page.locator('css=.ant-menu-title-content').getByText('Quản trị viên').first().click();
    await expect(page.getByRole('heading', { name: 'Quản trị viên' }).first()).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to roles page when clicking roles menu', async ({ page }) => {
    await page.locator('css=.ant-menu-title-content').getByText('Phân quyền').first().click();
    await expect(page.getByRole('heading', { name: 'Phân quyền' })).toBeVisible({ timeout: 15000 });
  });

  test('should expand GIS submenu', async ({ page }) => {
    await page.locator('css=.ant-menu-title-content').getByText('GIS • Bản đồ').first().click();
    await expect(page.getByText('Đối tượng điểm')).toBeVisible();
    await expect(page.getByText('Đối tượng đường')).toBeVisible();
    await expect(page.getByText('Đối tượng vùng')).toBeVisible();
    await expect(page.getByText('Lớp bản đồ')).toBeVisible();
    await expect(page.getByText('Tra cứu GIS')).toBeVisible();
  });

  test('should navigate to GIS points page', async ({ page }) => {
    await page.locator('css=.ant-menu-title-content').getByText('GIS • Bản đồ').first().click();
    await page.getByText('Đối tượng điểm').click();
    await expect(page.getByRole('heading', { name: 'Đối tượng điểm' })).toBeVisible({ timeout: 10000 });
  });

  test('should display header with user info', async ({ page }) => {
    await expect(page.locator('css=.ant-avatar')).toBeVisible();
  });

  test('should display header title that changes with page', async ({ page }) => {
    await page.locator('css=.ant-menu-title-content').getByText('Phân quyền').first().click();
    await expect(page.getByRole('heading', { name: 'Phân quyền' })).toBeVisible({ timeout: 15000 });
  });

  test('should show disabled state for settings and logs menus', async ({ page }) => {
    await expect(page.getByText('Cấu hình hệ thống')).toBeVisible();
    await expect(page.getByText('Nhật ký hệ thống')).toBeVisible();
  });
});

test.describe('Routing and Navigation', () => {
  test.use({ storageState: { cookies: [], origins: [{ origin: 'http://localhost:3000', localStorage: [{ name: 'auth_token', value: 'mock-jwt-token-2026' }] }] } });

  test('should redirect root to /users', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/users');
  });

  test('should load /admins page', async ({ page }) => {
    await page.goto('/admins');
    await page.waitForTimeout(1500);
    await expect(page.getByRole('heading', { name: 'Quản trị viên' }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should load /gis/points page', async ({ page }) => {
    await page.goto('/gis/points');
    await page.waitForTimeout(1500);
    await expect(page.getByRole('heading', { name: 'Đối tượng điểm' })).toBeVisible({ timeout: 10000 });
  });

  test('should load /gis/search page', async ({ page }) => {
    await page.goto('/gis/search');
    await page.waitForTimeout(1500);
    await expect(page.getByRole('heading', { name: 'Tra cứu GIS' }).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('App Layout', () => {
  test.use({ storageState: { cookies: [], origins: [{ origin: 'http://localhost:3000', localStorage: [{ name: 'auth_token', value: 'mock-jwt-token-2026' }] }] } });

  test('should have sidebar logo area', async ({ page }) => {
    await page.goto('/users');
    await expect(page.locator('css=.ant-layout-sider')).toBeVisible({ timeout: 15000 });
  });

  test('should have collapsible sidebar', async ({ page }) => {
    await page.goto('/users');
    await expect(page.locator('css=.ant-layout-sider-trigger')).toBeVisible();
  });

  test('should have header with avatar', async ({ page }) => {
    await page.goto('/users');
    await expect(page.locator('css=.ant-avatar')).toBeVisible({ timeout: 15000 });
  });

  test('should have dropdown user menu', async ({ page }) => {
    await page.goto('/users');
    await page.locator('css=.ant-avatar').click();
    await expect(page.getByText('Đăng xuất')).toBeVisible({ timeout: 10000 });
  });
});
