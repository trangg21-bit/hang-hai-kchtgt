import { test, expect } from '@playwright/test';

test.describe('Smoke Test', () => {
  test('trang chủ redirect đến /users', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/users');
  });
});
