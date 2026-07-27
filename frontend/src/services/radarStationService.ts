import api from './api';
import { toArray, toSingle, toTotalCount } from './resilient';
import type {
  RadarStationResponse,
  CreateRadarStationRequest,
  UpdateRadarStationRequest,
  ApprovalRequest,
  HistoryEntry,
  ListParams,
  SearchResponse,
} from '../types/radarStation';

export const radarStationCRUD = {
  async list(params?: ListParams): Promise<{ items: RadarStationResponse[]; total: number }> {
    const res = await api.get('/v1/radar-station', {
      params: {
        page: params?.page || 0,
        size: params?.size || 20,
      },
    });
    return {
      items: toArray<RadarStationResponse>(res.data),
      total: toTotalCount(res.data, 0),
    };
  },

  async search(params?: ListParams): Promise<SearchResponse<RadarStationResponse>> {
    const res = await api.get('/v1/radar-station/search', {
      params: {
        orgUnitId: params?.orgUnitId,
        keyword: params?.keyword,
        conditionStatus: params?.conditionStatus,
        approvalStatus: params?.approvalStatus,
      },
    });
    const data = res.data || {};
    const items = toArray<RadarStationResponse>(data);
    return {
      items,
      total: toTotalCount(data, items.length),
      page: params?.page || 0,
      size: params?.size || 20,
    };
  },

  async getById(id: string): Promise<RadarStationResponse> {
    const res = await api.get(`/v1/radar-station/${id}`);
    return toSingle<RadarStationResponse>(res.data) || {} as RadarStationResponse;
  },

  async create(data: CreateRadarStationRequest): Promise<RadarStationResponse> {
    const res = await api.post('/v1/radar-station', data);
    return toSingle<RadarStationResponse>(res.data) || {} as RadarStationResponse;
  },

  async update(id: string, data: UpdateRadarStationRequest): Promise<RadarStationResponse> {
    const res = await api.put(`/v1/radar-station/${id}`, data);
    return toSingle<RadarStationResponse>(res.data) || {} as RadarStationResponse;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/radar-station/${id}`);
  },

  async getByStatus(status: string): Promise<RadarStationResponse[]> {
    const res = await api.get(`/v1/radar-station/approval-status/${status}`);
    return toArray<RadarStationResponse>(res.data);
  },
};

export const radarStationApproval = {
  async approveC1(id: string, data: ApprovalRequest): Promise<RadarStationResponse> {
    const res = await api.post(`/v1/radar-station/${id}/approve/c1`, data);
    return toSingle<RadarStationResponse>(res.data) || {} as RadarStationResponse;
  },

  async approveC2(id: string, data: ApprovalRequest): Promise<RadarStationResponse> {
    const res = await api.post(`/v1/radar-station/${id}/approve/c2`, data);
    return toSingle<RadarStationResponse>(res.data) || {} as RadarStationResponse;
  },

  async getHistory(id: string): Promise<HistoryEntry[]> {
    const res = await api.get(`/v1/radar-station/${id}/history`);
    return toArray<HistoryEntry>(res.data);
  },
};
