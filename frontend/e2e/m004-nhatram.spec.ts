/**
 * M-004 F-080..F-091 — Nhà trạm (NhaTramDen / NhaTramPhao) CRUD E2E.
 * API-level create → read → update → delete for both entities.
 * Self-cleaning: each CRUD chain deletes its record; finally blocks as safety net.
 * UI smoke: /nhatram/den and /nhatram/phao routes are visible to admin.
 */
import { test, expect } from '@playwright/test';
import {
  loginAdmin,
  adminToken,
  createNhaTramDen,
  createNhaTramPhao,
  apiDelete,
  uid,
  BE,
} from './m004-helpers';

/* ------------------------------------------------------------------ */
/*  NhaTramDen — full CRUD via API                                     */
/* ------------------------------------------------------------------ */
test.describe.serial('M-004 NhaTramDen API CRUD', () => {
  let id: string | null = null;
  let token: string;
  const tag = uid('DEN');
  const code = `E2E-DEN-${tag}`;
  const updatedName = `E2E Đèn biển ${tag} (đã sửa)`;

  test.beforeAll(async ({ request }) => {
    token = await adminToken(request);
  });

  test('CREATE via API', async ({ request }) => {
    id = await createNhaTramDen(request, token, tag);
    expect(id).toBeTruthy();
  });

  test('READ detail via API', async ({ request }) => {
    expect(id).toBeTruthy();
    const res = await request.get(`${BE}/api/v1/nhatram/den/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const data = body.data ?? body;
    expect(data.code).toBe(code);
    expect(data.type).toBe('LIGHTHOUSE');
  });

  test('UPDATE via API', async ({ request }) => {
    expect(id).toBeTruthy();
    const res = await request.put(`${BE}/api/v1/nhatram/den/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        code,
        name: updatedName,
        type: 'BEACON_LIGHT',
        latitude: 20.86,
        longitude: 106.69,
        lightRange: 12.0,
        lightColor: 'Đỏ',
        lightCharacteristic: 'Chớp nhóm 3 chu kỳ 10 giây',
        range: 18.0,
        description: 'E2E update test',
        unitId: '00000000-0000-0000-0000-000000000000',
        lastMaintenanceDate: '2025-06-01',
        nextMaintenanceDate: '2026-06-01',
        isActive: true,
        status: 'ACTIVE',
      },
    });
    expect(res.ok(), `update failed: ${res.status()} ${await res.text()}`).toBeTruthy();
    // Verify
    const get = await request.get(`${BE}/api/v1/nhatram/den/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await get.json();
    expect((body.data ?? body).name).toBe(updatedName);
    expect((body.data ?? body).type).toBe('BEACON_LIGHT');
  });

  test('DELETE via API', async ({ request }) => {
    expect(id).toBeTruthy();
    const del = await request.delete(`${BE}/api/v1/nhatram/den/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(del.ok(), `delete failed: ${del.status()} ${await del.text()}`).toBeTruthy();
    // Verify gone
    const get = await request.get(`${BE}/api/v1/nhatram/den/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(get.status()).toBe(404);
    id = null; // deleted, no cleanup needed
  });

  test.afterAll(async ({ request }) => {
    if (id) await apiDelete(request, token, '/api/v1/nhatram/den', id);
  });
});

/* ------------------------------------------------------------------ */
/*  NhaTramPhao — full CRUD via API                                    */
/* ------------------------------------------------------------------ */
test.describe.serial('M-004 NhaTramPhao API CRUD', () => {
  let id: string | null = null;
  let token: string;
  const tag = uid('PHAO');
  const code = `E2E-PHAO-${tag}`;
  const updatedName = `E2E Phao tiêu ${tag} (đã sửa)`;

  test.beforeAll(async ({ request }) => {
    token = await adminToken(request);
  });

  test('CREATE via API', async ({ request }) => {
    id = await createNhaTramPhao(request, token, tag);
    expect(id).toBeTruthy();
  });

  test('READ detail via API', async ({ request }) => {
    expect(id).toBeTruthy();
    const res = await request.get(`${BE}/api/v1/nhatram/phao/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const data = body.data ?? body;
    expect(data.code).toBe(code);
    expect(data.type).toBe('CARDINAL');
  });

  test('UPDATE via API', async ({ request }) => {
    expect(id).toBeTruthy();
    const res = await request.put(`${BE}/api/v1/nhatram/phao/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        code,
        name: updatedName,
        type: 'SPECIAL',
        latitude: 20.83,
        longitude: 106.70,
        color: 'Vàng',
        shape: 'Hình nón',
        lightCharacteristic: 'Chớp vàng chu kỳ 6 giây',
        range: 8.0,
        description: 'E2E update test phao',
        unitId: '00000000-0000-0000-0000-000000000000',
        lastInspectionDate: '2025-07-01',
        nextInspectionDate: '2026-07-01',
        isActive: true,
        status: 'ACTIVE',
      },
    });
    expect(res.ok(), `update failed: ${res.status()} ${await res.text()}`).toBeTruthy();
    // Verify
    const get = await request.get(`${BE}/api/v1/nhatram/phao/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await get.json();
    expect((body.data ?? body).name).toBe(updatedName);
    expect((body.data ?? body).type).toBe('SPECIAL');
  });

  test('DELETE via API', async ({ request }) => {
    expect(id).toBeTruthy();
    const del = await request.delete(`${BE}/api/v1/nhatram/phao/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(del.ok(), `delete failed: ${del.status()} ${await del.text()}`).toBeTruthy();
    // Verify gone
    const get = await request.get(`${BE}/api/v1/nhatram/phao/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(get.status()).toBe(404);
    id = null;
  });

  test.afterAll(async ({ request }) => {
    if (id) await apiDelete(request, token, '/api/v1/nhatram/phao', id);
  });
});

/* ------------------------------------------------------------------ */
/*  UI smoke — routes are accessible to admin                          */
/* ------------------------------------------------------------------ */
test.describe('M-004 NhaTram UI smoke', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test('/nhatram/den route accessible (no permission wall)', async ({ page }) => {
    await page.goto('/nhatram/den');
    await expect(page.getByText('Không có quyền truy cập')).toHaveCount(0);
    await expect(page.getByText('Danh sách nhà trạm đèn biển')).toBeVisible({ timeout: 15_000 });
  });

  test('/nhatram/phao route accessible (no permission wall)', async ({ page }) => {
    await page.goto('/nhatram/phao');
    await expect(page.getByText('Không có quyền truy cập')).toHaveCount(0);
    await expect(page.getByText('Danh sách nhà trạm phao tiêu hàng hải')).toBeVisible({ timeout: 15_000 });
  });
});
