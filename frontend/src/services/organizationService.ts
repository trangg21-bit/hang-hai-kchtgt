import api from "./api";
import type { PaginatedResponse } from "../types/common";
import { MOCK_ORGANIZATIONS } from './mockData';

const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 200));
let organizations: Organization[] = [...MOCK_ORGANIZATIONS];

// ============================================================
// Types
// ============================================================
export interface Organization {
  id: string;
  name: string;
  code?: string;
  parentId?: string;
  parentOrgName?: string;
  level?: number;
  type?: "DEPARTMENT" | "GENERAL_DEPARTMENT" | "SUB_DEPARTMENT" | "PORT_AUTHORITY";
  description?: string;
  address?: string;
  detailAddress?: string;
  phone?: string;
  contactPerson?: string;
  contactPhone?: string;
  status: "draft" | "pending" | "approved" | "rejected";
  operationalStatus: "active" | "inactive";
  childCount: number;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface CreateOrganizationPayload {
  name: string;
  code?: string;
  parentId?: string;
  type?: "DEPARTMENT" | "GENERAL_DEPARTMENT" | "SUB_DEPARTMENT" | "PORT_AUTHORITY";
  description?: string;
  address?: string;
  detailAddress?: string;
  phone?: string;
  contactPerson?: string;
  contactPhone?: string;
  operationalStatus?: "active" | "inactive";
}

export interface UpdateOrganizationPayload {
  name?: string;
  code?: string;
  parentId?: string;
  type?: "DEPARTMENT" | "GENERAL_DEPARTMENT" | "SUB_DEPARTMENT" | "PORT_AUTHORITY";
  description?: string;
  address?: string;
  detailAddress?: string;
  phone?: string;
  contactPerson?: string;
  contactPhone?: string;
  status?: "draft" | "pending" | "approved" | "rejected";
  operationalStatus?: "active" | "inactive";
}

export interface OrgFilters {
  search?: string;
  status?: string;
  level?: number;
  parentId?: string;
}

// ============================================================
// API Response normalizer
// ============================================================
function extractData<T>(response: any): T {
  return response.data?.data ?? response.data;
}

// ============================================================
// Service -- real API calls
// ============================================================

/**
 * Compute derived fields that the backend does not return in flat list responses.
 * The backend OrgUnitResponse has: id, name, code, parentId, type, address, phone, status, createdAt, updatedAt, children.
 * The frontend Organization adds: parentOrgName, level, childCount, contactPerson, contactPhone.
 */
function mapOrgUnit(
  item: any,
  orgMap: Map<string, Organization>
): Organization {
  // Compute parentOrgName from flat list
  const parentOrgName = item.parentId
    ? orgMap.get(item.parentId)?.name
    : undefined;

  // Compute level: root (no parentId) = 1, else parent.level + 1
  let level = 1;
  if (item.parentId) {
    const parent = orgMap.get(item.parentId);
    if (parent && parent.level !== undefined) {
      level = parent.level + 1;
    }
  }

  // Compute childCount from flat list
  let childCount = 0;
  if (item.children && Array.isArray(item.children)) {
    childCount = item.children.length;
  }

  return {
    id: item.id ?? "",
    name: item.name ?? "",
    code: item.code,
    parentId: item.parentId ? String(item.parentId) : undefined,
    parentOrgName,
    level,
    type: item.type as Organization["type"],
    description: item.description,
    address: item.address, detailAddress: item.detailAddress, phone: item.phone,
    contactPerson: item.contactPerson,
    contactPhone: item.contactPhone ?? item.phone,
    status: (item.status?.toLowerCase() as Organization["status"]) ?? "draft",
    operationalStatus: (item.operationalStatus?.toLowerCase() as Organization["operationalStatus"]) ?? "active",
    childCount,
    createdAt: item.createdAt
      ? new Date(item.createdAt).toISOString()
      : "",
    updatedAt: item.updatedAt
      ? new Date(item.updatedAt).toISOString()
      : "",
  };
}

const getGlobalWindow = (): any => {
  try {
    return window.top || window;
  } catch {
    return window;
  }
};

const getCachedOrgs = (): Organization[] | null => {
  const globalWin = getGlobalWindow();
  return globalWin.__orgUnitsCache || null;
};

const setCachedOrgs = (orgs: Organization[]) => {
  const globalWin = getGlobalWindow();
  globalWin.__orgUnitsCache = orgs;
};

const clearCachedOrgs = () => {
  const globalWin = getGlobalWindow();
  globalWin.__orgUnitsCache = null;
};

export const organizationService = {
  /**
   * GET /api/org-units
   * Note: Backend returns flat list (no pagination endpoint).
   * Frontend applies pagination client-side.
   */
  async list(
    params?: { page?: number; pageSize?: number; search?: string; status?: string; parentId?: string }
  ): Promise<PaginatedResponse<Organization>> {
    const isCacheable = !params?.search && !params?.status && !params?.parentId;
    if (isCacheable) {
      const cached = getCachedOrgs();
      if (cached) {
        const page = params?.page || 1;
        const pageSize = params?.pageSize || 1000;
        const start = (page - 1) * pageSize;
        return {
          data: cached.slice(start, start + pageSize),
          total: cached.length,
          page,
          pageSize,
        };
      }
    }

    try {
      const resp = await api.get("/org-units", {
        params: {
          size: 1000,
          parentId: params?.parentId,
        }
      });
      const rawData: any = extractData(resp);
      const items: any[] = Array.isArray(rawData)
        ? rawData
        : (rawData && Array.isArray(rawData.content) ? rawData.content : []);

      // Build flat list first for parent lookups
      const flatList = items.map((item) => ({
        ...item,
        // Map to frontend Organization type
        id: item.id ?? "",
        name: item.name ?? "",
        code: item.code,
        parentId: item.parentId ? String(item.parentId) : undefined,
        level: item.level,
        type: item.type as Organization["type"],
        status: (item.status?.toLowerCase() as Organization["status"]) ?? "draft",
        operationalStatus: (item.operationalStatus?.toLowerCase() as Organization["operationalStatus"]) ?? "active",
      }));

      // Build parent name lookup map
      const orgMap = new Map<string, Organization>();
      flatList.forEach((item) => {
        orgMap.set(item.id, {
          id: item.id,
          name: item.name,
          code: item.code,
          parentId: item.parentId,
          parentOrgName: undefined,
          level: item.level,
          type: item.type as Organization["type"],
          description: item.description,
          address: item.address, detailAddress: item.detailAddress, phone: item.phone,
          contactPerson: item.contactPerson,
          contactPhone: item.contactPhone ?? item.phone,
          status: item.status as Organization["status"],
          operationalStatus: item.operationalStatus as Organization["operationalStatus"],
          childCount: 0, // placeholder
          createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : "",
          updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : "", updatedBy: (item.updatedBy ?? undefined), 
        });
      });

      // Now compute parentOrgName and level
      const data: Organization[] = flatList.map((item) => {
        let level = item.level ?? 1;
        let parentOrgName: string | undefined;
        if (item.parentId) {
          const parent = orgMap.get(item.parentId);
          if (parent) {
            parentOrgName = parent.name;
          }
        }

        // Compute childCount
        const childCount = flatList.filter(
          (o) => o.parentId === item.id
        ).length;

        return {
          id: item.id,
          name: item.name,
          code: item.code,
          parentId: item.parentId,
          parentOrgName,
          level,
          type: item.type as Organization["type"],
          description: item.description,
          address: item.address, detailAddress: item.detailAddress, phone: item.phone,
          contactPerson: item.contactPerson,
          contactPhone: item.contactPhone ?? item.phone,
          status: item.status as Organization["status"],
          operationalStatus: item.operationalStatus as Organization["operationalStatus"],
          childCount,
          createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : "",
          updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : "", updatedBy: (item.updatedBy ?? undefined), 
        };
      });

      if (isCacheable) {
        setCachedOrgs(data);
      }

      // Apply filters
      let filtered: Organization[] = [...data];

      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (o) =>
            o.name.toLowerCase().includes(q) ||
            (o.description || "").toLowerCase().includes(q)
        );
      }
      if (params?.status) {
        filtered = filtered.filter(
          (o) => o.status.toLowerCase() === params.status?.toLowerCase()
        );
      }

      const page = params?.page || 1;
      const pageSize = params?.pageSize || 1000;
      const start = (page - 1) * pageSize;

      return {
        data: filtered.slice(start, start + pageSize),
        total: filtered.length,
        page,
        pageSize,
      };
    } catch {
      await delay();
      let filtered = [...organizations];
      if (params?.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(o => o.name.toLowerCase().includes(s) || (o.description || '').toLowerCase().includes(s));
      }
      if (params?.status) {
        filtered = filtered.filter(o => o.status === params.status);
      }
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 1000;
      const start = (page - 1) * pageSize;

      if (isCacheable) {
        setCachedOrgs(filtered);
      }

      return {
        data: filtered.slice(start, start + pageSize),
        total: filtered.length,
        page,
        pageSize,
      };
    }
  },

  /**
   * GET /api/org-units/:id
   */
  async getById(id: string): Promise<Organization> {
    try {
      const resp = await api.get(`/org-units/${id}`);
      const item: any = extractData(resp);
      if (!item) throw new Error("Đơn vị không tồn tại");

      return {
        id: item.id ?? "",
        name: item.name ?? "",
        code: item.code,
        parentId: item.parentId ? String(item.parentId) : undefined,
        parentOrgName: undefined,
        level: item.level,
        type: item.type as Organization["type"],
        description: item.description,
        address: item.address, detailAddress: item.detailAddress, phone: item.phone,
        contactPerson: item.contactPerson,
        contactPhone: item.contactPhone ?? item.phone,
        status: (item.status?.toLowerCase() as Organization["status"]) ?? "draft",
        operationalStatus: (item.operationalStatus?.toLowerCase() as Organization["operationalStatus"]) ?? "active",
        childCount: 0,
        createdAt: item.createdAt
          ? new Date(item.createdAt).toISOString()
          : "",
        updatedAt: item.updatedAt
          ? new Date(item.updatedAt).toISOString()
          : "",
        updatedBy: item.updatedBy ?? undefined,
      };
    } catch {
      await delay();
      const found = organizations.find(o => o.id === id);
      if (!found) throw new Error("Đơn vị không tồn tại");
      return { ...found };
    }
  },

  /**
   * GET /api/org-units/tree
   * Returns hierarchical tree with children populated.
   */
  async getTree(): Promise<Organization[]> {
    try {
      const resp = await api.get("/org-units/tree");
      const items: any[] = extractData(resp) ?? [];

      if (!Array.isArray(items)) return [];

      const flatList: Organization[] = [];

      const flatten = (node: any) => {
        if (!node) return;
        const org: Organization = {
          id: node.id ?? "",
          name: node.name ?? "",
          code: node.code,
          parentId: node.parentId ? String(node.parentId) : undefined,
          parentOrgName: undefined,
          level: node.level,
          type: node.type as Organization["type"],
          description: node.description,
          address: node.address,
          detailAddress: node.detailAddress,
          phone: node.phone,
          status: (node.status?.toLowerCase() as Organization["status"]) ?? "draft",
          childCount: Array.isArray(node.children) ? node.children.length : 0,
          createdAt: node.createdAt ? new Date(node.createdAt).toISOString() : "",
          updatedAt: node.updatedAt ? new Date(node.updatedAt).toISOString() : "", updatedBy: (node.updatedBy ?? undefined), 
        };
        flatList.push(org);

        if (Array.isArray(node.children)) {
          node.children.forEach(flatten);
        }
      };

      items.forEach(flatten);

      // Enrich parentOrgName
      const orgMap = new Map<string, Organization>();
      flatList.forEach((org) => orgMap.set(org.id, org));
      flatList.forEach((org) => {
        if (org.parentId) {
          const parent = orgMap.get(org.parentId);
          if (parent) {
            org.parentOrgName = parent.name;
          }
        }
      });

      return flatList;
    } catch {
      await delay();
      // Build a tree-like flat list from MOCK_ORGANIZATIONS
      const orgMap = new Map<string, Organization>();
      organizations.forEach(o => orgMap.set(o.id, {...o}));
      // Enrich parentOrgName
      organizations.forEach(o => {
        if (o.parentId) {
          const parent = orgMap.get(o.parentId);
          if (parent) {
            o.parentOrgName = parent.name;
          }
        }
      });
      return [...organizations];
    }
  },

  /**
   * GET /api/org-units?parentId=:id
   * Fetches direct children of a parent unit.
   */
  async getChildren(parentId: string): Promise<Organization[]> {
    try {
      const resp = await api.get("/org-units", {
        params: { parentId },
      });
      const items: any[] = extractData(resp) ?? [];

      const orgMap = new Map<string, Organization>();
      const flatList = items.map((item) => {
        const org: Organization = {
          id: item.id ?? "",
          name: item.name ?? "",
          code: item.code,
          parentId: item.parentId ? String(item.parentId) : undefined,
          parentOrgName: "",
          level: undefined,
          description: item.description,
          address: item.address, detailAddress: item.detailAddress, phone: item.phone,
          contactPerson: item.contactPerson,
          contactPhone: item.contactPhone ?? item.phone,
          status: (item.status?.toLowerCase() as Organization["status"]) ?? "active",
          childCount: 0,
          createdAt: item.createdAt
            ? new Date(item.createdAt).toISOString()
            : "",
          updatedAt: item.updatedAt
            ? new Date(item.updatedAt).toISOString()
            : "",
          updatedBy: item.updatedBy ?? undefined,
        };
        orgMap.set(item.id ?? "", org);
        return org;
      });

      // Compute parentOrgName
      flatList.forEach((org) => {
        if (org.parentId) {
          const parent = orgMap.get(org.parentId);
          if (parent) org.parentOrgName = parent.name;
        }
      });

      return flatList;
    } catch {
      await delay();
      return organizations.filter(o => o.parentId === parentId);
    }
  },

  /**
   * POST /api/org-units
   */
  async create(
    payload: CreateOrganizationPayload
  ): Promise<Organization> {
    clearCachedOrgs();
    try {
      const resp = await api.post("/org-units", {
        name: payload.name,
        ...(payload.code ? { code: payload.code } : {}),
        parentId: payload.parentId,
        type: payload.type,
        description: payload.description,
        address: payload.address,
        detailAddress: payload.detailAddress,
        phone: payload.phone ?? payload.contactPhone,
        contactPerson: payload.contactPerson,
        status: "DRAFT",
        operationalStatus: payload.operationalStatus?.toUpperCase() ?? "ACTIVE",
      });
      const item: any = extractData(resp);

      return {
        id: item.id ?? "",
        name: item.name ?? payload.name,
        code: item.code,
        parentId: payload.parentId,
        parentOrgName: undefined,
        level: undefined,
        type: item.type as Organization["type"],
        description: item.description ?? payload.description,
        address: item.address ?? payload.address,
        phone: item.phone ?? payload.phone,
        contactPerson: item.contactPerson ?? payload.contactPerson,
        contactPhone: payload.contactPhone ?? payload.phone,
        status: (item.status?.toLowerCase() as Organization["status"]) ?? "draft",
        operationalStatus: (item.operationalStatus?.toLowerCase() as Organization["operationalStatus"]) ?? "active",
        childCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(), updatedBy: undefined, 
      };
    } catch {
      await delay();
      // Find parent name if parentId provided
      let parentOrgName: string | undefined;
      if (payload.parentId) {
        const parent = organizations.find(o => o.id === payload.parentId);
        if (parent) parentOrgName = parent.name;
      }
      const newOrg: Organization = {
        id: `org-${Date.now()}`,
        name: payload.name,
        code: payload.code ?? payload.name.substring(0, 10).replace(/\s+/g, "_").toLowerCase(),
        parentId: payload.parentId,
        parentOrgName,
        level: parentOrgName ? 2 : 1,
        type: payload.type,
        description: payload.description,
        address: payload.address,
        phone: payload.phone,
        contactPerson: payload.contactPerson,
        contactPhone: payload.contactPhone ?? payload.phone,
        status: 'draft',
        operationalStatus: payload.operationalStatus ?? 'active',
        childCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(), updatedBy: undefined, 
      };
      organizations.push(newOrg);
      return { ...newOrg };
    }
  },

  /**
   * PUT /api/org-units/:id
   */
  async update(
    id: string,
    payload: UpdateOrganizationPayload
  ): Promise<Organization> {
    clearCachedOrgs();
    try {
      const body: Record<string, any> = {
        name: payload.name,
        code: payload.code,
        type: payload.type,
        description: payload.description,
        address: payload.address,
        detailAddress: payload.detailAddress,
        phone: payload.phone ?? payload.contactPhone,
        contactPerson: payload.contactPerson,
        status: payload.status?.toUpperCase(),
        operationalStatus: payload.operationalStatus?.toUpperCase(),
      };
      if (payload.parentId !== undefined) {
        body.parentId = payload.parentId;
      }
      const resp = await api.put(`/org-units/${id}`, body);
      const item: any = extractData(resp);

      return {
        id: item.id ?? id,
        name: item.name ?? payload.name ?? "",
        code: item.code,
        parentId: payload.parentId,
        parentOrgName: undefined,
        level: undefined,
        type: item.type as Organization["type"],
        description: item.description ?? payload.description,
        address: item.address ?? payload.address,
        phone: item.phone ?? payload.phone,
        contactPerson: item.contactPerson ?? payload.contactPerson,
        contactPhone: payload.contactPhone ?? payload.phone,
        status:
          (payload.status ?? item.status?.toLowerCase()) as Organization["status"] ??
          "draft",
        operationalStatus:
          (payload.operationalStatus ?? item.operationalStatus?.toLowerCase()) as Organization["operationalStatus"] ??
          "active",
        childCount: 0,
        createdAt: item.createdAt
          ? new Date(item.createdAt).toISOString()
          : "",
        updatedAt: item.updatedAt
          ? new Date(item.updatedAt).toISOString()
          : "",
      };
    } catch {
      await delay();
      const idx = organizations.findIndex(o => o.id === id);
      if (idx === -1) throw new Error("Đơn vị không tồn tại");
      organizations[idx] = {
        ...organizations[idx],
        ...payload,
        updatedAt: new Date().toISOString(), updatedBy: undefined, 
      };
      return { ...organizations[idx] };
    }
  },

  /**
   * DELETE /api/org-units/:id
   */
  async delete(id: string): Promise<void> {
    clearCachedOrgs();
    try {
      await api.delete(`/org-units/${id}`);
    } catch {
      await delay();
      const idx = organizations.findIndex(o => o.id === id);
      if (idx === -1) throw new Error("Đơn vị không tồn tại");
      organizations.splice(idx, 1);
    }
  },

  /**
   * POST /api/org-units/:id/submit
   */
  async submit(id: string): Promise<Organization> {
    clearCachedOrgs();
    try {
      const resp = await api.post(`/org-units/${id}/submit`);
      const item: any = extractData(resp);
      return {
        id: item.id ?? id,
        name: item.name ?? "",
        code: item.code,
        parentId: item.parentId ? String(item.parentId) : undefined,
        parentOrgName: undefined,
        level: undefined,
        description: item.description,
        address: item.address, detailAddress: item.detailAddress, phone: item.phone,
        contactPerson: item.contactPerson,
        contactPhone: item.contactPhone ?? item.phone,
        status: (item.status?.toLowerCase() as Organization["status"]) ?? "active",
        childCount: 0,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : "",
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : "", updatedBy: (item.updatedBy ?? undefined), 
      };
    } catch {
      await delay();
      const idx = organizations.findIndex(o => o.id === id);
      if (idx === -1) throw new Error("Đơn vị không tồn tại");
      organizations[idx] = { ...organizations[idx], status: 'pending', updatedAt: new Date().toISOString() };
      return { ...organizations[idx] };
    }
  },

  /**
   * POST /api/org-units/:id/approve
   */
  async approve(id: string, comments?: string): Promise<Organization> {
    clearCachedOrgs();
    try {
      const resp = await api.post(`/org-units/${id}/approve`, null, {
        params: comments ? { comments } : undefined,
      });
      const item: any = extractData(resp);
      return {
        id: item.id ?? id,
        name: item.name ?? "",
        code: item.code,
        parentId: item.parentId ? String(item.parentId) : undefined,
        parentOrgName: undefined,
        level: undefined,
        description: item.description,
        address: item.address, detailAddress: item.detailAddress, phone: item.phone,
        contactPerson: item.contactPerson,
        contactPhone: item.contactPhone ?? item.phone,
        status: (item.status?.toLowerCase() as Organization["status"]) ?? "active",
        childCount: 0,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : "",
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : "", updatedBy: (item.updatedBy ?? undefined), 
      };
    } catch {
      await delay();
      const idx = organizations.findIndex(o => o.id === id);
      if (idx === -1) throw new Error("Đơn vị không tồn tại");
      organizations[idx] = { ...organizations[idx], status: 'approved', updatedAt: new Date().toISOString() };
      return { ...organizations[idx] };
    }
  },

  /**
   * POST /api/org-units/:id/reject
   */
  async reject(id: string, comments?: string): Promise<Organization> {
    clearCachedOrgs();
    try {
      const resp = await api.post(`/org-units/${id}/reject`, null, {
        params: comments ? { comments } : undefined,
      });
      const item: any = extractData(resp);
      return {
        id: item.id ?? id,
        name: item.name ?? "",
        code: item.code,
        parentId: item.parentId ? String(item.parentId) : undefined,
        parentOrgName: undefined,
        level: undefined,
        description: item.description,
        address: item.address, detailAddress: item.detailAddress, phone: item.phone,
        contactPerson: item.contactPerson,
        contactPhone: item.contactPhone ?? item.phone,
        status: (item.status?.toLowerCase() as Organization["status"]) ?? "active",
        childCount: 0,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : "",
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : "", updatedBy: (item.updatedBy ?? undefined), 
      };
    } catch {
      await delay();
      const idx = organizations.findIndex(o => o.id === id);
      if (idx === -1) throw new Error("Đơn vị không tồn tại");
      organizations[idx] = { ...organizations[idx], status: 'rejected', updatedAt: new Date().toISOString() };
      return { ...organizations[idx] };
    }
  },

  async search(query: string): Promise<Organization[]> {
    try {
      const resp = await api.get("/org-units/search", {
        params: { q: query }
      });
      const rawData: any[] = extractData(resp) || [];
      return rawData.map((item) => ({
        id: item.id ?? "",
        name: item.name ?? "",
        code: item.code,
        parentId: item.parentId ? String(item.parentId) : undefined,
        parentOrgName: undefined,
        level: item.level,
        type: item.type as Organization["type"],
        description: item.description,
        address: item.address, detailAddress: item.detailAddress, phone: item.phone,
        contactPerson: item.contactPerson,
        contactPhone: item.contactPhone ?? item.phone,
        status: (item.status?.toLowerCase() as Organization["status"]) ?? "draft",
        childCount: 0,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : "",
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : "", updatedBy: (item.updatedBy ?? undefined), 
      }));
    } catch {
      await delay();
      const s = query.toLowerCase();
      return organizations.filter(o =>
        o.name.toLowerCase().includes(s) ||
        (o.code || '').toLowerCase().includes(s) ||
        (o.description || '').toLowerCase().includes(s)
      );
    }
  },
};
