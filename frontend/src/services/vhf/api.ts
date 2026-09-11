import api from '../api';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../operatingOrganizationsData';
import type {
  VhfResponse,
  CreateVhfRequest,
  UpdateVhfRequest,
  PageResponse,
  VhfOptionResponse,
  ApprovalResult,
  ApprovalRequest,
} from './types';
import type { HistoryEntry } from '../../types/vtsSystem';

const BASE = '/v1/vhf';

export interface VhfAttachmentResponse {
  id: string;
  fileName: string;
  fileSize?: number;
}

export interface VhfHistoryFilterParams {
  keyword?: string;
  fromDate?: string;
  toDate?: string;
}

// ── Đơn vị khai thác (bảng operating_organizations — endpoint chung) ──

export async function fetchOperatingOrganizations(): Promise<Array<{ id: string; name: string; code: string }>> {
  try {
    const res = await api.get('/common/options/operating-organizations');
    const data = res.data?.data;
    if (Array.isArray(data) && data.length > 0) return data;
  } catch {
    // ignore — fall back to defaults
  }
  return DEFAULT_OPERATING_ORGANIZATIONS;
}

// ── CRUD ────────────────────────────────────────────────────────────

export async function fetchVhfList(params: {
  page?: number;
  size?: number;
  orgUnitId?: string;
  seaportId?: string;
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
}): Promise<PageResponse<VhfResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.orgUnitId) sp.set('orgUnitId', params.orgUnitId);
  if (params.seaportId) sp.set('seaportId', params.seaportId);
  if (params.search) sp.set('search', params.search);
  if (params.deviceCode) sp.set('deviceCode', params.deviceCode);
  if (params.deviceName) sp.set('deviceName', params.deviceName);
  if (params.province) sp.set('province', params.province);
  if (params.operationalStatus !== undefined && params.operationalStatus !== '') sp.set('operatingStatus', String(params.operationalStatus));
  if (params.approvalStatus) sp.set('approvalStatus', params.approvalStatus);
  if (params.vtsSystemId) sp.set('vtsSystemId', params.vtsSystemId);
  if (params.attachedInfraType !== undefined) sp.set('attachedInfrastructureType', String(params.attachedInfraType));
  if (params.attachedInfraId) sp.set('attachedInfrastructureId', params.attachedInfraId);
  if (params.yearOfUse !== undefined) sp.set('yearOfUse', String(params.yearOfUse));
  if (params.updatedFrom) sp.set('updatedFrom', params.updatedFrom);
  if (params.updatedTo) sp.set('updatedTo', params.updatedTo);
  if (params.sortBy) sp.set('sortBy', params.sortBy);
  if (params.sortOrder) sp.set('sortOrder', params.sortOrder);

  const res = await api.get(`${BASE}?${sp}`);
  return res.data.data;
}

export async function fetchVhfById(id: string): Promise<VhfResponse> {
  const res = await api.get(`${BASE}/${id}`);
  return res.data.data;
}

export async function createVhf(payload: CreateVhfRequest): Promise<VhfResponse> {
  const res = await api.post(BASE, payload);
  return res.data.data;
}

export async function updateVhf(payload: UpdateVhfRequest): Promise<VhfResponse> {
  const res = await api.put(BASE, payload);
  return res.data.data;
}

export async function deleteVhf(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}

// ── Code generation ─────────────────────────────────────────────────

export async function generateVhfCode(): Promise<string> {
  const res = await api.get(`${BASE}/generate-code`);
  return res.data.data.deviceCode;
}

// ── Options ─────────────────────────────────────────────────────────

export async function fetchVhfOptions(): Promise<VhfOptionResponse[]> {
  const res = await api.get(`${BASE}/options`);
  return res.data.data;
}

// ── Approval 2 cấp (C1 Cảng vụ → C2 Cục) ───────────────────────────

export async function submitVhf(id: string, content?: string): Promise<ApprovalResult> {
  const res = await api.post(`${BASE}/${id}/submit`, { content: content ?? null });
  return res.data;
}

export async function approveVhfC1(id: string, data: ApprovalRequest): Promise<ApprovalResult> {
  const res = await api.post(`${BASE}/${id}/approve/c1`, data);
  return res.data;
}

export async function approveVhfC2(id: string, data: ApprovalRequest): Promise<ApprovalResult> {
  const res = await api.post(`${BASE}/${id}/approve/c2`, data);
  return res.data;
}

// ── History ─────────────────────────────────────────────────────────

export async function fetchVhfHistory(
  id: string,
  page?: number,
  pageSize?: number,
  filters?: VhfHistoryFilterParams,
): Promise<HistoryEntry[]> {
  const sp = new URLSearchParams();
  if (page !== undefined && page !== null) sp.set('page', String(page));
  if (pageSize !== undefined && pageSize !== null) sp.set('pageSize', String(pageSize));
  if (filters?.keyword?.trim()) sp.set('keyword', filters.keyword.trim());
  if (filters?.fromDate) sp.set('fromDate', filters.fromDate);
  if (filters?.toDate) sp.set('toDate', filters.toDate);
  const query = sp.toString() ? `?${sp.toString()}` : '';
  const res = await api.get(`${BASE}/${id}/history${query}`);
  return res.data?.data || [];
}

export async function fetchAllVhfHistory(
  params?: { page?: number; size?: number },
): Promise<unknown> {
  const sp = new URLSearchParams();
  if (params?.page !== undefined) sp.set('page', String(params.page));
  if (params?.size !== undefined) sp.set('size', String(params.size));
  const res = await api.get(`${BASE}/history/all?${sp}`);
  return res.data.data;
}

// ── Restore ─────────────────────────────────────────────────────────

export async function restoreVhf(id: string): Promise<VhfResponse> {
  const res = await api.post(`${BASE}/${id}/restore`);
  return res.data.data;
}

// ── Attachments (File đính kèm) ────────────────────────────────────

export async function fetchVhfAttachments(id: string): Promise<VhfAttachmentResponse[]> {
  const res = await api.get(`${BASE}/${id}/attachments`);
  return res.data.data || [];
}

export async function uploadVhfAttachment(id: string, file: File): Promise<unknown> {
  const formData = new FormData();
  formData.append('files', file);
  const res = await api.post(`${BASE}/${id}/attachments`, formData, {
    headers: { 'Content-Type': undefined },
  });
  return res.data;
}

export async function deleteVhfAttachment(id: string, attachmentId: string): Promise<unknown> {
  const res = await api.delete(`${BASE}/${id}/attachments/${attachmentId}`);
  return res.data;
}

// Download file đính kèm — mirror /vts-operation-center (vtsOperationCenterService.downloadAttachment):
// GET /{id}/attachments/{attId}/download → blob → lưu file qua <a download>.
export async function downloadVhfAttachment(id: string, attId: string, fileName?: string): Promise<void> {
  const res = await api.get(`${BASE}/${id}/attachments/${attId}/download`, {
    responseType: 'blob',
  });
  const blob = new Blob([res.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || 'attachment';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
