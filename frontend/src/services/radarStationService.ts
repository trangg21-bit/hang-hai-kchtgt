import api from './api';
import { toArray, toSingle, toTotalCount } from './resilient';
import type {
  RadarStationResponse,
  RadarStationAttachment,
  RadarStationOptionResponse,
  CreateRadarStationRequest,
  UpdateRadarStationRequest,
  HistoryEntry,
  ListParams,
} from '../types/radarStation';

const BASE_PATH = '/v1/radar-station';

function buildSearchParams(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  return sp;
}

export interface SearchResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export const radarStationCRUD = {
  async getById(id: string): Promise<RadarStationResponse> {
    const res = await api.get(`${BASE_PATH}/${id}`);
    return toSingle<RadarStationResponse>(res.data) || ({} as RadarStationResponse);
  },

  async getOptions(orgUnitId?: string): Promise<RadarStationOptionResponse[]> {
    const sp = buildSearchParams({ orgUnitId });
    const res = await api.get(`${BASE_PATH}/options?${sp}`);
    return toArray<RadarStationOptionResponse>(res.data);
  },

  async getTabCounts(orgUnitId?: string, keyword?: string, conditionStatus?: string): Promise<Record<string, number>> {
    const sp = buildSearchParams({ orgUnitId, keyword, conditionStatus });
    const res = await api.get(`${BASE_PATH}/tab-counts?${sp}`);
    return toSingle<Record<string, number>>(res.data) || {};
  },

  async search(params?: any): Promise<any> {
    return radarStationCRUD.searchPaged(params);
  },

  async searchPaged(params?: ListParams): Promise<SearchResponse<RadarStationResponse>> {
    const sp = buildSearchParams({
      keyword: params?.keyword,
      orgUnitId: params?.orgUnitId,
      seaportId: params?.seaportId,
      vtsSystemId: params?.vtsSystemId,
      vtsOperationCenterId: params?.vtsOperationCenterId,
      operatingUnitId: params?.operatingUnitId,
      provinceId: params?.provinceId,
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
      items: toArray<RadarStationResponse>(res.data),
      total: toTotalCount(res.data, 0),
      page: (pageData?.number ?? 0) + 1,
      size: pageData?.size ?? (params?.size || 20),
    };
  },

  async generateCode(): Promise<{ code: string }> {
    const res = await api.get(`${BASE_PATH}/generate-code`);
    return toSingle<{ code: string }>(res.data) || { code: '' };
  },

  async create(data: CreateRadarStationRequest): Promise<RadarStationResponse> {
    const res = await api.post(BASE_PATH, data);
    return toSingle<RadarStationResponse>(res.data) || ({} as RadarStationResponse);
  },

  async update(id: string, data: UpdateRadarStationRequest): Promise<RadarStationResponse> {
    const res = await api.put(`${BASE_PATH}/${id}`, data);
    return toSingle<RadarStationResponse>(res.data) || ({} as RadarStationResponse);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};

export const radarStationApproval = {
  async submitForApproval(id: string): Promise<RadarStationResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/submit`);
    return toSingle<RadarStationResponse>(res.data) || ({} as RadarStationResponse);
  },

  async approveLevel1(id: string, note?: string): Promise<RadarStationResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/approvec1`, null, {
      params: { note },
    });
    return toSingle<RadarStationResponse>(res.data) || ({} as RadarStationResponse);
  },

  async approveLevel2(id: string, note?: string): Promise<RadarStationResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/approvec2`, null, {
      params: { note },
    });
    return toSingle<RadarStationResponse>(res.data) || ({} as RadarStationResponse);
  },

  async rejectLevel1(id: string, reason: string): Promise<RadarStationResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/rejectc1`, null, {
      params: { reason },
    });
    return toSingle<RadarStationResponse>(res.data) || ({} as RadarStationResponse);
  },

  async rejectLevel2(id: string, reason: string): Promise<RadarStationResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/rejectc2`, null, {
      params: { reason },
    });
    return toSingle<RadarStationResponse>(res.data) || ({} as RadarStationResponse);
  },

  // Legacy aliases
  async approveL1(id: string, _approverId?: string): Promise<RadarStationResponse> {
    return this.approveLevel1(id);
  },

  async reject(id: string, rejectReason: string, _approverId?: string): Promise<RadarStationResponse> {
    return this.rejectLevel1(id, rejectReason);
  },

  async getHistory(id: string, page?: number, pageSize?: number, filters?: { keyword?: string; fromDate?: string; toDate?: string }): Promise<HistoryEntry[]> {
    const sp = new URLSearchParams();
    if (page !== undefined && page !== null) sp.set('page', String(page));
    if (pageSize !== undefined && pageSize !== null) sp.set('pageSize', String(pageSize));
    if (filters?.keyword?.trim()) sp.set('keyword', filters.keyword.trim());
    if (filters?.fromDate) sp.set('fromDate', filters.fromDate);
    if (filters?.toDate) sp.set('toDate', filters.toDate);
    const query = sp.toString() ? `?${sp.toString()}` : '';
    const res = await api.get(`${BASE_PATH}/${id}/history${query}`);
    return toArray<HistoryEntry>(res.data);
  },
};

export const radarStationAttachment = {
  async list(id: string): Promise<RadarStationAttachment[]> {
    const res = await api.get(`${BASE_PATH}/${id}/attachments`);
    return toArray<RadarStationAttachment>(res.data);
  },

  async upload(id: string, files: File | File[]): Promise<RadarStationAttachment[]> {
    const fileList = Array.isArray(files) ? files : [files];
    const formData = new FormData();
    fileList.forEach((f) => formData.append('files', f));
    const res = await api.post(`${BASE_PATH}/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return toArray<RadarStationAttachment>(res.data);
  },

  async delete(id: string, attachmentId: string): Promise<void> {
    await api.delete(`${BASE_PATH}/${id}/attachments/${attachmentId}`);
  },

  async remove(id: string, attachmentId: string): Promise<void> {
    return this.delete(id, attachmentId);
  },
};

export const radarStationService = radarStationCRUD;
export default radarStationCRUD;
