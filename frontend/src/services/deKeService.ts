import api from './api';
import { toArray, toSingle, toTotalCount } from './resilient';
import type {
  DeKeResponse,
  CreateDeKeRequest,
  UpdateDeKeRequest,
  PheDuyetRequest,
  HistoryEntry,
  ListParams,
  SearchResponse,
} from '../types/deKe';

export const dekeCRUD = {
  async list(params?: ListParams): Promise<{ items: DeKeResponse[]; total: number }> {
    const res = await api.get('/v1/de-ke', {
      params: {
        page: params?.page || 0,
        size: params?.size || 20,
      },
    });
    return {
      items: toArray<DeKeResponse>(res.data),
      total: toTotalCount(res.data, 0),
    };
  },

  async search(params?: ListParams): Promise<SearchResponse<DeKeResponse>> {
    const res = await api.get('/v1/de-ke/search', {
      params: {
        keyword: params?.keyword,
        loaiDe: params?.loaiDe,
        tinhTrang: params?.tinhTrang,
        trangThaiPheDuyet: params?.trangThaiPheDuyet,
      },
    });
    const data = res.data || {};
    const items = toArray<DeKeResponse>(data);
    return {
      items,
      total: toTotalCount(data, items.length),
      page: params?.page || 0,
      size: params?.size || 20,
    };
  },

  async getById(id: string): Promise<DeKeResponse> {
    const res = await api.get(`/v1/de-ke/${id}`);
    return toSingle<DeKeResponse>(res.data) || {} as DeKeResponse;
  },

  async create(data: CreateDeKeRequest): Promise<DeKeResponse> {
    const res = await api.post('/v1/de-ke', data);
    return toSingle<DeKeResponse>(res.data) || {} as DeKeResponse;
  },

  async update(id: string, data: UpdateDeKeRequest): Promise<DeKeResponse> {
    const res = await api.put(`/v1/de-ke/${id}`, data);
    return toSingle<DeKeResponse>(res.data) || {} as DeKeResponse;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/de-ke/${id}`);
  },

  async getByStatus(status: string): Promise<DeKeResponse[]> {
    const res = await api.get(`/v1/de-ke/status-phe-duyet/${status}`);
    return toArray<DeKeResponse>(res.data);
  },
};

export const deKeApproval = {
  async approveC1(id: string, data: PheDuyetRequest): Promise<DeKeResponse> {
    const res = await api.post(`/v1/de-ke/${id}/approve/c1`, data);
    return toSingle<DeKeResponse>(res.data) || {} as DeKeResponse;
  },

  async approveC2(id: string, data: PheDuyetRequest): Promise<DeKeResponse> {
    const res = await api.post(`/v1/de-ke/${id}/approve/c2`, data);
    return toSingle<DeKeResponse>(res.data) || {} as DeKeResponse;
  },

  async getHistory(id: string): Promise<HistoryEntry[]> {
    const res = await api.get(`/v1/de-ke/${id}/history`);
    return toArray<HistoryEntry>(res.data);
  },
};
