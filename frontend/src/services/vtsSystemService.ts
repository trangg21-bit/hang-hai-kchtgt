import api from './api';
import { toArray, toSingle, toTotalCount } from './resilient';
import { DEFAULT_OPERATING_ORGANIZATIONS } from './operatingOrganizationsData';
import type {
  VtsSystemResponse,
  VtsSystemAttachment,
  VtsSystemListItem,
  CreateVtsSystemRequest,
  UpdateVtsSystemRequest,
  ApprovalRequest,
  HistoryEntry,
  ListParams,
  SearchResponse,
  VtsZoneDto,
} from '../types/vtsSystem';

import { organizationService } from './organizationService';
import { portCRUD } from './portService';
import { MOCK_ORGANIZATIONS } from './mockData';

const VTS_BASE_PATH = '/v1/vts-system';
const COMMON_OPTIONS_BASE_PATH = '/common/options';

const inFlightGetByIdPromises = new Map<string, Promise<VtsSystemResponse>>();
let inFlightListPromise: { key: string; promise: Promise<{ items: VtsSystemListItem[]; total: number; statusCounts: Record<string, number> }> } | null = null;
let cachedOperatingOrgs: Array<{ id: string; name: string; code: string }> | null = null;

export const vtsSystemCRUD = {
  async getScopedOrgUnitOptions(): Promise<Array<{ id: string; name: string; code?: string; path?: string; parentId?: string }>> {
    try {
      const orgs = await organizationService.getAll();
      if (Array.isArray(orgs) && orgs.length > 0) return orgs;
    } catch {
      // ignore
    }
    return MOCK_ORGANIZATIONS;
  },

  async getScopedPortOptions(): Promise<Array<{ id: string; portCode?: string; portName?: string; orgUnitId?: string }>> {
    return portCRUD.getOptions();
  },

  async getOperatingOrganizationOptions(): Promise<Array<{ id: string; name: string; code: string }>> {
    if (cachedOperatingOrgs && cachedOperatingOrgs.length > 0) {
      return cachedOperatingOrgs;
    }
    try {
      const res = await api.get(`${COMMON_OPTIONS_BASE_PATH}/operating-organizations`);
      const data = res.data?.data;
      if (Array.isArray(data) && data.length > 0) {
        cachedOperatingOrgs = data;
        return data;
      }
    } catch {
      // ignore
    }
    cachedOperatingOrgs = DEFAULT_OPERATING_ORGANIZATIONS;
    return DEFAULT_OPERATING_ORGANIZATIONS;
  },

  async getOptions(params?: { orgUnitId?: string }): Promise<Array<{ id: string; name: string; code?: string; orgUnitId?: string }>> {
    try {
      const res = await api.get(`${VTS_BASE_PATH}/options`, {
        params: {
          orgUnitId: params?.orgUnitId,
        },
      });
      const data = res.data?.data ?? res.data;
      if (Array.isArray(data)) {
        return data.map((s: any) => ({
          id: String(s.id),
          name: s.name || s.systemName || s.code || '',
          code: s.code || '',
          orgUnitId: s.orgUnitId ? String(s.orgUnitId) : undefined,
        }));
      }
      return [];
    } catch {
      try {
        const res = await api.get(VTS_BASE_PATH, {
          params: { size: 1000, orgUnitId: params?.orgUnitId, includeCounts: false },
        });
        const data = res.data?.data?.items || res.data?.items;
        return Array.isArray(data)
          ? data.map((s: any) => ({
              id: String(s.id),
              name: s.systemName || s.name || s.code || '',
              code: s.code || '',
              orgUnitId: s.orgUnitId ? String(s.orgUnitId) : undefined,
            }))
          : [];
      } catch {
        return [];
      }
    }
  },

  async list(params?: ListParams & { includeCounts?: boolean; sort?: string }): Promise<{ items: VtsSystemListItem[]; total: number; statusCounts: Record<string, number> }> {
    const key = JSON.stringify(params || {});
    if (inFlightListPromise && inFlightListPromise.key === key) {
      return inFlightListPromise.promise;
    }
    const promise = (async () => {
      try {
        const res = await api.get(VTS_BASE_PATH, {
          params: {
            orgUnitId: params?.orgUnitId,
            portId: params?.portId,
            provinceId: params?.provinceId,
            page: params?.page || 0,
            size: params?.size || 20,
            keyword: params?.keyword,
            systemName: params?.systemName,
            code: params?.code,
            conditionStatus: params?.conditionStatus,
            approvalStatus: params?.approvalStatus,
            year: params?.year,
            operationStartDateFrom: params?.operationStartDateFrom,
            operationStartDateTo: params?.operationStartDateTo,
            updatedFrom: params?.updatedFrom,
            updatedTo: params?.updatedTo,
            includeCounts: params?.includeCounts ?? true,
            sort: params?.sort,
          },
        });
        const data = res.data?.data || {};
        return {
          items: Array.isArray(data.items) ? data.items as VtsSystemListItem[] : [],
          total: data.total || 0,
          statusCounts: data.statusCounts || {},
        };
      } finally {
        if (inFlightListPromise?.key === key) {
          inFlightListPromise = null;
        }
      }
    })();
    inFlightListPromise = { key, promise };
    return promise;
  },

  async search(params?: ListParams): Promise<SearchResponse<VtsSystemResponse>> {
    const res = await api.get(`${VTS_BASE_PATH}/search`, {
      params: {
        orgUnitId: params?.orgUnitId,
        keyword: params?.keyword,
        conditionStatus: params?.conditionStatus,
        approvalStatus: params?.approvalStatus,
        year: params?.year,
      },
    });
    const data = res.data || {};
    const items = toArray<VtsSystemResponse>(data);
    return {
      items,
      total: toTotalCount(data, items.length),
      page: params?.page || 0,
      size: params?.size || 20,
    };
  },

  async getById(id: string, options?: { includeZones?: boolean; includeAttachments?: boolean }): Promise<VtsSystemResponse> {
    const key = `${id}-${options?.includeZones ?? true}-${options?.includeAttachments ?? true}`;
    const existing = inFlightGetByIdPromises.get(key);
    if (existing) {
      return existing;
    }
    const promise = (async () => {
      try {
        const res = await api.get(`${VTS_BASE_PATH}/${id}`, options ? {
          params: {
            includeZones: options.includeZones ?? true,
            includeAttachments: options.includeAttachments ?? true,
          },
        } : undefined);
        return toSingle<VtsSystemResponse>(res.data) || {} as VtsSystemResponse;
      } finally {
        inFlightGetByIdPromises.delete(key);
      }
    })();
    inFlightGetByIdPromises.set(key, promise);
    return promise;
  },

  async getZones(id: string, params?: { page?: number; size?: number }): Promise<VtsZoneDto[]> {
    const res = params
      ? await api.get(`${VTS_BASE_PATH}/${id}/zones`, { params })
      : await api.get(`${VTS_BASE_PATH}/${id}/zones`);
    const data = res.data?.data?.items || res.data?.items || res.data?.data || res.data;
    return Array.isArray(data) ? data : toArray<VtsZoneDto>(res.data);
  },

  async createZone(id: string, data: VtsZoneDto): Promise<VtsZoneDto> {
    const res = await api.post(`${VTS_BASE_PATH}/${id}/zones`, data);
    return toSingle<VtsZoneDto>(res.data) || {} as VtsZoneDto;
  },

  async updateZone(id: string, zoneId: string, data: VtsZoneDto): Promise<VtsZoneDto> {
    const res = await api.put(`${VTS_BASE_PATH}/${id}/zones/${zoneId}`, data);
    return toSingle<VtsZoneDto>(res.data) || {} as VtsZoneDto;
  },

  async deleteZone(id: string, zoneId: string): Promise<void> {
    await api.delete(`${VTS_BASE_PATH}/${id}/zones/${zoneId}`);
  },

  async getAttachments(id: string): Promise<VtsSystemAttachment[]> {
    const res = await api.get(`${VTS_BASE_PATH}/${id}/attachments`);
    return toArray<VtsSystemAttachment>(res.data);
  },

  async uploadAttachment(id: string, file: File): Promise<VtsSystemAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`${VTS_BASE_PATH}/${id}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return toSingle<VtsSystemAttachment>(res.data) || {} as VtsSystemAttachment;
  },

  async deleteAttachment(id: string, attId: string): Promise<void> {
    await api.delete(`${VTS_BASE_PATH}/${id}/attachments/${attId}`);
  },

  async downloadAttachment(id: string, attId: string, fileName?: string): Promise<void> {
    const res = await api.get(`${VTS_BASE_PATH}/${id}/attachments/${attId}/download`, {
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

  async create(data: CreateVtsSystemRequest): Promise<VtsSystemResponse> {
    const res = await api.post(VTS_BASE_PATH, data);
    return toSingle<VtsSystemResponse>(res.data) || {} as VtsSystemResponse;
  },

  async update(id: string, data: UpdateVtsSystemRequest): Promise<VtsSystemResponse> {
    const res = await api.put(`${VTS_BASE_PATH}/${id}`, data);
    return toSingle<VtsSystemResponse>(res.data) || {} as VtsSystemResponse;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${VTS_BASE_PATH}/${id}`);
  },

  async getByStatus(status: string): Promise<VtsSystemResponse[]> {
    const res = await api.get(`${VTS_BASE_PATH}/approval-status/${status}`);
    return toArray<VtsSystemResponse>(res.data);
  },

  async generateCode(): Promise<{ code: string }> {
    try {
      const res = await api.get(`${VTS_BASE_PATH}/generate-code`);
      const val = toSingle<{ code: string }>(res.data) || res.data?.data || res.data;
      if (val && typeof val === 'object' && 'code' in val && val.code) {
        return { code: String(val.code) };
      }
    } catch {
      // Fallback if needed
    }
    return { code: 'VTS-000001' };
  },
};

