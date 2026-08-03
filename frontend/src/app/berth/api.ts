// ============================================================
// Berth — API layer (uses shared axios `api` instance)
// ============================================================

import api from '../../services/api';

const BASE = "/v1/berths";

function buildSearchParams(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  return sp;
}

// ----------------------------------------------------------------
// CRUD
// ----------------------------------------------------------------

export async function generateCode(): Promise<string> {
  const res = await api.get(`${BASE}/generate-code`);
  return res.data.data?.code || res.data.data || '';
}

export async function fetchBenCangList(params: {
  page?: number;
  size?: number;
  search?: string;
  berthCode?: string;
  berthName?: string;
  portName?: string;
  portStatus?: string;
  portId?: string;
  orgUnitId?: string;
  sortBy?: string;
  sortOrder?: string;
}) {
  const sp = buildSearchParams({
    page: params.page !== undefined ? String(params.page) : undefined,
    size: params.size !== undefined ? String(params.size) : undefined,
    search: params.search,
    berthCode: params.berthCode,
    berthName: params.berthName,
    portName: params.portName,
    portStatus: params.portStatus,
    portId: params.portId,
    orgUnitId: params.orgUnitId,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });
  const res = await api.get(`${BASE}?${sp.toString()}`);
  const pageData = res.data.data;
  return {
    content: pageData.content || [],
    totalElements: pageData.totalElements ?? 0,
    totalPages: pageData.totalPages ?? 0,
    number: pageData.number ?? 0,
    size: pageData.size ?? 20,
    first: pageData.first ?? false,
    last: pageData.last ?? false,
  };
}

export async function fetchBenCangById(id: string) {
  const res = await api.get(`${BASE}/${id}`);
  return res.data.data;
}

export async function fetchChildren(id: string): Promise<{ piers: number }> {
  const res = await api.get(`${BASE}/${id}/children`);
  return res.data.data || { piers: 0 };
}

export async function createBenCang(payload: Record<string, unknown>) {
  const res = await api.post(BASE, payload);
  return res.data.data;
}

export async function updateBenCang(payload: Record<string, unknown>) {
  const res = await api.put(BASE, payload);
  return res.data.data;
}

export async function deleteBenCang(id: string) {
  const res = await api.delete(`${BASE}/${id}`);
  return res.data.data;
}

// ----------------------------------------------------------------
// Approval (2-level with cap)
// ----------------------------------------------------------------

export async function approveBenCang(id: string, cap: string) {
  const res = await api.post(`${BASE}/${id}/approve`, { cap });
  return res.data.data;
}

export async function rejectBenCang(id: string, cap: string, lyDo: string) {
  const res = await api.post(`${BASE}/${id}/reject`, { cap, lyDo });
  return res.data.data;
}

// ----------------------------------------------------------------
// Children
// ----------------------------------------------------------------

export async function fetchBerthChildren(id: string): Promise<{ cauCangCount: number }> {
  const res = await api.get(`${BASE}/${id}/children`);
  return res.data.data;
}

// ----------------------------------------------------------------
// History
// ----------------------------------------------------------------

export async function fetchBerthHistory(id: string, params?: { page?: number; size?: number }) {
  const sp = buildSearchParams({
    page: params?.page !== undefined ? String(params.page) : undefined,
    size: params?.size !== undefined ? String(params.size) : undefined,
  });
  const res = await api.get(`${BASE}/${id}/history?${sp.toString()}`);
  return res.data.data;
}
