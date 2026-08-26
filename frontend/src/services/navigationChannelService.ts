import api from './api';
import { toArray, toSingle, toTotalCount } from './resilient';
import type {
  NavigationChannelResponse,
  NavigationChannelOptionResponse,
  CreateNavigationChannelRequest,
  UpdateNavigationChannelRequest,
  HistoryEntry,
  ListParams,
  SearchResponse,
} from '../types/navigationChannel';

const BASE_PATH = '/v1/navigation-channel';

function buildSearchParams(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  return sp;
}

export const navigationChannelCRUD = {
  async getById(id: string): Promise<NavigationChannelResponse> {
    const res = await api.get(`${BASE_PATH}/${id}`);
    return toSingle<NavigationChannelResponse>(res.data) || ({} as NavigationChannelResponse);
  },

  async getOptions(orgUnitId?: string): Promise<NavigationChannelOptionResponse[]> {
    const sp = buildSearchParams({ orgUnitId });
    const res = await api.get(`${BASE_PATH}/options?${sp}`);
    return toArray<NavigationChannelOptionResponse>(res.data);
  },

  async getTabCounts(orgUnitId?: string, keyword?: string, status?: number): Promise<Record<string, number>> {
    const sp = buildSearchParams({ orgUnitId, keyword, status });
    const res = await api.get(`${BASE_PATH}/tab-counts?${sp}`);
    return toSingle<Record<string, number>>(res.data) || {};
  },

  async searchPaged(params?: ListParams): Promise<SearchResponse<NavigationChannelResponse>> {
    const sp = buildSearchParams({
      keyword: params?.keyword,
      orgUnitId: params?.orgUnitId,
      seaportId: params?.seaportId,
      status: params?.status,
      approvalStatus: params?.approvalStatus,
      updatedBy: params?.updatedBy,
      updatedFrom: params?.updatedFrom,
      updatedTo: params?.updatedTo,
      page: params?.page !== undefined ? Math.max(0, params.page > 0 ? params.page - 1 : 0) : 0,
      size: params?.size || 20,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
    });
    const res = await api.get(`${BASE_PATH}/search-paged?${sp}`);
    const pageData = res.data?.data;
    return {
      items: toArray<NavigationChannelResponse>(res.data),
      total: toTotalCount(res.data, 0),
      page: (pageData?.number ?? 0) + 1,
      size: pageData?.size ?? (params?.size || 20),
    };
  },

  async generateCode(): Promise<{ code: string }> {
    const res = await api.get(`${BASE_PATH}/generate-code`);
    return toSingle<{ code: string }>(res.data) || { code: '' };
  },

  async create(data: CreateNavigationChannelRequest): Promise<NavigationChannelResponse> {
    const res = await api.post(BASE_PATH, data);
    return toSingle<NavigationChannelResponse>(res.data) || ({} as NavigationChannelResponse);
  },

  async update(id: string, data: UpdateNavigationChannelRequest): Promise<NavigationChannelResponse> {
    const res = await api.put(`${BASE_PATH}/${id}`, data);
    return toSingle<NavigationChannelResponse>(res.data) || ({} as NavigationChannelResponse);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};

export const navigationChannelApproval = {
  async submitForApproval(id: string): Promise<NavigationChannelResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/submit`);
    return toSingle<NavigationChannelResponse>(res.data) || ({} as NavigationChannelResponse);
  },

  async approveLevel1(id: string, note?: string): Promise<NavigationChannelResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/approvec1`, null, {
      params: { note },
    });
    return toSingle<NavigationChannelResponse>(res.data) || ({} as NavigationChannelResponse);
  },

  async approveLevel2(id: string, note?: string): Promise<NavigationChannelResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/approvec2`, null, {
      params: { note },
    });
    return toSingle<NavigationChannelResponse>(res.data) || ({} as NavigationChannelResponse);
  },

  async rejectLevel1(id: string, reason: string): Promise<NavigationChannelResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/rejectc1`, null, {
      params: { reason },
    });
    return toSingle<NavigationChannelResponse>(res.data) || ({} as NavigationChannelResponse);
  },

  async rejectLevel2(id: string, reason: string): Promise<NavigationChannelResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/rejectc2`, null, {
      params: { reason },
    });
    return toSingle<NavigationChannelResponse>(res.data) || ({} as NavigationChannelResponse);
  },

  async getHistory(id: string): Promise<HistoryEntry[]> {
    const res = await api.get(`${BASE_PATH}/${id}/history`);
    return toArray<HistoryEntry>(res.data);
  },
};
