import { type Page, type APIRequestContext, expect } from '@playwright/test';

export const BE = 'http://localhost:8080';

/** Log in as admin through the UI; resolves once redirected away from /login. */
export async function loginAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin');
  await page.getByLabel('Mật khẩu').fill('admin123');
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20_000 });
}

/** Get an admin JWT via the API (for fixture setup/cleanup, not the thing under test). */
export async function adminToken(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${BE}/api/auth/login`, {
    data: { username: 'admin', password: 'admin123' },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return body.data.token;
}

/** Create a NhaTramDen via API, return its id. */
export async function createNhaTramDen(
  request: APIRequestContext,
  token: string,
  tag: string,
): Promise<string> {
  const res = await request.post(`${BE}/api/v1/nhatram/den`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      code: `E2E-DEN-${tag}`,
      name: `E2E Đèn biển ${tag}`,
      type: 'LIGHTHOUSE',
      latitude: 20.8523,
      longitude: 106.6821,
      lightRange: 15.5,
      lightColor: 'Trắng',
      lightCharacteristic: 'Chớp đơn chu kỳ 5 giây',
      range: 20.0,
      description: `E2E test nhà trạm đèn ${tag}`,
      unitId: '00000000-0000-0000-0000-000000000000',
      lastMaintenanceDate: '2025-01-01',
      nextMaintenanceDate: '2026-01-01',
      isActive: true,
      status: 'DRAFT',
    },
  });
  expect(res.ok(), `create nhatram-den failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  const body = await res.json();
  return (body.data ?? body).id;
}

/** Create a NhaTramPhao via API, return its id. */
export async function createNhaTramPhao(
  request: APIRequestContext,
  token: string,
  tag: string,
): Promise<string> {
  const res = await request.post(`${BE}/api/v1/nhatram/phao`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      code: `E2E-PHAO-${tag}`,
      name: `E2E Phao tiêu ${tag}`,
      type: 'CARDINAL',
      latitude: 20.8415,
      longitude: 106.6912,
      color: 'Đỏ - Trắng',
      shape: 'Hình trụ tròn',
      lightCharacteristic: 'Chớp đơn chu kỳ 4 giây',
      range: 10.0,
      description: `E2E test phao tiêu ${tag}`,
      unitId: '00000000-0000-0000-0000-000000000000',
      lastInspectionDate: '2025-06-01',
      nextInspectionDate: '2026-06-01',
      isActive: true,
      status: 'DRAFT',
    },
  });
  expect(res.ok(), `create nhatram-phao failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  const body = await res.json();
  return (body.data ?? body).id;
}

/** Create a CoastalStation (VTS) via API, return its id. */
export async function createCoastalStation(
  request: APIRequestContext,
  token: string,
  tag: string,
): Promise<string> {
  const res = await request.post(`${BE}/api/v1/stations/coastal`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      stationCode: `E2E-DDH-${tag}`,
      stationName: `E2E Đài duyên hải ${tag}`,
      latitude: 20.8415,
      longitude: 106.6912,
      frequencyBand: 'VHF',
      transmitPower: 50,
      equipmentType: 'VHF Transceiver',
      locationAddress: `E2E Địa chỉ ${tag}`,
      contactPerson: `E2E Người liên hệ ${tag}`,
      contactPhone: '0900000000',
      status: 'PENDING_APPROVAL',
    },
  });
  expect(res.ok(), `create coastal station failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  const body = await res.json();
  return (body.data ?? body).id;
}

/** Create an Inmarsat station via API, return its id. */
export async function createInmarsatStation(
  request: APIRequestContext,
  token: string,
  tag: string,
): Promise<string> {
  const res = await request.post(`${BE}/api/v1/stations/inmarsat`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      deviceCode: `E2E-IM-${tag}`,
      stationName: `E2E Đài Inmarsat ${tag}`,
      latitude: 20.8415,
      longitude: 106.6912,
      modemType: 'Inmarsat-C',
      frequency: '1.6 GHz',
      coverageZone: 'IOR',
      sarCode: '445701110',
      locationAddress: `E2E Địa chỉ ${tag}`,
      contactPerson: `E2E Người phụ trách ${tag}`,
      contactPhone: '0900000001',
      status: 'PENDING_APPROVAL',
    },
  });
  expect(res.ok(), `create inmarsat station failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  const body = await res.json();
  return (body.data ?? body).id;
}

/** Hard-cleanup any leftover E2E record via API by entity path + id. */
export async function apiDelete(request: APIRequestContext, token: string, path: string, id: string) {
  try {
    await request.delete(`${BE}${path}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  } catch { /* best-effort cleanup; ignore (e.g. context closed on timeout) */ }
}

const TS = Date.now().toString().slice(-6);
/** Unique-ish suffix so repeated runs don't collide on unique codes. */
export function uid(prefix: string) {
  return `${prefix}-${TS}-${Math.floor(Math.random() * 1000)}`;
}
