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
  deletedAt?: string;
  deletedBy?: string;
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
  list: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    code?: string;
    name?: string;
    iconId?: string;
    geometryType?: number;
    status?: number;
    isDeleted?: boolean;
    fromUpdatedDate?: string;
    toUpdatedDate?: string;
    sort?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const backendPage = params?.page ? params.page - 1 : 0;
    const { page, pageSize, sortField, sortOrder, sort, ...rest } = params || {};
    const effectiveSortField = sortField === 'updatedBy' ? 'updatedAt' : sortField;
    const sortParam = sort || (effectiveSortField && sortOrder ? `${effectiveSortField},${sortOrder}` : undefined);
    const res = await api.get('/v1/gis/spatial-categories', { 
        params: { 
            ...rest, 
            sort: sortParam,
            page: backendPage,
            size: pageSize,
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
