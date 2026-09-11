import api from '../api';
import { triggerBlobDownload } from '../../components/shared/InfrastructureAttachmentTab';
import {
  fetchCoastalStationAssets,
  fetchCoastalStationAsset,
  createCoastalStationAsset,
  updateCoastalStationAsset,
  deleteCoastalStationAsset,
  fetchCoastalStationExploitations,
  createCoastalStationExploitation,
  fetchCoastalStationAdjustments,
  createCoastalStationAdjustment,
} from '../coastalStationAsset/api';
import type {
  PageResponse,
  DaiTtdhAsset,
  DaiTtdhAssetPayload,
  DaiTtdhAssetFilters,
  DaiTtdhAssetExploitation,
  DaiTtdhAssetExploitationPayload,
  DaiTtdhAssetAdjustment,
  DaiTtdhAssetAdjustmentPayload,
} from './types';

export const DAI_TTDH_ASSET_TYPE = 'Tài sản đài TTDH';

export async function fetchDaiTtdhAssets(
  params: DaiTtdhAssetFilters
): Promise<PageResponse<DaiTtdhAsset>> {
  return fetchCoastalStationAssets({
    ...params,
    assetType: DAI_TTDH_ASSET_TYPE,
  });
}

export async function fetchDaiTtdhAsset(id: string): Promise<DaiTtdhAsset> {
  return fetchCoastalStationAsset(id);
}

export async function createDaiTtdhAsset(
  payload: DaiTtdhAssetPayload
): Promise<DaiTtdhAsset> {
  return createCoastalStationAsset({
    ...payload,
    assetType: payload.assetType || DAI_TTDH_ASSET_TYPE,
  });
}

export async function updateDaiTtdhAsset(
  id: string,
  payload: DaiTtdhAssetPayload
): Promise<DaiTtdhAsset> {
  return updateCoastalStationAsset(id, {
    ...payload,
    assetType: payload.assetType || DAI_TTDH_ASSET_TYPE,
  });
}

export async function deleteDaiTtdhAsset(id: string): Promise<void> {
  return deleteCoastalStationAsset(id);
}

export async function fetchDaiTtdhExploitations(
  assetId: string
): Promise<DaiTtdhAssetExploitation[]> {
  return fetchCoastalStationExploitations(assetId);
}

export async function createDaiTtdhExploitation(
  assetId: string,
  payload: DaiTtdhAssetExploitationPayload
): Promise<DaiTtdhAssetExploitation> {
  return createCoastalStationExploitation(assetId, payload);
}

export async function fetchDaiTtdhAdjustments(
  assetId: string,
  type?: string
): Promise<DaiTtdhAssetAdjustment[]> {
  return fetchCoastalStationAdjustments(assetId, type);
}

export async function createDaiTtdhAdjustment(
  assetId: string,
  payload: DaiTtdhAssetAdjustmentPayload
): Promise<DaiTtdhAssetAdjustment> {
  return createCoastalStationAdjustment(assetId, payload);
}

export async function fetchDaiTtdhOptions(): Promise<Array<{ id: string; code: string; name: string }>> {
  try {
    const res = await api.get('/v1/dai-ttdh/options');
    const body = res.data?.data !== undefined ? res.data.data : res.data;
    const list = Array.isArray(body) ? body : (Array.isArray(body?.content) ? body.content : []);
    if (list.length > 0) {
      return list.map((item: Record<string, unknown>) => ({
        id: String(item.id || ''),
        code: String(item.daiTtdhCode || item.code || ''),
        name: String(item.daiTtdhName || item.name || ''),
      }));
    }
  } catch {
    // Fallback to /v1/dai-ttdh?size=1000
  }

  try {
    const res2 = await api.get('/v1/dai-ttdh?size=1000');
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
      code: String(item.daiTtdhCode || item.code || ''),
      name: String(item.daiTtdhName || item.name || ''),
    }));
  } catch {
    return [];
  }
}


export interface DaiTtdhAssetAttachmentResponse {
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

export async function fetchDaiTtdhAssetAttachments(
  assetId: string
): Promise<DaiTtdhAssetAttachmentResponse[]> {
  try {
    const res = await api.get(`/v1/dai-ttdh/${assetId}/attachments`);
    return res.data.data ?? [];
  } catch {
    return [];
  }
}

export async function uploadDaiTtdhAssetAttachments(
  assetId: string,
  files: File[]
): Promise<DaiTtdhAssetAttachmentResponse[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const res = await api.post(`/v1/dai-ttdh/${assetId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data ?? [];
}

export async function deleteDaiTtdhAssetAttachment(
  assetId: string,
  attId: string
): Promise<void> {
  await api.delete(`/v1/dai-ttdh/${assetId}/attachments/${attId}`);
}

export async function downloadDaiTtdhAssetAttachment(
  assetId: string,
  attId: string,
  fileName: string
): Promise<void> {
  const res = await api.get(`/v1/dai-ttdh/${assetId}/attachments/${attId}/download`, {
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
