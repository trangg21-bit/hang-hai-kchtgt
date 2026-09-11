import api from '../api';
import { triggerBlobDownload } from '../../components/shared/InfrastructureAttachmentTab';
import type {
  PageResponse,
  TransmissionAsset,
  TransmissionAssetPayload,
  TransmissionAssetFilters,
  TransmissionAssetExploitation,
  TransmissionAssetAdjustment,
} from './types';

const BASE_URL = '/v1/asset/transmission-assets';

export async function fetchTransmissionAssets(params: TransmissionAssetFilters): Promise<PageResponse<TransmissionAsset>> {
  const sp = new URLSearchParams();
  const merged = { assetType: 'Tài sản HT truyền dẫn', ...params };
  Object.entries(merged).forEach(([key, value]) => {
    if (value !== undefined && value !== '') sp.set(key, String(value));
  });
  const res = await api.get(`${BASE_URL}?${sp}`);
  return res.data.data;
}

export async function fetchTransmissionAsset(id: string): Promise<TransmissionAsset> {
  const res = await api.get(`${BASE_URL}/${id}`);
  return res.data.data;
}

export async function createTransmissionAsset(payload: TransmissionAssetPayload): Promise<TransmissionAsset> {
  const res = await api.post(BASE_URL, payload);
  return res.data.data;
}

export async function updateTransmissionAsset(id: string, payload: TransmissionAssetPayload): Promise<TransmissionAsset> {
  const res = await api.put(`${BASE_URL}/${id}`, payload);
  return res.data.data;
}

export async function deleteTransmissionAsset(id: string): Promise<void> {
  await api.delete(`${BASE_URL}/${id}`);
}

export async function fetchTransmissionExploitations(assetId: string): Promise<TransmissionAssetExploitation[]> {
  const res = await api.get(`${BASE_URL}/${assetId}/exploitations`);
  return res.data.data;
}

export async function createTransmissionExploitation(assetId: string, payload: Partial<TransmissionAssetExploitation>): Promise<TransmissionAssetExploitation> {
  const res = await api.post(`${BASE_URL}/${assetId}/exploitations`, payload);
  return res.data.data;
}

export async function fetchTransmissionAdjustments(assetId: string, type?: string): Promise<TransmissionAssetAdjustment[]> {
  const sp = type ? `?type=${type}` : '';
  const res = await api.get(`${BASE_URL}/${assetId}/adjustments${sp}`);
  return res.data.data;
}

export async function createTransmissionAdjustment(assetId: string, payload: Partial<TransmissionAssetAdjustment>): Promise<TransmissionAssetAdjustment> {
  const res = await api.post(`${BASE_URL}/${assetId}/adjustments`, payload);
  return res.data.data;
}

export interface TransmissionAssetAttachmentResponse {
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

export async function fetchTransmissionAssetAttachments(
  assetId: string
): Promise<TransmissionAssetAttachmentResponse[]> {
  const res = await api.get(`${BASE_URL}/${assetId}/attachments`);
  return res.data.data;
}

export async function uploadTransmissionAssetAttachments(
  assetId: string,
  files: File[]
): Promise<TransmissionAssetAttachmentResponse[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const res = await api.post(`${BASE_URL}/${assetId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function deleteTransmissionAssetAttachment(
  assetId: string,
  attId: string
): Promise<void> {
  await api.delete(`${BASE_URL}/${assetId}/attachments/${attId}`);
}

export async function downloadTransmissionAssetAttachment(
  assetId: string,
  attId: string,
  fileName: string
): Promise<void> {
  const res = await api.get(`${BASE_URL}/${assetId}/attachments/${attId}/download`, {
    responseType: 'blob',
  });

  // Ưu tiên content-type từ server, nhưng fallback về MIME type từ tên file
  // để tránh browser rename .xlsx → .txt khi server trả về text/plain
  const serverContentType = res.headers?.['content-type']
    ? String(res.headers['content-type']).split(';')[0].trim()
    : '';

  const contentType = resolveContentType(serverContentType, fileName);
  const blob = new Blob([res.data], { type: contentType });
  triggerBlobDownload(blob, fileName || 'attachment');
}

/** Map extension → MIME type cho các định dạng phổ biến */
function resolveContentType(serverType: string, fileName: string): string {
  // Nếu server trả đúng binary type thì dùng luôn
  if (
    serverType &&
    serverType !== 'text/plain' &&
    serverType !== 'application/octet-stream'
  ) {
    return serverType;
  }
  // Detect từ extension của tên file
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
    gif: 'image/gif',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    txt: 'text/plain',
    csv: 'text/csv',
  };
  return mimeMap[ext] ?? 'application/octet-stream';
}

