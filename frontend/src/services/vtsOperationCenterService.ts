import api from './api';
import { toArray, toSingle } from './resilient';
import type {
  VtsOperationCenterResponse,
  VtsOperationCenterListItem,
  VtsOperationCenterAttachment,
  CreateVtsOperationCenterRequest,
  UpdateVtsOperationCenterRequest,
} from '../types/vtsOperationCenter';
import type { HistoryEntry } from '../types/radarStation';

const BASE_PATH = '/v1/vts-operation-center';

function buildSearchParams(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  return sp;
}

export interface VtsOperationCenterListParams {
  keyword?: string;
  name?: string;
  code?: string;
  orgUnitId?: string;
  vtsSystemId?: string;
  portId?: string;
  provinceId?: number;
  conditionStatus?: number | string;
  approvalStatus?: number | string;
  /** Khoảng ngày cập nhật (bộ lọc nâng cao) — chuỗi ISO-8601. */
  updatedFrom?: string;
  updatedTo?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface VtsOperationCenterSearchResponse {
  items: VtsOperationCenterListItem[];
  total: number;
  page: number;
  size: number;
  statusCounts: Record<string, number>;
}

const inFlightGetByIdPromises = new Map<string, Promise<VtsOperationCenterResponse>>();
let inFlightSearchPromise: { key: string; promise: Promise<VtsOperationCenterSearchResponse> } | null = null;

export const vtsOperationCenterService = {
  async getById(id: string): Promise<VtsOperationCenterResponse> {
    const existing = inFlightGetByIdPromises.get(id);
    if (existing) {
      return existing;
    }
    const promise = (async () => {
      try {
        const res = await api.get(`${BASE_PATH}/${id}`);
        return toSingle<VtsOperationCenterResponse>(res.data) || ({} as VtsOperationCenterResponse);
      } finally {
        inFlightGetByIdPromises.delete(id);
      }
    })();
    inFlightGetByIdPromises.set(id, promise);
    return promise;
  },

  async list(params?: VtsOperationCenterListParams): Promise<VtsOperationCenterSearchResponse> {
    return this.search(params);
  },

  async search(params?: VtsOperationCenterListParams): Promise<VtsOperationCenterSearchResponse> {
    const key = JSON.stringify(params || {});
    if (inFlightSearchPromise && inFlightSearchPromise.key === key) {
      return inFlightSearchPromise.promise;
    }
    const promise = (async () => {
      try {
        const sp = buildSearchParams({
          keyword: params?.keyword,
          name: params?.name,
          code: params?.code,
          orgUnitId: params?.orgUnitId,
          vtsSystemId: params?.vtsSystemId,
          portId: params?.portId,
          provinceId: params?.provinceId,
          conditionStatus: params?.conditionStatus,
          approvalStatus: params?.approvalStatus,
          updatedFrom: params?.updatedFrom,
          updatedTo: params?.updatedTo,
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
      } finally {
        if (inFlightSearchPromise?.key === key) {
          inFlightSearchPromise = null;
        }
      }
    })();
    inFlightSearchPromise = { key, promise };
    return promise;
  },

  async generateCode(): Promise<{ code: string }> {
    const res = await api.get(`${BASE_PATH}/generate-code`);
    return toSingle<{ code: string }>(res.data) || { code: '' };
  },

  async create(data: CreateVtsOperationCenterRequest): Promise<VtsOperationCenterResponse> {
    const res = await api.post(BASE_PATH, data);
    return toSingle<VtsOperationCenterResponse>(res.data) || ({} as VtsOperationCenterResponse);
  },

  async update(id: string, data: UpdateVtsOperationCenterRequest): Promise<VtsOperationCenterResponse> {
    const res = await api.put(`${BASE_PATH}/${id}`, data);
    return toSingle<VtsOperationCenterResponse>(res.data) || ({} as VtsOperationCenterResponse);
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

  async listAttachments(id: string): Promise<VtsOperationCenterAttachment[]> {
    const res = await api.get(`${BASE_PATH}/${id}/attachments`);
    return toArray<VtsOperationCenterAttachment>(res.data);
  },

  async uploadAttachments(id: string, files: File[]): Promise<VtsOperationCenterAttachment[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const res = await api.post(`${BASE_PATH}/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return toArray<VtsOperationCenterAttachment>(res.data);
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

  async getOptions(orgUnitId?: string): Promise<{ id: string; code: string; name: string; orgUnitId?: string; vtsSystemId?: string }[]> {
    const sp = orgUnitId ? `?orgUnitId=${encodeURIComponent(orgUnitId)}` : '';
    const res = await api.get(`${BASE_PATH}/options${sp}`);
    return toArray<{ id: string; code: string; name: string; orgUnitId?: string; vtsSystemId?: string }>(res.data);
  },
};
