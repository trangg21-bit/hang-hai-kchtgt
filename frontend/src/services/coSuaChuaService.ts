import api from './api';
import { toArray, toSingle, toTotalCount } from './resilient';
import type {
  CoSuaChuaResponse,
  CreateCoSuaChuaRequest,
  UpdateCoSuaChuaRequest,
  PheDuyetRequest,
  HistoryEntry,
  ListParams,
  SearchResponse,
} from '../types/coSuaChua';

export const coSuaChuaCRUD = {
  async list(params?: ListParams): Promise<{ items: CoSuaChuaResponse[]; total: number }> {
    const res = await api.get('/v1/co-so-sua-chua', {
      params: {
        page: params?.page || 0,
        size: params?.size || 20,
      },
    });
    return {
      items: toArray<CoSuaChuaResponse>(res.data),
      total: toTotalCount(res.data, 0),
    };
  },

  async search(params?: ListParams): Promise<SearchResponse<CoSuaChuaResponse>> {
    const res = await api.get('/v1/co-so-sua-chua/search', {
      params: {
        keyword: params?.keyword,
        tinhThanh: params?.tinhThanh,
        trangThai: params?.trangThai,
        trangThaiPheDuyet: params?.trangThaiPheDuyet,
      },
    });
    const data = res.data || {};
    const items = toArray<CoSuaChuaResponse>(data);
    return {
      items,
      total: toTotalCount(data, items.length),
      page: params?.page || 0,
      size: params?.size || 20,
    };
  },

  async getById(id: string): Promise<CoSuaChuaResponse> {
    const res = await api.get(`/v1/co-so-sua-chua/${id}`);
    return toSingle<CoSuaChuaResponse>(res.data) || {} as CoSuaChuaResponse;
  },

  async create(data: CreateCoSuaChuaRequest): Promise<CoSuaChuaResponse> {
    const res = await api.post('/v1/co-so-sua-chua', data);
    return toSingle<CoSuaChuaResponse>(res.data) || {} as CoSuaChuaResponse;
  },

  async update(id: string, data: UpdateCoSuaChuaRequest): Promise<CoSuaChuaResponse> {
    const res = await api.put(`/v1/co-so-sua-chua/${id}`, data);
    return toSingle<CoSuaChuaResponse>(res.data) || {} as CoSuaChuaResponse;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/co-so-sua-chua/${id}`);
  },

  async getByStatus(status: string): Promise<CoSuaChuaResponse[]> {
    const res = await api.get(`/v1/co-so-sua-chua/status-phe-duyet/${status}`);
    return toArray<CoSuaChuaResponse>(res.data);
  },
};

export const coSuaChuaApproval = {
  async approveC1(id: string, data: PheDuyetRequest): Promise<CoSuaChuaResponse> {
    const res = await api.post(`/v1/co-so-sua-chua/${id}/approve/c1`, data);
    return toSingle<CoSuaChuaResponse>(res.data) || {} as CoSuaChuaResponse;
  },

  async approveC2(id: string, data: PheDuyetRequest): Promise<CoSuaChuaResponse> {
    const res = await api.post(`/v1/co-so-sua-chua/${id}/approve/c2`, data);
    return toSingle<CoSuaChuaResponse>(res.data) || {} as CoSuaChuaResponse;
  },

  async getHistory(id: string): Promise<HistoryEntry[]> {
    const res = await api.get(`/v1/co-so-sua-chua/${id}/history`);
    return toArray<HistoryEntry>(res.data);
  },
};
