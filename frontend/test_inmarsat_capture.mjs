import { chromium } from '@playwright/test';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  
  await page.goto('http://localhost:3001/login');
  await page.fill('input[placeholder*="tên đăng nhập"]', 'admin');
  await page.fill('input[placeholder*="mật khẩu"]', 'Asdqwe@123');
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
  
  await page.goto('http://localhost:3001/station/inmarsat', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Check state of user permissions in frontend store
  const permCheck = await page.evaluate(() => {
    const authStorage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const permStorage = JSON.parse(localStorage.getItem('permission-storage') || '{}');
    return {
      user: authStorage.state?.user,
      permissions: permStorage.state?.permissions,
      effectivePermissions: permStorage.state?.effectivePermissions,
    };
  });
  console.log('Frontend user info:', permCheck.user);
  console.log('Has coastalstationinmarsat perms:', 
    (permCheck.permissions || []).filter(p => p.includes('inmarsat') || p.includes('coastal'))
  );

  // Find row with kkkkd (INMARSAT-0012)
  const kkkkdRow = page.locator('tbody tr', { hasText: 'INMARSAT-0012' });
  const count = await kkkkdRow.count();
  console.log('kkkkd rows count:', count);
  if (count > 0) {
    const kkkkdText = await kkkkdRow.innerText();
    console.log('kkkkd row text:', kkkkdText.replace(/\n/g, ' | '));
    const actionBtn = kkkkdRow.locator('td:last-child button');
    await actionBtn.click();
    await page.waitForTimeout(500);
    const menuItems = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.ant-dropdown-menu-item')).map(el => el.innerText.trim());
    });
    console.log('Menu items for INMARSAT-0012 (PENDING_APPROVAL):', menuItems);
    await page.screenshot({ path: 'C:/Users/sonpn/.gemini/antigravity-ide/brain/dd3dbd01-c0b8-44e2-9eae-2c016346438c/screenshots/inmarsat_menu_kkkkd.png' });
  }

  await browser.close();
}

test().catch(console.error);
