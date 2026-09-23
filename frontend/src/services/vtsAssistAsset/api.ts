import api from '../api';
import type {
  PageResponse,
  VtsAssistAsset,
  VtsAssistAssetPayload,
  VtsAssistAssetFilters,
  VtsAssistAssetExploitation,
  VtsAssistAssetAdjustment,
} from './types';

const BASE_URL = '/v1/asset/vts-assist-assets';

export async function fetchVtsAssistAssets(params: VtsAssistAssetFilters): Promise<PageResponse<VtsAssistAsset>> {
  const sp = new URLSearchParams();
  const mergedParams = { assetType: 'Tài sản hệ thống phụ trợ VTS', ...params };
  Object.entries(mergedParams).forEach(([key, value]) => {
    if (value !== undefined && value !== '') sp.set(key, String(value));
  });
  const res = await api.get(`${BASE_URL}?${sp}`);
  return res.data.data;
}

export async function fetchVtsAssistAsset(id: string): Promise<VtsAssistAsset> {
  const res = await api.get(`${BASE_URL}/${id}`);
  return res.data.data;
}

export async function createVtsAssistAsset(payload: VtsAssistAssetPayload): Promise<VtsAssistAsset> {
  const res = await api.post(BASE_URL, payload);
  return res.data.data;
}

export async function updateVtsAssistAsset(id: string, payload: VtsAssistAssetPayload): Promise<VtsAssistAsset> {
  const res = await api.put(`${BASE_URL}/${id}`, payload);
  return res.data.data;
}

export async function deleteVtsAssistAsset(id: string): Promise<void> {
  await api.delete(`${BASE_URL}/${id}`);
}

export async function fetchVtsAssistAssetHistory(
  id: string,
  page?: number,
  pageSize?: number,
  filters?: { keyword?: string; fromDate?: string; toDate?: string },
): Promise<{ changeHistory?: Record<string, unknown>[] } | Record<string, unknown>[]> {
  const sp = new URLSearchParams();
  if (page !== undefined && page !== null) sp.set('page', String(page));
  if (pageSize !== undefined && pageSize !== null) sp.set('pageSize', String(pageSize));
  if (filters?.keyword?.trim()) sp.set('keyword', filters.keyword.trim());
  if (filters?.fromDate) sp.set('fromDate', filters.fromDate);
  if (filters?.toDate) sp.set('toDate', filters.toDate);
  const qs = sp.toString();
  const res = await api.get(`${BASE_URL}/${id}/history${qs ? `?${qs}` : ''}`);
  return res.data?.data;
}


export async function fetchVtsAssistExploitations(assetId: string): Promise<VtsAssistAssetExploitation[]> {
  const res = await api.get(`${BASE_URL}/${assetId}/exploitations`);
  return res.data.data;
}

export async function createVtsAssistExploitation(assetId: string, payload: Partial<VtsAssistAssetExploitation>): Promise<VtsAssistAssetExploitation> {
  const res = await api.post(`${BASE_URL}/${assetId}/exploitations`, payload);
  return res.data.data;
}

export async function fetchVtsAssistAdjustments(assetId: string, type?: string): Promise<VtsAssistAssetAdjustment[]> {
  const sp = type ? `?type=${type}` : '';
  const res = await api.get(`${BASE_URL}/${assetId}/adjustments${sp}`);
  return res.data.data;
}

export async function createVtsAssistAdjustment(assetId: string, payload: Partial<VtsAssistAssetAdjustment>): Promise<VtsAssistAssetAdjustment> {
  const res = await api.post(`${BASE_URL}/${assetId}/adjustments`, payload);
  return res.data.data;
}

export {
  fetchTransmissionAssetAttachments as fetchVtsAssistAssetAttachments,
  uploadTransmissionAssetAttachments as uploadVtsAssistAssetAttachments,
  deleteTransmissionAssetAttachment as deleteVtsAssistAssetAttachment,
  downloadTransmissionAssetAttachment as downloadVtsAssistAssetAttachment,
  type TransmissionAssetAttachmentResponse as VtsAssistAssetAttachmentResponse,
} from '../transmissionAsset/api';
