import api from './api';
import type { PaginatedResponse } from '../types/common';
import type {
  PointObject,
  CreatePointObjectPayload,
  UpdatePointObjectPayload,
  PointObjectFilters,
} from '../types/pointObject';

export interface PointObjectResponse extends PointObject {}

export const pointObjectService = {
  async list(params?: PointObjectFilters & { page?: number; pageSize?: number }): Promise<PaginatedResponse<PointObject>> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('name', params.search);
    if (params?.objectType) searchParams.set('objectType', params.objectType);
    if (params?.status) searchParams.set('status', params.status);

    const res = await api.get(`/point-objects/search?${searchParams}`);
    const data = res.data.data || [];
    return {
      data,
      total: data.length,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
    };
  },

  async getAll(): Promise<PointObject[]> {
    const res = await api.get('/point-objects');
    return res.data.data || [];
  },

  async getById(id: string): Promise<PointObject> {
    const res = await api.get(`/point-objects/${id}`);
    return res.data.data;
  },

  async getByObjectType(objectType: string): Promise<PointObject[]> {
    const res = await api.get(`/point-objects/type/${objectType}`);
    return res.data.data || [];
  },

  async getByStatus(status: string): Promise<PointObject[]> {
    const res = await api.get(`/point-objects/status/${status}`);
    return res.data.data || [];
  },

  async create(payload: CreatePointObjectPayload): Promise<PointObject> {
    const res = await api.post('/point-objects', payload);
    return res.data.data;
  },

  async update(id: string, payload: UpdatePointObjectPayload): Promise<PointObject> {
    const res = await api.put(`/point-objects/${id}`, payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/point-objects/${id}`);
  },

  async submitForApproval(id: string): Promise<void> {
    await api.post(`/point-objects/${id}/submit-approval`);
  },

  async approveL1(id: string, approverId: string): Promise<PointObject> {
    const res = await api.post(`/point-objects/${id}/approve-l1`, null, { params: { approverId } });
    return res.data.data;
  },

  async approveL2(id: string, approverId: string): Promise<PointObject> {
    const res = await api.post(`/point-objects/${id}/approve-l2`, null, { params: { approverId } });
    return res.data.data;
  },
};
