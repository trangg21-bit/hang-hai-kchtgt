import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 } });
  await page.goto('http://localhost:3001/login');
  await page.fill('input[placeholder*="tên đăng nhập"]', 'admin');
  await page.fill('input[placeholder*="mật khẩu"]', 'Asdqwe@123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 15000 });

  // 1. Check LRIT Detail
  await page.goto('http://localhost:3001/station/lrit', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const row = page.locator('tbody tr', { hasText: 'LRIT-0009' }).first();
  const count = await row.count();
  if (count > 0) {
    const actionBtn = row.locator('td:last-child button').first();
    await actionBtn.click();
    await page.waitForTimeout(500);
    const viewItem = page.locator('.ant-dropdown-menu-item', { hasText: 'Xem chi tiết' }).first();
    await viewItem.click();
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'C:/Users/sonpn/.gemini/antigravity-ide/brain/dd3dbd01-c0b8-44e2-9eae-2c016346438c/screenshots/lrit_detail_final.png' });
  console.log('Saved lrit_detail_final.png');

  // Close drawer
  const closeBtn = page.locator('.ant-drawer-close').first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await page.waitForTimeout(500);
  }

  // 2. Check LRIT Create Form
  const addBtn = page.locator('button', { hasText: 'Thêm mới' }).first();
  if (await addBtn.isVisible()) {
    await addBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'C:/Users/sonpn/.gemini/antigravity-ide/brain/dd3dbd01-c0b8-44e2-9eae-2c016346438c/screenshots/lrit_form_final.png' });
    console.log('Saved lrit_form_final.png');
  }

  await browser.close();
}

main().catch(console.error);
