import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:/Users/sonpn/.gemini/antigravity-ide/brain/dd3dbd01-c0b8-44e2-9eae-2c016346438c/screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const STATIONS = [
  {
    name: 'Đài thông tin LRIT',
    url: 'http://localhost:3001/station/lrit',
    key: 'lrit',
  },
  {
    name: 'Đài thông tin vệ tinh Cospas-Sarsat',
    url: 'http://localhost:3001/station/cospas-sarsat',
    key: 'cospas',
  },
  {
    name: 'Đài thông tin vệ tinh Inmarsat',
    url: 'http://localhost:3001/station/inmarsat',
    key: 'inmarsat',
  },
  {
    name: 'Đài TTXLTT Hà Nội',
    url: 'http://localhost:3001/station/hanoi',
    key: 'hanoi',
  },
];

async function runTests() {
  console.log('🚀 Starting Playwright tests for all Maritime Station modules...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();

  // 1. Login
  console.log('🔑 Logging in as admin...');
  await page.goto('http://localhost:3001/login');
  await page.fill('input[placeholder*="tên đăng nhập"]', 'admin');
  await page.fill('input[placeholder*="mật khẩu"]', 'Asdqwe@123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 15000 });
  console.log('✅ Logged in successfully');

  const testResults = [];

  for (const station of STATIONS) {
    console.log(`\n========================================`);
    console.log(`📡 Testing [${station.name}] (${station.url})`);
    console.log(`========================================`);

    const result = {
      name: station.name,
      key: station.key,
      listPass: false,
      detailPass: false,
      formPass: false,
      errors: [],
    };

    try {
      // ── Step 1: List Screen ──
      await page.goto(station.url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);

      const table = page.locator('.ant-table');
      if (await table.isVisible()) {
        console.log(`  ✓ List table rendered`);
        result.listPass = true;
      } else {
        result.errors.push('List table not visible');
      }

      // ── Step 2: Detail Drawer ──
      const firstRow = page.locator('tbody tr.ant-table-row').first();
      const rowCount = await page.locator('tbody tr.ant-table-row').count();
      if (rowCount > 0) {
        console.log(`  ✓ Found ${rowCount} rows, opening Detail Drawer on first row...`);
        const actionBtn = firstRow.locator('td:last-child button').first();
        await actionBtn.click();
        await page.waitForTimeout(400);

        const viewMenuItem = page.locator('.ant-dropdown-menu-item', { hasText: 'Xem chi tiết' }).first();
        if (await viewMenuItem.isVisible()) {
          await viewMenuItem.click();
          await page.waitForTimeout(1500);

          const drawer = page.locator('.ant-drawer-open');
          await drawer.waitFor({ state: 'visible', timeout: 5000 });

          // Take screenshot of detail drawer
          const detailPath = path.join(SCREENSHOT_DIR, `${station.key}_detail_pw.png`);
          await page.screenshot({ path: detailPath });
          console.log(`  📸 Saved detail screenshot: ${station.key}_detail_pw.png`);

          result.detailPass = true;
        } else {
          result.errors.push('"Xem chi tiết" menu item not found');
        }
      } else {
        console.log(`  ⚠ No rows found in table for ${station.name}`);
      }

      // ── Step 3: Create Form Drawer (Clean navigation to avoid backdrop issues) ──
      console.log(`  Testing Create Form Drawer...`);
      await page.goto(station.url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);

      const addBtn = page.locator('button', { hasText: 'Thêm mới' }).first();
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1500);

        const formDrawer = page.locator('.ant-drawer-open');
        await formDrawer.waitFor({ state: 'visible', timeout: 5000 });

        // Verify "Địa điểm chi tiết" and "Dịch vụ cung cấp" form items
        const locDetailItem = formDrawer.locator('label', { hasText: 'Địa điểm chi tiết' });
        const serviceItem = formDrawer.locator('label', { hasText: 'Dịch vụ cung cấp' });
        const locVisible = await locDetailItem.isVisible();
        const srvVisible = await serviceItem.isVisible();
        console.log(`  ✓ Form fields: "Địa điểm chi tiết": ${locVisible}, "Dịch vụ cung cấp": ${srvVisible}`);

        // Verify TextArea for 2000 chars
        const textAreas = formDrawer.locator('textarea');
        const taCount = await textAreas.count();
        console.log(`  ✓ Found ${taCount} TextArea fields (Vùng phủ sóng / Ghi chú)`);

        // Take screenshot of form drawer
        const formPath = path.join(SCREENSHOT_DIR, `${station.key}_form_pw.png`);
        await page.screenshot({ path: formPath });
        console.log(`  📸 Saved form screenshot: ${station.key}_form_pw.png`);

        result.formPass = locVisible && srvVisible;
      } else {
        result.errors.push('"Thêm mới" button not visible');
      }

    } catch (err) {
      console.error(`  ❌ Error testing ${station.name}:`, err.message);
      result.errors.push(err.message);
    }

    testResults.push(result);
  }

  await browser.close();

  console.log('\n========================================');
  console.log('📊 PLAYWRIGHT TEST SUMMARY');
  console.log('========================================');
  for (const r of testResults) {
    const status = r.listPass && r.detailPass && r.formPass ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${r.name}: List=${r.listPass}, Detail=${r.detailPass}, Form=${r.formPass}`);
    if (r.errors.length > 0) {
      console.log(`   Errors: ${r.errors.join('; ')}`);
    }
  }

  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, 'playwright_report.json'),
    JSON.stringify(testResults, null, 2),
  );
  console.log(`\nReport written to ${path.join(SCREENSHOT_DIR, 'playwright_report.json')}`);
}

runTests().catch(console.error);
