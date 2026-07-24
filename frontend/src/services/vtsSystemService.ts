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

export const vtsSystemCRUD = {
  async list(params?: ListParams): Promise<{ items: VtsSystemResponse[]; total: number }> {
    const res = await api.get('/v1/vts-system', {
      params: {
        orgUnitId: params?.orgUnitId,
        page: params?.page || 0,
        size: params?.size || 20,
        keyword: params?.keyword,
        conditionStatus: params?.conditionStatus,
        approvalStatus: params?.approvalStatus,
      },
    });
    return {
      items: toArray<VtsSystemResponse>(res.data),
      total: toTotalCount(res.data, 0),
    };
  },

  async search(params?: ListParams): Promise<SearchResponse<VtsSystemResponse>> {
    const res = await api.get('/v1/vts-system/search', {
      params: {
        orgUnitId: params?.orgUnitId,
        keyword: params?.keyword,
        conditionStatus: params?.conditionStatus,
        approvalStatus: params?.approvalStatus,
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
    const res = await api.get(`/v1/vts-system/${id}`);
    return toSingle<VtsSystemResponse>(res.data) || {} as VtsSystemResponse;
  },

  async create(data: CreateVtsSystemRequest): Promise<VtsSystemResponse> {
    const res = await api.post('/v1/vts-system', data);
    return toSingle<VtsSystemResponse>(res.data) || {} as VtsSystemResponse;
  },

  async update(id: string, data: UpdateVtsSystemRequest): Promise<VtsSystemResponse> {
    const res = await api.put(`/v1/vts-system/${id}`, data);
    return toSingle<VtsSystemResponse>(res.data) || {} as VtsSystemResponse;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/vts-system/${id}`);
  },

  async getByStatus(status: string): Promise<VtsSystemResponse[]> {
    const res = await api.get(`/v1/vts-system/status-phe-duyet/${status}`);
    return toArray<VtsSystemResponse>(res.data);
  },
};

export const vtsSystemApproval = {
  async approveC1(id: string, data: ApprovalRequest): Promise<VtsSystemResponse> {
    const res = await api.post(`/v1/vts-system/${id}/approve/c1`, data);
    return toSingle<VtsSystemResponse>(res.data) || {} as VtsSystemResponse;
  },

  async approveC2(id: string, data: ApprovalRequest): Promise<VtsSystemResponse> {
    const res = await api.post(`/v1/vts-system/${id}/approve/c2`, data);
    return toSingle<VtsSystemResponse>(res.data) || {} as VtsSystemResponse;
  },

  async getHistory(id: string): Promise<HistoryEntry[]> {
    const res = await api.get(`/v1/vts-system/${id}/history`);
    return toArray<HistoryEntry>(res.data);
  },
};
