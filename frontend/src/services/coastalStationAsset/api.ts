import api from '../api';
import { triggerBlobDownload, resolveMimeType } from '../../components/shared/InfrastructureAttachmentTab';
import type {
  PageResponse,
  CoastalStationAsset,
  CoastalStationAssetPayload,
  CoastalStationAssetFilters,
  CoastalStationAssetExploitation,
  CoastalStationAssetExploitationPayload,
  CoastalStationAssetAdjustment,
  CoastalStationAssetAdjustmentPayload,
} from './types';

const BASE_URL = '/v1/asset/coastal-station-assets';

export async function fetchCoastalStationAssets(
  params: CoastalStationAssetFilters
): Promise<PageResponse<CoastalStationAsset>> {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') sp.set(key, String(value));
  });
  const res = await api.get(`${BASE_URL}?${sp}`);
  return res.data.data;
}

export async function fetchCoastalStationAsset(id: string): Promise<CoastalStationAsset> {
  const res = await api.get(`${BASE_URL}/${id}`);
  return res.data.data;
}

export async function createCoastalStationAsset(
  payload: CoastalStationAssetPayload
): Promise<CoastalStationAsset> {
  const res = await api.post(BASE_URL, payload);
  return res.data.data;
}

export async function updateCoastalStationAsset(
  id: string,
  payload: CoastalStationAssetPayload
): Promise<CoastalStationAsset> {
  const res = await api.put(`${BASE_URL}/${id}`, payload);
  return res.data.data;
}

export async function deleteCoastalStationAsset(id: string): Promise<void> {
  await api.delete(`${BASE_URL}/${id}`);
}

export async function fetchCoastalStationExploitations(
  assetId: string
): Promise<CoastalStationAssetExploitation[]> {
  const res = await api.get(`${BASE_URL}/${assetId}/exploitations`);
  return res.data.data;
}

export async function createCoastalStationExploitation(
  assetId: string,
  payload: CoastalStationAssetExploitationPayload
): Promise<CoastalStationAssetExploitation> {
  const res = await api.post(`${BASE_URL}/${assetId}/exploitations`, payload);
  return res.data.data;
}

export async function fetchCoastalStationAdjustments(
  assetId: string,
  type?: string
): Promise<CoastalStationAssetAdjustment[]> {
  const params = type ? `?type=${type}` : '';
  const res = await api.get(`${BASE_URL}/${assetId}/adjustments${params}`);
  return res.data.data;
}

export async function createCoastalStationAdjustment(
  assetId: string,
  payload: CoastalStationAssetAdjustmentPayload
): Promise<CoastalStationAssetAdjustment> {
  const res = await api.post(`${BASE_URL}/${assetId}/adjustments`, payload);
  return res.data.data;
}

export interface CoastalStationAssetAttachmentResponse {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  filePath?: string;
  fileSize?: number;
  contentType?: string;
  uploadedBy?: string;
  uploadedByName?: string;
  uploadedAt?: string;
}

export async function fetchCoastalStationAssetAttachments(
  assetId: string
): Promise<CoastalStationAssetAttachmentResponse[]> {
  try {
    const res = await api.get(`${BASE_URL}/${assetId}/attachments`);
    return res.data.data ?? [];
  } catch {
    return [];
  }
}

export async function uploadCoastalStationAssetAttachments(
  assetId: string,
  files: File[]
): Promise<CoastalStationAssetAttachmentResponse[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const res = await api.post(`${BASE_URL}/${assetId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data ?? [];
}

export async function deleteCoastalStationAssetAttachment(
  assetId: string,
  attId: string
): Promise<void> {
  await api.delete(`${BASE_URL}/${assetId}/attachments/${attId}`);
}

export async function downloadCoastalStationAssetAttachment(
  assetId: string,
  attId: string,
  fileName: string
): Promise<void> {
  const res = await api.get(`${BASE_URL}/${assetId}/attachments/${attId}/download`, {
    responseType: 'blob',
  });
  const serverContentType = res.headers?.['content-type']
    ? String(res.headers['content-type']).split(';')[0].trim()
    : '';
  const contentType = resolveMimeType(fileName, serverContentType);
  const blob = new Blob([res.data], { type: contentType });
  triggerBlobDownload(blob, fileName || 'attachment');
}
