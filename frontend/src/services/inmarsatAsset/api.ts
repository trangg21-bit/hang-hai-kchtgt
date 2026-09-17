import api from '../api';
import { triggerBlobDownload } from '../../components/shared/InfrastructureAttachmentTab';
import type {
  PageResponse,
  InmarsatAsset,
  InmarsatAssetPayload,
  InmarsatAssetFilters,
  InmarsatAssetExploitation,
  InmarsatAssetExploitationPayload,
  InmarsatAssetAdjustment,
  InmarsatAssetAdjustmentPayload,
} from './types';

const BASE_URL = '/v1/asset/inmarsat-assets';
export const INMARSAT_ASSET_TYPE = 'Tài sản đài Inmarsat';

export async function fetchInmarsatAssets(
  params: InmarsatAssetFilters
): Promise<PageResponse<InmarsatAsset>> {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') sp.set(key, String(value));
  });
  const res = await api.get(`${BASE_URL}?${sp}`);
  return res.data.data;
}

export async function fetchInmarsatAssetCounts(
  params: InmarsatAssetFilters
): Promise<Record<string, number>> {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && key !== 'page' && key !== 'size' && key !== 'approvalStatus') {
      sp.set(key, String(value));
    }
  });
  try {
    const res = await api.get(`${BASE_URL}/counts?${sp}`);
    return res.data.data ?? {};
  } catch {
    return {};
  }
}

export async function fetchInmarsatAsset(id: string): Promise<InmarsatAsset> {
  const res = await api.get(`${BASE_URL}/${id}`);
  return res.data.data;
}

export async function createInmarsatAsset(
  payload: InmarsatAssetPayload
): Promise<InmarsatAsset> {
  const res = await api.post(BASE_URL, {
    ...payload,
    assetType: payload.assetType || INMARSAT_ASSET_TYPE,
  });
  return res.data.data;
}

export async function updateInmarsatAsset(
  id: string,
  payload: InmarsatAssetPayload
): Promise<InmarsatAsset> {
  const res = await api.put(`${BASE_URL}/${id}`, {
    ...payload,
    assetType: payload.assetType || INMARSAT_ASSET_TYPE,
  });
  return res.data.data;
}

export async function deleteInmarsatAsset(id: string): Promise<void> {
  await api.delete(`${BASE_URL}/${id}`);
}

export async function fetchInmarsatAssetHistory(
  id: string
): Promise<{ changeHistory?: Record<string, unknown>[] } | Record<string, unknown>[]> {
  const res = await api.get(`${BASE_URL}/${id}/history`);
  return res.data?.data;
}

export async function fetchInmarsatExploitations(
  assetId: string
): Promise<InmarsatAssetExploitation[]> {
  const res = await api.get(`${BASE_URL}/${assetId}/exploitations`);
  return res.data.data;
}

export async function createInmarsatExploitation(
  assetId: string,
  payload: InmarsatAssetExploitationPayload
): Promise<InmarsatAssetExploitation> {
  const res = await api.post(`${BASE_URL}/${assetId}/exploitations`, payload);
  return res.data.data;
}

export async function fetchInmarsatAdjustments(
  assetId: string,
  type?: string
): Promise<InmarsatAssetAdjustment[]> {
  const sp = type ? `?type=${type}` : '';
  const res = await api.get(`${BASE_URL}/${assetId}/adjustments${sp}`);
  return res.data.data;
}

export async function createInmarsatAdjustment(
  assetId: string,
  payload: InmarsatAssetAdjustmentPayload
): Promise<InmarsatAssetAdjustment> {
  const res = await api.post(`${BASE_URL}/${assetId}/adjustments`, payload);
  return res.data.data;
}

export async function fetchInmarsatStationOptions(): Promise<Array<{ id: string; code: string; name: string }>> {
  try {
    const res = await api.get('/v1/stations/inmarsat/options');
    const body = res.data?.data !== undefined ? res.data.data : res.data;
    const list = Array.isArray(body) ? body : (Array.isArray(body?.content) ? body.content : []);
    if (list.length > 0) {
      return list.map((item: Record<string, unknown>) => ({
        id: String(item.id || ''),
        code: String(item.code || item.deviceCode || item.stationCode || ''),
        name: String(item.name || item.stationName || ''),
      }));
    }
  } catch {
    // Fallback below
  }

  try {
    const res2 = await api.get('/v1/stations/inmarsat?size=1000');
    const body2 = res2.data?.data !== undefined ? res2.data.data : res2.data;
    const list2 = Array.isArray(body2?.content)
      ? body2.content
      : Array.isArray(body2)
        ? body2
        : Array.isArray(res2.data?.content)
          ? res2.data.content
          : [];
    return list2.map((item: Record<string, unknown>) => ({
      id: String(item.id || ''),
      code: String(item.code || item.deviceCode || item.stationCode || ''),
      name: String(item.name || item.stationName || ''),
    }));
  } catch {
    return [];
  }
}

export interface InmarsatAssetAttachmentResponse {
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

export async function fetchInmarsatAssetAttachments(
  assetId: string
): Promise<InmarsatAssetAttachmentResponse[]> {
  try {
    const res = await api.get(`${BASE_URL}/${assetId}/attachments`);
    return res.data.data ?? [];
  } catch {
    return [];
  }
}

export async function uploadInmarsatAssetAttachments(
  assetId: string,
  files: File[]
): Promise<InmarsatAssetAttachmentResponse[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const res = await api.post(`${BASE_URL}/${assetId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data ?? [];
}

export async function deleteInmarsatAssetAttachment(
  assetId: string,
  attId: string
): Promise<void> {
  await api.delete(`${BASE_URL}/${assetId}/attachments/${attId}`);
}

export async function downloadInmarsatAssetAttachment(
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
  const contentType = resolveContentType(serverContentType, fileName);
  const blob = new Blob([res.data], { type: contentType });
  triggerBlobDownload(blob, fileName || 'attachment');
}

/** Map extension → MIME type để tránh browser rename sai đuôi file */
function resolveContentType(serverType: string, fileName: string): string {
  if (serverType && serverType !== 'text/plain' && serverType !== 'application/octet-stream') {
    return serverType;
  }
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  const mimeMap: Record<string, string> = {
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    zip: 'application/zip',
    txt: 'text/plain',
    csv: 'text/csv',
  };
  return mimeMap[ext] ?? 'application/octet-stream';
}
