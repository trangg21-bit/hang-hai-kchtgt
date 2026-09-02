import api from './api';
import { toArray, toSingle } from './resilient';
import type {
  LritStationItem,
  CreateLritStationRequest,
  UpdateLritStationRequest,
  LritStationListParams,
  LritStationSearchResponse,
} from '../types/lritStation';
import type { HistoryEntry } from '../types/radarStation';

export type {
  LritStationItem,
  CreateLritStationRequest,
  UpdateLritStationRequest,
  LritStationListParams,
  LritStationSearchResponse,
};

const BASE_PATH = '/v1/stations/lrit';

function buildSearchParams(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  return sp;
}

export const lritStationService = {
  async generateCode(): Promise<{ code: string }> {
    const res = await api.get(`${BASE_PATH}/generate-code`);
    return res.data?.data || res.data || { code: 'LRIT-0001' };
  },

  async getById(id: string): Promise<LritStationItem> {
    const res = await api.get(`${BASE_PATH}/${id}`);
    return toSingle<LritStationItem>(res.data?.data || res.data) || ({} as LritStationItem);
  },

  async search(params?: LritStationListParams): Promise<LritStationSearchResponse> {
    const sp = buildSearchParams({
      keyword: params?.keyword,
      name: params?.name,
      code: params?.code,
      orgUnitId: params?.orgUnitId,
      operatingOrgId: params?.operatingOrgId,
      provinceId: params?.provinceId,
      conditionStatus: params?.conditionStatus,
      approvalStatus: params?.approvalStatus,
      updatedBy: params?.updatedBy,
      updatedFrom: params?.updatedFrom,
      updatedTo: params?.updatedTo,
      page: params?.page !== undefined ? Math.max(0, params.page > 0 ? params.page - 1 : 0) : 0,
      size: params?.size || 20,
      sortBy: params?.sortBy,
      sortDir: params?.sortDir,
    });
    const [res, countsRes] = await Promise.all([
      api.get(`${BASE_PATH}?${sp}`),
      api.get(`${BASE_PATH}/counts?${sp}`),
    ]);
    const data = res.data?.data || res.data || {};
    const items = data.content || (Array.isArray(data) ? data : []);
    const total = data.totalElements ?? items.length;
    const counts = countsRes.data?.data || countsRes.data || {};

    return {
      items,
      total,
      page: (data.number ?? 0) + 1,
      size: data.size ?? (params?.size || 20),
      statusCounts: counts,
    };
  },

  async getCounts(params?: LritStationListParams): Promise<Record<string, number>> {
    const sp = buildSearchParams({
      orgUnitId: params?.orgUnitId,
      keyword: params?.keyword,
      name: params?.name,
      code: params?.code,
      conditionStatus: params?.conditionStatus,
    });
    const res = await api.get(`${BASE_PATH}/counts?${sp}`);
    return res.data?.data || res.data || {};
  },

  async getOptions(orgUnitId?: string): Promise<LritStationItem[]> {
    const sp = buildSearchParams({ orgUnitId });
    const res = await api.get(`${BASE_PATH}/options?${sp}`);
    return toArray<LritStationItem>(res.data?.data || res.data);
  },

  async create(data: CreateLritStationRequest, action = 'DRAFT'): Promise<LritStationItem> {
    const res = await api.post(`${BASE_PATH}?action=${action}`, data);
    return toSingle<LritStationItem>(res.data?.data || res.data) || ({} as LritStationItem);
  },

  async update(id: string, data: UpdateLritStationRequest): Promise<LritStationItem> {
    const res = await api.put(`${BASE_PATH}/${id}`, data);
    return toSingle<LritStationItem>(res.data?.data || res.data) || ({} as LritStationItem);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_PATH}/${id}`);
  },

  async submit(id: string): Promise<LritStationItem> {
    const res = await api.post(`${BASE_PATH}/${id}/submit`);
    return toSingle<LritStationItem>(res.data?.data || res.data) || ({} as LritStationItem);
  },

  async approveC1(id: string, statusOrContent?: string, maybeContent?: string): Promise<LritStationItem> {
    const content = maybeContent !== undefined ? maybeContent : statusOrContent;
    const body = content ? { content } : {};
    const res = await api.post(`${BASE_PATH}/${id}/approve-c1`, body);
    return toSingle<LritStationItem>(res.data?.data || res.data) || ({} as LritStationItem);
  },

  async approveC2(id: string, statusOrContent?: string, maybeContent?: string): Promise<LritStationItem> {
    const content = maybeContent !== undefined ? maybeContent : statusOrContent;
    const body = content ? { content } : {};
    const res = await api.post(`${BASE_PATH}/${id}/approve-c2`, body);
    return toSingle<LritStationItem>(res.data?.data || res.data) || ({} as LritStationItem);
  },

  async reject(id: string, reason: string): Promise<LritStationItem> {
    const res = await api.post(`${BASE_PATH}/${id}/reject`, { reason });
    return toSingle<LritStationItem>(res.data?.data || res.data) || ({} as LritStationItem);
  },

  async approveL1(id: string, statusOrContent?: string, maybeContent?: string): Promise<LritStationItem> {
    return this.approveC1(id, statusOrContent, maybeContent);
  },

  async approveL2(id: string, statusOrContent?: string, maybeContent?: string): Promise<LritStationItem> {
    return this.approveC2(id, statusOrContent, maybeContent);
  },

  /**
   * Nhật ký thay đổi. Truyền `page`/`pageSize` để drawer cuộn tải thêm, và
   * `keyword`/`fromDate`/`toDate` để lọc ở server — lọc phía client sẽ chỉ soi
   * được phần đã tải.
   */
  async getHistory(
    id: string,
    page?: number,
    pageSize?: number,
    filters?: { keyword?: string; fromDate?: string; toDate?: string },
  ): Promise<HistoryEntry[]> {
    const params: Record<string, string | number> = {};
    if (page !== undefined && pageSize !== undefined) {
      params.page = page;
      params.pageSize = pageSize;
    }
    if (filters?.keyword) params.keyword = filters.keyword;
    if (filters?.fromDate) params.fromDate = filters.fromDate;
    if (filters?.toDate) params.toDate = filters.toDate;

    const res = await api.get(`${BASE_PATH}/${id}/history`, { params });
    return toArray<HistoryEntry>(res.data?.data || res.data);
  },

  async getAttachments(id: string): Promise<any[]> {
    try {
      const res = await api.get(`${BASE_PATH}/${id}/attachments`);
      const data = res.data?.data || res.data;
      return toArray<any>(data);
    } catch {
      return [];
    }
  },

  async uploadAttachment(id: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('files', file);
    const res = await api.post(`${BASE_PATH}/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data || res.data;
  },

  async deleteAttachment(id: string, attId: string): Promise<void> {
    await api.delete(`${BASE_PATH}/${id}/attachments/${attId}`);
  },

  async downloadAttachment(id: string, attId: string, fileName?: string): Promise<void> {
    const res = await api.get(`${BASE_PATH}/${id}/attachments/${attId}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || 'attachment');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
