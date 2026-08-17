import api from './api';
import { toArray, toSingle, toTotalCount } from './resilient';
import type {
  VtsSystemResponse,
  VtsSystemAttachment,
  VtsSystemListItem,
  CreateVtsSystemRequest,
  UpdateVtsSystemRequest,
  ApprovalRequest,
  HistoryEntry,
  ListParams,
  SearchResponse,
  VtsZoneDto,
} from '../types/vtsSystem';

const VTS_BASE_PATH = '/v1/vts-system';
const COMMON_OPTIONS_BASE_PATH = '/common/options';

export const vtsSystemCRUD = {
  async getScopedOrgUnitOptions(): Promise<Array<{ id: string; name: string; code?: string; path?: string; parentId?: string }>> {
    const res = await api.get(`${COMMON_OPTIONS_BASE_PATH}/org-units`);
    const data = res.data?.data;
    return Array.isArray(data) ? data : [];
  },

  async getScopedPortOptions(): Promise<Array<{ id: string; portCode?: string; portName?: string; orgUnitId?: string }>> {
    const res = await api.get(`${COMMON_OPTIONS_BASE_PATH}/ports`);
    const data = res.data?.data;
    return Array.isArray(data) ? data : [];
  },

  async list(params?: ListParams & { includeCounts?: boolean }): Promise<{ items: VtsSystemListItem[]; total: number; statusCounts: Record<string, number> }> {
    const res = await api.get(VTS_BASE_PATH, {
      params: {
        orgUnitId: params?.orgUnitId,
        page: params?.page || 0,
        size: params?.size || 20,
        keyword: params?.keyword,
        conditionStatus: params?.conditionStatus,
        approvalStatus: params?.approvalStatus,
        year: params?.year,
        includeCounts: params?.includeCounts ?? true,
      },
    });
    const data = res.data?.data || {};
    return {
      items: Array.isArray(data.items) ? data.items as VtsSystemListItem[] : [],
      total: data.total || 0,
      statusCounts: data.statusCounts || {},
    };
  },

  async search(params?: ListParams): Promise<SearchResponse<VtsSystemResponse>> {
    const res = await api.get(`${VTS_BASE_PATH}/search`, {
      params: {
        orgUnitId: params?.orgUnitId,
        keyword: params?.keyword,
        conditionStatus: params?.conditionStatus,
        approvalStatus: params?.approvalStatus,
        year: params?.year,
      },
    });
    const data = res.data || {};
    const items = toArray<VtsSystemResponse>(data);
    return {
      items,
      total: toTotalCount(data, items.length),
      page: params?.page || 0,
      size: params?.size || 20,
    };
  },

  async getById(id: string, options?: { includeZones?: boolean; includeAttachments?: boolean }): Promise<VtsSystemResponse> {
    const res = await api.get(`${VTS_BASE_PATH}/${id}`, options ? {
      params: {
        includeZones: options.includeZones ?? true,
        includeAttachments: options.includeAttachments ?? true,
      },
    } : undefined);
    return toSingle<VtsSystemResponse>(res.data) || {} as VtsSystemResponse;
  },

  async getZones(id: string): Promise<VtsZoneDto[]> {
    const res = await api.get(`${VTS_BASE_PATH}/${id}/zones`);
    return toArray<VtsZoneDto>(res.data);
  },

  async getAttachments(id: string): Promise<VtsSystemAttachment[]> {
    const res = await api.get(`${VTS_BASE_PATH}/${id}/attachments`);
    return toArray<VtsSystemAttachment>(res.data);
  },

  async create(data: CreateVtsSystemRequest): Promise<VtsSystemResponse> {
    const res = await api.post(VTS_BASE_PATH, data);
    return toSingle<VtsSystemResponse>(res.data) || {} as VtsSystemResponse;
  },

  async update(id: string, data: UpdateVtsSystemRequest): Promise<VtsSystemResponse> {
    const res = await api.put(`${VTS_BASE_PATH}/${id}`, data);
    return toSingle<VtsSystemResponse>(res.data) || {} as VtsSystemResponse;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${VTS_BASE_PATH}/${id}`);
  },

  async getByStatus(status: string): Promise<VtsSystemResponse[]> {
    const res = await api.get(`${VTS_BASE_PATH}/approval-status/${status}`);
    return toArray<VtsSystemResponse>(res.data);
  },
};

export const vtsSystemApproval = {
  async approveC1(id: string, data: ApprovalRequest): Promise<VtsSystemResponse> {
    const res = await api.post(`${VTS_BASE_PATH}/${id}/approve/c1`, data);
    return toSingle<VtsSystemResponse>(res.data) || {} as VtsSystemResponse;
  },

  async approveC2(id: string, data: ApprovalRequest): Promise<VtsSystemResponse> {
    const res = await api.post(`${VTS_BASE_PATH}/${id}/approve/c2`, data);
    return toSingle<VtsSystemResponse>(res.data) || {} as VtsSystemResponse;
  },

  async getHistory(id: string, page?: number, pageSize?: number, filters?: { keyword?: string; fromDate?: string; toDate?: string }): Promise<HistoryEntry[]> {
    const params = new URLSearchParams();
    if (page !== undefined && page !== null) params.append('page', String(page));
    if (pageSize !== undefined && pageSize !== null) params.append('pageSize', String(pageSize));
    if (filters?.keyword?.trim()) params.append('keyword', filters.keyword.trim());
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`${VTS_BASE_PATH}/${id}/history${query}`);
    return toArray<HistoryEntry>(res.data);
  },

  async uploadAttachment(id: string, file: File): Promise<VtsSystemAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`${VTS_BASE_PATH}/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  async deleteAttachment(id: string, attachmentId: string): Promise<void> {
    await api.delete(`${VTS_BASE_PATH}/${id}/attachments/${attachmentId}`);
  },
};
