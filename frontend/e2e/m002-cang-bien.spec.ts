/**
 * M-002 F-008..F-013 — Cảng biển (CangBien) deep CRUD E2E.
 * Real create → read → list → edit → delete through the UI against the live backend.
 * Self-cleaning: the delete step removes the record; a finally block is the safety net.
 *
 * Port code is now auto-generated (GET /api/v1/ports/generate-code) and disabled — the test
 * reads the generated code from the input instead of typing it manually.
 */
import { test, expect, type APIRequestContext } from '@playwright/test';
import { loginAdmin, adminToken, apiDelete, uid, BE } from './m002-helpers';

const LIST = '/port';

async function findIdByCode(request: APIRequestContext, token: string, portCode: string): Promise<string | null> {
  const res = await request.get(`${BE}/api/v1/ports?search=${encodeURIComponent(portCode)}&size=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  const items = (body.data ?? body).content ?? [];
  const hit = items.find((x: any) => x.portCode === portCode);
  return hit?.id ?? null;
}

/** Read the auto-generated port code from the disabled input field. */
async function readGeneratedPortCode(page: any): Promise<string> {
  // Ant Design assigns id="portCode" from Form.Item name="portCode"
  const input = page.locator('#portCode');
  // Wait for auto-generate API to populate the field with a CB-XXXXXX code
  await expect
    .poll(async () => (await input.inputValue()).trim(), { timeout: 10_000 })
    .toMatch(/^CB-\d{6}$/);
  return (await input.inputValue()).trim();
}

test('M-002 Cảng biển: full CRUD (create → list → edit → delete)', async ({ page, request }) => {
  const token = await adminToken(request);
  const tenCang = `E2E Cảng biển ${uid('E2E-CB')}`;
  const tenCangEdited = `${tenCang} (đã sửa)`;
  let id: string | null = null;
  let autoCode: string = '';

  try {
    await test.step('login', async () => {
      await loginAdmin(page);
    });

    await test.step('CREATE via form (port code auto-generated, disabled)', async () => {
      await page.goto('/port/create');

      // Wait for auto-generated port code to appear
      autoCode = await readGeneratedPortCode(page);
      expect(autoCode).toMatch(/^CB-\d{6}$/); // format CB-XXXXXX

      // Fill required fields
      await page.getByPlaceholder('VD: Cảng biển Hải Phòng').fill(tenCang);

      // Submit for approval
      await page.getByRole('button', { name: 'Gửi phê duyệt' }).click();
      await page.waitForURL(/\/port$/, { timeout: 15_000 });
    });

    await test.step('READ in list (find by auto-generated code)', async () => {
      id = await findIdByCode(request, token, autoCode);
      expect(id, 'created record must persist and be resolvable via API').toBeTruthy();
      // Newest-first list — record shows on page 1 without searching
      await page.goto('/port');
      await expect(page.getByText(autoCode, { exact: true })).toBeVisible({ timeout: 15_000 });
    });

    await test.step('UPDATE via form', async () => {
      await page.goto(`/port/${id}/edit`);
      // Port code field is disabled in edit mode too
      const ten = page.getByPlaceholder('VD: Cảng biển Hải Phòng');
      await ten.fill(tenCangEdited);
      await page.getByRole('button', { name: 'Cập nhật' }).click();
      // Verify name changed via API
      await expect.poll(async () => {
        const r = await request.get(`${BE}/api/v1/ports/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        const b = await r.json();
        return (b.data ?? b).portName;
      }, { timeout: 15_000 }).toBe(tenCangEdited);
    });

    await test.step('DELETE via confirm page', async () => {
      await page.goto(`/port/${id}/delete`);
      await page.getByRole('checkbox').check();
      await page.getByRole('button', { name: 'Xóa', exact: true }).click();
      await page.waitForURL(/\/port$/, { timeout: 15_000 });
      // Verify gone via API (soft-delete removes from list query)
      await expect.poll(async () => await findIdByCode(request, token, autoCode), { timeout: 15_000 }).toBeNull();
      id = null; // deleted, no cleanup needed
    });
  } finally {
    if (id) await apiDelete(request, token, '/api/v1/ports', id);
  }
});
