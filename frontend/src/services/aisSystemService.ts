import api from './api';
import { toArray, toSingle } from './resilient';
import type {
  AisSystemResponse,
  AisSystemListItem,
  AisSystemAttachment,
  CreateAisSystemRequest,
  UpdateAisSystemRequest,
} from '../types/aisSystem';
import type { HistoryEntry } from '../types/radarStation';

const BASE_PATH = '/v1/ais-system';

function buildSearchParams(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  return sp;
}

export interface AisSystemListParams {
  keyword?: string;
  orgUnitId?: string;
  vtsOperationCenterId?: string;
  operatingOrgId?: string;
  provinceId?: number;
  conditionStatus?: number | string;
  approvalStatus?: number | string;
  commissioningYear?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface AisSystemSearchResponse {
  items: AisSystemListItem[];
  total: number;
  page: number;
  size: number;
  statusCounts: Record<string, number>;
}

export const aisSystemService = {
  async getById(id: string): Promise<AisSystemResponse> {
    const res = await api.get(`${BASE_PATH}/${id}`);
    return toSingle<AisSystemResponse>(res.data) || ({} as AisSystemResponse);
  },

  async search(params?: AisSystemListParams): Promise<AisSystemSearchResponse> {
    const sp = buildSearchParams({
      keyword: params?.keyword,
      orgUnitId: params?.orgUnitId,
      vtsOperationCenterId: params?.vtsOperationCenterId,
      operatingOrgId: params?.operatingOrgId,
      provinceId: params?.provinceId,
      conditionStatus: params?.conditionStatus,
      approvalStatus: params?.approvalStatus,
      commissioningYear: params?.commissioningYear,
      page: params?.page !== undefined ? Math.max(0, params.page > 0 ? params.page - 1 : 0) : 0,
      size: params?.size || 20,
      sortBy: params?.sortBy,
      sortDir: params?.sortDir,
    });
    const res = await api.get(`${BASE_PATH}?${sp}`);
    const data = res.data?.data || {};
    return {
      items: data.content || [],
      total: data.totalElements || 0,
      page: (data.number ?? 0) + 1,
      size: data.size ?? (params?.size || 20),
      statusCounts: data.statusCounts || {},
    };
  },

  async generateCode(): Promise<{ code: string }> {
    const res = await api.get(`${BASE_PATH}/generate-code`);
    return toSingle<{ code: string }>(res.data) || { code: '' };
  },

  async create(data: CreateAisSystemRequest): Promise<AisSystemResponse> {
    const res = await api.post(BASE_PATH, data);
    return toSingle<AisSystemResponse>(res.data) || ({} as AisSystemResponse);
  },

  async update(id: string, data: UpdateAisSystemRequest): Promise<AisSystemResponse> {
    const res = await api.put(`${BASE_PATH}/${id}`, data);
    return toSingle<AisSystemResponse>(res.data) || ({} as AisSystemResponse);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_PATH}/${id}`);
  },

  async submit(id: string): Promise<void> {
    await api.post(`${BASE_PATH}/${id}/submit`);
  },

  async approveC1(id: string, decision?: string, reason?: string): Promise<void> {
    await api.post(`${BASE_PATH}/${id}/approve-c1`, { decision, reason });
  },

  async approveC2(id: string, decision?: string, reason?: string): Promise<void> {
    await api.post(`${BASE_PATH}/${id}/approve-c2`, { decision, reason });
  },

  async reject(id: string, reason: string): Promise<void> {
    await api.post(`${BASE_PATH}/${id}/reject`, { reason });
  },

  async getHistory(id: string): Promise<HistoryEntry[]> {
    const res = await api.get(`${BASE_PATH}/${id}/history`);
    return toArray<HistoryEntry>(res.data);
  },

  async listAttachments(id: string): Promise<AisSystemAttachment[]> {
    const res = await api.get(`${BASE_PATH}/${id}/attachments`);
    return toArray<AisSystemAttachment>(res.data);
  },

  async uploadAttachments(id: string, files: File[]): Promise<AisSystemAttachment[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const res = await api.post(`${BASE_PATH}/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return toArray<AisSystemAttachment>(res.data);
  },

  async deleteAttachment(id: string, attId: string): Promise<void> {
    await api.delete(`${BASE_PATH}/${id}/attachments/${attId}`);
  },

  async downloadAttachment(id: string, attId: string, fileName?: string): Promise<void> {
    const res = await api.get(`${BASE_PATH}/${id}/attachments/${attId}/download`, {
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
  },

  async getOptions(orgUnitId?: string): Promise<{ id: string; code: string; name: string; orgUnitId?: string; vtsOperationCenterId?: string }[]> {
    const sp = orgUnitId ? `?orgUnitId=${encodeURIComponent(orgUnitId)}` : '';
    const res = await api.get(`${BASE_PATH}/options${sp}`);
    return toArray<{ id: string; code: string; name: string; orgUnitId?: string; vtsOperationCenterId?: string }>(res.data);
  },
};
