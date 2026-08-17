import api from './api';
import type { PaginatedResponse } from '../types/common';

// ============================================================
// Types
// ============================================================
export interface Symbol {
  id: string;
  name: string;
  description?: string;
  image: string;
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
  createdByName?: string;
  updatedByName?: string;
}

export interface CreateSymbolPayload {
  name: string;
  description?: string;
  image: string;
  status?: string;
}

export interface UpdateSymbolPayload {
  name?: string;
  description?: string;
  image?: string;
  status?: 'active' | 'inactive';
}

export interface SymbolFilters {
  search?: string;
  status?: string;
}

// ============================================================
// Service
// ============================================================
function extractData<T>(response: any): T {
  return response.data?.data ?? response.data;
}

function mapSymbol(item: any): Symbol {
  return {
    id: item.id ?? '',
    name: item.name ?? '',
    description: item.description ?? '',
    image: item.image ?? '',
    status: (item.status?.toLowerCase() as Symbol['status']) || 'active',
    createdBy: item.createdBy ?? '',
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : '',
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : '',
    createdByName: item.createdByName ?? '',
    updatedBy: item.updatedBy ?? '',
    updatedByName: item.updatedByName ?? '',
  };
}

export const symbolService = {
  async list(params?: { page?: number; pageSize?: number; search?: string; status?: string }): Promise<PaginatedResponse<Symbol>> {
    const backendPage = params?.page ? params.page - 1 : 0;

    const resp = await api.get('/symbols', {
      params: {
        search: params?.search,
        status: params?.status ? params.status.toUpperCase() : undefined,
        page: backendPage,
        size: params?.pageSize || 10,
      }
    });

    const rawData: any = extractData(resp);
    const items: any[] = Array.isArray(rawData)
      ? rawData
      : (rawData && Array.isArray(rawData.content) ? rawData.content : []);

    const total = Array.isArray(rawData) ? rawData.length : (rawData?.totalElements || 0);

    return {
      data: items.map(mapSymbol),
      total,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
    };
  },

  async getById(id: string): Promise<Symbol> {
    const resp = await api.get(`/symbols/${id}`);
    return mapSymbol(extractData(resp));
  },

  async create(payload: CreateSymbolPayload): Promise<Symbol> {
    const resp = await api.post('/symbols', {
      name: payload.name,
      description: payload.description,
      image: payload.image,
      status: payload.status ? payload.status.toUpperCase() : 'ACTIVE'
    });
    return mapSymbol(extractData(resp));
  },

  async update(id: string, payload: UpdateSymbolPayload): Promise<Symbol> {
    const resp = await api.put(`/symbols/${id}`, {
      name: payload.name,
      description: payload.description,
      image: payload.image,
      status: payload.status ? payload.status.toUpperCase() : undefined
    });
    return mapSymbol(extractData(resp));
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/symbols/${id}`);
  },

  async searchByValue(value: string): Promise<Symbol[]> {
    const resp = await api.get('/symbols', { params: { search: value, size: 50 } });
    const rawData: any = extractData(resp);
    const items: any[] = Array.isArray(rawData)
      ? rawData
      : (rawData && Array.isArray(rawData.content) ? rawData.content : []);
    return items.map(mapSymbol);
  },
};
