import api from './api';
import { toArray, toSingle, toTotalCount } from './resilient';
import type {
  VtsSystemResponse,
  CreateVtsSystemRequest,
  UpdateVtsSystemRequest,
  ApprovalRequest,
  HistoryEntry,
  ListParams,
  SearchResponse,
} from '../types/vtsSystem';

const VTS_BASE_PATH = '/v1/vts-system';

export const vtsSystemCRUD = {
  async list(params?: ListParams): Promise<{ items: VtsSystemResponse[]; total: number; statusCounts: Record<string, number> }> {
    const res = await api.get(VTS_BASE_PATH, {
      params: {
        orgUnitId: params?.orgUnitId,
        page: params?.page || 0,
        size: params?.size || 20,
        keyword: params?.keyword,
        conditionStatus: params?.conditionStatus,
        approvalStatus: params?.approvalStatus,
        year: params?.year,
      },
    });
    const data = res.data?.data || {};
    return {
      items: Array.isArray(data.items) ? data.items : [],
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

  async getById(id: string): Promise<VtsSystemResponse> {
    const res = await api.get(`${VTS_BASE_PATH}/${id}`);
    return toSingle<VtsSystemResponse>(res.data) || {} as VtsSystemResponse;
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

  async getHistory(id: string): Promise<HistoryEntry[]> {
    const res = await api.get(`${VTS_BASE_PATH}/${id}/history`);
    return toArray<HistoryEntry>(res.data);
  },

  async uploadAttachment(id: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    await api.post(`${VTS_BASE_PATH}/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async deleteAttachment(id: string, attachmentId: string): Promise<void> {
    await api.delete(`${VTS_BASE_PATH}/${id}/attachments/${attachmentId}`);
  },
};
