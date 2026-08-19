import { expect, test } from '@playwright/test';

const encodeJwtPart = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
const testToken = [
  encodeJwtPart({ alg: 'HS256', typ: 'JWT' }),
  encodeJwtPart({
    sub: 'admin',
    role: 'ROLE_SYSTEM_ADMIN',
    permissions: ['admin:all', 'vts:read', 'vts:create', 'vts:history'],
    user_id: '00000000-0000-0000-0000-000000000001',
  }),
  'test-signature',
].join('.');

test.use({
  viewport: { width: 1648, height: 916 },
  storageState: { cookies: [], origins: [] },
});

test('VTS empty table keeps the fixed action column as the last visible column', async ({ page }) => {
  await page.addInitScript((token) => localStorage.setItem('auth_token', token), testToken);

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    let data: unknown = [];

    if (url.pathname.endsWith('/v1/vts-system')) {
      data = { items: [], total: 0, statusCounts: {} };
    } else if (url.pathname.endsWith('/field-visibility')) {
      data = {};
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data }),
    });
  });

  await page.goto('/vts-system');

  await expect(page.getByText('Chưa có hệ thống VTS nào')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /Ngày cập nhật/i })).toBeAttached();

  const actionHeader = page.getByRole('columnheader').last();
  await expect(actionHeader).toBeVisible();

  const rightEdge = await actionHeader.evaluate((actionHeaderElement) => {
    const table = actionHeaderElement.closest<HTMLElement>('.ant-table');
    const tableHeader = table?.querySelector<HTMLElement>('.ant-table-header');
    if (!table || !tableHeader) {
      throw new Error('Không tìm thấy header hoặc cột thao tác fixed-right');
    }

    const actionRect = actionHeaderElement.getBoundingClientRect();
    const headerRect = tableHeader.getBoundingClientRect();
    const probeY = actionRect.top + actionRect.height / 2;
    const probeX = Math.min(headerRect.right - 1, actionRect.right + 2);
    const topElement = document.elementFromPoint(probeX, probeY);

    return {
      actionRight: actionRect.right,
      headerRight: headerRect.right,
      exposedText: topElement?.textContent?.trim() || '',
    };
  });

  expect(rightEdge.headerRight - rightEdge.actionRight).toBeLessThanOrEqual(20);
  expect(rightEdge.exposedText.toLocaleLowerCase('vi')).not.toContain('ngày cập nhật');
});
