/**
 * M-004 — Trạm thông tin (CoastalStation / Inmarsat) CRUD E2E.
 * API-level create → read → update → delete for both entities.
 * Self-cleaning: each CRUD chain deletes its record; finally blocks as safety net.
 * UI smoke: /station/coastal and /station/special routes are visible to admin.
 */
import { test, expect } from '@playwright/test';
import {
  loginAdmin,
  adminToken,
  createCoastalStation,
  createInmarsatStation,
  apiDelete,
  uid,
  BE,
} from './m004-helpers';

/* ------------------------------------------------------------------ */
/*  CoastalStation (VTS) — full CRUD via API                           */
/* ------------------------------------------------------------------ */
test.describe.serial('M-004 CoastalStation API CRUD', () => {
  let id: string | null = null;
  let token: string;
  const tag = uid('DDH');
  const stationCode = `E2E-DDH-${tag}`;
  const updatedName = `E2E Đài duyên hải ${tag} (đã sửa)`;

  test.beforeAll(async ({ request }) => {
    token = await adminToken(request);
  });

  test('CREATE via API', async ({ request }) => {
    id = await createCoastalStation(request, token, tag);
    expect(id).toBeTruthy();
  });

  test('READ detail via API', async ({ request }) => {
    expect(id).toBeTruthy();
    const res = await request.get(`${BE}/api/v1/stations/coastal/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const data = body.data ?? body;
    expect(data.stationCode).toBe(stationCode);
    // Initial status from 2-level approval workflow is PENDING_APPROVAL
    expect(data.status).toBe('PENDING_APPROVAL');
  });

  test('UPDATE via API', async ({ request }) => {
    expect(id).toBeTruthy();
    const res = await request.put(`${BE}/api/v1/stations/coastal/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        stationCode,
        stationName: updatedName,
        latitude: 20.85,
        longitude: 106.68,
        frequencyBand: 'MF/HF',
        transmitPower: 100,
        equipmentType: 'MF/HF Transceiver',
        locationAddress: `E2E Địa chỉ ${tag} (đã sửa)`,
        contactPerson: `E2E Người liên hệ ${tag} (đã sửa)`,
        contactPhone: '0900000002',
        status: 'ACTIVE',
      },
    });
    expect(res.ok(), `update failed: ${res.status()} ${await res.text()}`).toBeTruthy();
    // Verify
    const get = await request.get(`${BE}/api/v1/stations/coastal/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await get.json();
    expect((body.data ?? body).stationName).toBe(updatedName);
    expect((body.data ?? body).frequencyBand).toBe('MF/HF');
  });

  test('DELETE via API', async ({ request }) => {
    expect(id).toBeTruthy();
    const del = await request.delete(`${BE}/api/v1/stations/coastal/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(del.ok(), `delete failed: ${del.status()} ${await del.text()}`).toBeTruthy();
    // Verify gone
    const get = await request.get(`${BE}/api/v1/stations/coastal/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(get.status()).toBe(404);
    id = null;
  });

  test.afterAll(async ({ request }) => {
    if (id) await apiDelete(request, token, '/api/v1/stations/coastal', id);
  });
});

/* ------------------------------------------------------------------ */
/*  Inmarsat — full CRUD via API                                       */
/* ------------------------------------------------------------------ */
test.describe.serial('M-004 Inmarsat Station API CRUD', () => {
  let id: string | null = null;
  let token: string;
  const tag = uid('IM');
  const deviceCode = `E2E-IM-${tag}`;
  const updatedName = `E2E Đài Inmarsat ${tag} (đã sửa)`;

  test.beforeAll(async ({ request }) => {
    token = await adminToken(request);
  });

  test('CREATE via API', async ({ request }) => {
    id = await createInmarsatStation(request, token, tag);
    expect(id).toBeTruthy();
  });

  test('READ detail via API', async ({ request }) => {
    expect(id).toBeTruthy();
    const res = await request.get(`${BE}/api/v1/stations/inmarsat/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const data = body.data ?? body;
    expect(data.deviceCode).toBe(deviceCode);
    // Initial status from 2-level approval workflow is PENDING_APPROVAL
    expect(data.status).toBe('PENDING_APPROVAL');
    expect(data.stationName).toContain(tag);
  });

  test('UPDATE via API', async ({ request }) => {
    expect(id).toBeTruthy();
    const res = await request.put(`${BE}/api/v1/stations/inmarsat/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        deviceCode,
        stationName: updatedName,
        latitude: 20.86,
        longitude: 106.69,
        modemType: 'FleetBroadband',
        frequency: '1.5 GHz',
        coverageZone: 'AOR-E',
        sarCode: '445701111',
        locationAddress: `E2E Địa chỉ ${tag} (đã sửa)`,
        contactPerson: `E2E Người phụ trách ${tag} (đã sửa)`,
        contactPhone: '0900000003',
        status: 'ACTIVE',
      },
    });
    expect(res.ok(), `update failed: ${res.status()} ${await res.text()}`).toBeTruthy();
    // Verify
    const get = await request.get(`${BE}/api/v1/stations/inmarsat/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await get.json();
    expect((body.data ?? body).stationName).toBe(updatedName);
    expect((body.data ?? body).modemType).toBe('FleetBroadband');
  });

  test('DELETE via API', async ({ request }) => {
    expect(id).toBeTruthy();
    const del = await request.delete(`${BE}/api/v1/stations/inmarsat/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(del.ok(), `delete failed: ${del.status()} ${await del.text()}`).toBeTruthy();
    // Verify gone
    const get = await request.get(`${BE}/api/v1/stations/inmarsat/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(get.status()).toBe(404);
    id = null;
  });

  test.afterAll(async ({ request }) => {
    if (id) await apiDelete(request, token, '/api/v1/stations/inmarsat', id);
  });
});

/* ------------------------------------------------------------------ */
/*  UI smoke — routes are accessible to admin                          */
/* ------------------------------------------------------------------ */
test.describe('M-004 Station UI smoke', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test('/station/coastal route accessible (no permission wall)', async ({ page }) => {
    await page.goto('/station/coastal');
    await expect(page.getByText('Không có quyền truy cập')).toHaveCount(0);
    await expect(
      page.getByText('Danh sách đài duyên hải và hệ thống thông tin VTS'),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('/station/inmarsat route accessible (no permission wall)', async ({ page }) => {
    await page.goto('/station/inmarsat');
    await expect(page.getByText('Không có quyền truy cập')).toHaveCount(0);
    await expect(
      page.getByText('Quản lý trạm thông tin vệ tinh Inmarsat'),
    ).toBeVisible({ timeout: 15_000 });
  });
});
