import api from '../api';
import type {
  CangBienResponse,
  CreateCangBienRequest,
  UpdateCangBienRequest,
  ChangeHistory,
  PageResponse,
  ApprovalResult,
} from './types';

// ── Helpers ─────────────────────────────────────────────────────────

const BASE = '/cang-bien';

// ── CRUD ────────────────────────────────────────────────────────────

export async function fetchCangBienList(params: {
  page?: number;
  size?: number;
  orgUnitId?: string;
  maCang?: string;
  tenCang?: string;
  tinhThanhPho?: string;
  trangThaiHoatDong?: string;
  trangThaiPheDuyet?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<PageResponse<CangBienResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.orgUnitId) sp.set('orgUnitId', params.orgUnitId);
  if (params.maCang) sp.set('maCang', params.maCang);
  if (params.tenCang) sp.set('tenCang', params.tenCang);
  if (params.tinhThanhPho) sp.set('tinhThanhPho', params.tinhThanhPho);
  if (params.trangThaiHoatDong) sp.set('trangThaiHoatDong', params.trangThaiHoatDong);
  if (params.trangThaiPheDuyet) sp.set('trangThaiPheDuyet', params.trangThaiPheDuyet);
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

export async function approveCangBien(id: string): Promise<ApprovalResult> {
  const res = await api.post(`${BASE}/${id}/approve`);
  return res.data;
}

export async function rejectCangBien(id: string, reason: string): Promise<ApprovalResult> {
  const res = await api.post(`${BASE}/${id}/reject`, null, { params: { reason } });
  return res.data;
}

// ── History ─────────────────────────────────────────────────────────

export async function fetchCangBienHistory(
  id: string,
  params?: { page?: number; size?: number },
): Promise<PageResponse<ChangeHistory>> {
  const sp = new URLSearchParams();
  if (params?.page !== undefined) sp.set('page', String(params.page));
  if (params?.size !== undefined) sp.set('size', String(params.size));

  const res = await api.get(`${BASE}/${id}/history?${sp}`);
  return res.data.data;
}
