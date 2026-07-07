import api from '../../services/api';
import type { CangCan, CreateCangCanPayload, UpdateCangCanPayload } from './types';

// ── Types ───────────────────────────────────────────────────────────────

export interface CangCanListParams {
  search?: string;
  status?: string;
  approvalStatus?: string;
  orgUnitId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface CangCanHistoryRecord {
  id: string;
  fieldChanged: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
  changedAt: string;
  reason?: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ── List ────────────────────────────────────────────────────────────────

export async function fetchCangCanList(
  params: CangCanListParams,
): Promise<PaginatedResult<CangCan>> {
  const sp = new URLSearchParams();
  if (params.search) sp.set('search', params.search);
  if (params.status) sp.set('status', params.status);
  if (params.approvalStatus) sp.set('approvalStatus', params.approvalStatus);
  if (params.orgUnitId) sp.set('orgUnitId', params.orgUnitId);
  if (params.sortBy) sp.set('sortBy', params.sortBy);
  if (params.sortOrder) sp.set('sortOrder', params.sortOrder);
  sp.set('page', String(params.page ?? 0));
  sp.set('size', String(params.pageSize ?? 20));

  const res = await api.get(`/cang-can?${sp}`);
  const pageData = res.data.data;
  return {
    data: pageData.content || [],
    total: pageData.totalElements ?? 0,
    page: (pageData.number ?? 0) + 1,
    pageSize: pageData.size ?? 20,
  };
}

// ── Detail ──────────────────────────────────────────────────────────────

export async function fetchCangCanById(id: string): Promise<CangCan> {
  const res = await api.get(`/cang-can/${id}`);
  return res.data.data;
}

// ── Create ──────────────────────────────────────────────────────────────

export async function createCangCan(payload: CreateCangCanPayload): Promise<CangCan> {
  const res = await api.post('/cang-can', payload);
  return res.data.data;
}

// ── Update ──────────────────────────────────────────────────────────────

export async function updateCangCan(payload: UpdateCangCanPayload): Promise<CangCan> {
  const res = await api.put('/cang-can', payload);
  return res.data.data;
}

// ── Delete ──────────────────────────────────────────────────────────────

export async function deleteCangCan(id: string): Promise<void> {
  await api.delete(`/cang-can/${id}`);
}

// ── Approve / Reject ────────────────────────────────────────────────────

export async function approveCangCan(id: string): Promise<void> {
  await api.post(`/cang-can/${id}/approve`);
}

export async function rejectCangCan(id: string, reason: string): Promise<void> {
  const sp = new URLSearchParams();
  sp.set('reason', reason);
  await api.post(`/cang-can/${id}/reject?${sp}`);
}

// ── History ─────────────────────────────────────────────────────────────

export async function fetchCangCanHistory(id: string): Promise<CangCanHistoryRecord[]> {
  const res = await api.get(`/cang-can/${id}/history`);
  return res.data.data ?? [];
}
