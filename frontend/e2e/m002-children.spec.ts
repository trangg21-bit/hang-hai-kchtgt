/**
 * M-002 child entities — deep CRUD E2E through the UI against the live backend.
 * BenCang / CauCang / CangCan / VungNuoc. Self-cleaning (UI delete + finally safety net).
 */
import { test, expect, type Page } from '@playwright/test';
import {
  loginAdmin, adminToken, apiDelete, uid, BE,
  createParentCangBien, createParentBenCang, findIdByMaField,
} from './m002-helpers';

async function fillByPlaceholder(page: Page, ph: string, val: string) {
  await page.getByPlaceholder(ph).fill(val);
}

async function submitAndReturn(page: Page, btn: RegExp, listRe: RegExp) {
  await page.getByRole('button', { name: btn }).first().click();
  await page.waitForURL(listRe, { timeout: 15_000 });
}

async function uiDelete(page: Page, deletePath: string, listRe: RegExp) {
  await page.goto(deletePath);
  // tick any confirmation checkbox(es)
  const cbs = await page.getByRole('checkbox').all();
  for (const c of cbs) await c.check().catch(() => {});
  // click the destructive action (label contains "xóa", excluding Hủy/Quay lại)
  await page.getByRole('button', { name: /xóa/i })
    .filter({ hasNotText: /hủy|quay lại/i }).first().click();
  // two-step variant (BenCang): confirm inside the follow-up modal
  const modalConfirm = page.locator('.ant-modal').getByRole('button', { name: /^xóa$|xác nhận/i });
  if (await modalConfirm.count()) await modalConfirm.first().click().catch(() => {});
  await page.waitForURL(listRe, { timeout: 15_000 });
}

