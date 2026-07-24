import api from './api';

export interface SpatialObjectCategory {
  id: string;
  code: string;
  name: string;
  geometryType: number;
  iconId: string;
  iconUrl?: string;
  status: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface CreateSpatialObjectCategoryPayload {
  code: string;
  name: string;
  geometryType: number;
  iconId?: string;
  status?: number;
}

export interface UpdateSpatialObjectCategoryPayload {
  code: string;
  name: string;
  geometryType: number;
  iconId?: string;
  status?: number;
}

export const spatialObjectCategoryService = {
  list: async (params?: { page?: number; pageSize?: number; search?: string; geometryType?: number; status?: number }) => {
    const backendPage = params?.page ? params.page - 1 : 0;
    const res = await api.get('/v1/gis/spatial-categories', { 
        params: { 
            ...params, 
            page: backendPage 
        } 
    });
    return res.data.data; // { content, totalElements }
  },

  get: async (id: string) => {
    const res = await api.get(`/v1/gis/spatial-categories/${id}`);
    return res.data.data;
  },

  create: async (payload: CreateSpatialObjectCategoryPayload) => {
    const res = await api.post('/v1/gis/spatial-categories', payload);
    return res.data.data;
  },

  update: async (id: string, payload: UpdateSpatialObjectCategoryPayload) => {
    const res = await api.put(`/v1/gis/spatial-categories/${id}`, payload);
    return res.data.data;
  },

  delete: async (id: string) => {
    const res = await api.delete(`/v1/gis/spatial-categories/${id}`);
    return res.data.data;
  },
};
