import api from './api';
import { toArray, toSingle, toTotalCount } from './resilient';
import type {
  DikeRevetmentResponse,
  CreateDikeRevetmentRequest,
  UpdateDikeRevetmentRequest,
  HistoryEntry,
  ListParams,
  SearchResponse,
} from '../types/dikeRevetment';

export const dikeRevetmentCRUD = {
  async list(params?: ListParams): Promise<{ items: DikeRevetmentResponse[]; total: number }> {
    const res = await api.get('/v1/dike-revetment', {
      params: {
        page: params?.page || 0,
        size: params?.size || 20,
      },
    });
    return {
      items: toArray<DikeRevetmentResponse>(res.data),
      total: toTotalCount(res.data, 0),
    };
  },

  async search(params?: ListParams): Promise<SearchResponse<DikeRevetmentResponse>> {
    const res = await api.get('/v1/dike-revetment/search', {
      params: {
        orgUnitId: params?.orgUnitId,
        code: params?.code,
        keyword: params?.keyword,
        seaportId: params?.seaportId,
        location: params?.location,
        dikeRevetmentType: params?.dikeRevetmentType,
        status: params?.status,
        approvalStatus: params?.approvalStatus,
        commissioningYear: params?.commissioningYear,
        updatedFrom: params?.updatedFrom,
        updatedTo: params?.updatedTo,
        page: params?.page || 0,
        size: params?.size || 20,
      },
    });
    const data = res.data || {};
    const items = toArray<DikeRevetmentResponse>(data);
    return {
      items,
      total: toTotalCount(data, items.length),
      page: params?.page || 0,
      size: params?.size || 20,
    };
  },

  async getById(id: string): Promise<DikeRevetmentResponse> {
    const res = await api.get(`/v1/dike-revetment/${id}`);
    return toSingle<DikeRevetmentResponse>(res.data) || {} as DikeRevetmentResponse;
  },

  async create(data: CreateDikeRevetmentRequest): Promise<DikeRevetmentResponse> {
    const res = await api.post('/v1/dike-revetment', data);
    return toSingle<DikeRevetmentResponse>(res.data) || {} as DikeRevetmentResponse;
  },

  async update(id: string, data: UpdateDikeRevetmentRequest): Promise<DikeRevetmentResponse> {
    const res = await api.put(`/v1/dike-revetment/${id}`, data);
    return toSingle<DikeRevetmentResponse>(res.data) || {} as DikeRevetmentResponse;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/dike-revetment/${id}`);
  },

  async getByStatus(status: string): Promise<DikeRevetmentResponse[]> {
    const res = await api.get(`/v1/dike-revetment/approval-status/${status}`);
    return toArray<DikeRevetmentResponse>(res.data);
  },
};

export const dikeRevetmentApproval = {
  async submitForApproval(id: string): Promise<void> {
    await api.post(`/v1/dike-revetment/${id}/submit-approval`);
  },

  async approveL1(id: string): Promise<DikeRevetmentResponse> {
    const res = await api.post(`/v1/dike-revetment/${id}/approve-l1`);
    return toSingle<DikeRevetmentResponse>(res.data) || {} as DikeRevetmentResponse;
  },

  async reject(id: string, reason: string): Promise<DikeRevetmentResponse> {
    const res = await api.post(`/v1/dike-revetment/${id}/reject`, { decision: 'REJECTED', reason });
    return toSingle<DikeRevetmentResponse>(res.data) || {} as DikeRevetmentResponse;
  },

  async getHistory(id: string): Promise<HistoryEntry[]> {
    const res = await api.get(`/v1/dike-revetment/${id}/history`);
    return toArray<HistoryEntry>(res.data);
  },
};
