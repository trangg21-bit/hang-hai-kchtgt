import api from '../api';
import type {
  CangBienResponse,
  CreateCangBienRequest,
  UpdateCangBienRequest,
  PageResponse,
  ApprovalResult,
  PortChildrenSummary,
} from './types';

// ── Helpers ─────────────────────────────────────────────────────────

const BASE = '/v1/ports';

// ── Code generation ─────────────────────────────────────────────────

export async function generatePortCode(): Promise<string> {
  const res = await api.get(`${BASE}/generate-code`);
  return res.data.data?.code || '';
}

// ── CRUD ────────────────────────────────────────────────────────────

export async function fetchCangBienList(params: {
  page?: number;
  size?: number;
  orgUnitId?: string;
  search?: string;
  portCode?: string;
  portName?: string;
  province?: string;
  portStatus?: string;         // NEW: filter by unified status
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
  if (params.portStatus) sp.set('portStatus', params.portStatus);
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

// ── Children check (before delete) ──────────────────────────────────

export async function fetchPortChildren(id: string): Promise<PortChildrenSummary> {
  const res = await api.get(`${BASE}/${id}/children`);
  return res.data.data;
}

// ── Approval ────────────────────────────────────────────────────────

export async function approveCangBien(id: string): Promise<ApprovalResult> {
  const res = await api.post(`${BASE}/${id}/approve`);
  return res.data;
}

export async function rejectCangBien(id: string, reason: string): Promise<ApprovalResult> {
  const res = await api.post(`${BASE}/${id}/reject`, null, { params: { reason } });
  return res.data;
}

// ── Attachments ─────────────────────────────────────────────────────

export async function uploadAttachment(id: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post(`${BASE}/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function deleteAttachment(id: string, attId: string): Promise<void> {
  await api.delete(`${BASE}/${id}/attachments/${attId}`);
}

// ── Status counts ──────────────────────────────────────────────────

export async function fetchPortStatusCounts(): Promise<Record<string, number>> {
  const res = await api.get(`${BASE}/status-counts`);
  return res.data.data ?? {};
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
