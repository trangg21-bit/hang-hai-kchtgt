import { chromium } from '@playwright/test';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 } });
  await page.goto('http://localhost:3001/login');
  await page.fill('input[placeholder*="tên đăng nhập"]', 'admin');
  await page.fill('input[placeholder*="mật khẩu"]', 'Asdqwe@123');
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
  await page.goto('http://localhost:3001/station/lrit', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Click action menu on first row
  const actionBtn = page.locator('tbody tr td:last-child button').first();
  await actionBtn.click();
  await page.waitForTimeout(500);
  
  // Click 'Xem chi tiết'
  const viewItem = page.locator('.ant-dropdown-menu-item', { hasText: 'Xem chi tiết' }).first();
  await viewItem.click();
  await page.waitForTimeout(1500);
  
  await page.screenshot({ path: 'C:/Users/sonpn/.gemini/antigravity-ide/brain/dd3dbd01-c0b8-44e2-9eae-2c016346438c/screenshots/lrit_detail_fixed.png' });
  console.log('Saved lrit_detail_fixed.png');
  await browser.close();
}

test().catch(console.error);
