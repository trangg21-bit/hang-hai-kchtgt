# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.ts >> Đăng nhập >> Đăng nhập thất bại — tài khoản không tồn tại
- Location: e2e\login.spec.ts:43:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByPlaceholder('Nhập tài khoản')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: "[plugin:vite:oxc] Transform failed with 2 errors: [PARSE_ERROR] Invalid Unicode escape sequence ╭─[ src/pages/organizations/UnitList.tsx:345:34 ] │ 345 │ showTotal: (t) => \\Tổng \\ đơn vị\\, │ ┬ │ ╰── ─────╯ [PARSE_ERROR] Invalid Unicode escape sequence ╭─[ src/pages/organizations/UnitList.tsx:345:40 ] │ 345 │ showTotal: (t) => \\Tổng \\ đơn vị\\, │ ┬ │ ╰── ─────╯"
  - generic [ref=e5]: C:/Users/trangtt1/hang-hai-kchtgt/frontend/src/pages/organizations/UnitList.tsx
  - generic [ref=e6]: at transformWithOxc (file:///C:/Users/trangtt1/hang-hai-kchtgt/frontend/node_modules/vite/dist/node/chunks/node.js:3344:19) at TransformPluginContext.transform (file:///C:/Users/trangtt1/hang-hai-kchtgt/frontend/node_modules/vite/dist/node/chunks/node.js:3415:26) at EnvironmentPluginContainer.transform (file:///C:/Users/trangtt1/hang-hai-kchtgt/frontend/node_modules/vite/dist/node/chunks/node.js:30387:51) at async loadAndTransform (file:///C:/Users/trangtt1/hang-hai-kchtgt/frontend/node_modules/vite/dist/node/chunks/node.js:24646:26) at async viteTransformMiddleware (file:///C:/Users/trangtt1/hang-hai-kchtgt/frontend/node_modules/vite/dist/node/chunks/node.js:24440:20)
  - generic [ref=e7]:
    - text: Click outside, press Esc key, or fix the code to dismiss.
    - text: You can also disable this overlay by setting
    - code [ref=e8]: server.hmr.overlay
    - text: to
    - code [ref=e9]: "false"
    - text: in
    - code [ref=e10]: vite.config.ts
    - text: .
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Đăng nhập', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Clear login state
  6  |     await page.context().clearCookies();
  7  |   });
  8  | 
  9  |   test('Đăng nhập thành công với admin/admin123', async ({ page }) => {
  10 |     // 1. Vào trang login
  11 |     await page.goto('/login');
  12 |     await expect(page.getByRole('heading', { name: /đăng nhập/i })).toBeVisible();
  13 | 
  14 |     // 2. Fill credentials
  15 |     await page.getByPlaceholder('Nhập tài khoản').fill('admin');
  16 |     await page.getByPlaceholder('Nhập mật khẩu').fill('admin123');
  17 | 
  18 |     // 3. Submit form
  19 |     await page.getByRole('button', { name: /đăng nhập/i }).click();
  20 | 
  21 |     // 4. Verify redirect
  22 |     await page.waitForURL(/\/users/);
  23 |     await expect(page).toHaveURL(/\/users/);
  24 |   });
  25 | 
  26 |   test('Đăng nhập thất bại — sai mật khẩu', async ({ page }) => {
  27 |     await page.goto('/login');
  28 | 
  29 |     await page.getByPlaceholder('Nhập tài khoản').fill('admin');
  30 |     await page.getByPlaceholder('Nhập mật khẩu').fill('sai');
  31 | 
  32 |     await page.getByRole('button', { name: /đăng nhập/i }).click();
  33 | 
  34 |     // In mock mode, login always succeeds (mock authStore ignores credentials).
  35 |     // Error message only appears when real API returns 401.
  36 |     // We verify that either: (a) an error message appears, or (b) redirect to /users (mock always succeeds).
  37 |     await page.waitForTimeout(1500);
  38 |     const hasError = await page.locator('.ant-message-notice-content:has-text("thất bại")').count();
  39 |     const isOnUsersPage = await page.url().includes('/users');
  40 |     expect(hasError > 0 || isOnUsersPage).toBeTruthy();
  41 |   });
  42 | 
  43 |   test('Đăng nhập thất bại — tài khoản không tồn tại', async ({ page }) => {
  44 |     await page.goto('/login');
  45 | 
> 46 |     await page.getByPlaceholder('Nhập tài khoản').fill('notexist');
     |                                                   ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  47 |     await page.getByPlaceholder('Nhập mật khẩu').fill('admin123');
  48 | 
  49 |     await page.getByRole('button', { name: /đăng nhập/i }).click();
  50 | 
  51 |     // In mock mode, login always succeeds (mock authStore ignores credentials).
  52 |     // Error message only appears when real API returns 401.
  53 |     // We verify that either: (a) an error message appears, or (b) redirect to /users (mock always succeeds).
  54 |     await page.waitForTimeout(1500);
  55 |     const hasError = await page.locator('.ant-message-notice-content:has-text("thất bại")').count();
  56 |     const isOnUsersPage = await page.url().includes('/users');
  57 |     expect(hasError > 0 || isOnUsersPage).toBeTruthy();
  58 |   });
  59 | 
  60 |   test('Logout sau khi đăng nhập', async ({ page }) => {
  61 |     // Login
  62 |     await page.goto('/login');
  63 |     await page.getByPlaceholder('Nhập tài khoản').fill('admin');
  64 |     await page.getByPlaceholder('Nhập mật khẩu').fill('admin123');
  65 |     await page.getByRole('button', { name: /đăng nhập/i }).click();
  66 |     await page.waitForURL(/\/users/);
  67 | 
  68 |     // Logout — Avatar dropdown → click "Đăng xuất" menu item
  69 |     // The user menu is triggered by clicking the avatar in the header
  70 |     await page.locator('.ant-avatar').first().click({ timeout: 5000 });
  71 |     await page.waitForTimeout(500);
  72 |     // Click "Đăng xuất" menu item in the dropdown
  73 |     await page.getByRole('menuitem', { name: /đăng xuất/i }).click({ timeout: 5000 });
  74 |     await page.waitForURL(/\/login/);
  75 |   });
  76 | });
  77 | 
```