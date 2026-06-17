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
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 300));

let symbols: Symbol[] = [
  { id: 'sym-001', code: 'SYM-HD', name: 'Hướng đi', description: 'Ký hiệu hướng đi', category: 'navigation', icon: 'ArrowRightOutlined', color: '#1677ff', value: 'HD', status: 'active', createdBy: 'admin', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
  { id: 'sym-002', code: 'SYM-DC', name: 'Đường chính', description: 'Ký hiệu đường chính', category: 'road', icon: 'LineOutlined', color: '#52c41a', value: 'DC', status: 'active', createdBy: 'admin', createdAt: '2025-01-15T00:00:00Z', updatedAt: '2026-04-15T00:00:00Z' },
  { id: 'sym-003', code: 'SYM-TT', name: 'Tọa độ', description: 'Ký hiệu tọa độ', category: 'position', icon: 'MapOutlined', color: '#faad14', value: 'TT', status: 'active', createdBy: 'tuanla', createdAt: '2025-02-01T00:00:00Z', updatedAt: '2026-03-10T00:00:00Z' },
  { id: 'sym-004', code: 'SYM-CC', name: 'Chia cắt', description: 'Ký hiệu chia cắt', category: 'division', icon: 'DividerOutlined', color: '#f5222d', value: 'CC', status: 'inactive', createdBy: 'admin', createdAt: '2025-03-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' },
  { id: 'sym-005', code: 'SYM-CT', name: 'Cửa tầng', description: 'Ký hiệu cửa tầng ngầm', category: 'building', icon: 'DoorOutlined', color: '#722ed1', value: 'CT', status: 'active', createdBy: 'tuanla', createdAt: '2025-04-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
  { id: 'sym-006', code: 'SYM-BN', name: 'Bến ngầm', description: 'Ký hiệu bến ngầm', category: 'transport', icon: 'ShipOutlined', color: '#13c2c2', value: 'BN', status: 'active', createdBy: 'admin', createdAt: '2025-05-01T00:00:00Z', updatedAt: '2026-05-20T00:00:00Z' },
  { id: 'sym-007', code: 'SYM-OD', name: 'Địa điểm', description: 'Ký hiệu địa điểm', category: 'location', icon: 'EnvironmentOutlined', color: '#eb2f96', value: 'OD', status: 'deprecated', createdBy: 'admin', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-12-01T00:00:00Z' },
];

export const symbolService = {
  async list(params?: { page?: number; pageSize?: number; search?: string; category?: string; status?: string }): Promise<PaginatedResponse<Symbol>> {
    await delay();

    let filtered = [...symbols];

    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q));
    }
    if (params?.category) {
      filtered = filtered.filter((s) => s.category === params.category);
    }
    if (params?.status) {
      filtered = filtered.filter((s) => s.status === params.status);
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;

    return {
      data: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  },

  async getById(id: string): Promise<Symbol> {
    await delay(300);
    const sym = symbols.find((s) => s.id === id);
    if (!sym) throw new Error('Biểu tượng không tồn tại');
    return sym;
  },

  async getByCode(code: string): Promise<Symbol> {
    await delay(300);
    const sym = symbols.find((s) => s.code === code);
    if (!sym) throw new Error(`Biểu tượng ${code} không tồn tại`);
    return sym;
  },

  async create(payload: CreateSymbolPayload): Promise<Symbol> {
    await delay(700);
    const newSymbol: Symbol = {
      id: `sym-${Date.now()}`,
      ...payload,
      status: 'active',
      createdBy: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    symbols.unshift(newSymbol);
    return newSymbol;
  },

  async update(id: string, payload: UpdateSymbolPayload): Promise<Symbol> {
    await delay(500);
    const idx = symbols.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Biểu tượng không tồn tại');

    symbols[idx] = { ...symbols[idx], ...payload, updatedAt: new Date().toISOString() };
    return symbols[idx];
  },

  async delete(id: string): Promise<void> {
    await delay(400);
    const idx = symbols.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Biểu tượng không tồn tại');
    symbols = symbols.filter((s) => s.id !== id);
  },

  async getCategories(): Promise<string[]> {
    await delay(200);
    const cats = new Set(symbols.map((s) => s.category));
    return Array.from(cats);
  },

  async searchByValue(value: string): Promise<Symbol[]> {
    await delay(300);
    return symbols.filter((s) => s.value?.toLowerCase().includes(value.toLowerCase()));
  },
};
