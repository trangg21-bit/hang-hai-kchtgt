import api from './api';
import { toArray, toSingle, toTotalCount } from './resilient';
import type {
  DikeRevetmentResponse,
  DikeRevetmentOptionResponse,
  CreateDikeRevetmentRequest,
  UpdateDikeRevetmentRequest,
  HistoryEntry,
  DikeRevetmentType,
} from '../types/dikeRevetment';

const BASE_PATH = '/v1/dike-revetment';

function buildSearchParams(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  return sp;
}

export interface ListParams {
  keyword?: string;
  orgUnitId?: string;
  seaportId?: string;
  dikeRevetmentType?: DikeRevetmentType;
  conditionStatus?: string;
  approvalStatus?: string;
  status?: string;
  updatedBy?: string;
  updatedFrom?: string;
  updatedTo?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface SearchResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export const dikeRevetmentCRUD = {
  async getById(id: string): Promise<DikeRevetmentResponse> {
    const res = await api.get(`${BASE_PATH}/${id}`);
    return toSingle<DikeRevetmentResponse>(res.data) || ({} as DikeRevetmentResponse);
  },

  async getOptions(orgUnitId?: string): Promise<DikeRevetmentOptionResponse[]> {
    const sp = buildSearchParams({ orgUnitId });
    const res = await api.get(`${BASE_PATH}/options?${sp}`);
    return toArray<DikeRevetmentOptionResponse>(res.data);
  },

  async getTabCounts(orgUnitId?: string, keyword?: string, conditionStatus?: string): Promise<Record<string, number>> {
    const sp = buildSearchParams({ orgUnitId, keyword, conditionStatus });
    const res = await api.get(`${BASE_PATH}/tab-counts?${sp}`);
    return toSingle<Record<string, number>>(res.data) || {};
  },

  async search(params?: any): Promise<any> {
    return dikeRevetmentCRUD.searchPaged(params);
  },

  async searchPaged(params?: ListParams): Promise<SearchResponse<DikeRevetmentResponse>> {
    const sp = buildSearchParams({
      keyword: params?.keyword,
      orgUnitId: params?.orgUnitId,
      seaportId: params?.seaportId,
      dikeRevetmentType: params?.dikeRevetmentType,
      conditionStatus: params?.conditionStatus,
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
      items: toArray<DikeRevetmentResponse>(res.data),
      total: toTotalCount(res.data, 0),
      page: (pageData?.number ?? 0) + 1,
      size: pageData?.size ?? (params?.size || 20),
    };
  },

  async generateCode(): Promise<{ code: string }> {
    const res = await api.get(`${BASE_PATH}/generate-code`);
    return toSingle<{ code: string }>(res.data) || { code: '' };
  },

  async create(data: CreateDikeRevetmentRequest): Promise<DikeRevetmentResponse> {
    const res = await api.post(BASE_PATH, data);
    return toSingle<DikeRevetmentResponse>(res.data) || ({} as DikeRevetmentResponse);
  },

  async update(id: string, data: UpdateDikeRevetmentRequest): Promise<DikeRevetmentResponse> {
    const res = await api.put(`${BASE_PATH}/${id}`, data);
    return toSingle<DikeRevetmentResponse>(res.data) || ({} as DikeRevetmentResponse);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};

export const dikeRevetmentApproval = {
  async submitForApproval(id: string): Promise<DikeRevetmentResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/submit`);
    return toSingle<DikeRevetmentResponse>(res.data) || ({} as DikeRevetmentResponse);
  },

  async approveLevel1(id: string, note?: string): Promise<DikeRevetmentResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/approvec1`, null, {
      params: { note },
    });
    return toSingle<DikeRevetmentResponse>(res.data) || ({} as DikeRevetmentResponse);
  },

  async approveLevel2(id: string, note?: string): Promise<DikeRevetmentResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/approvec2`, null, {
      params: { note },
    });
    return toSingle<DikeRevetmentResponse>(res.data) || ({} as DikeRevetmentResponse);
  },

  async rejectLevel1(id: string, reason: string): Promise<DikeRevetmentResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/rejectc1`, null, {
      params: { reason },
    });
    return toSingle<DikeRevetmentResponse>(res.data) || ({} as DikeRevetmentResponse);
  },

  async rejectLevel2(id: string, reason: string): Promise<DikeRevetmentResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/rejectc2`, null, {
      params: { reason },
    });
    return toSingle<DikeRevetmentResponse>(res.data) || ({} as DikeRevetmentResponse);
  },

  async getHistory(id: string): Promise<HistoryEntry[]> {
    const res = await api.get(`${BASE_PATH}/${id}/history`);
    return toArray<HistoryEntry>(res.data);
  },
};
