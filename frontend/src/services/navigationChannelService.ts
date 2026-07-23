import api from './api';
import { toArray, toSingle, toTotalCount } from './resilient';
import type {
  NavigationChannelResponse,
  CreateNavigationChannelRequest,
  UpdateNavigationChannelRequest,
  PheDuyetRequest,
  HistoryEntry,
  ListParams,
  SearchResponse,
} from '../types/navigationChannel';

export const navigationChannelCRUD = {
  async list(params?: ListParams): Promise<{ items: NavigationChannelResponse[]; total: number }> {
    const res = await api.get('/v1/navigation-channel', {
      params: {
        page: params?.page || 0,
        size: params?.size || 20,
      },
    });
    return {
      items: toArray<NavigationChannelResponse>(res.data),
      total: toTotalCount(res.data, 0),
    };
  },

  async search(params?: ListParams): Promise<SearchResponse<NavigationChannelResponse>> {
    const res = await api.get('/v1/navigation-channel/search', {
      params: {
        orgUnitId: params?.orgUnitId,
        keyword: params?.keyword,
        channelCode: params?.channelCode,
        approvalStatus: params?.approvalStatus,
        page: params?.page || 0,
        size: params?.size || 20,
      },
    });
    const data = res.data || {};
    const items = toArray<NavigationChannelResponse>(data);
    return {
      items,
      total: toTotalCount(data, items.length),
      page: params?.page || 0,
      size: params?.size || 20,
    };
  },

  async getById(id: string): Promise<NavigationChannelResponse> {
    const res = await api.get(`/v1/navigation-channel/${id}`);
    return toSingle<NavigationChannelResponse>(res.data) || {} as NavigationChannelResponse;
  },

  async create(data: CreateNavigationChannelRequest): Promise<NavigationChannelResponse> {
    const res = await api.post('/v1/navigation-channel', data);
    return toSingle<NavigationChannelResponse>(res.data) || {} as NavigationChannelResponse;
  },

  async update(id: string, data: UpdateNavigationChannelRequest): Promise<NavigationChannelResponse> {
    const res = await api.put(`/v1/navigation-channel/${id}`, data);
    return toSingle<NavigationChannelResponse>(res.data) || {} as NavigationChannelResponse;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/navigation-channel/${id}`);
  },

  async getByStatus(status: string): Promise<NavigationChannelResponse[]> {
    const res = await api.get(`/v1/navigation-channel/status-phe-duyet/${status}`);
    return toArray<NavigationChannelResponse>(res.data);
  },
};

export const navigationChannelApproval = {
  async approveC1(id: string, data: PheDuyetRequest): Promise<NavigationChannelResponse> {
    const res = await api.post(`/v1/navigation-channel/${id}/approve/c1`, data);
    return toSingle<NavigationChannelResponse>(res.data) || {} as NavigationChannelResponse;
  },

  async approveC2(id: string, data: PheDuyetRequest): Promise<NavigationChannelResponse> {
    const res = await api.post(`/v1/navigation-channel/${id}/approve/c2`, data);
    return toSingle<NavigationChannelResponse>(res.data) || {} as NavigationChannelResponse;
  },

  async getHistory(id: string): Promise<HistoryEntry[]> {
    const res = await api.get(`/v1/navigation-channel/${id}/history`);
    return toArray<HistoryEntry>(res.data);
  },
};
