import api from './api';
import { toArray, toSingle, toTotalCount } from './resilient';
import type {
  NavigationChannelResponse,
  CreateNavigationChannelRequest,
  UpdateNavigationChannelRequest,
  ApprovalRequest,
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
        seaportId: params?.seaportId,
        provinceId: params?.provinceId,
        conditionStatus: params?.conditionStatus,
        approvalStatus: params?.approvalStatus,
        updatedFrom: params?.updatedFrom,
        updatedTo: params?.updatedTo,
        updatedBy: params?.updatedBy,
        sortField: params?.sortField,
        sortOrder: params?.sortOrder,
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
    const res = await api.get(`/v1/navigation-channel/approval-status/${status}`);
    return toArray<NavigationChannelResponse>(res.data);
  },
};

export const navigationChannelApproval = {
  // Gửi phê duyệt (#50/#51) — design plan mục 6.4 (WO-FE-4)
  async submitApproval(id: string): Promise<NavigationChannelResponse> {
    const res = await api.post(`/v1/navigation-channel/${id}/submit-approval`);
    return toSingle<NavigationChannelResponse>(res.data) || {} as NavigationChannelResponse;
  },

  async approveC1(id: string, data: ApprovalRequest): Promise<NavigationChannelResponse> {
    const res = await api.post(`/v1/navigation-channel/${id}/approve/c1`, data);
    return toSingle<NavigationChannelResponse>(res.data) || {} as NavigationChannelResponse;
  },

  async approveC2(id: string, data: ApprovalRequest): Promise<NavigationChannelResponse> {
    const res = await api.post(`/v1/navigation-channel/${id}/approve/c2`, data);
    return toSingle<NavigationChannelResponse>(res.data) || {} as NavigationChannelResponse;
  },

  // Trả về cấp 1 (#54) — design plan mục 6.4
  async rejectLevel1(id: string, data: ApprovalRequest): Promise<NavigationChannelResponse> {
    const res = await api.post(`/v1/navigation-channel/${id}/reject-level-1`, data);
    return toSingle<NavigationChannelResponse>(res.data) || {} as NavigationChannelResponse;
  },

  // Trả về cấp 2 (#57) — design plan mục 6.4
  async rejectLevel2(id: string, data: ApprovalRequest): Promise<NavigationChannelResponse> {
    const res = await api.post(`/v1/navigation-channel/${id}/reject-level-2`, data);
    return toSingle<NavigationChannelResponse>(res.data) || {} as NavigationChannelResponse;
  },

  async getHistory(id: string): Promise<HistoryEntry[]> {
    const res = await api.get(`/v1/navigation-channel/${id}/history`);
    return toArray<HistoryEntry>(res.data);
  },
};
