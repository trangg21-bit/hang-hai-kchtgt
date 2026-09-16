import api from './api';
import { toArray, toSingle } from './resilient';
import type {
  CoastalStationCospasSarsatResponse,
  CoastalStationCospasSarsatRequest,
  CoastalStationCospasSarsatHistoryResponse,
} from './station/types';

const BASE_PATH = '/v1/stations/cospas-sarsat';

function buildSearchParams(params: Record<string, string | number | boolean | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  return sp;
}

export interface CospasSarsatListParams {
  keyword?: string;
  name?: string;
  code?: string;
  orgUnitId?: string;
  operatingOrgId?: string;
  provinceId?: number;
  conditionStatus?: string;
  approvalStatus?: string;
  updatedFrom?: string;
  updatedTo?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface CospasSarsatSearchResponse {
  items: CoastalStationCospasSarsatResponse[];
  total: number;
  page: number;
  size: number;
  statusCounts: Record<string, number>;
}

export const cospasSarsatStationService = {
  async getById(id: string): Promise<CoastalStationCospasSarsatResponse> {
    const res = await api.get(`${BASE_PATH}/${id}`);
    return toSingle<CoastalStationCospasSarsatResponse>(res.data) || ({} as CoastalStationCospasSarsatResponse);
  },

  async search(params?: CospasSarsatListParams): Promise<CospasSarsatSearchResponse> {
    const sp = buildSearchParams({
      keyword: params?.keyword,
      name: params?.name,
      code: params?.code,
      orgUnitId: params?.orgUnitId,
      operatingOrgId: params?.operatingOrgId,
      provinceId: params?.provinceId,
      conditionStatus: params?.conditionStatus,
      approvalStatus: params?.approvalStatus,
      updatedFrom: params?.updatedFrom,
      updatedTo: params?.updatedTo,
      page: params?.page !== undefined ? Math.max(0, params.page > 0 ? params.page - 1 : 0) : 0,
      size: params?.size || 10,
      sort: params?.sort,
    });

    let listRes: any;
    try {
      listRes = await api.get(`${BASE_PATH}?${sp}`);
    } catch {
      try {
        listRes = await api.get(`${BASE_PATH}/list?${sp}`);
      } catch {
        listRes = await api.get(`${BASE_PATH}/search?${sp}`);
      }
    }

    const pageData = listRes.data || {};
    const content = Array.isArray(pageData) ? pageData : (pageData.content || pageData.items || pageData.data || []);
    const totalElements = pageData.totalElements ?? pageData.total ?? content.length;

    return {
      items: toArray<CoastalStationCospasSarsatResponse>(content),
      total: totalElements,
      page: (pageData.number !== undefined ? pageData.number + 1 : params?.page) || 1,
      size: pageData.size || params?.size || 10,
      statusCounts: pageData.statusCounts || {},
    };
  },

  async generateCode(): Promise<string> {
    try {
      const res = await api.get(`${BASE_PATH}/generate-code`);
      return res.data?.code || res.data?.data?.code || '';
    } catch {
      return '';
    }
  },

  async getOptions(orgUnitId?: string) {
    const sp = orgUnitId ? `?orgUnitId=${encodeURIComponent(orgUnitId)}` : '';
    const res = await api.get(`${BASE_PATH}/options${sp}`);
    return res.data || [];
  },

  async create(payload: CoastalStationCospasSarsatRequest, action = 'DRAFT'): Promise<CoastalStationCospasSarsatResponse> {
    try {
      const res = await api.post(`${BASE_PATH}?action=${action}`, payload);
      return res.data;
    } catch {
      const res = await api.post(BASE_PATH, payload);
      return res.data;
    }
  },

  async update(id: string, payload: CoastalStationCospasSarsatRequest, action?: string): Promise<CoastalStationCospasSarsatResponse> {
    const url = action ? `${BASE_PATH}/${id}?action=${action}` : `${BASE_PATH}/${id}`;
    const res = await api.put(url, payload);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_PATH}/${id}`);
  },

  async submit(id: string): Promise<CoastalStationCospasSarsatResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/submit`);
    return res.data;
  },

  async approveLevel1(id: string): Promise<CoastalStationCospasSarsatResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/approve-l1`);
    return res.data;
  },

  async approveLevel2(id: string): Promise<CoastalStationCospasSarsatResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/approve-l2`);
    return res.data;
  },

  async reject(id: string, rejectionReason: string): Promise<CoastalStationCospasSarsatResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/reject`, { rejectionReason });
    return res.data;
  },

  async getHistory(
    id: string,
    page?: number,
    pageSize?: number,
    filters?: { keyword?: string; fromDate?: string; toDate?: string }
  ): Promise<CoastalStationCospasSarsatHistoryResponse[]> {
    const sp = new URLSearchParams();
    if (page !== undefined) sp.set('page', String(page));
    if (pageSize !== undefined) sp.set('pageSize', String(pageSize));
    if (filters?.keyword) sp.set('keyword', filters.keyword);
    if (filters?.fromDate) sp.set('fromDate', filters.fromDate);
    if (filters?.toDate) sp.set('toDate', filters.toDate);
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    const res = await api.get(`${BASE_PATH}/${id}/history${qs}`);
    return toArray<CoastalStationCospasSarsatHistoryResponse>(res.data);
  },

  async getAttachments(id: string): Promise<any[]> {
    try {
      const res = await api.get(`${BASE_PATH}/${id}/attachments`);
      const data = res.data?.data || res.data;
      return toArray<any>(data);
    } catch {
      return [];
    }
  },

  async uploadAttachment(id: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('files', file);
    const res = await api.post(`${BASE_PATH}/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) {
      return data[0] || null;
    }
    return data;
  },

  async deleteAttachment(id: string, attId: string): Promise<void> {
    await api.delete(`${BASE_PATH}/${id}/attachments/${attId}`);
  },

  async downloadAttachment(id: string, attId: string, fileName?: string): Promise<void> {
    const res = await api.get(`${BASE_PATH}/${id}/attachments/${attId}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || 'attachment');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
