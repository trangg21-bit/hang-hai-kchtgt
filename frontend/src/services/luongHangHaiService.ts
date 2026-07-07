import api from './api';
import { toArray, toSingle, toTotalCount } from './resilient';
import type {
  LuongHangHaiResponse,
  CreateLuongHangHaiRequest,
  UpdateLuongHangHaiRequest,
  PheDuyetRequest,
  HistoryEntry,
  ListParams,
  SearchResponse,
} from '../types/luongHangHai';

export const luongHangHaiCRUD = {
  async list(params?: ListParams): Promise<{ items: LuongHangHaiResponse[]; total: number }> {
    const res = await api.get('/v1/luong-hang-hai', {
      params: {
        page: params?.page || 0,
        size: params?.size || 20,
      },
    });
    return {
      items: toArray<LuongHangHaiResponse>(res.data),
      total: toTotalCount(res.data, 0),
    };
  },

  async search(params?: ListParams): Promise<SearchResponse<LuongHangHaiResponse>> {
    const res = await api.get('/v1/luong-hang-hai/search', {
      params: {
        keyword: params?.keyword,
        gioDien: params?.gioDien,
        taiTrong: params?.taiTrong,
        trangThaiPheDuyet: params?.trangThaiPheDuyet,
      },
    });
    const data = res.data || {};
    const items = toArray<LuongHangHaiResponse>(data);
    return {
      items,
      total: toTotalCount(data, items.length),
      page: params?.page || 0,
      size: params?.size || 20,
    };
  },

  async getById(id: string): Promise<LuongHangHaiResponse> {
    const res = await api.get(`/v1/luong-hang-hai/${id}`);
    return toSingle<LuongHangHaiResponse>(res.data) || {} as LuongHangHaiResponse;
  },

  async create(data: CreateLuongHangHaiRequest): Promise<LuongHangHaiResponse> {
    const res = await api.post('/v1/luong-hang-hai', data);
    return toSingle<LuongHangHaiResponse>(res.data) || {} as LuongHangHaiResponse;
  },

  async update(id: string, data: UpdateLuongHangHaiRequest): Promise<LuongHangHaiResponse> {
    const res = await api.put(`/v1/luong-hang-hai/${id}`, data);
    return toSingle<LuongHangHaiResponse>(res.data) || {} as LuongHangHaiResponse;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/luong-hang-hai/${id}`);
  },

  async getByStatus(status: string): Promise<LuongHangHaiResponse[]> {
    const res = await api.get(`/v1/luong-hang-hai/status-phe-duyet/${status}`);
    return toArray<LuongHangHaiResponse>(res.data);
  },
};

export const luongHangHaiApproval = {
  async approveC1(id: string, data: PheDuyetRequest): Promise<LuongHangHaiResponse> {
    const res = await api.post(`/v1/luong-hang-hai/${id}/approve/c1`, data);
    return toSingle<LuongHangHaiResponse>(res.data) || {} as LuongHangHaiResponse;
  },

  async approveC2(id: string, data: PheDuyetRequest): Promise<LuongHangHaiResponse> {
    const res = await api.post(`/v1/luong-hang-hai/${id}/approve/c2`, data);
    return toSingle<LuongHangHaiResponse>(res.data) || {} as LuongHangHaiResponse;
  },

  async getHistory(id: string): Promise<HistoryEntry[]> {
    const res = await api.get(`/v1/luong-hang-hai/${id}/history`);
    return toArray<HistoryEntry>(res.data);
  },
};
