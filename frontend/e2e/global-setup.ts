import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3001';
  const authFile = path.resolve('e2e/.auth/state.json');

  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`[Global Setup] Logging in at ${baseURL}/login ...`);
    await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[placeholder*="đăng nhập"]', 'admin');
    await page.fill('input[placeholder*="mật khẩu"]', 'Asdqwe@123');
    const captcha = page.locator('input[placeholder*="5 số bảo vệ"], input[placeholder*="mã bảo vệ"]');
    if (await captcha.isVisible({ timeout: 2000 }).catch(() => false)) {
      await captcha.fill('00000');
    }
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
    console.log('[Global Setup] Login successful, current URL:', page.url());

    await page.context().storageState({ path: authFile });
    console.log(`[Global Setup] Storage state saved to ${authFile}`);
  } catch (err) {
    console.error('[Global Setup] Failed to authenticate:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
