import api from './api';
import type { PaginatedResponse } from '../types/common';

// ============================================================
// Types
// ============================================================
export interface Symbol {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  icon?: string;
  color?: string;
  value?: string;
  status: 'active' | 'inactive' | 'deprecated';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSymbolPayload {
  code: string;
  name: string;
  description?: string;
  category: string;
  icon?: string;
  color?: string;
  value?: string;
}

export interface UpdateSymbolPayload {
  name?: string;
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
  value?: string;
  status?: 'active' | 'inactive' | 'deprecated';
}

export interface SymbolFilters {
  search?: string;
  category?: string;
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
    code: item.code ?? '',
    name: item.name ?? '',
    description: item.description ?? '',
    category: item.category ?? '',
    icon: item.icon ?? '',
    color: item.color ?? '',
    value: item.value ?? '',
    status: (item.status?.toLowerCase() as Symbol['status']) || 'active',
    createdBy: item.createdBy ?? '',
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : '',
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : '',
  };
}

export const symbolService = {
  async list(params?: { page?: number; pageSize?: number; search?: string; category?: string; status?: string }): Promise<PaginatedResponse<Symbol>> {
    const backendPage = params?.page ? params.page - 1 : 0;

    const resp = await api.get('/symbols', {
      params: {
        search: params?.search,
        category: params?.category,
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

  async getByCode(code: string): Promise<Symbol> {
    const resp = await api.get('/symbols', { params: { search: code } });
    const rawData: any = extractData(resp);
    const items: any[] = Array.isArray(rawData)
      ? rawData
      : (rawData && Array.isArray(rawData.content) ? rawData.content : []);
    const found = items.find((s: any) => s.code === code);
    if (!found) throw new Error(`Biểu tượng ${code} không tồn tại`);
    return mapSymbol(found);
  },

  async create(payload: CreateSymbolPayload): Promise<Symbol> {
    const resp = await api.post('/symbols', {
      ...payload,
      status: 'ACTIVE'
    });
    return mapSymbol(extractData(resp));
  },

  async update(id: string, payload: UpdateSymbolPayload): Promise<Symbol> {
    const resp = await api.put(`/symbols/${id}`, {
      ...payload,
      status: payload.status ? payload.status.toUpperCase() : undefined
    });
    return mapSymbol(extractData(resp));
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/symbols/${id}`);
  },

  async getCategories(): Promise<string[]> {
    const resp = await api.get('/symbols', { params: { size: 100 } });
    const rawData: any = extractData(resp);
    const items: any[] = Array.isArray(rawData)
      ? rawData
      : (rawData && Array.isArray(rawData.content) ? rawData.content : []);
    const cats = new Set(items.map((s: any) => s.category).filter(Boolean));
    return Array.from(cats);
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
