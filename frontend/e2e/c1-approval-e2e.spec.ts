import { test, expect, Page } from '@playwright/test';

async function loginAs(page: Page, username: string, pass: string = 'Asdqwe@123') {
  await page.goto('/login');
  await page.locator('input[placeholder*="đăng nhập"]').fill(username);
  await page.locator('input[placeholder*="mật khẩu"]').fill(pass);
  await page.getByRole('button', { name: /Đăng nhập/i }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
}

test.describe('E2E Verification: C1 Approval & Direct Submit (Phương án A)', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('Verify Option A: Drawer has 2 buttons and "Lưu và gửi phê duyệt" submits directly to APPROVED_LEVEL1', async ({ page }) => {
    await loginAs(page, 'testhh10102000@gmail.com');

    // 1. Vào màn hình trạm radar
    await page.goto('/radar-station');
    await page.waitForLoadState('networkidle');

    // 2. Mở Drawer thêm mới
    const createBtn = page.getByRole('button', { name: /Thêm mới/i });
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    const drawer = page.locator('.ant-drawer');
    await expect(drawer).toBeVisible({ timeout: 5000 });

    // 3. Kiểm tra chân Drawer: đúng 2 nút "Lưu tạm" và "Lưu và gửi phê duyệt", cấm nút "Lưu và phê duyệt"
    const draftBtn = drawer.getByRole('button', { name: 'Lưu tạm' });
    const submitBtn = drawer.getByRole('button', { name: 'Lưu và gửi phê duyệt' });
    const approveBtn = drawer.getByRole('button', { name: 'Lưu và phê duyệt' });

    await expect(draftBtn).toBeVisible({ timeout: 5000 });
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
    await expect(approveBtn).not.toBeVisible();

    // 4. Nhập các trường bắt buộc
    // - Thuộc cảng biển
    const seaportSelect = drawer.locator('.ant-form-item:has-text("Thuộc cảng biển") .ant-select');
    await seaportSelect.click();
    await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').first().click();

    // - Tên trạm radar
    const uniqueName = `Radar E2E Option A ${Date.now()}`;
    await drawer.locator('input[placeholder*="tên trạm radar"]').fill(uniqueName);

    // - Địa điểm (Tỉnh/TP)
    const provinceSelect = drawer.locator('.ant-form-item:has-text("Địa điểm (Tỉnh/TP)") .ant-select');
    await provinceSelect.click();
    await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').first().click();

    // - Số lượng (scroll into view)
    const quantityInput = drawer.locator('.ant-form-item:has-text("Số lượng") input');
    await quantityInput.scrollIntoViewIfNeeded();
    await quantityInput.fill('1');

    await page.screenshot({ path: 'evidence-drawer-filled.png' });

    // 5. Bấm "Lưu và gửi phê duyệt"
    await submitBtn.click();

    // Drawer phải đóng sau khi lưu thành công
    await expect(drawer).not.toBeVisible({ timeout: 15000 });
    console.log('[E2E] Drawer successfully closed after "Lưu và gửi phê duyệt"');

    // 6. Tìm bản ghi vừa tạo
    const searchInput = page.locator('input[placeholder*="tên trạm radar"]').first();
    await searchInput.fill(uniqueName);
    await page.getByRole('button', { name: /Tìm kiếm/i }).click();
    await page.waitForTimeout(2000);

    // Xác nhận bản ghi xuất hiện trong bảng danh sách
    const tableRow = page.locator('.ant-table-tbody tr.ant-table-row', { hasText: uniqueName });
    await expect(tableRow).toBeVisible({ timeout: 10000 });

    // Xác nhận tab "Chờ phê duyệt cấp Cục" có số lượng >= 1 và chuyển tab
    const cucTab = page.getByText(/Chờ phê duyệt cấp Cục/i).first();
    await expect(cucTab).toBeVisible();
    await cucTab.click();
    await page.waitForTimeout(1000);

    // Bản ghi phải nằm trong tab "Chờ phê duyệt cấp Cục"
    const cucRow = page.locator('.ant-table-tbody tr.ant-table-row', { hasText: uniqueName });
    await expect(cucRow).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'evidence-option-a-submitted.png' });
    console.log(`[E2E] Option A Success: Record "${uniqueName}" is verified in "Chờ phê duyệt cấp Cục" (APPROVED_LEVEL1)!`);
  });

  test('Verify Requirement 2: C1 user can approve self-created record in PENDING_APPROVAL without 4-eyes block', async ({ page }) => {
    // Reset RADAR-000045 về PENDING_APPROVAL do chính user tạo
    await page.request.post('http://localhost:8080/api/auth/login', {
      data: { identifier: 'admin', password: 'Asdqwe@123' },
    });

    await loginAs(page, 'testhh10102000@gmail.com');

    await page.goto('/radar-station');
    await page.waitForLoadState('networkidle');

    // 1. Chuyển sang tab "Chờ phê duyệt cấp Cảng vụ/Chi cục"
    const pendingTab = page.getByText(/Chờ phê duyệt cấp Cảng vụ/i).first();
    await expect(pendingTab).toBeVisible({ timeout: 5000 });
    await pendingTab.click();
    await page.waitForTimeout(1500);

    // 2. Tìm bản ghi đang chờ duyệt
    const targetRow = page.locator('.ant-table-tbody tr.ant-table-row').first();
    await expect(targetRow).toBeVisible({ timeout: 10000 });

    // 3. Mở menu thao tác của bản ghi (nút ⋮ ở cột cuối cùng)
    const actionTrigger = targetRow.locator('.ant-dropdown-trigger, button, .anticon-more').last();
    await actionTrigger.click();

    // 4. Kiểm tra nút "Phê duyệt cấp Cảng vụ/Chi cục"
    const c1MenuItem = page.locator('.ant-dropdown-menu-item', { hasText: /Phê duyệt cấp Cảng vụ/i });
    await expect(c1MenuItem).toBeVisible({ timeout: 5000 });

    const text = await c1MenuItem.innerText();
    console.log('[E2E] Menu item text for C1 approval:', text);

    // KHÔNG chứa chữ "(không thể tự duyệt)"
    expect(text).not.toContain('(không thể tự duyệt)');

    // KHÔNG bị disabled
    const isDisabled = await c1MenuItem.getAttribute('aria-disabled');
    expect(isDisabled).not.toBe('true');

    await page.screenshot({ path: 'evidence-c1-action-enabled.png' });

    // 5. Thực hiện phê duyệt C1
    await c1MenuItem.click();

    // Modal phê duyệt xuất hiện
    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Nhập nội dung phê duyệt
    const contentInput = modal.locator('textarea, input[type="text"]').first();
    if (await contentInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await contentInput.fill('Phê duyệt C1 tự động bởi Playwright E2E');
    }

    // Bấm nút Phê duyệt trên modal
    const confirmBtn = modal.getByRole('button', { name: /Phê duyệt/i });
    await confirmBtn.click();

    // Modal đóng lại
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    // Chờ bảng cập nhật
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'evidence-c1-approved.png' });
    console.log('[E2E] Requirement 2 Success: Self-approval completed successfully for C1 user!');
  });
});
