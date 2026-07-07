import api from './api';
import { toArray, toSingle, toTotalCount } from './resilient';
import type {
  HeThongVTSResponse,
  CreateHeThongVTSRequest,
  UpdateHeThongVTSRequest,
  PheDuyetRequest,
  HistoryEntry,
  ListParams,
  SearchResponse,
} from '../types/heThongVts';

export const heThongVTSCRUD = {
  async list(params?: ListParams): Promise<{ items: HeThongVTSResponse[]; total: number }> {
    const res = await api.get('/v1/he-thong-vts', {
      params: {
        page: params?.page || 0,
        size: params?.size || 20,
      },
    });
    return {
      items: toArray<HeThongVTSResponse>(res.data),
      total: toTotalCount(res.data, 0),
    };
  },

  async search(params?: ListParams): Promise<SearchResponse<HeThongVTSResponse>> {
    const res = await api.get('/v1/he-thong-vts/search', {
      params: {
        keyword: params?.keyword,
        tinhTrang: params?.tinhTrang,
        trangThai: params?.trangThai,
      },
    });
    const data = res.data || {};
    const items = toArray<HeThongVTSResponse>(data);
    return {
      items,
      total: toTotalCount(data, items.length),
      page: params?.page || 0,
      size: params?.size || 20,
    };
  },

  async getById(id: string): Promise<HeThongVTSResponse> {
    const res = await api.get(`/v1/he-thong-vts/${id}`);
    return toSingle<HeThongVTSResponse>(res.data) || {} as HeThongVTSResponse;
  },

  async create(data: CreateHeThongVTSRequest): Promise<HeThongVTSResponse> {
    const res = await api.post('/v1/he-thong-vts', data);
    return toSingle<HeThongVTSResponse>(res.data) || {} as HeThongVTSResponse;
  },

  async update(id: string, data: UpdateHeThongVTSRequest): Promise<HeThongVTSResponse> {
    const res = await api.put(`/v1/he-thong-vts/${id}`, data);
    return toSingle<HeThongVTSResponse>(res.data) || {} as HeThongVTSResponse;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/he-thong-vts/${id}`);
  },

  async getByStatus(status: string): Promise<HeThongVTSResponse[]> {
    const res = await api.get(`/v1/he-thong-vts/status-phe-duyet/${status}`);
    return toArray<HeThongVTSResponse>(res.data);
  },
};

export const heThongVTSApproval = {
  async approveC1(id: string, data: PheDuyetRequest): Promise<HeThongVTSResponse> {
    const res = await api.post(`/v1/he-thong-vts/${id}/approve/c1`, data);
    return toSingle<HeThongVTSResponse>(res.data) || {} as HeThongVTSResponse;
  },

  async approveC2(id: string, data: PheDuyetRequest): Promise<HeThongVTSResponse> {
    const res = await api.post(`/v1/he-thong-vts/${id}/approve/c2`, data);
    return toSingle<HeThongVTSResponse>(res.data) || {} as HeThongVTSResponse;
  },

  async getHistory(id: string): Promise<HistoryEntry[]> {
    const res = await api.get(`/v1/he-thong-vts/${id}/history`);
    return toArray<HistoryEntry>(res.data);
  },
};
