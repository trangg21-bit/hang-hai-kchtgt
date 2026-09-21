import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:/Users/sonpn/.gemini/antigravity-ide/brain/dd3dbd01-c0b8-44e2-9eae-2c016346438c/screenshots';
const BASE_URL = 'http://localhost:3001';

async function run() {
  console.log('=== KHỞI CHẠY KIỂM THỬ PHÂN QUYỀN 2 TRÌNH DUYỆT VỚI PLAYWRIGHT ===');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
  });

  const testReport = {
    adminFlow: {},
    sonFlow: {},
    permissionIssues: [],
  };

  try {
    // ==========================================
    // BƯỚC 1: TRÌNH DUYỆT 1 - TÀI KHOẢN ADMIN
    // ==========================================
    console.log('\n--- [TRÌNH DUYỆT 1] Đăng nhập Admin & Phân quyền ---');
    const adminContext = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const adminPage = await adminContext.newPage();

    adminPage.on('console', (msg) => {
      if (msg.type() === 'error') console.log(`[Admin Console Error]: ${msg.text()}`);
    });
    adminPage.on('response', (res) => {
      if (res.status() === 403) {
        console.warn(`[Admin 403 Forbidden]: ${res.url()}`);
        testReport.permissionIssues.push({ user: 'admin', url: res.url(), status: 403 });
      }
    });

    console.log('1.1. Điều hướng đến trang Đăng nhập...');
    await adminPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, '01_admin_login_page.png') });

    console.log('1.2. Điền thông tin admin / Asdqwe@123...');
    await adminPage.fill('input[placeholder*="tên đăng nhập"]', 'admin');
    await adminPage.fill('input[placeholder*="mật khẩu"]', 'Asdqwe@123');
    await adminPage.click('button[type="submit"]');

    console.log('1.3. Đang chờ chuyển trang sau đăng nhập...');
    await adminPage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
    await adminPage.waitForTimeout(2000);
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, '02_admin_dashboard.png') });
    console.log('Admin đăng nhập thành công!');

    console.log('1.4. Điều hướng đến Quản lý người dùng (/users)...');
    await adminPage.goto(`${BASE_URL}/users`, { waitUntil: 'networkidle' });
    await adminPage.waitForTimeout(2000);
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, '03_admin_users_list.png') });

    console.log('1.5. Tìm kiếm người dùng son9xhn@gmail.com...');
    const searchInput = adminPage.locator('input[placeholder*="Tìm"]').first();
    await searchInput.fill('son9xhn');
    await searchInput.press('Enter');
    await adminPage.waitForTimeout(2500);
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, '04_admin_search_son9xhn.png') });

    const sonRow = adminPage.locator('tr').filter({ hasText: 'son9xhn@gmail.com' });
    const count = await sonRow.count();
    console.log(`Tìm thấy ${count} dòng khớp son9xhn@gmail.com`);

    if (count > 0) {
      console.log('1.6. Mở menu hành động dòng của son9xhn...');
      const actionBtn = sonRow.locator('button, .ant-dropdown-trigger, [aria-label*="more"]').last();
      await actionBtn.click();
      await adminPage.waitForTimeout(1000);
      await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, '05_admin_row_menu.png') });

      console.log('1.7. Nhấp vào "Phân quyền"...');
      const permMenuItem = adminPage.locator('.ant-dropdown-menu-item').filter({ hasText: 'Phân quyền' });
      if (await permMenuItem.count() > 0) {
        await permMenuItem.click();
      } else {
        await adminPage.click('text="Phân quyền"');
      }

      console.log('1.8. Đang chờ Drawer Phân quyền hiển thị...');
      const drawer = adminPage.locator('.ant-drawer').filter({ hasText: 'Phân quyền' });
      await drawer.waitFor({ state: 'visible', timeout: 10000 });
      await adminPage.waitForTimeout(2000);
      await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, '06_admin_perm_drawer_opened.png') });
      console.log('Drawer phân quyền đã mở!');

      console.log('1.9. Tìm kiếm nhóm quyền VTS...');
      const permSearchInput = adminPage.locator('.ant-drawer input[placeholder*="Tìm theo tên"]');
      if (await permSearchInput.count() > 0) {
        await permSearchInput.fill('VTS');
        await permSearchInput.press('Enter');
        await adminPage.waitForTimeout(1500);
      }
      await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, '07_admin_perm_search_vts.png') });

      console.log('1.10. Chọn tất cả các quyền hiển thị trong cây...');
      const checkboxes = adminPage.locator('.ant-drawer .ant-tree-checkbox');
      const cbCount = await checkboxes.count();
      console.log(`Số checkbox quyền tìm thấy: ${cbCount}`);
      for (let i = 0; i < cbCount; i++) {
        const cb = checkboxes.nth(i);
        const isChecked = await cb.evaluate((el) => el.classList.contains('ant-tree-checkbox-checked'));
        if (!isChecked) {
          await cb.click();
          await adminPage.waitForTimeout(200);
        }
      }

      await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, '08_admin_perm_checked.png') });

      console.log('1.11. Nhấn nút "Lưu" phân quyền...');
      const saveBtn = adminPage.locator('.ant-drawer button').filter({ hasText: 'Lưu' });
      await saveBtn.click();
      await adminPage.waitForTimeout(3000);
      await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, '09_admin_perm_saved.png') });
      console.log('Phân quyền cho son9xhn thành công!');
      testReport.adminFlow.permissionAssigned = true;
    } else {
      console.warn('Không tìm thấy dòng của son9xhn@gmail.com trên bảng danh sách!');
      testReport.adminFlow.permissionAssigned = false;
    }

    // ==========================================
    // BƯỚC 2: TRÌNH DUYỆT 2 - TÀI KHOẢN SON9XHN
    // ==========================================
    console.log('\n--- [TRÌNH DUYỆT 2] Đăng nhập son9xhn & Kiểm tra chức năng KCHT ---');
    const sonContext = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const sonPage = await sonContext.newPage();

    const sonConsoleErrors = [];
    const sonNetwork403s = [];

    sonPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        sonConsoleErrors.push(msg.text());
        console.log(`[Son Console Error]: ${msg.text()}`);
      }
    });
    sonPage.on('response', (res) => {
      if (res.status() === 403) {
        sonNetwork403s.push(res.url());
        console.warn(`[Son 403 Forbidden]: ${res.url()}`);
        testReport.permissionIssues.push({ user: 'son9xhn', url: res.url(), status: 403 });
      }
    });

    console.log('2.1. Điều hướng đến trang Đăng nhập...');
    await sonPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await sonPage.screenshot({ path: path.join(SCREENSHOT_DIR, '10_son_login_page.png') });

    console.log('2.2. Điền thông tin son9xhn@gmail.com / Asdqwe@123...');
    await sonPage.fill('input[placeholder*="tên đăng nhập"]', 'son9xhn@gmail.com');
    await sonPage.fill('input[placeholder*="mật khẩu"]', 'Asdqwe@123');
    await sonPage.click('button[type="submit"]');

    console.log('2.3. Đang chờ chuyển trang sau đăng nhập...');
    await sonPage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
    await sonPage.waitForTimeout(2000);
    await sonPage.screenshot({ path: path.join(SCREENSHOT_DIR, '11_son_dashboard.png') });
    console.log('Son9xhn đăng nhập thành công!');

    console.log('2.4. Điều hướng đến màn hình Hệ thống VTS (/vts-system)...');
    await sonPage.goto(`${BASE_URL}/vts-system`, { waitUntil: 'networkidle' });
    await sonPage.waitForTimeout(2000);

    // Nếu gặp lỗi dynamic import hoặc chưa hiển thị bảng, reload lại trang
    if (await sonPage.locator('.ant-table').count() === 0) {
      console.log('Chưa phát hiện bảng VTS, thử reload trang...');
      await sonPage.reload({ waitUntil: 'networkidle' });
      await sonPage.waitForTimeout(3000);
    }

    await sonPage.screenshot({ path: path.join(SCREENSHOT_DIR, '12_son_vts_list.png') });

    // Kiểm tra dữ liệu bảng danh sách
    const vtsRows = sonPage.locator('.ant-table-tbody tr.ant-table-row');
    let vtsRowCount = await vtsRows.count();
    console.log(`2.5. Số bản ghi VTS hiển thị trên bảng: ${vtsRowCount}`);
    testReport.sonFlow.vtsRowCount = vtsRowCount;

    // Kiểm tra StatusTabs
    const statusTabs = sonPage.locator('.chk-status-tabs-container > *, .ant-tabs-tab');
    const tabCount = await statusTabs.count();
    console.log(`2.6. Số tab trạng thái hiển thị: ${tabCount}`);
    testReport.sonFlow.statusTabCount = tabCount;

    // Kiểm tra nút Thêm mới
    const addBtn = sonPage.locator('button').filter({ hasText: 'Thêm mới' });
    const hasAddBtn = (await addBtn.count()) > 0;
    console.log(`2.7. Nút "Thêm mới" VTS: ${hasAddBtn ? 'CÓ HIỂN THỊ (PASS)' : 'BỊ ẨN (FAIL)'}`);
    testReport.sonFlow.hasCreateButton = hasAddBtn;

    if (hasAddBtn) {
      console.log('2.8. Thử nhấn nút "Thêm mới" để kiểm tra Form Drawer...');
      await addBtn.first().click();
      await sonPage.waitForTimeout(2000);
      await sonPage.screenshot({ path: path.join(SCREENSHOT_DIR, '13_son_vts_create_drawer.png') });

      // Đóng drawer thêm mới bằng nút ✕ hoặc phím Escape
      console.log('2.8b. Đóng form thêm mới...');
      const closeBtn = sonPage.locator('.ant-drawer button:has-text("✕")').first();
      if (await closeBtn.count() > 0) {
        await closeBtn.click();
      } else {
        await sonPage.keyboard.press('Escape');
      }
      await sonPage.waitForTimeout(1500);
      if (await sonPage.locator('.ant-drawer-open').count() > 0) {
        await sonPage.keyboard.press('Escape');
        await sonPage.waitForTimeout(1500);
      }
    }

    // Kiểm tra menu thao tác trên dòng đầu tiên
    if (vtsRowCount > 0) {
      console.log('2.9. Kiểm tra menu thao tác trên dòng đầu tiên...');
      const firstRowActionBtn = vtsRows.first().locator('button, .ant-dropdown-trigger').last();
      if (await firstRowActionBtn.count() > 0) {
        await firstRowActionBtn.click();
        await sonPage.waitForTimeout(1000);
        await sonPage.screenshot({ path: path.join(SCREENSHOT_DIR, '14_son_vts_row_actions.png') });

        const actionItems = sonPage.locator('.ant-dropdown-menu-item');
        const actionCount = await actionItems.count();
        const actionLabels = [];
        for (let j = 0; j < actionCount; j++) {
          actionLabels.push(await actionItems.nth(j).innerText());
        }
        console.log(`Các hành động có quyền thao tác trên dòng VTS:`, actionLabels);
        testReport.sonFlow.vtsRowActionLabels = actionLabels;

        // Thử click Xem chi tiết
        const viewAction = actionItems.filter({ hasText: 'Xem chi tiết' });
        if (await viewAction.count() > 0) {
          await viewAction.first().click();
          await sonPage.waitForTimeout(2000);
          await sonPage.screenshot({ path: path.join(SCREENSHOT_DIR, '15_son_vts_detail_drawer.png') });
          console.log('Drawer Xem chi tiết VTS mở thành công!');

          const closeDetailBtn = sonPage.locator('.ant-drawer button:has-text("✕")').first();
          if (await closeDetailBtn.count() > 0) {
            await closeDetailBtn.click();
          } else {
            await sonPage.keyboard.press('Escape');
          }
          await sonPage.waitForTimeout(1000);
        }
      }
    }

    testReport.sonFlow.network403s = sonNetwork403s;
    testReport.sonFlow.consoleErrors = sonConsoleErrors;

    console.log('\n=== TỔNG KẾT KIỂM THỬ PHÂN QUYỀN ===');
    console.log(`- Số lỗi 403 Network phát hiện: ${testReport.permissionIssues.length}`);
    console.log(`- Quyền Tạo mới VTS: ${hasAddBtn ? 'PASS' : 'FAIL'}`);
    console.log(`- Số dòng VTS tải được: ${vtsRowCount}`);
    console.log(`- Console Errors: ${sonConsoleErrors.length}`);

    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'test_report.json'),
      JSON.stringify(testReport, null, 2),
      'utf-8'
    );
    console.log('Đã lưu báo cáo tại test_report.json và các ảnh chụp màn hình minh chứng!');

  } catch (err) {
    console.error('Lỗi trong quá trình chạy kiểm thử Playwright:', err);
  } finally {
    await browser.close();
    console.log('=== ĐÃ HOÀN TẤT VÀ ĐÓNG TRÌNH DUYỆT ===');
  }
}

run();
