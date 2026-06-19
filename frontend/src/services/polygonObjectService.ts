import api from './api';
import type { PaginatedResponse } from '../types/common';
import type {
  PolygonObject,
  CreatePolygonObjectPayload,
  UpdatePolygonObjectPayload,
  PolygonObjectFilters,
} from '../types/polygonObject';

export interface PolygonObjectResponse extends PolygonObject {}

export const polygonObjectService = {
  async list(params?: PolygonObjectFilters & { page?: number; pageSize?: number }): Promise<PaginatedResponse<PolygonObject>> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('name', params.search);
    if (params?.objectType) searchParams.set('objectType', params.objectType);
    if (params?.status) searchParams.set('status', params.status);

    const res = await api.get(`/polygon-objects/search?${searchParams}`);
    const data = res.data.data || [];
    return {
      data,
      total: data.length,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
    };
  },

  async getAll(): Promise<PolygonObject[]> {
    const res = await api.get('/polygon-objects');
    return res.data.data || [];
  },

  async getById(id: string): Promise<PolygonObject> {
    const res = await api.get(`/polygon-objects/${id}`);
    return res.data.data;
  },

  async getByObjectType(objectType: string): Promise<PolygonObject[]> {
    const res = await api.get(`/polygon-objects/type/${objectType}`);
    return res.data.data || [];
  },

  async getByStatus(status: string): Promise<PolygonObject[]> {
    const res = await api.get(`/polygon-objects/status/${status}`);
    return res.data.data || [];
  },

  async create(payload: CreatePolygonObjectPayload): Promise<PolygonObject> {
    const res = await api.post('/polygon-objects', payload);
    return res.data.data;
  },

  async update(id: string, payload: UpdatePolygonObjectPayload): Promise<PolygonObject> {
    const res = await api.put(`/polygon-objects/${id}`, payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/polygon-objects/${id}`);
  },

  async submitForApproval(id: string): Promise<void> {
    await api.post(`/polygon-objects/${id}/submit-approval`);
  },

  async approveL1(id: string, approverId: string): Promise<PolygonObject> {
    const res = await api.post(`/polygon-objects/${id}/approve-l1`, null, { params: { approverId } });
    return res.data.data;
  },

  async approveL2(id: string, approverId: string): Promise<PolygonObject> {
    const res = await api.post(`/polygon-objects/${id}/approve-l2`, null, { params: { approverId } });
    return res.data.data;
  },
};
