import api from './api';
import { toArray, toSingle, toTotalCount } from './resilient';
import type {
  NavigationChannelResponse,
  CreateNavigationChannelRequest,
  UpdateNavigationChannelRequest,
  ApprovalRequest,
  NavigationChannelHistoryEntry,
  ListParams,
  SearchResponse,
  NavigationChannelAttachment,
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
        sortBy: params?.sortBy || params?.sortField,
        sortDir: params?.sortDir || (params?.sortOrder === 'asc' ? 'ASC' : params?.sortOrder === 'desc' ? 'DESC' : params?.sortOrder),
        page: params?.page || 0,
        size: params?.size || 20,
      },
    });
    const data = res.data || {};
    const innerData = data.data || data;
    const items = toArray<NavigationChannelResponse>(innerData.results || innerData.content || data);
    return {
      items,
      total: toTotalCount(data, items.length),
      page: params?.page || 0,
      size: params?.size || 20,
      statusCounts: innerData.statusCounts || data.statusCounts || {},
    };
  },

  async countStatus(params?: ListParams): Promise<Record<string, number>> {
    const res = await api.get('/v1/navigation-channel/status-counts', {
      params: {
        orgUnitId: params?.orgUnitId,
        keyword: params?.keyword,
        channelCode: params?.channelCode,
        seaportId: params?.seaportId,
        provinceId: params?.provinceId,
        conditionStatus: params?.conditionStatus,
        updatedFrom: params?.updatedFrom,
        updatedTo: params?.updatedTo,
      },
    });
    return res.data?.data || res.data || {};
  },

  async getById(id: string): Promise<NavigationChannelResponse> {
    const res = await api.get(`/v1/navigation-channel/${id}`);
    return toSingle<NavigationChannelResponse>(res.data) || {} as NavigationChannelResponse;
  },

  async getOptions(): Promise<Array<{ id: string; channelCode?: string; channelName?: string; orgUnitId?: string; seaportId?: string }>> {
    const res = await api.get('/common/options/navigation-channels');
    return res.data?.data || [];
  },

  async create(data: CreateNavigationChannelRequest): Promise<NavigationChannelResponse> {
    const res = await api.post('/v1/navigation-channel', data);
    return toSingle<NavigationChannelResponse>(res.data) || {} as NavigationChannelResponse;
  },

  async createAndApprove(data: CreateNavigationChannelRequest): Promise<NavigationChannelResponse> {
    const res = await api.post('/v1/navigation-channel/create-and-approve', data);
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

  async generateCode(orgUnitId: string): Promise<string> {
    const res = await api.get('/v1/navigation-channel/generate-code', { params: { orgUnitId } });
    return res.data?.data?.channelCode || '';
  },

  async uploadAttachments(id: string, files: File[]): Promise<NavigationChannelAttachment[]> {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    const res = await api.post(`/v1/navigation-channel/${id}/attachments`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return (res.data?.data || []) as NavigationChannelAttachment[];
  },

  async listAttachments(id: string): Promise<NavigationChannelAttachment[]> {
    const res = await api.get(`/v1/navigation-channel/${id}/attachments`);
    return (res.data?.data || []) as NavigationChannelAttachment[];
  },

  async deleteAttachment(id: string, attachmentId: string): Promise<void> {
    await api.delete(`/v1/navigation-channel/${id}/attachments/${attachmentId}`);
  },

  async downloadAttachment(id: string, attachmentId: string): Promise<Blob> {
    const res = await api.get(`/v1/navigation-channel/${id}/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    });
    return res.data as Blob;
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

  async directApprove(id: string): Promise<NavigationChannelResponse> {
    const res = await api.post(`/v1/navigation-channel/${id}/approve-direct`);
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

    async getHistory(
      id: string,
      page?: number,
      pageSize?: number,
      filters?: { keyword?: string; fromDate?: string; toDate?: string },
    ): Promise<NavigationChannelHistoryEntry[]> {
      const sp = new URLSearchParams();
      if (page !== undefined && page !== null) sp.set('page', String(page));
      if (pageSize !== undefined && pageSize !== null) sp.set('pageSize', String(pageSize));
      if (filters?.keyword?.trim()) sp.set('keyword', filters.keyword.trim());
      if (filters?.fromDate) sp.set('fromDate', filters.fromDate);
      if (filters?.toDate) sp.set('toDate', filters.toDate);
      const query = sp.toString() ? `?${sp.toString()}` : '';
      const res = await api.get(`/v1/navigation-channel/${id}/history${query}`);
      return toArray<NavigationChannelHistoryEntry>(res.data);
    },

    async getPagedHistory(
      id: string,
      page?: number,
      pageSize?: number,
      filters?: { keyword?: string; fromDate?: string; toDate?: string },
    ): Promise<NavigationChannelHistoryEntry[]> {
      return this.getHistory(id, page, pageSize, filters);
    },
  };
