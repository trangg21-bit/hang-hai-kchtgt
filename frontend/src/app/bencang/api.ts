// ============================================================
// BenCang — API layer (uses shared axios `api` instance)
// ============================================================

import api from '../../services/api';

const BASE = "/api/v1/ben-cang";

// ----------------------------------------------------------------
// CRUD
// ----------------------------------------------------------------

export async function fetchBenCangList(params: {
  page?: number;
  size?: number;
  orgUnitId?: string;
}) {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set("page", String(params.page));
  if (params.size !== undefined) sp.set("size", String(params.size));
  if (params.orgUnitId) sp.set("orgUnitId", params.orgUnitId);
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
// Approval
// ----------------------------------------------------------------

export async function approveBenCang(id: string) {
  const res = await api.post(`${BASE}/${id}/approve`);
  return res.data.data;
}

export async function rejectBenCang(id: string, reason: string) {
  const res = await api.post(`${BASE}/${id}/reject`, null, { params: { reason } });
  return res.data.data;
}

// ----------------------------------------------------------------
// History
// ----------------------------------------------------------------

export async function fetchBenCangHistory(id: string) {
  const res = await api.get(`${BASE}/${id}/history`);
  return res.data.data;
}