// ── BenCang (parent: CangBien via free-text cangBienId) ─────────────────────
test('M-002 Bến cảng: full CRUD', async ({ page, request }) => {
  const token = await adminToken(request);
  const parentId = await createParentCangBien(request, token, uid('BC'));
  const ma = uid('E2E-BC');
  let id: string | null = null;
  try {
    await loginAdmin(page);
    await page.goto('/bencang/create');
    await fillByPlaceholder(page, 'VD: BC-HAIPHONG-001', ma);
    await fillByPlaceholder(page, 'VD: Bến cảng Hải Phòng', `E2E ${ma}`);
    await fillByPlaceholder(page, 'Nhập ID cảng biển cha', parentId);
    await submitAndReturn(page, /tạo bến cảng/i, /\/bencang$/);

    id = await findIdByMaField(request, token, '/api/v1/ben-cang', 'maBen', ma);
    expect(id, 'ben-cang created').toBeTruthy();
    await expect(page.getByText(ma, { exact: true })).toBeVisible({ timeout: 15_000 });

    await page.goto(`/bencang/${id}`);
    await expect(page.getByText(ma).first()).toBeVisible();

    await page.goto(`/bencang/${id}/edit`);
    await page.getByPlaceholder('VD: Bến cảng Hải Phòng').fill(`E2E ${ma} sửa`);
    await page.getByRole('button', { name: /cập nhật|lưu/i }).first().click();
    await expect.poll(async () => {
      const r = await request.get(`${BE}/api/v1/ben-cang/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      return (await r.json()).data?.tenBen;
    }, { timeout: 15_000 }).toBe(`E2E ${ma} sửa`);

    await uiDelete(page, `/bencang/${id}/delete`, /\/bencang$/);
    await expect.poll(async () => await findIdByMaField(request, token, '/api/v1/ben-cang', 'maBen', ma), { timeout: 15_000 }).toBeNull();
    id = null;
  } finally {
    if (id) await apiDelete(request, token, '/api/v1/ben-cang', id);
    await apiDelete(request, token, '/api/v1/cang-bien', parentId);
  }
});

// ── CangCan (independent, no parent) ────────────────────────────────────────
test('M-002 Cảng cạn: full CRUD', async ({ page, request }) => {
  const token = await adminToken(request);
  const ma = uid('E2E-CC');
  let id: string | null = null;
  try {
    await loginAdmin(page);
    await page.goto('/cangcan/create');
    await fillByPlaceholder(page, 'VD: CC-HAIPHONG-001', ma);
    await fillByPlaceholder(page, 'VD: Cảng cạn Nội Bài', `E2E ${ma}`);
    await fillByPlaceholder(page, 'VD: 50000.00', '25000');
    await submitAndReturn(page, /tạo cảng cạn/i, /\/cangcan$/);

    id = await findIdByMaField(request, token, '/api/v1/cang-can', 'maCangCan', ma);
    expect(id, 'cang-can created').toBeTruthy();
    await expect(page.getByText(ma, { exact: true })).toBeVisible({ timeout: 15_000 });

    await page.goto(`/cangcan/${id}`);
    await expect(page.getByText(ma).first()).toBeVisible();

    await page.goto(`/cangcan/${id}/edit`);
    await page.getByPlaceholder('VD: Cảng cạn Nội Bài').fill(`E2E ${ma} sửa`);
    await page.getByRole('button', { name: /cập nhật|lưu/i }).first().click();
    await expect.poll(async () => {
      const r = await request.get(`${BE}/api/v1/cang-can/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      return (await r.json()).data?.tenCangCan;
    }, { timeout: 15_000 }).toBe(`E2E ${ma} sửa`);

    await uiDelete(page, `/cangcan/${id}/delete`, /\/cangcan$/);
    await expect.poll(async () => await findIdByMaField(request, token, '/api/v1/cang-can', 'maCangCan', ma), { timeout: 15_000 }).toBeNull();
    id = null;
  } finally {
    if (id) await apiDelete(request, token, '/api/v1/cang-can', id);
  }
});

// ── VungNuoc (parent: CangBien via free-text cangBienId) ────────────────────
test('M-002 Vùng nước: full CRUD', async ({ page, request }) => {
  const token = await adminToken(request);
  const parentId = await createParentCangBien(request, token, uid('VN'));
  const ma = uid('E2E-VN');
  let id: string | null = null;
  try {
    await loginAdmin(page);
    await page.goto('/vungnuoc/create');
    await fillByPlaceholder(page, 'VD: VN-HAIPHONG-001', ma);
    await fillByPlaceholder(page, 'VD: Vùng nước cảng Hải Phòng', `E2E ${ma}`);
    await fillByPlaceholder(page, 'Nhập UUID cảng biển', parentId);
    await submitAndReturn(page, /tạo vùng nước/i, /\/vungnuoc$/);

    id = await findIdByMaField(request, token, '/api/v1/vung-nuoc', 'maVungNuoc', ma);
    expect(id, 'vung-nuoc created').toBeTruthy();
    await expect(page.getByText(ma, { exact: true })).toBeVisible({ timeout: 15_000 });

    await page.goto(`/vungnuoc/${id}`);
    await expect(page.getByText(ma).first()).toBeVisible();

    await page.goto(`/vungnuoc/${id}/edit`);
    const tenVn = page.getByPlaceholder('VD: Vùng nước cảng Hải Phòng');
    await expect(tenVn).toHaveValue(`E2E ${ma}`); // wait for form to load before editing
    await tenVn.fill(`E2E ${ma} sửa`);
    await page.getByRole('button', { name: /cập nhật|lưu/i }).first().click();
    await expect.poll(async () => {
      const r = await request.get(`${BE}/api/v1/vung-nuoc/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      return (await r.json()).data?.tenVungNuoc;
    }, { timeout: 15_000 }).toBe(`E2E ${ma} sửa`);

    await uiDelete(page, `/vungnuoc/${id}/delete`, /\/vungnuoc$/);
    await expect.poll(async () => await findIdByMaField(request, token, '/api/v1/vung-nuoc', 'maVungNuoc', ma), { timeout: 15_000 }).toBeNull();
    id = null;
  } finally {
    if (id) await apiDelete(request, token, '/api/v1/vung-nuoc', id);
    await apiDelete(request, token, '/api/v1/cang-bien', parentId);
  }
});

// ── CauCang (parent: BenCang via antd Select) ───────────────────────────────
test('M-002 Cầu cảng: full CRUD', async ({ page, request }) => {
  const token = await adminToken(request);
  // remove leftover E2E ben-cang so the benCangId dropdown holds only our parent (avoids virtual-scroll offscreen)
  const existing = await request.get(`${BE}/api/v1/ben-cang?size=200`, { headers: { Authorization: `Bearer ${token}` } });
  for (const it of ((await existing.json()).data?.content ?? [])) {
    if (String(it.maBen).includes('E2E')) await apiDelete(request, token, '/api/v1/ben-cang', it.id);
  }
  const cangBienId = await createParentCangBien(request, token, uid('CT'));
  const benCangId = await createParentBenCang(request, token, cangBienId, uid('CT'));
  const ma = uid('E2E-CT');
  let id: string | null = null;
  try {
    await loginAdmin(page);
    await page.goto('/caucang/create');
    await fillByPlaceholder(page, 'VD: CC-HAIPHONG-001', ma);
    await fillByPlaceholder(page, 'VD: Cầu cảng số 1', `E2E ${ma}`);
    // antd Select for benCangId (first select on the form): open + pick our parent by id
    await page.locator('.ant-select').first().click();
    await page.getByRole('option').first().waitFor({ state: 'attached' });
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await submitAndReturn(page, /tạo cầu cảng/i, /\/caucang$/);

    id = await findIdByMaField(request, token, '/api/v1/cau-cang', 'maCau', ma);
    expect(id, 'cau-cang created').toBeTruthy();
    await expect(page.getByText(ma, { exact: true })).toBeVisible({ timeout: 15_000 });

    await page.goto(`/caucang/${id}`);
    await expect(page.getByText(ma).first()).toBeVisible();

    await page.goto(`/caucang/${id}/edit`);
    const tenCt = page.getByPlaceholder('VD: Cầu cảng số 1');
    await expect(tenCt).toHaveValue(`E2E ${ma}`); // wait for form to load before editing
    await tenCt.fill(`E2E ${ma} sửa`);
    await page.getByRole('button', { name: /cập nhật|lưu/i }).first().click();
    await expect.poll(async () => {
      const r = await request.get(`${BE}/api/v1/cau-cang/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      return (await r.json()).data?.tenCau;
    }, { timeout: 15_000 }).toBe(`E2E ${ma} sửa`);

    await uiDelete(page, `/caucang/${id}/delete`, /\/caucang$/);
    await expect.poll(async () => await findIdByMaField(request, token, '/api/v1/cau-cang', 'maCau', ma), { timeout: 15_000 }).toBeNull();
    id = null;
  } finally {
    if (id) await apiDelete(request, token, '/api/v1/cau-cang', id);
    await apiDelete(request, token, '/api/v1/ben-cang', benCangId);
    await apiDelete(request, token, '/api/v1/cang-bien', cangBienId);
  }
});
