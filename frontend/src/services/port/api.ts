import api from '../api';
import type {
  CangBienResponse,
  CreateCangBienRequest,
  UpdateCangBienRequest,
  PageResponse,
  ApprovalResult,
} from './types';

// ── Helpers ─────────────────────────────────────────────────────────

const BASE = '/v1/ports';

// ── CRUD ────────────────────────────────────────────────────────────

export async function fetchCangBienList(params: {
  page?: number;
  size?: number;
  orgUnitId?: string;
  search?: string;
  portCode?: string;
  portName?: string;
  province?: string;
  operationalStatus?: string;
  approvalStatus?: string;
  portGroup?: number;
  portClass?: number;
  updatedFrom?: string;
  updatedTo?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<PageResponse<CangBienResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.orgUnitId) sp.set('orgUnitId', params.orgUnitId);
  if (params.search) sp.set('search', params.search);
  if (params.portCode) sp.set('portCode', params.portCode);
  if (params.portName) sp.set('portName', params.portName);
  if (params.province) sp.set('province', params.province);
  if (params.operationalStatus) sp.set('operationalStatus', params.operationalStatus);
  if (params.approvalStatus) sp.set('approvalStatus', params.approvalStatus);
  if (params.portGroup !== undefined) sp.set('portGroup', String(params.portGroup));
  if (params.portClass !== undefined) sp.set('portClass', String(params.portClass));
  if (params.updatedFrom) sp.set('updatedFrom', params.updatedFrom);
  if (params.updatedTo) sp.set('updatedTo', params.updatedTo);
  if (params.sortBy) sp.set('sort', `${params.sortBy},${params.sortOrder ?? 'desc'}`);

  const res = await api.get(`${BASE}?${sp}`);
  return res.data.data;
}

export async function fetchCangBienById(id: string): Promise<CangBienResponse> {
  const res = await api.get(`${BASE}/${id}`);
  return res.data.data;
}

export async function createCangBien(payload: CreateCangBienRequest): Promise<CangBienResponse> {
  const res = await api.post(BASE, payload);
  return res.data.data;
}

export async function updateCangBien(payload: UpdateCangBienRequest): Promise<CangBienResponse> {
  const res = await api.put(BASE, payload);
  return res.data.data;
}

export async function deleteCangBien(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}

// ── Approval ────────────────────────────────────────────────────────

/** T02/T03 — gửi hồ sơ đi duyệt (vòng 1, hoặc thẳng vòng 2 nếu người gửi cấp Cục). */
export async function submitCangBien(id: string): Promise<ApprovalResult> {
  const res = await api.post(`${BASE}/${id}/submit`);
  return res.data;
}

/** T06 — Cảng vụ / Chi cục duyệt vòng 1. */
export async function approveCangBienC1(id: string, reason?: string): Promise<ApprovalResult> {
  const res = await api.post(`${BASE}/${id}/approve/c1`, null, { params: { reason } });
  return res.data;
}

/** T08 — Cục duyệt vòng 2, hồ sơ trở thành "Đã duyệt". */
export async function approveCangBienC2(id: string, reason?: string): Promise<ApprovalResult> {
  const res = await api.post(`${BASE}/${id}/approve/c2`, null, { params: { reason } });
  return res.data;
}

/** T07/T09 — từ chối; backend suy ra vòng bị từ chối từ trạng thái hiện tại. */
export async function rejectCangBien(id: string, reason: string): Promise<ApprovalResult> {
  const res = await api.post(`${BASE}/${id}/reject`, null, { params: { reason } });
  return res.data;
}

// ── History ─────────────────────────────────────────────────────────

export async function fetchportHistory(
  id: string,
  params?: { page?: number; size?: number },
): Promise<any> {
  const sp = new URLSearchParams();
  if (params?.page !== undefined) sp.set('page', String(params.page));
  if (params?.size !== undefined) sp.set('size', String(params.size));

  const res = await api.get(`${BASE}/${id}/history?${sp}`);
  return res.data.data;
}

export async function fetchPortAllHistory(params?: { page?: number; size?: number }): Promise<any> {
  const sp = new URLSearchParams();
  if (params?.page !== undefined) sp.set('page', String(params.page));
  if (params?.size !== undefined) sp.set('size', String(params.size));
  const res = await api.get(`${BASE}/history/all?${sp}`);
  return res.data.data;
}
