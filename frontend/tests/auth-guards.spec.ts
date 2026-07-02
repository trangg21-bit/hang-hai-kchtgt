import { test, expect } from '@playwright/test';

test.describe('Auth Guard & Protected Routes', () => {
  test('should be accessible as authenticated user', async ({ page }) => {
    await page.goto('/users');
    await page.waitForTimeout(1500);
    await expect(page.locator('css=.ant-layout').first()).toBeVisible({ timeout: 15000 });
  });

  test('login page should be accessible without auth', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('css=.ant-card')).toBeVisible();
  });
});

test.describe('UI Responsiveness', () => {
  test.use({ storageState: { cookies: [], origins: [{ origin: 'http://localhost:3001', localStorage: [{ name: 'auth_token', value: 'mock-jwt-token-2026' }] }] } });

  test('users page should render properly at normal viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/users');
    await expect(page.getByRole('heading', { name: 'Quản lý người dùng' })).toBeVisible({ timeout: 15000 });
  });

  test('roles page should render properly at normal viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/roles');
    await expect(page.getByRole('heading', { name: 'Phân quyền' })).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Modal and Forms', () => {
  test.use({ storageState: { cookies: [], origins: [{ origin: 'http://localhost:3001', localStorage: [{ name: 'auth_token', value: 'mock-jwt-token-2026' }] }] } });

  test('should open create user modal', async ({ page }) => {
    await page.goto('/users');
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Thêm người dùng' }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 });
  });

  test('create user modal should have required fields', async ({ page }) => {
    await page.goto('/users');
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Thêm người dùng' }).click();
    await expect(page.getByText('Thêm người dùng mới')).toBeVisible({ timeout: 15000 });
  });

  test('should open edit user modal', async ({ page }) => {
    await page.goto('/users');
    await page.waitForTimeout(1500);
    // Edit buttons have aria-label "edit" (icon-only with tooltip)
    await page.getByRole('row', { name: 'Nguyễn Văn An' }).getByRole('button', { name: 'edit' }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('dialog').getByText('Sửa người dùng')).toBeVisible({ timeout: 15000 });
  });

  test('should close modal with cancel button', async ({ page }) => {
    await page.goto('/users');
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Thêm người dùng' }).click();
    await page.getByRole('button', { name: 'Hủy' }).click();
    await expect(page.getByRole('dialog').first()).not.toBeVisible();
  });

  test('should open create role modal', async ({ page }) => {
    await page.goto('/roles');
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Tạo vai trò' }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 });
  });

  test('create role modal should have permission tree', async ({ page }) => {
    await page.goto('/roles');
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Tạo vai trò' }).click();
    await expect(page.getByRole('tree')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Error States', () => {
  test.use({ storageState: { cookies: [], origins: [{ origin: 'http://localhost:3001', localStorage: [{ name: 'auth_token', value: 'mock-jwt-token-2026' }] }] } });

  test('users page should show loading skeleton', async ({ page }) => {
    await page.goto('/users');
    await expect(page.locator('css=.ant-skeleton').first()).toBeVisible({ timeout: 15000 });
  });
});
