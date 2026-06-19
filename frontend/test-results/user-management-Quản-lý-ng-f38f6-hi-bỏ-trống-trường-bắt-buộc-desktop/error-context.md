# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user-management.spec.ts >> Quản lý người dùng (User CRUD) >> Không thể tạo user khi bỏ trống trường bắt buộc
- Location: e2e\user-management.spec.ts:110:3

# Error details

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
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
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * e2e/user-management.spec.ts — Kiểm tra CRUD người dùng
  5   |  * 
  6   |  * Trang UsersPage sử dụng:
  7   |  * - Inline Modal (antd) cho Tạo/Sửa người dùng
  8   |  * - Ant Design Table với các cột: Họ và tên, Tên đăng nhập, Email, Vai trò, Trạng thái
  9   |  * - Modal.confirm cho xác nhận xóa
  10  |  * - Form fields: username, password, fullName, email, phone, roleId
  11  |  * 
  12  |  * Debugging:
  13  |  *   - test.only(...) để chạy duy nhất test này
  14  |  *   - test.skip(...) để bỏ qua tạm thời
  15  |  */
  16  | 
  17  | const BASE_URL = 'http://localhost:3000';
  18  | 
  19  | async function setupAuth(page: any): Promise<void> {
  20  |   await page.context().addInitScript(() => {
  21  |     localStorage.clear();
  22  |     localStorage.setItem('auth_token', 'mock-jwt-token-2026');
  23  |   });
  24  |   await page.goto(BASE_URL);
> 25  |   await page.waitForURL(/\/users/, { timeout: 10_000 });
      |              ^ TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
  26  | }
  27  | 
  28  | // ============================================================
  29  | // Tests — CRUD User
  30  | // ============================================================
  31  | 
  32  | test.describe('Quản lý người dùng (User CRUD)', () => {
  33  | 
  34  |   test.beforeEach(async ({ page }) => {
  35  |     await setupAuth(page);
  36  |   });
  37  | 
  38  |   // --------------------------------------------------------
  39  |   // TEST: Tạo người dùng mới
  40  |   // --------------------------------------------------------
  41  |   test('Tạo mới người dùng — điền đầy đủ form và xác nhận', async ({ page }) => {
  42  |     // Mở modal tạo mới
  43  |     const createBtn = page.locator('button:has-text("Thêm người dùng")').first();
  44  |     await createBtn.scrollIntoViewIfNeeded();
  45  |     await createBtn.click({ timeout: 10_000 });
  46  | 
  47  |     // Modal phải mở với tiêu đề "Thêm người dùng mới"
  48  |     await expect(page.locator('.ant-modal-title')).toHaveText('Thêm người dùng mới', { timeout: 5000 });
  49  | 
  50  |     // Điền form
  51  |     // Username: chỉ cho phép [a-z0-9_], min 4 ký tự
  52  |     await page.getByPlaceholder('vd: nguyenvana').fill('testuser01');
  53  |     
  54  |     // Password: phải có chữ hoa, chữ thường, số, min 6 ký tự
  55  |     await page.getByPlaceholder('Ít nhất 6 ký tự').fill('Test1234');
  56  |     
  57  |     // Full name
  58  |     await page.getByPlaceholder('Nguyễn Văn A').fill('Nguyễn Văn Test');
  59  |     
  60  |     // Email
  61  |     await page.getByPlaceholder('email@example.com').fill('test@hh.gov.vn');
  62  |     
  63  |     // Phone (10-11 số, bắt đầu 0)
  64  |     await page.getByPlaceholder('0901234567').fill('0912345678');
  65  |     
  66  |     // Role — chọn từ dropdown Select
  67  |     // Ant Design Select: click để mở dropdown, rồi chọn option
  68  |     // Find the Select component for roleId by its label
  69  |     const roleIdSelect = page.locator('.ant-form-item:has-text("Vai trò") .ant-select').first();
  70  |     await roleIdSelect.click({ timeout: 5000 });
  71  |     await page.waitForTimeout(300);
  72  |     
  73  |     // Click the first role option — use force:true to bypass overlay interception
  74  |     const roleOption = page.locator('.ant-select-item-option').first();
  75  |     await roleOption.click({ timeout: 5000, force: true });
  76  | 
  77  |     // Submit form — click "Tạo mới" button
  78  |     const submitBtn = page.locator('.ant-modal .ant-btn-primary:has-text("Tạo mới"), button:has-text("Tạo mới").ant-btn');
  79  |     await submitBtn.click({ timeout: 10_000 });
  80  | 
  81  |     // Modal should close after successful submission
  82  |     await page.waitForTimeout(1500); // mock delay 800ms + buffer
  83  |     
  84  |     // Verify success message from antd message.success
  85  |     // useCreateUser hook shows: "Đã tạo người dùng thành công"
  86  |     const successMsg = page.locator('.ant-message:has-text("thành công"), .ant-message-notice-content:has-text("thành công")');
  87  |     // Either modal closed and we see updated list, or success message shown
  88  |     const modalClosed = page.locator('.ant-modal').count();
  89  |     
  90  |     // Either modal closed OR success message is shown
  91  |     if (modalClosed === 1) {
  92  |       // Modal still open — check for error
  93  |       await expect(page.locator('.ant-modal')).not.toBeVisible({ timeout: 5000 });
  94  |     } else {
  95  |       // Modal closed successfully
  96  |     }
  97  | 
  98  |     // Verify new user appears in table
  99  |     // The new user should be in the list (mock data prepends to array)
  100 |     const tableText = page.locator('.ant-table-tbody');
  101 |     const hasNewUser = tableText.locator('td:has-text("Nguyễn Văn Test")');
  102 |     // Note: in mock mode, user may or may not appear depending on render timing
  103 |     // We just verify the page is still in valid state
  104 |     await expect(page.locator('.ant-table')).toBeVisible({ timeout: 5000 });
  105 |   });
  106 | 
  107 |   // --------------------------------------------------------
  108 |   // TEST: Tạo user với validation error — bỏ trống required fields
  109 |   // --------------------------------------------------------
  110 |   test('Không thể tạo user khi bỏ trống trường bắt buộc', async ({ page }) => {
  111 |     const createBtn = page.locator('button:has-text("Thêm người dùng")').first();
  112 |     await createBtn.scrollIntoViewIfNeeded();
  113 |     await createBtn.click({ timeout: 10_000 });
  114 | 
  115 |     await expect(page.locator('.ant-modal-title')).toHaveText('Thêm người dùng mới', { timeout: 5000 });
  116 | 
  117 |     // Chỉ click "Tạo mới" mà không điền gì → validation errors
  118 |     const submitBtn = page.locator('.ant-modal .ant-btn-primary:has-text("Tạo mới"), button:has-text("Tạo mới").ant-btn');
  119 |     await submitBtn.click({ timeout: 5000 });
  120 | 
  121 |     // Ant Design Form validation shows error messages
  122 |     // Required fields: username, password, fullName, email, roleId
  123 |     // Errors render as red text under each input with class containing 'explain' (may be CSS-var obfuscated)
  124 |     // Use getByText to find the first validation error text
  125 |     // Common Ant Design validation messages:
```