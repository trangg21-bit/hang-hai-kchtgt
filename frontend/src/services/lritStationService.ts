import api from './api';
import { toArray, toSingle } from './resilient';
import type {
  LritStationItem,
  CreateLritStationRequest,
  UpdateLritStationRequest,
  LritStationListParams,
  LritStationSearchResponse,
} from '../types/lritStation';
import type { HistoryEntry } from '../types/radarStation';

const BASE_PATH = '/v1/stations/lrit';

function buildSearchParams(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  return sp;
}

export const lritStationService = {
  async getById(id: string): Promise<LritStationItem> {
    const res = await api.get(`${BASE_PATH}/${id}`);
    return toSingle<LritStationItem>(res.data?.data || res.data) || ({} as LritStationItem);
  },

  async search(params?: LritStationListParams): Promise<LritStationSearchResponse> {
    const sp = buildSearchParams({
      keyword: params?.keyword,
      orgUnitId: params?.orgUnitId,
      operatingOrgId: params?.operatingOrgId,
      provinceId: params?.provinceId,
      conditionStatus: params?.conditionStatus,
      approvalStatus: params?.approvalStatus,
      updatedBy: params?.updatedBy,
      updatedFrom: params?.updatedFrom,
      updatedTo: params?.updatedTo,
      page: params?.page !== undefined ? Math.max(0, params.page > 0 ? params.page - 1 : 0) : 0,
      size: params?.size || 20,
      sortBy: params?.sortBy,
      sortDir: params?.sortDir,
    });
    const [res, countsRes] = await Promise.all([
      api.get(`${BASE_PATH}?${sp}`),
      api.get(`${BASE_PATH}/counts?${sp}`),
    ]);
    const data = res.data?.data || res.data || {};
    const items = data.content || (Array.isArray(data) ? data : []);
    const total = data.totalElements ?? items.length;
    const counts = countsRes.data?.data || countsRes.data || {};

    return {
      items,
      total,
      page: (data.number ?? 0) + 1,
      size: data.size ?? (params?.size || 20),
      statusCounts: counts,
    };
  },

  async getCounts(params?: { orgUnitId?: string; keyword?: string; conditionStatus?: string }): Promise<Record<string, number>> {
    const sp = buildSearchParams({
      orgUnitId: params?.orgUnitId,
      keyword: params?.keyword,
      conditionStatus: params?.conditionStatus,
    });
    const res = await api.get(`${BASE_PATH}/counts?${sp}`);
    return res.data?.data || res.data || {};
  },

  async getOptions(orgUnitId?: string): Promise<LritStationItem[]> {
    const sp = buildSearchParams({ orgUnitId });
    const res = await api.get(`${BASE_PATH}/options?${sp}`);
    return toArray<LritStationItem>(res.data?.data || res.data);
  },

  async create(data: CreateLritStationRequest, action = 'DRAFT'): Promise<LritStationItem> {
    const res = await api.post(`${BASE_PATH}?action=${action}`, data);
    return toSingle<LritStationItem>(res.data?.data || res.data) || ({} as LritStationItem);
  },

  async update(id: string, data: UpdateLritStationRequest): Promise<LritStationItem> {
    const res = await api.put(`${BASE_PATH}/${id}`, data);
    return toSingle<LritStationItem>(res.data?.data || res.data) || ({} as LritStationItem);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_PATH}/${id}`);
  },

  async submit(id: string): Promise<LritStationItem> {
    const res = await api.post(`${BASE_PATH}/${id}/submit`);
    return toSingle<LritStationItem>(res.data?.data || res.data) || ({} as LritStationItem);
  },

  async approveC1(id: string): Promise<LritStationItem> {
    const res = await api.post(`${BASE_PATH}/${id}/approve-c1`);
    return toSingle<LritStationItem>(res.data?.data || res.data) || ({} as LritStationItem);
  },

  async approveC2(id: string): Promise<LritStationItem> {
    const res = await api.post(`${BASE_PATH}/${id}/approve-c2`);
    return toSingle<LritStationItem>(res.data?.data || res.data) || ({} as LritStationItem);
  },

  async reject(id: string, reason: string): Promise<LritStationItem> {
    const res = await api.post(`${BASE_PATH}/${id}/reject`, { reason });
    return toSingle<LritStationItem>(res.data?.data || res.data) || ({} as LritStationItem);
  },

  async getHistory(id: string): Promise<HistoryEntry[]> {
    const res = await api.get(`${BASE_PATH}/${id}/history`);
    return toArray<HistoryEntry>(res.data?.data || res.data);
  },
};
