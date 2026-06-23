# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: org-unit.spec.ts >> Quản lý đơn vị >> Sửa đơn vị
- Location: e2e\org-unit.spec.ts:28:3

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
  3  | test.describe('Quản lý đơn vị', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/login');
> 6  |     await page.getByLabel('Tài khoản').fill('admin');
     |                                        ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  7  |     await page.getByLabel('Mật khẩu').fill('admin123');
  8  |     await page.getByRole('button', { name: /đăng nhập/i }).click();
  9  |     await page.waitForURL(/\/users/);
  10 |   });
  11 | 
  12 |   test('Hiển thị danh sách đơn vị', async ({ page }) => {
  13 |     await page.goto('/organizations');
  14 |     await expect(page.getByRole('table')).toBeVisible();
  15 |   });
  16 | 
  17 |   test('Tạo mới đơn vị', async ({ page }) => {
  18 |     await page.goto('/organizations');
  19 |     await page.getByRole('button', { name: /thêm/i }).click();
  20 | 
  21 |     await page.getByLabel('Tên đơn vị').fill('Phòng E2E Test');
  22 |     await page.getByLabel('Mã đơn vị').fill('E2E_DEPT');
  23 |     await page.getByRole('button', { name: /lưu/i }).click();
  24 | 
  25 |     await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  26 |   });
  27 | 
  28 |   test('Sửa đơn vị', async ({ page }) => {
  29 |     await page.goto('/organizations');
  30 |     const firstRow = page.locator('tr').first();
  31 |     await firstRow.getByRole('button', { name: /sửa/i }).click();
  32 | 
  33 |     await page.getByLabel('Tên đơn vị').fill('Updated E2E Dept');
  34 |     await page.getByRole('button', { name: /lưu/i }).click();
  35 | 
  36 |     await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  37 |   });
  38 | });
  39 | 
```