export const vtsSystemApproval = {
  async submit(id: string): Promise<VtsSystemResponse> {
    const res = await api.post(`${VTS_BASE_PATH}/${id}/submit`);
    return toSingle<VtsSystemResponse>(res.data) || {} as VtsSystemResponse;
  },

  async approveC1(id: string, data: ApprovalRequest): Promise<VtsSystemResponse> {
    const res = await api.post(`${VTS_BASE_PATH}/${id}/approve/c1`, data);
    return toSingle<VtsSystemResponse>(res.data) || {} as VtsSystemResponse;
  },

  async approveC2(id: string, data: ApprovalRequest): Promise<VtsSystemResponse> {
    const res = await api.post(`${VTS_BASE_PATH}/${id}/approve/c2`, data);
    return toSingle<VtsSystemResponse>(res.data) || {} as VtsSystemResponse;
  },

  async getHistory(id: string, page?: number, pageSize?: number, filters?: { keyword?: string; fromDate?: string; toDate?: string }): Promise<HistoryEntry[]> {
    const params = new URLSearchParams();
    if (page !== undefined && page !== null) params.append('page', String(page));
    if (pageSize !== undefined && pageSize !== null) params.append('pageSize', String(pageSize));
    if (filters?.keyword?.trim()) params.append('keyword', filters.keyword.trim());
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`${VTS_BASE_PATH}/${id}/history${query}`);
    return toArray<HistoryEntry>(res.data);
  },

  async uploadAttachment(id: string, file: File): Promise<VtsSystemAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`${VTS_BASE_PATH}/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  async deleteAttachment(id: string, attachmentId: string): Promise<void> {
    await api.delete(`${VTS_BASE_PATH}/${id}/attachments/${attachmentId}`);
  },
};
