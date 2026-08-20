import api from './api';
import { toArray, toSingle, toTotalCount } from './resilient';
import type {
  RadarStationResponse,
  RadarStationAttachment,
  CreateRadarStationRequest,
  UpdateRadarStationRequest,
  ApprovalRequest,
  HistoryEntry,
  ListParams,
  SearchResponse,
  GenerateCodeResponse,
} from '../types/radarStation';

const BASE_PATH = '/v1/radar-station';

// Helper: bỏ undefined/empty, page 1-based → 0-based, size mặc định 20.
function buildSearchParams(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  return sp;
}

export const radarStationCRUD = {
  async getById(id: string): Promise<RadarStationResponse> {
    const res = await api.get(`${BASE_PATH}/${id}`);
    return toSingle<RadarStationResponse>(res.data) || {} as RadarStationResponse;
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
      approvalStatus: params?.approvalStatus,
      updatedBy: params?.updatedBy,
      updatedFrom: params?.updatedFrom,
      updatedTo: params?.updatedTo,
      page: params?.page !== undefined ? params.page - 1 : 0,
      size: params?.size || 20,
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

  async generateCode(): Promise<GenerateCodeResponse> {
    const res = await api.get(`${BASE_PATH}/generate-code`);
    return toSingle<GenerateCodeResponse>(res.data) || { code: '' };
  },

  async create(data: CreateRadarStationRequest): Promise<RadarStationResponse> {
    const res = await api.post(BASE_PATH, data);
    return toSingle<RadarStationResponse>(res.data) || {} as RadarStationResponse;
  },

  async update(id: string, data: UpdateRadarStationRequest): Promise<RadarStationResponse> {
    const res = await api.put(`${BASE_PATH}/${id}`, data);
    return toSingle<RadarStationResponse>(res.data) || {} as RadarStationResponse;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};

export const radarStationApproval = {
  async approveC1(id: string, data: ApprovalRequest): Promise<RadarStationResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/approve/c1`, data);
    return toSingle<RadarStationResponse>(res.data) || {} as RadarStationResponse;
  },

  async approveC2(id: string, data: ApprovalRequest): Promise<RadarStationResponse> {
    const res = await api.post(`${BASE_PATH}/${id}/approve/c2`, data);
    return toSingle<RadarStationResponse>(res.data) || {} as RadarStationResponse;
  },

  async getHistory(id: string): Promise<HistoryEntry[]> {
    const res = await api.get(`${BASE_PATH}/${id}/history`);
    return toArray<HistoryEntry>(res.data);
  },
};

export const radarStationAttachment = {
  async upload(id: string, file: File): Promise<RadarStationAttachment> {
    const formData = new FormData();
    formData.append('files', file);
    const res = await api.post(`${BASE_PATH}/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data || {} as RadarStationAttachment;
  },

  async list(id: string): Promise<RadarStationAttachment[]> {
    const res = await api.get(`${BASE_PATH}/${id}/attachments`);
    return toArray<RadarStationAttachment>(res.data);
  },

  async remove(id: string, attachmentId: string): Promise<void> {
    await api.delete(`${BASE_PATH}/${id}/attachments/${attachmentId}`);
  },
};
