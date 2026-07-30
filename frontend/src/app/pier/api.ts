import api from '../../services/api';
import type {
  Pier,
  CauCangListQuery,
  CauCangCreateRequest,
  CauCangUpdateRequest,
  pierHistoryRecord,
  BenCangOption,
  PortOption,
  NavigationChannelOption,
} from './types';

const BASE = '/v1/piers';

// ── List ───────────────────────────────────────────────────────────────────
export async function fetchCauCangList(query: CauCangListQuery) {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.status) params.set('status', query.status);
  if (query.approvalStatus) params.set('approvalStatus', query.approvalStatus);
  if (query.berthId) params.set('berthId', query.berthId);
  if (query.orgUnitId) params.set('orgUnitId', query.orgUnitId);
  if (query.loaiCau) params.set('loaiCau', query.loaiCau);
  if (query.province) params.set('province', query.province);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortOrder) params.set('sortOrder', query.sortOrder);
  params.set('page', String(query.page));
  params.set('size', String(query.pageSize));

  const { data } = await api.get(`${BASE}`, { params });
  const pageData = data.data;
  return {
    content: pageData.content || [],
    totalElements: pageData.totalElements || 0,
    page: pageData.number || 0,
    pageSize: pageData.size || 20,
  };
}

// ── Get by ID ──────────────────────────────────────────────────────────────
export async function fetchCauCangById(id: string) {
  const { data } = await api.get(`${BASE}/${id}`);
  return data.data as Pier;
}

// ── Get by Code ────────────────────────────────────────────────────────────
export async function fetchCauCangByCode(pierCode: string) {
  const { data } = await api.get(`${BASE}/code/${pierCode}`);
  return data.data as Pier;
}

// ── Create ─────────────────────────────────────────────────────────────────
export async function createCauCang(payload: CauCangCreateRequest, action?: string) {
  const { data } = await api.post(BASE, payload, {
    params: action ? { action } : undefined,
  });
  return data.data as Pier;
}

// ── Update ─────────────────────────────────────────────────────────────────
export async function updateCauCang(payload: CauCangUpdateRequest) {
  const { data } = await api.put(BASE, payload);
  return data.data as Pier;
}

// ── Delete (soft) ──────────────────────────────────────────────────────────
export async function deleteCauCang(id: string) {
  await api.delete(`${BASE}/${id}`);
}

// ── Approve ────────────────────────────────────────────────────────────────
export async function approveCauCang(id: string) {
  const { data } = await api.post(`${BASE}/${id}/approve`);
  return data.data as Pier;
}

// ── Reject ─────────────────────────────────────────────────────────────────
export async function rejectCauCang(id: string, reason: string) {
  const { data } = await api.post(`${BASE}/${id}/reject`, null, {
    params: { reason },
  });
  return data.data as Pier;
}

// ── History ────────────────────────────────────────────────────────────────
export async function fetchpierHistory(id: string) {
  const { data } = await api.get(`${BASE}/${id}/history`);
  return data.data as pierHistoryRecord[];
}

// ── Berth options (for select dropdown) ──────────────────────────────────
export async function fetchBenCangOptions(params?: { search?: string; size?: number; portId?: string }) {
  const { data } = await api.get('/v1/berths', {
    params: {
      size: params?.size ?? 100,
      search: params?.search,
      portId: params?.portId,
      sortBy: 'berthName',
      sortOrder: 'asc',
      operationalStatus: 'OPERATIONAL'
    },
  });
  return data.data as { content: BenCangOption[] };
}

export async function fetchBenCangById(id: string) {
  const { data } = await api.get(`/v1/berths/${id}`);
  return data.data as { id: string; berthName: string };
}

// ── Port options (for select dropdown) ───────────────────────────────────
export async function fetchCangBienOptions(params?: { search?: string; size?: number }) {
  const { data } = await api.get('/v1/ports', {
    params: {
      size: params?.size ?? 100,
      portName: params?.search || undefined,
      operationalStatus: 'OPERATIONAL',
      approvalStatus: 'APPROVED',
    },
  });
  const pageData = data.data;
  return { content: (pageData.content || []) as PortOption[] };
}

// ── Navigation Channel options (for select dropdown) ─────────────────────
export async function fetchNavigationChannelOptions(params?: { search?: string; size?: number; portId?: string }) {
  const { data } = await api.get('/v1/navigation-channel', {
    params: { size: params?.size ?? 100 }
  });
  return { content: (data.data || []) as NavigationChannelOption[] };
}
