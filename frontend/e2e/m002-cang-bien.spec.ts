/**
 * M-002 F-008..F-013 — Cảng biển (CangBien) deep CRUD E2E.
 * Real create → read → update → delete through the UI against the live backend.
 * Self-cleaning: the delete step removes the record; a finally block is the safety net.
 */
import { test, expect, type APIRequestContext } from '@playwright/test';
import { loginAdmin, adminToken, apiDelete, uid, BE } from './m002-helpers';

const LIST = '/cangbien';

async function findIdByMa(request: APIRequestContext, token: string, maCang: string): Promise<string | null> {
  const res = await request.get(`${BE}/api/v1/cang-bien?search=${encodeURIComponent(maCang)}&size=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  const items = (body.data ?? body).content ?? [];
  const hit = items.find((x: any) => x.maCang === maCang);
  return hit?.id ?? null;
}

test('M-002 Cảng biển: full CRUD (create → list → detail → edit → delete)', async ({ page, request }) => {
  const token = await adminToken(request);
  const maCang = uid('E2E-CB');
  const tenCang = `E2E Cảng biển ${maCang}`;
  const tenCangEdited = `${tenCang} (đã sửa)`;
  let id: string | null = null;

  try {
    await test.step('login', async () => {
      await loginAdmin(page);
    });

    await test.step('CREATE via form', async () => {
      await page.goto('/cangbien/create');
      await page.getByPlaceholder('VD: CB-HAIPHONG-001').fill(maCang);
      await page.getByPlaceholder('VD: Cảng biển Hải Phòng').fill(tenCang);
      await page.getByPlaceholder('VD: 100.00').fill('250.5');
      await page.getByRole('button', { name: 'Tạo cảng biển' }).click();
      await page.waitForURL(/\/cangbien$/, { timeout: 15_000 });
    });

    await test.step('READ in list', async () => {
      id = await findIdByMa(request, token, maCang);
      expect(id, 'created record must persist and be resolvable via API').toBeTruthy();
      // newest-first list → record shows on page 1 without searching
      await expect(page.getByText(maCang, { exact: true })).toBeVisible({ timeout: 15_000 });
    });

    await test.step('READ detail', async () => {
      await page.goto(`/cangbien/${id}`);
      await expect(page.getByText(maCang).first()).toBeVisible();
      await expect(page.getByText(tenCang).first()).toBeVisible();
    });

    await test.step('UPDATE via form', async () => {
      await page.goto(`/cangbien/${id}/edit`);
      const ten = page.getByPlaceholder('VD: Cảng biển Hải Phòng');
      await ten.fill(tenCangEdited);
      await page.getByRole('button', { name: 'Cập nhật' }).click();
      await expect.poll(async () => {
        const r = await request.get(`${BE}/api/v1/cang-bien/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        const b = await r.json();
        return (b.data ?? b).tenCang;
      }, { timeout: 15_000 }).toBe(tenCangEdited);
    });

    await test.step('DELETE via confirm page', async () => {
      await page.goto(`/cangbien/${id}/delete`);
      await page.getByRole('checkbox').check();
      await page.getByRole('button', { name: 'Xóa', exact: true }).click();
      await page.waitForURL(/\/cangbien$/, { timeout: 15_000 });
      // verify gone via API (soft-delete removes it from the list query)
      await expect.poll(async () => await findIdByMa(request, token, maCang), { timeout: 15_000 }).toBeNull();
      id = null; // deleted, no cleanup needed
    });
  } finally {
    if (id) await apiDelete(request, token, '/api/v1/cang-bien', id);
  }
});
