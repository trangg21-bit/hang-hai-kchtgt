import api from './api';
import { toArray, toSingle, toTotalCount } from './resilient';
import type {
  TramRadarResponse,
  CreateTramRadarRequest,
  UpdateTramRadarRequest,
  PheDuyetRequest,
  HistoryEntry,
  ListParams,
  SearchResponse,
} from '../types/tramRadar';

export const tramRadarCRUD = {
  async list(params?: ListParams): Promise<{ items: TramRadarResponse[]; total: number }> {
    const res = await api.get('/v1/tram-radar', {
      params: {
        page: params?.page || 0,
        size: params?.size || 20,
      },
    });
    return {
      items: toArray<TramRadarResponse>(res.data),
      total: toTotalCount(res.data, 0),
    };
  },

  async search(params?: ListParams): Promise<SearchResponse<TramRadarResponse>> {
    const res = await api.get('/v1/tram-radar/search', {
      params: {
        keyword: params?.keyword,
        tinhTrang: params?.tinhTrang,
        trangThai: params?.trangThai,
      },
    });
    const data = res.data || {};
    const items = toArray<TramRadarResponse>(data);
    return {
      items,
      total: toTotalCount(data, items.length),
      page: params?.page || 0,
      size: params?.size || 20,
    };
  },

  async getById(id: string): Promise<TramRadarResponse> {
    const res = await api.get(`/v1/tram-radar/${id}`);
    return toSingle<TramRadarResponse>(res.data) || {} as TramRadarResponse;
  },

  async create(data: CreateTramRadarRequest): Promise<TramRadarResponse> {
    const res = await api.post('/v1/tram-radar', data);
    return toSingle<TramRadarResponse>(res.data) || {} as TramRadarResponse;
  },

  async update(id: string, data: UpdateTramRadarRequest): Promise<TramRadarResponse> {
    const res = await api.put(`/v1/tram-radar/${id}`, data);
    return toSingle<TramRadarResponse>(res.data) || {} as TramRadarResponse;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/tram-radar/${id}`);
  },

  async getByStatus(status: string): Promise<TramRadarResponse[]> {
    const res = await api.get(`/v1/tram-radar/status-phe-duyet/${status}`);
    return toArray<TramRadarResponse>(res.data);
  },
};

export const tramRadarApproval = {
  async approveC1(id: string, data: PheDuyetRequest): Promise<TramRadarResponse> {
    const res = await api.post(`/v1/tram-radar/${id}/approve/c1`, data);
    return toSingle<TramRadarResponse>(res.data) || {} as TramRadarResponse;
  },

  async approveC2(id: string, data: PheDuyetRequest): Promise<TramRadarResponse> {
    const res = await api.post(`/v1/tram-radar/${id}/approve/c2`, data);
    return toSingle<TramRadarResponse>(res.data) || {} as TramRadarResponse;
  },

  async getHistory(id: string): Promise<HistoryEntry[]> {
    const res = await api.get(`/v1/tram-radar/${id}/history`);
    return toArray<HistoryEntry>(res.data);
  },
};
