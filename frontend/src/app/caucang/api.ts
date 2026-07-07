import api from '../../services/api';
import type {
  CauCang,
  CauCangListQuery,
  CauCangCreateRequest,
  CauCangUpdateRequest,
  CauCangHistoryRecord,
  BenCangOption,
} from './types';

const BASE = '/v1/cau-cang';

// ── List ───────────────────────────────────────────────────────────────────
export async function fetchCauCangList(query: CauCangListQuery) {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.status) params.set('status', query.status);
  if (query.approvalStatus) params.set('approvalStatus', query.approvalStatus);
  if (query.benCangId) params.set('benCangId', query.benCangId);
  if (query.orgUnitId) params.set('orgUnitId', query.orgUnitId);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortOrder) params.set('sortOrder', query.sortOrder);
  params.set('page', String(query.page));
  params.set('pageSize', String(query.pageSize));

  const res = await api.get(`${BASE}`, { params });
  return res.data.data as { content: CauCang[]; totalElements: number; page: number; pageSize: number };
}

// ── Get by ID ──────────────────────────────────────────────────────────────
export async function fetchCauCangById(id: string) {
  const res = await api.get(`${BASE}/${id}`);
  return res.data.data as CauCang;
}

// ── Get by Code ────────────────────────────────────────────────────────────
export async function fetchCauCangByCode(maCau: string) {
  const res = await api.get(`${BASE}/code/${maCau}`);
  return res.data.data as CauCang;
}

// ── Create ─────────────────────────────────────────────────────────────────
export async function createCauCang(payload: CauCangCreateRequest) {
  const res = await api.post(BASE, payload);
  return res.data.data as CauCang;
}

// ── Update ─────────────────────────────────────────────────────────────────
export async function updateCauCang(payload: CauCangUpdateRequest) {
  const res = await api.put(BASE, payload);
  return res.data.data as CauCang;
}

// ── Delete (soft) ──────────────────────────────────────────────────────────
export async function deleteCauCang(id: string) {
  await api.delete(`${BASE}/${id}`);
}

// ── Approve ────────────────────────────────────────────────────────────────
export async function approveCauCang(id: string) {
  const res = await api.post(`${BASE}/${id}/approve`);
  return res.data.data as CauCang;
}

// ── Reject ─────────────────────────────────────────────────────────────────
export async function rejectCauCang(id: string, reason: string) {
  const res = await api.post(`${BASE}/${id}/reject`, null, {
    params: { reason },
  });
  return res.data.data as CauCang;
}

// ── History ────────────────────────────────────────────────────────────────
export async function fetchCauCangHistory(id: string) {
  const res = await api.get(`${BASE}/${id}/history`);
  return res.data.data as CauCangHistoryRecord[];
}

// ── BenCang options (for select dropdown) ──────────────────────────────────
export async function fetchBenCangOptions() {
  const res = await api.get('/v1/ben-cang', {
    params: { pageSize: 200, sortBy: 'tenBen', sortOrder: 'asc' },
  });
  return res.data.data as { content: BenCangOption[] };
}
