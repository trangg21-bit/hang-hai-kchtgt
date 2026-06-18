import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('should display login card', async ({ page }) => {
    await page.goto('/login');
    const card = page.locator('.ant-card');
    await expect(card).toBeVisible();
  });
  test('should have form inputs', async ({ page }) => {
    await page.goto('/login');
    const inputs = page.locator('input');
    await expect(inputs).toHaveCount(2);
  });
  test('should have submit button', async ({ page }) => {
    await page.goto('/login');
    const btn = page.locator('button[type=submit]');
    await expect(btn).toBeVisible();
  });
});