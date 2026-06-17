import api from './api';
import type { PaginatedResponse } from '../types/common';

// ============================================================
// Types
// ============================================================
export interface Organization {
  id: string;
  name: string;
  parentOrgId?: string;
  parentOrgName?: string;
  level: number;
  description?: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  status: 'active' | 'locked' | 'inactive';
  childCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationPayload {
  name: string;
  parentOrgId?: string;
  description?: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
}

export interface UpdateOrganizationPayload {
  name?: string;
  description?: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  status?: 'active' | 'locked' | 'inactive';
}

export interface OrgFilters {
  search?: string;
  status?: string;
  level?: number;
}

// ============================================================
// Service
// ============================================================
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 300));

let organizations: Organization[] = [
  { id: 'org-001', name: 'Cơ quan Đầu não', level: 1, description: 'Cơ quan đầu não', status: 'active', childCount: 3, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
  { id: 'org-002', name: 'Vụ Công nghệ', parentOrgId: 'org-001', parentOrgName: 'Cơ quan Đầu não', level: 2, description: 'Vụ phụ trách công nghệ', status: 'active', childCount: 2, createdAt: '2025-01-15T00:00:00Z', updatedAt: '2026-05-20T00:00:00Z' },
  { id: 'org-003', name: 'Vụ Nghiệp vụ', parentOrgId: 'org-001', parentOrgName: 'Cơ quan Đầu não', level: 2, description: 'Vụ phụ trách nghiệp vụ', status: 'active', childCount: 0, createdAt: '2025-02-01T00:00:00Z', updatedAt: '2026-04-15T00:00:00Z' },
  { id: 'org-004', name: 'Vụ Tài chính', parentOrgId: 'org-001', parentOrgName: 'Cơ quan Đầu não', level: 2, description: 'Vụ phụ trách tài chính', status: 'locked', childCount: 0, createdAt: '2025-02-15T00:00:00Z', updatedAt: '2026-06-10T00:00:00Z' },
  { id: 'org-005', name: 'Phòng CNTT', parentOrgId: 'org-002', parentOrgName: 'Vụ Công nghệ', level: 3, description: 'Phòng kỹ thuật', status: 'active', childCount: 0, createdAt: '2025-03-01T00:00:00Z', updatedAt: '2026-03-20T00:00:00Z' },
  { id: 'org-006', name: 'Phòng An ninh', parentOrgId: 'org-002', parentOrgName: 'Vụ Công nghệ', level: 3, description: 'Phòng an ninh mạng', status: 'active', childCount: 0, createdAt: '2025-03-15T00:00:00Z', updatedAt: '2026-05-10T00:00:00Z' },
  { id: 'org-007', name: 'Chi nhánh miền Bắc', parentOrgId: 'org-001', parentOrgName: 'Cơ quan Đầu não', level: 2, description: 'Chi nhánh phía Bắc', status: 'active', childCount: 0, createdAt: '2025-04-01T00:00:00Z', updatedAt: '2026-02-28T00:00:00Z' },
];

export const organizationService = {
  async list(params?: { page?: number; pageSize?: number; search?: string; status?: string }): Promise<PaginatedResponse<Organization>> {
    await delay();

    let filtered = [...organizations];

    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((o) => o.name.toLowerCase().includes(q) || (o.description || '').toLowerCase().includes(q));
    }
    if (params?.status) {
      filtered = filtered.filter((o) => o.status === params.status);
    }
    if (params?.level) {
      filtered = filtered.filter((o) => o.level === params.level);
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

  async getById(id: string): Promise<Organization> {
    await delay(300);
    const org = organizations.find((o) => o.id === id);
    if (!org) throw new Error('Đơn vị không tồn tại');
    return org;
  },

  async getTree(): Promise<Organization[]> {
    await delay(400);
    // Return flat list, caller should organize into tree
    return [...organizations];
  },

  async getChildren(parentId: string): Promise<Organization[]> {
    await delay(300);
    return organizations.filter((o) => o.parentOrgId === parentId);
  },

  async create(payload: CreateOrganizationPayload): Promise<Organization> {
    await delay(700);
    const parentOrg = organizations.find((o) => o.id === payload.parentOrgId);
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name: payload.name,
      parentOrgId: payload.parentOrgId,
      parentOrgName: parentOrg?.name,
      level: parentOrg ? parentOrg.level + 1 : 1,
      description: payload.description,
      address: payload.address,
      contactPerson: payload.contactPerson,
      contactPhone: payload.contactPhone,
      status: 'active',
      childCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    organizations.push(newOrg);
    // Update parent childCount
    if (parentOrg) parentOrg.childCount += 1;
    return newOrg;
  },

  async update(id: string, payload: UpdateOrganizationPayload): Promise<Organization> {
    await delay(500);
    const idx = organizations.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Đơn vị không tồn tại');

    organizations[idx] = { ...organizations[idx], ...payload, updatedAt: new Date().toISOString() };
    return organizations[idx];
  },

  async delete(id: string): Promise<void> {
    await delay(400);
    const idx = organizations.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Đơn vị không tồn tại');

    const org = organizations[idx];
    organizations = organizations.filter((o) => o.id !== id);

    // Decrement parent childCount
    if (org.parentOrgId) {
      const parent = organizations.find((o) => o.id === org.parentOrgId);
      if (parent) parent.childCount = Math.max(0, parent.childCount - 1);
    }
  },
};
