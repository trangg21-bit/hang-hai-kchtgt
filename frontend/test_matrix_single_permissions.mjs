import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:/Users/sonpn/.gemini/antigravity-ide/brain/dd3dbd01-c0b8-44e2-9eae-2c016346438c/screenshots';
const BASE_URL = 'http://localhost:3001';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('=== BẮT ĐẦU KIỂM THỬ MA TRẬN TỪNG QUYỀN ĐƠN LẺ VTS (SINGLE PERMISSIONS) ===');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200,
  });

  const results = {};

  try {
    // ------------------------------------------------------------------------
    // BƯỚC 1: Đăng nhập Admin lấy Token & User ID của son9xhn
    // ------------------------------------------------------------------------
    console.log('\n[1] Đăng nhập tài khoản Admin...');
    const adminContext = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const adminPage = await adminContext.newPage();

    await adminPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await adminPage.fill('input[placeholder*="tên đăng nhập"]', 'admin');
    await adminPage.fill('input[placeholder*="mật khẩu"]', 'Asdqwe@123');
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
    console.log('Admin đăng nhập thành công!');

    // Lấy token của admin từ localStorage
    const adminToken = await adminPage.evaluate(() => localStorage.getItem('auth_token'));
    console.log(`Admin token retrieved: ${Boolean(adminToken)}`);

    // Tìm son9xhn ID qua API
    const usersResp = await adminPage.request.get(`${BASE_URL}/api/users?search=son9xhn`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const usersData = await usersResp.json();
    const sonUser = (usersData.data?.content || usersData.content || usersData.data || []).find(
      (u) => u.email === 'son9xhn@gmail.com' || u.username === 'son9xhn'
    );
    if (!sonUser) {
      throw new Error('Không tìm thấy tài khoản son9xhn@gmail.com!');
    }
    const sonUserId = sonUser.id;
    console.log(`Đã tìm thấy son9xhn: id=${sonUserId}, email=${sonUser.email}`);

    // Helper hàm cập nhật quyền cho son9xhn
    async function setSonPermissions(perms) {
      const putResp = await adminPage.request.put(`${BASE_URL}/api/users/${sonUserId}/permissions`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        data: perms,
      });
      if (!putResp.ok()) {
        console.error(`Lỗi cập nhật quyền: ${putResp.status()} ${await putResp.text()}`);
      }
    }

    // ------------------------------------------------------------------------
    // BƯỚC 2: Khởi tạo Trình duyệt 2 cho tài khoản son9xhn
    // ------------------------------------------------------------------------
    console.log('\n[2] Đăng nhập tài khoản son9xhn trên Trình duyệt 2...');
    const sonContext = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const sonPage = await sonContext.newPage();

    await sonPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await sonPage.fill('input[placeholder*="tên đăng nhập"]', 'son9xhn@gmail.com');
    await sonPage.fill('input[placeholder*="mật khẩu"]', 'Asdqwe@123');
    await sonPage.click('button[type="submit"]');
    await sonPage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
    console.log('son9xhn đăng nhập thành công!');

    // Helper đăng nhập lại hoặc làm mới token cho son9xhn
    async function refreshSonSession() {
      // Refresh token qua localStorage hoặc reload sau khi backend đã đổi quyền
      // Đăng xuất và đăng nhập lại nhanh để token nạp đúng quyền mới
      await sonPage.evaluate(() => {
        localStorage.removeItem('auth-storage');
      });
      await sonPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await sonPage.fill('input[placeholder*="tên đăng nhập"]', 'son9xhn@gmail.com');
      await sonPage.fill('input[placeholder*="mật khẩu"]', 'Asdqwe@123');
      await sonPage.click('button[type="submit"]');
      await sonPage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
      await sonPage.waitForTimeout(1000);
    }

    // ========================================================================
    // TEST CASE 1: ĐÚNG CA TRONG ẢNH CHỤP CỦA USER — CHỈ GÁN vts:approvec2
    // ========================================================================
    console.log('\n======================================================');
    console.log('--- TEST CASE 1: CHỈ CẤP DUY NHẤT [vts:approvec2] (Ca trong ảnh của User) ---');
    console.log('======================================================');
    await setSonPermissions(['vts:approvec2']);
    await refreshSonSession();

    console.log('Điều hướng tới /vts-system...');
    await sonPage.goto(`${BASE_URL}/vts-system`, { waitUntil: 'networkidle' });
    await sonPage.waitForTimeout(2500);

    const is403Lock1 = (await sonPage.locator('.ant-result-icon .anticon-lock').count()) > 0 ||
      (await sonPage.locator('text="Không có quyền truy cập"').count()) > 0;
    const tableExists1 = (await sonPage.locator('.ant-table').count()) > 0;
    const rowCount1 = await sonPage.locator('.ant-table-tbody tr.ant-table-row').count();

    // Kiểm tra các menu con có bị lộ không (CCTV, SCADA, transmission, vtsassist)
    const cctvMenu = await sonPage.locator('.ant-menu-item:has-text("Hệ thống CCTV")').count();
    const scadaMenu = await sonPage.locator('.ant-menu-item:has-text("Hệ thống SCADA")').count();
    const transMenu = await sonPage.locator('.ant-menu-item:has-text("Hệ thống truyền dẫn")').count();
    const assistMenu = await sonPage.locator('.ant-menu-item:has-text("Hệ thống phụ trợ VTS")').count();

    const addBtn1 = (await sonPage.locator('button:has-text("Thêm mới")').count()) > 0;

    await sonPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'tc1_only_approvec2.png') });

    console.log(`Kết quả Case 1:`);
    console.log(`- Màn hình 403 Lock xuất hiện?: ${is403Lock1 ? 'CÓ (FAIL)' : 'KHÔNG (PASS)'}`);
    console.log(`- Bảng danh sách VTS hiển thị?: ${tableExists1 ? `CÓ (${rowCount1} dòng) (PASS)` : 'KHÔNG (FAIL)'}`);
    console.log(`- Nút "Thêm mới" hiển thị?: ${addBtn1 ? 'CÓ' : 'KHÔNG (Đúng vì không có quyền create)'}`);
    console.log(`- Menu CCTV hiển thị?: ${cctvMenu > 0 ? 'CÓ (Lỗi rò rỉ)' : 'KHÔNG (Đúng - Đã ẩn)'}`);
    console.log(`- Menu SCADA hiển thị?: ${scadaMenu > 0 ? 'CÓ (Lỗi rò rỉ)' : 'KHÔNG (Đúng - Đã ẩn)'}`);
    console.log(`- Menu Truyền dẫn hiển thị?: ${transMenu > 0 ? 'CÓ (Lỗi rò rỉ)' : 'KHÔNG (Đúng - Đã ẩn)'}`);
    console.log(`- Menu Phụ trợ VTS hiển thị?: ${assistMenu > 0 ? 'CÓ (Lỗi rò rỉ)' : 'KHÔNG (Đúng - Đã ẩn)'}`);

    results.case1_approvec2 = {
      passed: !is403Lock1 && tableExists1 && cctvMenu === 0 && scadaMenu === 0 && transMenu === 0 && assistMenu === 0,
      is403Lock: is403Lock1,
      tableExists: tableExists1,
      rowCount: rowCount1,
      hasAddBtn: addBtn1,
      cctvLeaked: cctvMenu > 0,
      scadaLeaked: scadaMenu > 0,
    };

    // ========================================================================
    // TEST CASE 2: CHỈ CẤP DUY NHẤT [vts:read]
    // ========================================================================
    console.log('\n======================================================');
    console.log('--- TEST CASE 2: CHỈ CẤP DUY NHẤT [vts:read] ---');
    console.log('======================================================');
    await setSonPermissions(['vts:read']);
    await refreshSonSession();

    await sonPage.goto(`${BASE_URL}/vts-system`, { waitUntil: 'networkidle' });
    await sonPage.waitForTimeout(2500);

    const is403Lock2 = (await sonPage.locator('text="Không có quyền truy cập"').count()) > 0;
    const tableExists2 = (await sonPage.locator('.ant-table').count()) > 0;
    const addBtn2 = (await sonPage.locator('button:has-text("Thêm mới")').count()) > 0;

    await sonPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'tc2_only_read.png') });

    console.log(`Kết quả Case 2:`);
    console.log(`- Màn hình 403: ${is403Lock2 ? 'CÓ' : 'KHÔNG (PASS)'}`);
    console.log(`- Bảng VTS: ${tableExists2 ? 'CÓ (PASS)' : 'KHÔNG'}`);
    console.log(`- Nút Thêm mới: ${addBtn2 ? 'HIỆN (FAIL)' : 'ẨN (PASS - Chỉ xem không được thêm)'}`);

    results.case2_read = {
      passed: !is403Lock2 && tableExists2 && !addBtn2,
      tableExists: tableExists2,
      addBtnHidden: !addBtn2,
    };

    // ========================================================================
    // TEST CASE 3: CHỈ CẤP DUY NHẤT [vts:create]
    // ========================================================================
    console.log('\n======================================================');
    console.log('--- TEST CASE 3: CHỈ CẤP DUY NHẤT [vts:create] ---');
    console.log('======================================================');
    await setSonPermissions(['vts:create']);
    await refreshSonSession();

    await sonPage.goto(`${BASE_URL}/vts-system`, { waitUntil: 'networkidle' });
    await sonPage.waitForTimeout(2500);

    const is403Lock3 = (await sonPage.locator('text="Không có quyền truy cập"').count()) > 0;
    const tableExists3 = (await sonPage.locator('.ant-table').count()) > 0;
    const addBtn3 = (await sonPage.locator('button:has-text("Thêm mới")').count()) > 0;

    if (addBtn3) {
      await sonPage.locator('button:has-text("Thêm mới")').first().click();
      await sonPage.waitForTimeout(1500);
      const drawerOpen = (await sonPage.locator('.ant-drawer-open').count()) > 0;
      console.log(`- Form Thêm mới mở thành công: ${drawerOpen ? 'CÓ (PASS)' : 'KHÔNG'}`);
      await sonPage.keyboard.press('Escape');
      await sonPage.waitForTimeout(1000);
    }

    await sonPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'tc3_only_create.png') });

    console.log(`Kết quả Case 3:`);
    console.log(`- Mở trang thành công qua Implicit Read: ${!is403Lock3 && tableExists3 ? 'PASS' : 'FAIL'}`);
    console.log(`- Nút "Thêm mới" xuất hiện: ${addBtn3 ? 'CÓ (PASS)' : 'KHÔNG (FAIL)'}`);

    results.case3_create = {
      passed: !is403Lock3 && tableExists3 && addBtn3,
      hasAddBtn: addBtn3,
    };

    // ========================================================================
    // TEST CASE 4: CHỈ CẤP DUY NHẤT [vts:history]
    // ========================================================================
    console.log('\n======================================================');
    console.log('--- TEST CASE 4: CHỈ CẤP DUY NHẤT [vts:history] ---');
    console.log('======================================================');
    await setSonPermissions(['vts:history']);
    await refreshSonSession();

    await sonPage.goto(`${BASE_URL}/vts-system`, { waitUntil: 'networkidle' });
    await sonPage.waitForTimeout(2500);

    const is403Lock4 = (await sonPage.locator('text="Không có quyền truy cập"').count()) > 0;
    const tableExists4 = (await sonPage.locator('.ant-table').count()) > 0;
    const addBtn4 = (await sonPage.locator('button:has-text("Thêm mới")').count()) > 0;

    // Mở menu thao tác dòng đầu tiên xem có nút Lịch sử không
    let hasHistoryAction = false;
    const firstRowBtn = sonPage.locator('.ant-table-tbody tr.ant-table-row').first().locator('button, .ant-dropdown-trigger').last();
    if (await firstRowBtn.count() > 0) {
      await firstRowBtn.click();
      await sonPage.waitForTimeout(1000);
      hasHistoryAction = (await sonPage.locator('.ant-dropdown-menu-item:has-text("Lịch sử")').count()) > 0;
      await sonPage.keyboard.press('Escape');
    }

    await sonPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'tc4_only_history.png') });

    console.log(`Kết quả Case 4:`);
    console.log(`- Mở trang thành công qua Implicit Read: ${!is403Lock4 && tableExists4 ? 'PASS' : 'FAIL'}`);
    console.log(`- Nút Thêm mới bị ẩn: ${!addBtn4 ? 'PASS' : 'FAIL'}`);
    console.log(`- Nút "Lịch sử" hiển thị trong menu dòng: ${hasHistoryAction ? 'CÓ (PASS)' : 'KHÔNG (FAIL)'}`);

    results.case4_history = {
      passed: !is403Lock4 && tableExists4 && !addBtn4 && hasHistoryAction,
      hasHistoryAction,
    };

    // ========================================================================
    // TEST CASE 5: KIỂM THỬ MÀN HÌNH KHÁC — CHỈ CẤP DUY NHẤT [anchorage:create]
    // ========================================================================
    console.log('\n======================================================');
    console.log('--- TEST CASE 5: KIỂM THỬ MÀN HÌNH KHÁC: CHỈ CẤP [anchorage:create] ---');
    console.log('======================================================');
    await setSonPermissions(['anchorage:create']);
    await refreshSonSession();

    // 1. Kiểm tra vào được /anchorage
    await sonPage.goto(`${BASE_URL}/anchorage`, { waitUntil: 'networkidle' });
    await sonPage.waitForTimeout(2500);
    const anchorageLock = (await sonPage.locator('.ant-result-title:has-text("Không có quyền truy cập")').count()) > 0 ||
      (await sonPage.locator('.ant-result-icon .anticon-lock').count()) > 0;
    const anchorageTable = (await sonPage.locator('.ant-table').count()) > 0;
    const anchorageAddBtn = (await sonPage.locator('button:has-text("Thêm mới")').count()) > 0;
    await sonPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'tc5_anchorage_create.png') });

    // 2. Kiểm tra KHÔNG VÀO ĐƯỢC /vts-system
    await sonPage.goto(`${BASE_URL}/vts-system`, { waitUntil: 'networkidle' });
    await sonPage.waitForTimeout(1500);
    const vtsLock = (await sonPage.locator('text="Không có quyền truy cập"').count()) > 0;

    // 3. Kiểm tra KHÔNG VÀO ĐƯỢC /port
    await sonPage.goto(`${BASE_URL}/port`, { waitUntil: 'networkidle' });
    await sonPage.waitForTimeout(1500);
    const portLock = (await sonPage.locator('text="Không có quyền truy cập"').count()) > 0;

    console.log(`Kết quả Case 5 (Màn hình Khu neo đậu & Cách ly màn hình khác):`);
    console.log(`- Vào được /anchorage qua Implicit Read: ${!anchorageLock && anchorageTable ? 'PASS' : 'FAIL'}`);
    console.log(`- Nút "Thêm mới" trên /anchorage hiển thị: ${anchorageAddBtn ? 'CÓ (PASS)' : 'KHÔNG (FAIL)'}`);
    console.log(`- Màn hình VTS bị khóa (không bị rò rỉ): ${vtsLock ? 'PASS' : 'FAIL'}`);
    console.log(`- Màn hình Cảng biển bị khóa (không bị rò rỉ): ${portLock ? 'PASS' : 'FAIL'}`);

    results.case5_other_screen_anchorage = {
      passed: !anchorageLock && anchorageTable && anchorageAddBtn && vtsLock && portLock,
      anchorageAccessible: !anchorageLock && anchorageTable,
      anchorageAddBtn,
      vtsProperlyBlocked: vtsLock,
      portProperlyBlocked: portLock,
    };

    console.log('\n======================================================');
    console.log('TỔNG HỢP KẾT QUẢ KIỂM THỬ MA TRẬN PHÂN QUYỀN TOÀN HỆ THỐNG:');
    console.log(JSON.stringify(results, null, 2));
    console.log('======================================================');

  } catch (err) {
    console.error('Lỗi trong quá trình chạy script:', err);
  } finally {
    await browser.close();
  }
}

run();
