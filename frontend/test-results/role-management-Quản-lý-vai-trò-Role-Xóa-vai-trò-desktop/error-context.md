# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: role-management.spec.ts >> Quản lý vai trò (Role) >> Xóa vai trò
- Location: e2e\role-management.spec.ts:41:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel('Tài khoản')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: "[plugin:vite:oxc] Transform failed with 2 errors: [PARSE_ERROR] Invalid Unicode escape sequence ╭─[ src/pages/organizations/UnitList.tsx:345:34 ] │ 345 │ showTotal: (t) => \\Tổng \\ đơn vị\\, │ ┬ │ ╰── ─────╯ [PARSE_ERROR] Invalid Unicode escape sequence ╭─[ src/pages/organizations/UnitList.tsx:345:40 ] │ 345 │ showTotal: (t) => \\Tổng \\ đơn vị\\, │ ┬ │ ╰── ─────╯"
  - generic [ref=e5]: C:/Users/trangtt1/hang-hai-kchtgt/frontend/src/pages/organizations/UnitList.tsx
  - generic [ref=e6]: at transformWithOxc (file:///C:/Users/trangtt1/hang-hai-kchtgt/frontend/node_modules/vite/dist/node/chunks/node.js:3344:19) at TransformPluginContext.transform (file:///C:/Users/trangtt1/hang-hai-kchtgt/frontend/node_modules/vite/dist/node/chunks/node.js:3415:26) at EnvironmentPluginContainer.transform (file:///C:/Users/trangtt1/hang-hai-kchtgt/frontend/node_modules/vite/dist/node/chunks/node.js:30387:51) at async loadAndTransform (file:///C:/Users/trangtt1/hang-hai-kchtgt/frontend/node_modules/vite/dist/node/chunks/node.js:24646:26)
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
  3  | test.describe('Quản lý vai trò (Role)', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/login');
> 6  |     await page.getByLabel('Tài khoản').fill('admin');
     |                                        ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  7  |     await page.getByLabel('Mật khẩu').fill('admin123');
  8  |     await page.getByRole('button', { name: /đăng nhập/i }).click();
  9  |     await page.waitForURL(/\/users/);
  10 |   });
  11 | 
  12 |   test('Hiển thị danh sách vai trò', async ({ page }) => {
  13 |     await page.goto('/roles');
  14 |     await expect(page.getByRole('table')).toBeVisible();
  15 |   });
  16 | 
  17 |   test('Tạo mới vai trò', async ({ page }) => {
  18 |     await page.goto('/roles');
  19 |     await page.getByRole('button', { name: /thêm/i }).click();
  20 | 
  21 |     await page.getByLabel('Tên vai trò').fill('E2E Tester');
  22 |     await page.getByLabel('Mã vai trò').fill('E2E_TESTER');
  23 | 
  24 |     // Submit without permissions (optional field)
  25 |     await page.getByRole('button', { name: /lưu/i }).click();
  26 | 
  27 |     await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  28 |   });
  29 | 
  30 |   test('Sửa vai trò', async ({ page }) => {
  31 |     await page.goto('/roles');
  32 |     const firstRow = page.locator('tr').first();
  33 |     await firstRow.getByRole('button', { name: /sửa/i }).click();
  34 | 
  35 |     await page.getByLabel('Tên vai trò').fill('Updated E2E Tester');
  36 |     await page.getByRole('button', { name: /lưu/i }).click();
  37 | 
  38 |     await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  39 |   });
  40 | 
  41 |   test('Xóa vai trò', async ({ page }) => {
  42 |     await page.goto('/roles');
  43 |     const firstRow = page.locator('tr').first();
  44 |     await firstRow.getByRole('button', { name: /xóa/i }).click();
  45 |     await page.getByRole('button', { name: /xóa/i }).click();
  46 | 
  47 |     await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  48 |   });
  49 | });
  50 | 
```