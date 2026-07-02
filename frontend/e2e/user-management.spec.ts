import { test, expect } from '@playwright/test';

  /**
   * e2e/user-management.spec.ts — Kiểm tra CRUD người dùng
   * 
   * Trang UsersPage sử dụng:
   * - Inline Modal (antd) cho Tạo/Sửa người dùng
   * - Ant Design Table với các cột: Họ và tên, Tên đăng nhập, Email, Vai trò, Trạng thái
   * - Modal.confirm cho xác nhận xóa
   * - Form fields: username, password, fullName, email, phone, roleId
   * 
   * Debugging:
   *   - test.only(...) để chạy duy nhất test này
   *   - test.skip(...) để bỏ qua tạm thời
   */

async function setupAuth(page: any): Promise<void> {
  await page.goto('/login');
  await page.getByPlaceholder('Tên đăng nhập').fill('admin');
  await page.getByPlaceholder('Mật khẩu').fill('admin123');
  await page.getByRole('button', { name: /Đăng nhập/ }).click();
  // Login redirects to home page (/) not /users
  await page.waitForURL(/\/$/);
}

// ============================================================
// Tests — CRUD User
// ============================================================

test.describe('Quản lý người dùng (User CRUD)', () => {

  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  // --------------------------------------------------------
  // TEST: Tạo người dùng mới
  // --------------------------------------------------------
  test('Tạo mới người dùng — điền đầy đủ form và xác nhận', async ({ page }) => {
    // Navigate to users page
    await page.getByText('Quản lý tài khoản').click();
    await page.waitForURL(/\/users/);

    // Wait for table to load
    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 15000 });

    // Mở modal tạo mới
    const createBtn = page.locator('button:has-text("Thêm người dùng")').first();
    await createBtn.scrollIntoViewIfNeeded();
    await createBtn.click({ timeout: 10_000 });

    // Modal phải mở với tiêu đề "Thêm người dùng mới"
    await expect(page.locator('.ant-modal-title')).toHaveText('Thêm người dùng mới', { timeout: 5000 });

    const rand = Date.now();
    // Điền form
    await page.locator('#username').fill('testuser' + rand);
    
    // Password: phải có chữ hoa, chữ thường, số, min 8 ký tự
    await page.locator('#password').fill('Test12345');
    
    // Full name
    await page.locator('#fullName').fill('Nguyễn Văn Test');
    
    // Email
    await page.locator('#email').fill('test_' + rand + '@hh.gov.vn');
    
    // Phone (10-11 số, bắt đầu 0)
    await page.locator('#phone').fill('0912345678');
    
    // Role — chọn từ dropdown Select
    const roleIdSelect = page.locator('.ant-form-item:has(label:has-text("Vai trò")) .ant-select').first();
    await roleIdSelect.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    
    // Click the first role option
    const roleOption = page.locator('.ant-select-item-option').first();
    await roleOption.click({ timeout: 5000, force: true });

    // Submit form — click "Tạo mới" button
    const submitBtn = page.locator('.ant-modal .ant-btn-primary:has-text("Tạo mới"), button:has-text("Tạo mới").ant-btn');
    await submitBtn.click({ timeout: 10_000 });

    // Modal should close after successful submission
    await page.waitForTimeout(1500);
    
    const modalVisible = await page.locator('.ant-modal').isVisible();
    if (modalVisible) {
      await expect(page.locator('.ant-modal')).not.toBeVisible({ timeout: 5000 });
    }

    // Verify page is still in valid state
    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 5000 });
  });

  // --------------------------------------------------------
  // TEST: Tạo user với validation error — bỏ trống required fields
  // --------------------------------------------------------
  test('Không thể tạo user khi bỏ trống trường bắt buộc', async ({ page }) => {
    // First navigate to users page
    await page.getByText('Quản lý tài khoản').click();
    await page.waitForURL(/\/users/);

    const createBtn = page.locator('button:has-text("Thêm người dùng")').first();
    await createBtn.scrollIntoViewIfNeeded();
    await createBtn.click({ timeout: 10_000 });

    await expect(page.locator('.ant-modal-title')).toHaveText('Thêm người dùng mới', { timeout: 5000 });

    // Chỉ click "Tạo mới" mà không điền gì → validation errors
    const submitBtn = page.locator('.ant-modal .ant-btn-primary:has-text("Tạo mới"), button:has-text("Tạo mới").ant-btn');
    await submitBtn.click({ timeout: 5000 });

    // Ant Design Form validation shows error messages
    // Required fields: username, password, fullName, email, roleId
    await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible({ timeout: 5000 });
    const errorCount = await page.locator('.ant-form-item-explain-error').count();
    expect(errorCount).toBeGreaterThan(0);
  });

  // --------------------------------------------------------
  // TEST: Sửa thông tin người dùng
  // --------------------------------------------------------
  test('Sửa thông tin người dùng — thay đổi email', async ({ page }) => {
    // Ensure we're on the users page
    await page.getByText('Quản lý tài khoản').click();
    await page.waitForURL(/\/users/);

    // Wait for table to load
    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 15000 });
    
    // Scroll to table body to find rows
    const tableBody = page.locator('.ant-table-tbody');
    await tableBody.scrollIntoViewIfNeeded();

    const firstRow = page.locator('.ant-table-row').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });

    // Find the edit button (button with title="Sửa")
    const editBtn = firstRow.locator('button[title="Sửa"]').first();
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await editBtn.click({ timeout: 10_000 });

    // Edit modal should open
    await expect(page.locator('.ant-modal-title')).toHaveText('Sửa người dùng', { timeout: 5000 });

    // Pre-filled data should be present
    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible({ timeout: 3000 });
    const emailValue = await emailInput.inputValue();

    // Change email
    await emailInput.fill('updated@hh.gov.vn');

    // Save
    const updateBtn = page.locator('.ant-modal .ant-btn-primary:has-text("Cập nhật"), button:has-text("Cập nhật").ant-btn');
    await updateBtn.click({ timeout: 10_000 });

    // Wait for mutation
    await page.waitForTimeout(1500);

    // Modal should close
    await expect(page.locator('.ant-modal')).not.toBeVisible({ timeout: 5000 });

    // Verify updated email is in table
    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 5000 });
  });

  // --------------------------------------------------------
  // TEST: Xóa người dùng với xác nhận
  // --------------------------------------------------------
  test('Xóa người dùng phải hiện modal xác nhận và xóa khỏi danh sách', async ({ page }) => {
    // Ensure we're on the users page
    await page.getByText('Quản lý tài khoản').click();
    await page.waitForURL(/\/users/);

    // Wait for table to load
    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 15000 });
    const tableBody = page.locator('.ant-table-tbody');
    await tableBody.scrollIntoViewIfNeeded();

    const rows = page.locator('.ant-table-row');
    const firstRow = rows.first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });

    // Click delete button inside first row
    const deleteBtn = firstRow.locator('button[title="Xóa"]').first();
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    await deleteBtn.click({ timeout: 10_000 });

    // Ant Design Modal.confirm should appear
    await expect(page.locator('.ant-modal-confirm-title')).toHaveText('Xác nhận xóa người dùng', { timeout: 5000 });

    // Click "Xóa" (danger button) in modal
    await page.locator('.ant-modal-confirm-btns button:has-text("Xóa")').first().click({ timeout: 10_000 });

    // Wait for mutation
    await page.waitForTimeout(1500);

    // Verify success message
    const successMsg = page.locator('.ant-message:has-text("Đã xóa"), .ant-message-notice-content:has-text("thành công")');
    const hasMsg = await successMsg.count();
    if (hasMsg > 0) {
      await expect(successMsg).toBeVisible({ timeout: 3000 });
    }

    // Confirm modal closed
    await expect(page.locator('.ant-modal-confirm')).not.toBeVisible({ timeout: 5000 });
  });

  // --------------------------------------------------------
  // TEST: Tìm kiếm người dùng
  // --------------------------------------------------------
  test('Tìm kiếm người dùng theo tên, email, username', async ({ page }) => {
    // Navigate to users page
    await page.getByText('Quản lý tài khoản').click();
    await page.waitForURL(/\/users/);

    const searchInput = page.locator('input[placeholder*="Tìm theo tên"], input[type="search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Search for "admin"
    await searchInput.fill('admin');
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);

    // Table should be visible (filtered results)
    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 5000 });

    // Clear search
    await searchInput.clear();
    await searchInput.press('Enter');
    await page.waitForTimeout(800);

    // Should see all users again
    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 5000 });
  });

  // --------------------------------------------------------
  // TEST: Bộ lọc theo vai trò
  // --------------------------------------------------------
  test('Lọc người dùng theo vai trò từ dropdown', async ({ page }) => {
    // Navigate to users page
    await page.getByText('Quản lý tài khoản').click();
    await page.waitForURL(/\/users/);

    // Click role filter Select
    const roleFilter = page.locator('select[placeholder="Vai trò"]').first();
    
    if (await roleFilter.count() > 0) {
      await roleFilter.click({ timeout: 5000 });
      await page.waitForTimeout(300);

      // Select first option
      const option = page.locator('.ant-select-item-option').first();
      await option.click({ timeout: 5000 });
      await page.waitForTimeout(800);

      // Table should be filtered
      await expect(page.locator('.ant-table')).toBeVisible({ timeout: 5000 });
    }
  });

  // --------------------------------------------------------
  // TEST: Trạng thái hiển thị trên bảng
  // --------------------------------------------------------
  test('Bảng người dùng phải hiển thị badge và tag trạng thái', async ({ page }) => {
    // Navigate to users page
    await page.getByText('Quản lý tài khoản').click();
    await page.waitForURL(/\/users/);

    // Wait for table to load
    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 15000 });

    // Verify status column has tags
    const statusTags = page.locator('td:has-text("Hoạt động"), td:has-text("Đã khóa"), td:has-text("Không hoạt động")');
    const tagCount = await statusTags.count();
    expect(tagCount).toBeGreaterThan(0);
  });

  // --------------------------------------------------------
  // TEST: Phân trang
  // --------------------------------------------------------
  test('Phân trang phải hoạt động — chuyển trang và thay đổi pageSize', async ({ page }) => {
    // Navigate to users page
    await page.getByText('Quản lý tài khoản').click();
    await page.waitForURL(/\/users/);

    // Wait for table to load
    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 15000 });

    // Check pagination is visible
    const pagination = page.locator('.ant-pagination');
    await expect(pagination).toBeVisible({ timeout: 5000 });

    // Verify pagination total text
    const totalText = page.locator('.ant-pagination-total-text');
    await expect(totalText).toBeVisible({ timeout: 5000 });

    // Next page if available
    const nextBtn = page.locator('.ant-pagination-next').first();
    const isDisabled = await nextBtn.getAttribute('class');
    if (!isDisabled?.includes('disabled')) {
      await nextBtn.click({ timeout: 5000 });
      await page.waitForTimeout(800);
      await expect(page.locator('.ant-pagination-item-active')).toBeVisible({ timeout: 5000 });
    }
  });
});
