import { chromium } from '@playwright/test';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  
  try {
    await page.goto('http://10.0.229.20:30008/login', { timeout: 5000 });
    console.log('Connected to 10.0.229.20:30008 successfully!');
    await page.fill('input[placeholder*="tên đăng nhập"]', 'admin');
    await page.fill('input[placeholder*="mật khẩu"]', 'Asdqwe@123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
    await page.goto('http://10.0.229.20:30008/station/inmarsat', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Check row actions on 30008
    const kkkkdRow = page.locator('tbody tr', { hasText: 'INMARSAT-0012' });
    const count = await kkkkdRow.count();
    console.log('30008 kkkkd rows count:', count);
    if (count > 0) {
      const actionBtn = kkkkdRow.locator('td:last-child button');
      await actionBtn.click();
      await page.waitForTimeout(500);
      const menuItems = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.ant-dropdown-menu-item')).map(el => el.innerText.trim());
      });
      console.log('30008 Menu items for INMARSAT-0012:', menuItems);
      await page.screenshot({ path: 'C:/Users/sonpn/.gemini/antigravity-ide/brain/dd3dbd01-c0b8-44e2-9eae-2c016346438c/screenshots/inmarsat_30008.png' });
    }
  } catch (e) {
    console.log('Cannot connect to 30008:', e.message);
  } finally {
    await browser.close();
  }
}

test().catch(console.error);
