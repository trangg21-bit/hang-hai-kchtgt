import api from './api';
import type { PaginatedResponse } from '../types/common';

// ============================================================
// Types
// ============================================================
export interface Symbol {
  id: string;
  name: string;
  code?: string;
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
  code?: string;
  description?: string;
  image: string;
  status?: string;
}

export interface UpdateSymbolPayload {
  name?: string;
  code?: string;
  description?: string;
  image?: string;
  status?: 'active' | 'inactive';
}

export interface SymbolOption {
  id: string;
  name: string;
  code?: string;
  image: string;
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
    code: item.code ?? item.symbolCode ?? undefined,
    description: item.description ?? '',
    image: item.image ?? item.hinhAnh ?? '',
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
  async list(params?: { page?: number; pageSize?: number; search?: string; status?: string; code?: string }): Promise<PaginatedResponse<Symbol>> {
    const backendPage = params?.page ? params.page - 1 : 0;

    const resp = await api.get('/symbols', {
      params: {
        search: params?.search,
        code: params?.code,
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

  async getAll(): Promise<Symbol[]> {
    try {
      const res = await this.list({ pageSize: 100 });
      return res.data || [];
    } catch {
      return [];
    }
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
    this.invalidateCache();
  },

  async getOptions(): Promise<SymbolOption[]> {
    if (cachedOptions) {
      return cachedOptions;
    }
    if (optionsPromise) {
      return optionsPromise;
    }

    optionsPromise = (async () => {
      try {
        const resp = await api.get('/symbols/options');
        const rawData: any = extractData(resp);
        const items: any[] = Array.isArray(rawData) ? rawData : (rawData?.content || []);
        const result = items.map((item) => ({
          id: item.id || '',
          name: item.name || '',
          code: item.code || '',
          image: item.image || item.hinhAnh || '',
        }));
        cachedOptions = result;
        return result;
      } finally {
        optionsPromise = null;
      }
    })();

    return optionsPromise;
  },

  invalidateCache(): void {
    cachedOptions = null;
    optionsPromise = null;
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

let cachedOptions: SymbolOption[] | null = null;
let optionsPromise: Promise<SymbolOption[]> | null = null;
