# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: example.spec.ts >> Smoke Test >> trang chủ redirect đến /users
- Location: e2e\example.spec.ts:4:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://localhost:3000/users"
Received: "http://localhost:3000/"
Timeout:  5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    12 × unexpected value "http://localhost:3000/"

```

```yaml
- text: "[plugin:vite:oxc] Transform failed with 2 errors: [PARSE_ERROR] Invalid Unicode escape sequence ╭─[ src/pages/organizations/UnitList.tsx:345:34 ] │ 345 │ showTotal: (t) => \\Tổng \\ đơn vị\\, │ ┬ │ ╰── ─────╯ [PARSE_ERROR] Invalid Unicode escape sequence ╭─[ src/pages/organizations/UnitList.tsx:345:40 ] │ 345 │ showTotal: (t) => \\Tổng \\ đơn vị\\, │ ┬ │ ╰── ─────╯ C:/Users/trangtt1/hang-hai-kchtgt/frontend/src/pages/organizations/UnitList.tsx at transformWithOxc (file:///C:/Users/trangtt1/hang-hai-kchtgt/frontend/node_modules/vite/dist/node/chunks/node.js:3344:19) at TransformPluginContext.transform (file:///C:/Users/trangtt1/hang-hai-kchtgt/frontend/node_modules/vite/dist/node/chunks/node.js:3415:26) at EnvironmentPluginContainer.transform (file:///C:/Users/trangtt1/hang-hai-kchtgt/frontend/node_modules/vite/dist/node/chunks/node.js:30387:51) at async loadAndTransform (file:///C:/Users/trangtt1/hang-hai-kchtgt/frontend/node_modules/vite/dist/node/chunks/node.js:24646:26) at async viteTransformMiddleware (file:///C:/Users/trangtt1/hang-hai-kchtgt/frontend/node_modules/vite/dist/node/chunks/node.js:24440:20) Click outside, press Esc key, or fix the code to dismiss. You can also disable this overlay by setting"
- code: server.hmr.overlay
- text: to
- code: "false"
- text: in
- code: vite.config.ts
- text: .
```

# Test source

```ts
  1 | import { test, expect } from '@playwright/test';
  2 | 
  3 | test.describe('Smoke Test', () => {
  4 |   test('trang chủ redirect đến /users', async ({ page }) => {
  5 |     await page.goto('/');
> 6 |     await expect(page).toHaveURL('/users');
    |                        ^ Error: expect(page).toHaveURL(expected) failed
  7 |   });
  8 | });
  9 | 
```