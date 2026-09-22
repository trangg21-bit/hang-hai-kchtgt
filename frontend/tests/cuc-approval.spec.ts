import { test, expect } from '@playwright/test';

test.describe('Cục Level Approval & Self-Approval Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Đăng nhập tài khoản Admin / Cấp Cục
    await page.goto('/login');
    await page.fill('input[placeholder*="tên đăng nhập"]', 'admin');
    await page.fill('input[placeholder*="mật khẩu"]', 'Asdqwe@123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
  });

  test('should display VTS list screen with status tabs and filter layout', async ({ page }) => {
    await page.goto('/vts-system');
    await page.waitForLoadState('networkidle');

    // Kiểm tra tiêu đề màn hình hoặc breadcrumb
    await expect(page.getByText('Hệ thống VTS').first()).toBeVisible({ timeout: 10000 });

    // Kiểm tra có StatusTabs (Tất cả, Lưu tạm, Chờ Cảng vụ duyệt...)
    await expect(page.getByRole('tab', { name: /Tất cả/i }).or(page.getByText(/Tất cả/i).first())).toBeVisible();

    // Kiểm tra bảng DataTable hiển thị
    const table = page.locator('.ant-table');
    await expect(table.first()).toBeVisible();
  });

  test('should provide Save & Approve action button in Drawer Form for Cuc Level user', async ({ page }) => {
    await page.goto('/vts-system');
    await page.waitForLoadState('networkidle');

    // Bấm nút "Thêm mới"
    const createBtn = page.getByRole('button', { name: /Thêm mới/i }).first();
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    // Đợi Drawer mở
    const drawer = page.locator('.ant-drawer');
    await expect(drawer).toBeVisible({ timeout: 5000 });

    // Cán bộ cấp Cục phải nhìn thấy nút "Lưu và phê duyệt"
    const saveAndApproveBtn = drawer.getByRole('button', { name: /Lưu và phê duyệt/i });
    await expect(saveAndApproveBtn).toBeVisible({ timeout: 5000 });

    // Đóng drawer bằng Escape hoặc nút Hủy
    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible({ timeout: 5000 });
  });

  test('should allow rowActions approval menu for Cuc Level user without self-approval blocking tooltip', async ({ page }) => {
    await page.goto('/vts-system');
    await page.waitForLoadState('networkidle');

    // Kiểm tra nếu có bản ghi trong bảng
    const actionButtons = page.locator('.ant-table-tbody button.ant-dropdown-trigger, .ant-table-tbody .ant-btn');
    const count = await actionButtons.count();

    if (count > 0) {
      // Click vào nút thao tác dòng đầu tiên
      await actionButtons.first().click();
      await page.waitForTimeout(500);

      // Không được chứa tooltip chặn tự duyệt kiểu "Bạn không thể tự phê duyệt hồ sơ do mình"
      const blockedTooltip = page.getByText(/không thể tự phê duyệt/i);
      await expect(blockedTooltip).toHaveCount(0);
    }
  });
});
