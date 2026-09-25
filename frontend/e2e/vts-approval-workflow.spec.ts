import { test, expect, Page } from '@playwright/test';

async function loginAs(page: Page, username: string, pass: string = 'Asdqwe@123') {
  await page.goto('/login');
  await page.locator('input[placeholder*="tên đăng nhập"], input[placeholder*="email"]').fill(username);
  await page.locator('input[placeholder*="mật khẩu"]').fill(pass);
  const captchaInput = page.locator('input[placeholder*="5 số bảo vệ"], input[placeholder*="mã bảo vệ"]');
  if (await captchaInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await captchaInput.fill('00000');
  }
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
}

test.describe('VTS 2-Level Approval & Authorization Spec Verification (25/09/2026)', () => {
  const uniqueSuffix = Date.now().toString().slice(-6);
  const vtsName = `Hệ thống VTS E2E Test ${uniqueSuffix}`;
  let vtsCode = '';

  test('E2E Full Workflow: Self-Approval C1, Reject Validation >=10 chars, Cuc Approval C2, and Edit APPROVED Record (R3/R4)', async ({ page }) => {
    test.setTimeout(120000);

    // =========================================================================
    // STEP 1: Cảng vụ user creates DRAFT VTS and self-approves C1 (Bỏ nguyên tắc 4 mắt)
    // =========================================================================
    console.log('[E2E STEP 1] Logging in as Cảng vụ user (testhh10102000@gmail.com)...');
    await loginAs(page, 'testhh10102000@gmail.com');

    await page.goto('/vts-system');
    await page.waitForLoadState('networkidle');

    // Click "Thêm mới" button
    const createBtn = page.getByRole('button', { name: /Thêm mới/i });
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    const drawer = page.locator('.ant-drawer-open');
    await expect(drawer).toBeVisible({ timeout: 8000 });

    // Wait for auto-generated code
    const codeInput = drawer.locator('input#code, input[id*="code"]');
    await expect(codeInput).not.toHaveValue('', { timeout: 10000 });
    vtsCode = await codeInput.inputValue();
    console.log(`[E2E STEP 1] Auto-generated VTS Code: ${vtsCode}`);

    // Fill required systemName
    await drawer.locator('input#systemName, input[id*="systemName"]').fill(vtsName);

    // 1. Select Đơn vị quản lý
    const orgUnitTree = drawer.locator('.ant-form-item:has-text("Đơn vị quản lý") .ant-tree-select');
    await orgUnitTree.click();
    const treeNode1 = page.locator('.ant-select-tree-node-content-wrapper:visible').first();
    await treeNode1.waitFor({ state: 'visible', timeout: 5000 });
    await treeNode1.click();
    await page.waitForTimeout(500);

    // 2. Select Đơn vị chủ quản
    const owningTree = drawer.locator('.ant-form-item:has-text("Đơn vị chủ quản") .ant-tree-select');
    await owningTree.click();
    const treeNode2 = page.locator('.ant-select-tree-node-content-wrapper:visible').first();
    await treeNode2.waitFor({ state: 'visible', timeout: 5000 });
    await treeNode2.click();
    await page.waitForTimeout(500);

    // 3. Select Đơn vị vận hành
    const operatingSelect = drawer.locator('.ant-form-item:has-text("Đơn vị vận hành") .ant-select');
    await operatingSelect.click();
    const opOption = page.locator('.ant-select-item-option:visible').first();
    await opOption.waitFor({ state: 'visible', timeout: 5000 });
    await opOption.click();
    await page.waitForTimeout(500);

    // Select province
    const provinceSelect = drawer.locator('.ant-form-item:has-text("Địa điểm (Tỉnh/TP)") .ant-select');
    if (await provinceSelect.isVisible()) {
      await provinceSelect.click();
      await page.locator('.ant-select-item-option:visible').first().click();
    }

    // In Drawer footer, click "Lưu tạm"
    const draftBtn = drawer.getByRole('button', { name: 'Lưu tạm' });
    await expect(draftBtn).toBeVisible();
    await draftBtn.click();

    // Verify drawer closed
    await expect(drawer).not.toBeVisible({ timeout: 15000 });
    console.log('[E2E STEP 1] Draft VTS created successfully.');

    // Switch to "Lưu tạm" tab
    const draftTab = page.locator('.chk-status-tabs-container button', { hasText: 'Lưu tạm' });
    await draftTab.click();
    await page.waitForTimeout(1000);

    // Search for the newly created record by name
    const searchNameInput = page.locator('input[placeholder*="Tìm theo tên"]').first();
    if (await searchNameInput.isVisible()) {
      await searchNameInput.fill(vtsName);
      await page.getByRole('button', { name: /Tìm kiếm/i }).click();
      await page.waitForTimeout(1500);
    }

    const tableRow = page.locator('.ant-table-tbody tr.ant-table-row', { hasText: vtsName }).first();
    await expect(tableRow).toBeVisible({ timeout: 10000 });

    // Open row action menu -> Click "Gửi Cảng vụ phê duyệt"
    await tableRow.locator('button.ant-btn').last().click();
    const submitMenu = page.locator('.ant-dropdown-menu-item', { hasText: /Gửi Cảng vụ phê duyệt/i });
    await expect(submitMenu).toBeVisible({ timeout: 5000 });
    await submitMenu.click();
    await page.waitForTimeout(2000);
    console.log('[E2E STEP 1] Submitted to PENDING_APPROVAL.');

    // Switch to "Chờ phê duyệt cấp Cảng vụ/Chi cục" tab
    const pendingTab = page.locator('.chk-status-tabs-container button', { hasText: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' });
    await expect(pendingTab).toBeVisible({ timeout: 8000 });
    await pendingTab.click();
    await page.waitForTimeout(1500);

    // Search in pending tab
    const searchPending = page.locator('input[placeholder*="Tìm theo tên"]').first();
    if (await searchPending.isVisible()) {
      await searchPending.fill(vtsName);
      await page.getByRole('button', { name: /Tìm kiếm/i }).click();
      await page.waitForTimeout(1500);
    }

    const pendingRow = page.locator('.ant-table-tbody tr.ant-table-row', { hasText: vtsName }).first();
    await expect(pendingRow).toBeVisible({ timeout: 10000 });

    // Open row action menu (⋮ button)
    await pendingRow.locator('button.ant-btn').last().click();

    // Verify C1 Approval action is available for self-created record (NO 4-eyes block!)
    const approveC1Menu = page.locator('.ant-dropdown-menu-item', { hasText: /Phê duyệt cấp Cảng vụ/i });
    await expect(approveC1Menu).toBeVisible({ timeout: 5000 });
    const approveText = await approveC1Menu.innerText();
    expect(approveText).not.toContain('(không thể tự duyệt)');
    expect(await approveC1Menu.getAttribute('aria-disabled')).not.toBe('true');

    // Click C1 Approval
    await approveC1Menu.click();

    // Modal opens
    const approveModal = page.locator('.ant-modal');
    await expect(approveModal).toBeVisible({ timeout: 5000 });
    const approveModalBtn = approveModal.getByRole('button', { name: /Phê duyệt/i });
    await approveModalBtn.click();
    await expect(approveModal).not.toBeVisible({ timeout: 10000 });

    console.log('[E2E STEP 1] C1 Self-Approval succeeded. Record transitioned to APPROVED_LEVEL1.');

    // =========================================================================
    // STEP 2: Cục user tests Rejection validation (>= 10 chars) and rejects C2
    // =========================================================================
    console.log('[E2E STEP 2] Logging in as Cục user (admin)...');
    await page.context().clearCookies();
    await loginAs(page, 'admin');

    await page.goto('/vts-system');
    await page.waitForLoadState('networkidle');

    // Switch to "Chờ phê duyệt cấp Cục" tab
    const cucTab = page.locator('.chk-status-tabs-container button', { hasText: 'Chờ phê duyệt cấp Cục' });
    await expect(cucTab).toBeVisible({ timeout: 8000 });
    await cucTab.click();
    await page.waitForTimeout(1500);

    // Search for the record
    const searchInputCuc = page.locator('input[placeholder*="Tìm theo tên"]').first();
    if (await searchInputCuc.isVisible()) {
      await searchInputCuc.fill(vtsName);
      await page.getByRole('button', { name: /Tìm kiếm/i }).click();
      await page.waitForTimeout(1500);
    }

    const cucRow = page.locator('.ant-table-tbody tr.ant-table-row', { hasText: vtsName }).first();
    await expect(cucRow).toBeVisible({ timeout: 10000 });

    // Open row action menu -> Select "Từ chối cấp Cục"
    await cucRow.locator('button.ant-btn').last().click();
    const rejectC2Menu = page.locator('.ant-dropdown-menu-item', { hasText: /Từ chối cấp Cục/i });
    await expect(rejectC2Menu).toBeVisible({ timeout: 5000 });
    await rejectC2Menu.click();

    // Modal từ chối opens
    const rejectModal = page.locator('.ant-modal');
    await expect(rejectModal).toBeVisible({ timeout: 5000 });
    const reasonTextArea = rejectModal.locator('textarea');
    const rejectModalBtn = rejectModal.getByRole('button', { name: /Từ chối/i });

    // Test rejection validation: < 10 characters
    await reasonTextArea.fill('Ngắn');
    await rejectModalBtn.click();

    // Toast error must appear: "Lý do từ chối phải có ít nhất 10 ký tự"
    const toastError = page.locator('.ant-message-error, .ant-notification-notice-error, div:has-text("Lý do từ chối phải có ít nhất 10 ký tự")');
    await expect(toastError.first()).toBeVisible({ timeout: 5000 });
    console.log('[E2E STEP 2] Rejection reason < 10 chars correctly blocked by validation.');

    // Now enter valid rejection reason >= 10 characters
    await reasonTextArea.fill('Lý do từ chối kiểm thử hợp lệ đủ 10 ký tự');
    await rejectModalBtn.click();
    await expect(rejectModal).not.toBeVisible({ timeout: 10000 });

    console.log('[E2E STEP 2] C2 Rejection succeeded with valid reason.');

    // =========================================================================
    // STEP 3: Cảng vụ edits rejected record and resubmits via "Lưu và phê duyệt"
    // =========================================================================
    console.log('[E2E STEP 3] Logging in as Cảng vụ user to edit rejected record...');
    await page.context().clearCookies();
    await loginAs(page, 'testhh10102000@gmail.com');

    await page.goto('/vts-system');
    await page.waitForLoadState('networkidle');

    // Switch to "Từ chối cấp Cục" tab
    const rejectedTab = page.locator('.chk-status-tabs-container button', { hasText: 'Từ chối cấp Cục' });
    await expect(rejectedTab).toBeVisible({ timeout: 8000 });
    await rejectedTab.click();
    await page.waitForTimeout(1500);

    const searchInputCv = page.locator('input[placeholder*="Tìm theo tên"]').first();
    if (await searchInputCv.isVisible()) {
      await searchInputCv.fill(vtsName);
      await page.getByRole('button', { name: /Tìm kiếm/i }).click();
      await page.waitForTimeout(1500);
    }

    const rejectedRow = page.locator('.ant-table-tbody tr.ant-table-row', { hasText: vtsName }).first();
    await expect(rejectedRow).toBeVisible({ timeout: 10000 });

    // Click "Chỉnh sửa" from row actions
    await rejectedRow.locator('button.ant-btn').last().click();
    const editMenu = page.locator('.ant-dropdown-menu-item', { hasText: /Chỉnh sửa/i });
    await expect(editMenu).toBeVisible();
    await editMenu.click();

    const editDrawer = page.locator('.ant-drawer-open');
    await expect(editDrawer).toBeVisible({ timeout: 8000 });

    // Update address / note
    const addressInput = editDrawer.locator('input#address, input[id*="address"]');
    if (await addressInput.isVisible()) {
      await addressInput.fill('Địa chỉ cập nhật sau khi bị từ chối');
    }

    // In footer, click "Lưu và gửi phê duyệt" (Cảng vụ transitions to PENDING_APPROVAL per spec 25/09)
    const resubmitBtn = editDrawer.getByRole('button', { name: 'Lưu và gửi phê duyệt' });
    await expect(resubmitBtn).toBeVisible();
    await resubmitBtn.click();
    await expect(editDrawer).not.toBeVisible({ timeout: 15000 });

    console.log('[E2E STEP 3] Resubmitted successfully back to PENDING_APPROVAL. Now approving C1...');

    // Switch to "Chờ phê duyệt cấp Cảng vụ/Chi cục" tab
    const pendingTab2 = page.locator('.chk-status-tabs-container button', { hasText: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' });
    await expect(pendingTab2).toBeVisible({ timeout: 8000 });
    await pendingTab2.click();
    await page.waitForTimeout(1500);

    const searchPending2 = page.locator('input[placeholder*="Tìm theo tên"]').first();
    if (await searchPending2.isVisible()) {
      await searchPending2.fill(vtsName);
      await page.getByRole('button', { name: /Tìm kiếm/i }).click();
      await page.waitForTimeout(1500);
    }

    const pendingRow2 = page.locator('.ant-table-tbody tr.ant-table-row', { hasText: vtsName }).first();
    await expect(pendingRow2).toBeVisible({ timeout: 10000 });

    // Open row action menu -> Click "Phê duyệt cấp Cảng vụ/Chi cục"
    await pendingRow2.locator('button.ant-btn').last().click();
    const approveC1Menu2 = page.locator('.ant-dropdown-menu-item', { hasText: /Phê duyệt cấp Cảng vụ/i });
    await expect(approveC1Menu2).toBeVisible({ timeout: 5000 });
    await approveC1Menu2.click();

    const approveModal2 = page.locator('.ant-modal');
    await expect(approveModal2).toBeVisible({ timeout: 5000 });
    await approveModal2.getByRole('button', { name: /Phê duyệt/i }).click();
    await expect(approveModal2).not.toBeVisible({ timeout: 10000 });

    console.log('[E2E STEP 3] C1 approved again after rejection. Record is now APPROVED_LEVEL1.');

    // =========================================================================
    // STEP 4: Cục user approves C2 -> Record becomes APPROVED
    // =========================================================================
    console.log('[E2E STEP 4] Logging in as Cục user to approve C2...');
    await page.context().clearCookies();
    await loginAs(page, 'admin');

    await page.goto('/vts-system');
    await page.waitForLoadState('networkidle');

    await page.locator('.chk-status-tabs-container button', { hasText: 'Chờ phê duyệt cấp Cục' }).click();
    await page.waitForTimeout(1500);

    const searchCuc2 = page.locator('input[placeholder*="Tìm theo tên"]').first();
    if (await searchCuc2.isVisible()) {
      await searchCuc2.fill(vtsName);
      await page.getByRole('button', { name: /Tìm kiếm/i }).click();
      await page.waitForTimeout(1500);
    }

    const cucRow2 = page.locator('.ant-table-tbody tr.ant-table-row', { hasText: vtsName }).first();
    await expect(cucRow2).toBeVisible({ timeout: 10000 });

    await cucRow2.locator('button.ant-btn').last().click();
    const approveC2Menu = page.locator('.ant-dropdown-menu-item', { hasText: /Phê duyệt cấp Cục/i });
    await expect(approveC2Menu).toBeVisible();
    await approveC2Menu.click();

    const approveModalC2 = page.locator('.ant-modal');
    await expect(approveModalC2).toBeVisible({ timeout: 5000 });
    await approveModalC2.getByRole('button', { name: /Phê duyệt/i }).click();
    await expect(approveModalC2).not.toBeVisible({ timeout: 10000 });

    console.log('[E2E STEP 4] C2 Approved. Record is now APPROVED.');

    // =========================================================================
    // STEP 5: Test Editing APPROVED Record (Rule R4b for Cảng vụ, R4a for Cục)
    // =========================================================================
    // 5.1 Cảng vụ user edits APPROVED record (R4b)
    console.log('[E2E STEP 5.1] Testing Rule R4b with Cảng vụ user on APPROVED record...');
    await page.context().clearCookies();
    await loginAs(page, 'testhh10102000@gmail.com');

    await page.goto('/vts-system');
    await page.waitForLoadState('networkidle');

    // Switch to "Đã phê duyệt" tab
    await page.locator('.chk-status-tabs-container button', { hasText: 'Đã phê duyệt' }).click();
    await page.waitForTimeout(1500);

    const searchCvApproved = page.locator('input[placeholder*="Tìm theo tên"]').first();
    if (await searchCvApproved.isVisible()) {
      await searchCvApproved.fill(vtsName);
      await page.getByRole('button', { name: /Tìm kiếm/i }).click();
      await page.waitForTimeout(1500);
    }

    const approvedRowCv = page.locator('.ant-table-tbody tr.ant-table-row', { hasText: vtsName }).first();
    await expect(approvedRowCv).toBeVisible({ timeout: 10000 });

    // Open row action menu -> "Chỉnh sửa" must be visible for Cảng vụ with approvec1
    await approvedRowCv.locator('button.ant-btn').last().click();
    const editApprovedCv = page.locator('.ant-dropdown-menu-item', { hasText: /Chỉnh sửa/i });
    await expect(editApprovedCv).toBeVisible({ timeout: 5000 });
    await editApprovedCv.click();

    const drawerCv = page.locator('.ant-drawer-open');
    await expect(drawerCv).toBeVisible({ timeout: 8000 });

    // Check footer buttons: both "Lưu và gửi phê duyệt" and "Lưu và phê duyệt"
    const submitBtnCv = drawerCv.getByRole('button', { name: 'Lưu và gửi phê duyệt' });
    const approveBtnCv = drawerCv.getByRole('button', { name: 'Lưu và phê duyệt' });
    await expect(submitBtnCv).toBeVisible();
    await expect(approveBtnCv).toBeVisible();

    // Test dirty check: click without modifying any field
    await approveBtnCv.click();
    const dirtyWarning = page.locator('.ant-message-warning, .ant-notification-notice-warning, div:has-text("Bắt buộc chỉnh sửa ít nhất 1 trường")');
    await expect(dirtyWarning.first()).toBeVisible({ timeout: 5000 });
    console.log('[E2E STEP 5.1] Dirty check on unmodified APPROVED record verified.');

    // Now modify a field
    const addrInput = drawerCv.locator('input#address, input[id*="address"]');
    if (await addrInput.isVisible()) {
      await addrInput.fill('Địa chỉ sửa đổi mới bởi Cảng vụ');
    }

    // Click "Lưu và phê duyệt" -> Cảng vụ transitions to APPROVED_LEVEL1
    await approveBtnCv.click();
    await expect(drawerCv).not.toBeVisible({ timeout: 15000 });
    console.log('[E2E STEP 5.1] Cảng vụ edit submitted -> successfully transitioned to APPROVED_LEVEL1.');

    // 5.2 Cục user approves C2 again to make it APPROVED, then tests R4a
    console.log('[E2E STEP 5.2] Testing Rule R4a with Cục user on APPROVED record...');
    await page.context().clearCookies();
    await loginAs(page, 'admin');

    await page.goto('/vts-system');
    await page.waitForLoadState('networkidle');

    await page.locator('.chk-status-tabs-container button', { hasText: 'Chờ phê duyệt cấp Cục' }).click();
    await page.waitForTimeout(1500);

    const searchCuc3 = page.locator('input[placeholder*="Tìm theo tên"]').first();
    if (await searchCuc3.isVisible()) {
      await searchCuc3.fill(vtsName);
      await page.getByRole('button', { name: /Tìm kiếm/i }).click();
      await page.waitForTimeout(1500);
    }

    const cucRow3 = page.locator('.ant-table-tbody tr.ant-table-row', { hasText: vtsName }).first();
    await expect(cucRow3).toBeVisible({ timeout: 10000 });

    // Approve C2 again
    await cucRow3.locator('button.ant-btn').last().click();
    await page.locator('.ant-dropdown-menu-item', { hasText: /Phê duyệt cấp Cục/i }).click();
    const modalCuc = page.locator('.ant-modal');
    await expect(modalCuc).toBeVisible();
    await modalCuc.getByRole('button', { name: /Phê duyệt/i }).click();
    await expect(modalCuc).not.toBeVisible({ timeout: 10000 });

    // Go to "Đã phê duyệt" tab
    await page.locator('.chk-status-tabs-container button', { hasText: 'Đã phê duyệt' }).click();
    await page.waitForTimeout(1500);

    const searchCucApproved = page.locator('input[placeholder*="Tìm theo tên"]').first();
    if (await searchCucApproved.isVisible()) {
      await searchCucApproved.fill(vtsName);
      await page.getByRole('button', { name: /Tìm kiếm/i }).click();
      await page.waitForTimeout(1500);
    }

    const approvedRowCuc = page.locator('.ant-table-tbody tr.ant-table-row', { hasText: vtsName }).first();
    await expect(approvedRowCuc).toBeVisible({ timeout: 10000 });

    // Click "Chỉnh sửa"
    await approvedRowCuc.locator('button.ant-btn').last().click();
    await page.locator('.ant-dropdown-menu-item', { hasText: /Chỉnh sửa/i }).click();

    const drawerCuc = page.locator('.ant-drawer-open');
    await expect(drawerCuc).toBeVisible({ timeout: 8000 });

    // For Cục user on APPROVED record: only "Lưu và phê duyệt" (green) should be present
    const approveBtnCuc = drawerCuc.getByRole('button', { name: 'Lưu và phê duyệt' });
    await expect(approveBtnCuc).toBeVisible();
    const submitBtnCuc = drawerCuc.getByRole('button', { name: 'Lưu và gửi phê duyệt' });
    await expect(submitBtnCuc).not.toBeVisible();

    // Modify a field and save
    const addrInputCuc = drawerCuc.locator('input#address, input[id*="address"]');
    if (await addrInputCuc.isVisible()) {
      await addrInputCuc.fill('Địa chỉ cập nhật chính thức bởi Cục');
    }

    await approveBtnCuc.click();
    await expect(drawerCuc).not.toBeVisible({ timeout: 15000 });

    // Verify record REMAINS in "Đã phê duyệt"
    await page.waitForTimeout(1500);
    const finalRow = page.locator('.ant-table-tbody tr.ant-table-row', { hasText: vtsName }).first();
    await expect(finalRow).toBeVisible({ timeout: 10000 });

    console.log('[E2E SUCCESS] All 5 steps passed! Rule R3, R4a, R4b, and 4-eyes removal verified 100% on VTS screen.');
  });
});
