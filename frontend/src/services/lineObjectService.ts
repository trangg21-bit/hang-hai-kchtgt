import api from './api';
import type { PaginatedResponse } from '../types/common';
import type {
  LineObject,
  CreateLineObjectPayload,
  UpdateLineObjectPayload,
  LineObjectFilters,
} from '../types/lineObject';

export interface LineObjectResponse extends LineObject {}

export const lineObjectService = {
  async list(params?: LineObjectFilters & { page?: number; pageSize?: number }): Promise<PaginatedResponse<LineObject>> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('name', params.search);
    if (params?.objectType) searchParams.set('objectType', params.objectType);
    if (params?.status) searchParams.set('status', params.status);

    const res = await api.get(`/line-objects/search?${searchParams}`);
    const data = res.data.data || [];
    return {
      data,
      total: data.length,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
    };
  },

  async getAll(): Promise<LineObject[]> {
    const res = await api.get('/line-objects');
    return res.data.data || [];
  },

  async getById(id: string): Promise<LineObject> {
    const res = await api.get(`/line-objects/${id}`);
    return res.data.data;
  },

  async getByObjectType(objectType: string): Promise<LineObject[]> {
    const res = await api.get(`/line-objects/type/${objectType}`);
    return res.data.data || [];
  },

  async getByStatus(status: string): Promise<LineObject[]> {
    const res = await api.get(`/line-objects/status/${status}`);
    return res.data.data || [];
  },

  async create(payload: CreateLineObjectPayload): Promise<LineObject> {
    const res = await api.post('/line-objects', payload);
    return res.data.data;
  },

  async update(id: string, payload: UpdateLineObjectPayload): Promise<LineObject> {
    const res = await api.put(`/line-objects/${id}`, payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/line-objects/${id}`);
  },

  async submitForApproval(id: string): Promise<void> {
    await api.post(`/line-objects/${id}/submit-approval`);
  },

  async approveL1(id: string, approverId: string): Promise<LineObject> {
    const res = await api.post(`/line-objects/${id}/approve-l1`, null, { params: { approverId } });
    return res.data.data;
  },

  async approveL2(id: string, approverId: string): Promise<LineObject> {
    const res = await api.post(`/line-objects/${id}/approve-l2`, null, { params: { approverId } });
    return res.data.data;
  },
};
