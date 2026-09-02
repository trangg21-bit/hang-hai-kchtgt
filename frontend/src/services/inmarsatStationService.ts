import api from './api';
import { toArray, toSingle } from './resilient';
import type {
  CoastalStationInmarsatResponse,
  CoastalStationInmarsatRequest,
  CoastalStationInmarsatUpdateRequest,
  CoastalStationInmarsatHistoryResponse,
  CoastalStationInmarsatOptionResponse,
} from './station/types';

const BASE_PATH = '/v1/stations/inmarsat';

function buildSearchParams(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  return sp;
}

export interface InmarsatListParams {
  keyword?: string;
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

export interface InmarsatSearchResponse {
  items: CoastalStationInmarsatResponse[];
  total: number;
  page: number;
  size: number;
  statusCounts: Record<string, number>;
}

export const inmarsatStationService = {
  async getById(id: string): Promise<CoastalStationInmarsatResponse> {
    const res = await api.get(`${BASE_PATH}/${id}`);
    return toSingle<CoastalStationInmarsatResponse>(res.data) || ({} as CoastalStationInmarsatResponse);
  },

  async search(params?: InmarsatListParams): Promise<InmarsatSearchResponse> {
    const sp = buildSearchParams({
      keyword: params?.keyword,
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

    const listRes = await api.get(`${BASE_PATH}?${sp}`);

    const pageData = listRes.data || {};
    const content = Array.isArray(pageData) ? pageData : (pageData.content || pageData.items || pageData.data || []);
    const totalElements = pageData.totalElements ?? pageData.total ?? content.length;

    return {
      items: toArray<CoastalStationInmarsatResponse>(content),
      total: totalElements,
      page: (pageData.number !== undefined ? pageData.number + 1 : params?.page) || 1,
      size: pageData.size || params?.size || 10,
      statusCounts: pageData.statusCounts || {},
    };
  },



  async create(payload: CoastalStationInmarsatRequest): Promise<CoastalStationInmarsatResponse> {
    const res = await api.post(BASE_PATH, payload);
    return res.data;
  },

  async update(id: string, payload: CoastalStationInmarsatUpdateRequest): Promise<CoastalStationInmarsatResponse> {
    const res = await api.put(`${BASE_PATH}/${id}`, payload);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_PATH}/${id}`);
  },

  async submit(id: string): Promise<CoastalStationInmarsatResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/submit`);
    return res.data;
  },

  async approveL1(id: string): Promise<CoastalStationInmarsatResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/approve-l1`);
    return res.data;
  },

  async approveL2(id: string): Promise<CoastalStationInmarsatResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/approve-l2`);
    return res.data;
  },

  async reject(id: string, rejectionReason: string): Promise<CoastalStationInmarsatResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/reject`, { rejectionReason, note: rejectionReason });
    return res.data;
  },

  async getHistory(id: string): Promise<CoastalStationInmarsatHistoryResponse[]> {
    const res = await api.get(`${BASE_PATH}/${id}/history`);
    return toArray<CoastalStationInmarsatHistoryResponse>(res.data);
  },

  async getOptions(orgUnitId?: string): Promise<CoastalStationInmarsatOptionResponse[]> {
    const sp = buildSearchParams({ orgUnitId });
    const res = await api.get(`${BASE_PATH}/options?${sp}`);
    return toArray<CoastalStationInmarsatOptionResponse>(res.data);
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
    return res.data?.data || res.data;
  },

  async deleteAttachment(id: string, attId: string): Promise<void> {
    await api.delete(`${BASE_PATH}/${id}/attachments/${attId}`);
  },

  async downloadAttachment(id: string, attId: string, fileName?: string): Promise<void> {
    const res = await api.get(`${BASE_PATH}/${id}/attachments/${attId}/download`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'attachment';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  async generateCode(): Promise<{ code: string }> {
    try {
      const res = await api.get(`${BASE_PATH}/generate-code`);
      return res.data?.data || res.data || { code: '' };
    } catch {
      return { code: '' };
    }
  },
};
