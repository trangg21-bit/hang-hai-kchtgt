import { type Page, type APIRequestContext, expect } from '@playwright/test';

export const BE = 'http://localhost:8080';

/** Log in as admin through the UI; resolves once redirected away from /login. */
export async function loginAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Tài khoản').fill('admin');
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

/** Create a parent CangBien via API, return its id. Used as fixture for child entities. */
export async function createParentCangBien(request: APIRequestContext, token: string, tag: string): Promise<string> {
  const res = await request.post(`${BE}/api/v1/cang-bien`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      maCang: `E2E-${tag}-PARENT`,
      tenCang: `E2E ${tag} parent port`,
      dienTich: 1000,
      trangThaiHoatDong: 'HIEN_HANH',
    },
  });
  expect(res.ok(), `create parent cang-bien failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  const body = await res.json();
  return (body.data ?? body).id;
}

/** Create a parent BenCang via API (needs a CangBien parent), return its id. */
export async function createParentBenCang(request: APIRequestContext, token: string, cangBienId: string, tag: string): Promise<string> {
  const res = await request.post(`${BE}/api/v1/ben-cang`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { maBen: `E2E-${tag}-BC`, tenBen: `E2E ${tag} ben`, cangBienId, trangThaiHoatDong: 'HIEN_HANH' },
  });
  expect(res.ok(), `create parent ben-cang failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  const body = await res.json();
  return (body.data ?? body).id;
}

/** Find an entity id by its "ma" code via the list API. */
export async function findIdByMaField(request: APIRequestContext, token: string, apiPath: string, maField: string, ma: string): Promise<string | null> {
  const res = await request.get(`${BE}${apiPath}?size=100`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json();
  const items = (body.data ?? body).content ?? [];
  return items.find((x: any) => x[maField] === ma)?.id ?? null;
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
