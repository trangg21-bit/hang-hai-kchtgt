import api from '../api';
import type {
  CctvResponse,
  CreateCctvRequest,
  UpdateCctvRequest,
  PageResponse,
  CctvOptionResponse,
  ApprovalResult,
  CctvHistoryResponse,
} from './types';

const BASE = '/v1/cctv';

// ── CRUD ────────────────────────────────────────────────────────────

export async function fetchCctvList(params: {
  page?: number;
  size?: number;
  orgUnitId?: string;
  search?: string;
  deviceCode?: string;
  deviceName?: string;
  province?: string;
  operationalStatus?: string;
  approvalStatus?: string;
  vtsSystemId?: string;
  attachedInfraType?: number;
  attachedInfraId?: string;
  yearOfUse?: number;
  updatedFrom?: string;
  updatedTo?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<PageResponse<CctvResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.orgUnitId) sp.set('orgUnitId', params.orgUnitId);
  if (params.search) sp.set('search', params.search);
  if (params.deviceCode) sp.set('deviceCode', params.deviceCode);
  if (params.deviceName) sp.set('deviceName', params.deviceName);
  if (params.province) sp.set('province', params.province);
  if (params.operationalStatus) sp.set('operationalStatus', params.operationalStatus);
  if (params.approvalStatus) sp.set('approvalStatus', params.approvalStatus);
  if (params.vtsSystemId) sp.set('vtsSystemId', params.vtsSystemId);
  if (params.attachedInfraType !== undefined) sp.set('attachedInfraType', String(params.attachedInfraType));
  if (params.attachedInfraId) sp.set('attachedInfraId', params.attachedInfraId);
  if (params.yearOfUse !== undefined) sp.set('yearOfUse', String(params.yearOfUse));
  if (params.updatedFrom) sp.set('updatedFrom', params.updatedFrom);
  if (params.updatedTo) sp.set('updatedTo', params.updatedTo);
  if (params.sortBy) sp.set('sortBy', params.sortBy);
  if (params.sortOrder) sp.set('sortOrder', params.sortOrder);

  const res = await api.get(`${BASE}?${sp}`);
  return res.data.data;
}

export async function fetchCctvById(id: string): Promise<CctvResponse> {
  const res = await api.get(`${BASE}/${id}`);
  return res.data.data;
}

export async function createCctv(payload: CreateCctvRequest): Promise<CctvResponse> {
  const res = await api.post(BASE, payload);
  return res.data.data;
}

export async function updateCctv(payload: UpdateCctvRequest): Promise<CctvResponse> {
  const res = await api.put(BASE, payload);
  return res.data.data;
}

export async function deleteCctv(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}

// ── Code generation ─────────────────────────────────────────────────

export async function generateCctvCode(): Promise<string> {
  const res = await api.get(`${BASE}/generate-code`);
  return res.data.data.deviceCode;
}

// ── Options ─────────────────────────────────────────────────────────

export async function fetchCctvOptions(): Promise<CctvOptionResponse[]> {
  const res = await api.get(`${BASE}/options`);
  return res.data.data;
}

// ── Approval ────────────────────────────────────────────────────────

export async function approveCctv(id: string): Promise<ApprovalResult> {
  const res = await api.post(`${BASE}/${id}/approve`);
  return res.data;
}

export async function rejectCctv(id: string, reason: string): Promise<ApprovalResult> {
  const res = await api.post(`${BASE}/${id}/reject`, null, { params: { reason } });
  return res.data;
}

// ── History ─────────────────────────────────────────────────────────

export async function fetchCctvHistory(
  id: string,
  params?: { page?: number; size?: number },
): Promise<CctvHistoryResponse> {
  const sp = new URLSearchParams();
  if (params?.page !== undefined) sp.set('page', String(params.page));
  if (params?.size !== undefined) sp.set('size', String(params.size));

  const res = await api.get(`${BASE}/${id}/history?${sp}`);
  return res.data.data;
}

export async function fetchAllCctvHistory(
  params?: { page?: number; size?: number },
): Promise<any> {
  const sp = new URLSearchParams();
  if (params?.page !== undefined) sp.set('page', String(params.page));
  if (params?.size !== undefined) sp.set('size', String(params.size));
  const res = await api.get(`${BASE}/history/all?${sp}`);
  return res.data.data;
}

// ── Restore ─────────────────────────────────────────────────────────

export async function restoreCctv(id: string): Promise<CctvResponse> {
  const res = await api.post(`${BASE}/${id}/restore`);
  return res.data.data;
}
