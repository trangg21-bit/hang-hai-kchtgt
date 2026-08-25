import api from "./api";
import type { PaginatedResponse } from "../types/common";
import { getProvinceNameById } from "../types/common";
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
  provinceId?: number;
  provinceName?: string;
  detailAddress?: string;
  phone?: string;
  operationalStatus?: "active" | "inactive";
  childCount?: number;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  rank?: OrgUnitRankName;
}

export interface CreateOrganizationPayload {
  name: string;
  code?: string;
  parentId?: string;
  type?: "DEPARTMENT" | "GENERAL_DEPARTMENT" | "SUB_DEPARTMENT" | "PORT_AUTHORITY";
  description?: string;
  provinceId?: number;
  detailAddress?: string;
  phone?: string;
  operationalStatus?: "active" | "inactive";
  rank?: OrgUnitRankName;
}

export interface UpdateOrganizationPayload {
  name?: string;
  code?: string;
  parentId?: string;
  type?: "DEPARTMENT" | "GENERAL_DEPARTMENT" | "SUB_DEPARTMENT" | "PORT_AUTHORITY";
  description?: string;
  provinceId?: number;
  detailAddress?: string;
  phone?: string;
  operationalStatus?: "active" | "inactive";
  rank?: OrgUnitRankName;
}

export interface OrgFilters {
  search?: string;
  level?: number;
  parentId?: string;
}

export type OrgUnitRankName = "DEPARTMENT" | "BRANCH" | "REPRESENTATIVE";

export const RANK_LABELS: Record<OrgUnitRankName, string> = {
  DEPARTMENT: "Cục",
  BRANCH: "Chi cục/ Cảng vụ/ Công ty bảo đảm",
  REPRESENTATIVE: "Đại diện",
};

export const RANK_OPTIONS: { value: OrgUnitRankName; label: string }[] = [
  { value: "DEPARTMENT", label: "Cục" },
  { value: "BRANCH", label: "Chi cục/ Cảng vụ/ Công ty bảo đảm" },
  { value: "REPRESENTATIVE", label: "Đại diện" },
];

// ============================================================
// API Response normalizer
// ============================================================
function extractData<T>(response: any): T {
  return response.data?.data ?? response.data;
}

function toApiOperationalStatus(status?: Organization["operationalStatus"]): "OPERATIONAL" | "SUSPENDED" {
  return status === "inactive" ? "SUSPENDED" : "OPERATIONAL";
}

// ============================================================
// Service -- real API calls
// ============================================================

/**
 * Compute derived fields that the backend does not return in flat list responses.
 * The backend OrgUnitResponse has: id, name, code, parentId, type, provinceId, detailAddress, phone, createdAt, updatedAt, children.
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
    parentId: item.parentId ? String(item.parentId) : undefined,
    parentOrgName,
    level,
    type: item.type as Organization["type"],
    description: item.description,
    provinceId: item.provinceId != null ? Number(item.provinceId) : undefined,
    provinceName: item.provinceId != null ? getProvinceNameById(Number(item.provinceId)) : undefined,
    detailAddress: item.detailAddress, phone: item.phone,
    operationalStatus: (item.operationalStatus?.toLowerCase() as Organization["operationalStatus"]) ?? "active",
    rank: item.rank as OrgUnitRankName | undefined,
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

const ORG_CACHE_TTL_MS = 5 * 60_000;

/**
 * Organisation data is scoped by the authenticated user. A shared browser
 * cache must therefore never be reused across users or permission versions.
 */
const getOrgCacheKey = (): string => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return 'anonymous';
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return `${payload.user_id || payload.sub || 'unknown'}:${payload.permission_version ?? 'unknown'}`;
  } catch {
    return 'unknown';
  }
};

const getCachedOrgs = (): Organization[] | null => {
  const globalWin = getGlobalWindow();
  const cachedAt = Number(globalWin.__orgUnitsCacheAt || 0);
  const cacheKey = getOrgCacheKey();
  if (!globalWin.__orgUnitsCache || globalWin.__orgUnitsCacheKey !== cacheKey
    || !cachedAt || Date.now() - cachedAt > ORG_CACHE_TTL_MS) {
    globalWin.__orgUnitsCache = null;
    globalWin.__orgUnitsCacheAt = 0;
    globalWin.__orgUnitsCacheKey = null;
    return null;
  }
  return globalWin.__orgUnitsCache;
};

const setCachedOrgs = (orgs: Organization[]) => {
  const globalWin = getGlobalWindow();
  globalWin.__orgUnitsCache = orgs;
  globalWin.__orgUnitsCacheAt = Date.now();
  globalWin.__orgUnitsCacheKey = getOrgCacheKey();
};

const clearCachedOrgs = () => {
  const globalWin = getGlobalWindow();
  globalWin.__orgUnitsCache = null;
  globalWin.__orgUnitsCacheAt = 0;
  globalWin.__orgUnitsCacheKey = null;
};

export const invalidateOrganizationCache = clearCachedOrgs;

export const organizationService = {
  /**
   * GET /api/common/options/org-units for the authenticated user's directory list, or the
   * paginated endpoint when filters are supplied. Frontend applies pagination
   * client-side for the cached directory list.
   */
  async list(
    params?: { page?: number; pageSize?: number; search?: string; parentId?: string }
  ): Promise<PaginatedResponse<Organization>> {
    const isCacheable = !params?.search && !params?.parentId;
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
      const resp = isCacheable
        ? await api.get("/common/options/org-units")
        : await api.get("/org-units", {
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
        parentId: item.parentId ? String(item.parentId) : undefined,
        level: item.level,
        type: item.type as Organization["type"],
        operationalStatus: (item.operationalStatus?.toLowerCase() as Organization["operationalStatus"]) ?? "active",
        rank: item.rank as OrgUnitRankName | undefined,
      }));

      // Build parent name lookup map
      const orgMap = new Map<string, Organization>();
      flatList.forEach((item) => {
        orgMap.set(item.id, {
          id: item.id,
          name: item.name,
          parentId: item.parentId,
          parentOrgName: undefined,
          level: item.level,
          type: item.type as Organization["type"],
          description: item.description,
          provinceId: item.provinceId != null ? Number(item.provinceId) : undefined,
          provinceName: item.provinceId != null ? getProvinceNameById(Number(item.provinceId)) : undefined,
          detailAddress: item.detailAddress, phone: item.phone,
          operationalStatus: item.operationalStatus as Organization["operationalStatus"],
          rank: item.rank as OrgUnitRankName | undefined,
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
          parentId: item.parentId,
          parentOrgName,
          level,
          type: item.type as Organization["type"],
          description: item.description,
          provinceId: item.provinceId != null ? Number(item.provinceId) : undefined,
          provinceName: item.provinceId != null ? getProvinceNameById(Number(item.provinceId)) : undefined,
          detailAddress: item.detailAddress, phone: item.phone,
          operationalStatus: item.operationalStatus as Organization["operationalStatus"],
          rank: item.rank as OrgUnitRankName | undefined,
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
        parentId: item.parentId ? String(item.parentId) : undefined,
        parentOrgName: undefined,
        level: item.level,
        type: item.type as Organization["type"],
        description: item.description,
        provinceId: item.provinceId != null ? Number(item.provinceId) : undefined,
        provinceName: item.provinceId != null ? getProvinceNameById(Number(item.provinceId)) : undefined,
        detailAddress: item.detailAddress, phone: item.phone,
        operationalStatus: (item.operationalStatus?.toLowerCase() as Organization["operationalStatus"]) ?? "active",
        rank: item.rank as OrgUnitRankName | undefined,
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
  async getTree(options?: { allowMockFallback?: boolean }): Promise<Organization[]> {
    const cached = getCachedOrgs();
    if (cached) {
      return cached;
    }

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
          parentId: node.parentId ? String(node.parentId) : undefined,
          parentOrgName: undefined,
          level: node.level,
          type: node.type as Organization["type"],
          description: node.description,
          provinceId: node.provinceId != null ? Number(node.provinceId) : undefined,
          provinceName: node.provinceId != null ? getProvinceNameById(Number(node.provinceId)) : undefined,
          detailAddress: node.detailAddress,
          phone: node.phone,
          operationalStatus: (node.operationalStatus?.toLowerCase() as Organization["operationalStatus"]) ?? "active",
          rank: node.rank as OrgUnitRankName | undefined,
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

      setCachedOrgs(flatList);
      return flatList;
    } catch (error) {
      if (options?.allowMockFallback === false) {
        throw error;
      }
      await delay();
      // Build a tree-like flat list from MOCK_ORGANIZATIONS
      const orgMap = new Map<string, Organization>();
      organizations.forEach(o => orgMap.set(o.id, { ...o }));
      // Enrich parentOrgName
      organizations.forEach(o => {
        if (o.parentId) {
          const parent = orgMap.get(o.parentId);
          if (parent) {
            o.parentOrgName = parent.name;
          }
        }
      });
      const fallback = [...organizations];
      setCachedOrgs(fallback);
      return fallback;
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
          provinceId: item.provinceId != null ? Number(item.provinceId) : undefined,
          provinceName: item.provinceId != null ? getProvinceNameById(Number(item.provinceId)) : undefined,
          detailAddress: item.detailAddress, phone: item.phone,
          operationalStatus: (item.operationalStatus?.toLowerCase() as Organization["operationalStatus"]) ?? "active",
          rank: item.rank as OrgUnitRankName | undefined,
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
    try {
      const resp = await api.post("/org-units", {
        name: payload.name,
        parentId: payload.parentId,
        type: payload.type,
        description: payload.description,
        provinceId: payload.provinceId,
        detailAddress: payload.detailAddress,
        phone: payload.phone,
        operationalStatus: toApiOperationalStatus(payload.operationalStatus),
        rank: payload.rank,
      });
      const item: any = extractData(resp);
      clearCachedOrgs();

      return {
        id: item.id ?? "",
        name: item.name ?? payload.name,
        parentId: payload.parentId,
        parentOrgName: undefined,
        level: undefined,
        type: item.type as Organization["type"],
        description: item.description ?? payload.description,
        provinceId: item.provinceId != null ? Number(item.provinceId) : payload.provinceId,
        provinceName: item.provinceId != null ? getProvinceNameById(Number(item.provinceId)) : undefined,
        detailAddress: item.detailAddress ?? payload.detailAddress,
        phone: item.phone ?? payload.phone,
        operationalStatus: (item.operationalStatus?.toLowerCase() as Organization["operationalStatus"]) ?? "active",
        rank: item.rank as OrgUnitRankName | undefined,
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
        parentId: payload.parentId,
        parentOrgName,
        level: parentOrgName ? 2 : 1,
        type: payload.type,
        description: payload.description,
        provinceId: payload.provinceId,
        detailAddress: payload.detailAddress,
        phone: payload.phone,
        operationalStatus: payload.operationalStatus ?? 'active',
        rank: payload.rank,
        childCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(), updatedBy: undefined,
      };
      organizations.push(newOrg);
      clearCachedOrgs();
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
    try {
      const body: Record<string, any> = {
        name: payload.name,
        type: payload.type,
        description: payload.description,
        provinceId: payload.provinceId,
        detailAddress: payload.detailAddress,
        phone: payload.phone,
        operationalStatus: payload.operationalStatus
          ? toApiOperationalStatus(payload.operationalStatus)
          : undefined,
        rank: payload.rank,
      };
      if (payload.parentId !== undefined) {
        body.parentId = payload.parentId;
      }
      const resp = await api.put(`/org-units/${id}`, body);
      const item: any = extractData(resp);
      clearCachedOrgs();

      return {
        id: item.id ?? id,
        name: item.name ?? payload.name ?? "",
        parentId: payload.parentId,
        parentOrgName: undefined,
        level: undefined,
        type: item.type as Organization["type"],
        description: item.description ?? payload.description,
        provinceId: item.provinceId != null ? Number(item.provinceId) : payload.provinceId,
        provinceName: item.provinceId != null ? getProvinceNameById(Number(item.provinceId)) : undefined,
        detailAddress: item.detailAddress ?? payload.detailAddress,
        phone: item.phone ?? payload.phone,
        operationalStatus:
          (payload.operationalStatus ?? item.operationalStatus?.toLowerCase()) as Organization["operationalStatus"] ??
          "active",
        rank: item.rank as OrgUnitRankName | undefined,
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
      clearCachedOrgs();
      return { ...organizations[idx] };
    }
  },

  /**
   * DELETE /api/org-units/:id
   */
  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/org-units/${id}`);
      clearCachedOrgs();
    } catch {
      await delay();
      const idx = organizations.findIndex(o => o.id === id);
      if (idx === -1) throw new Error("Đơn vị không tồn tại");
      organizations.splice(idx, 1);
      clearCachedOrgs();
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
        detailAddress: item.detailAddress, phone: item.phone,
        operationalStatus: (item.operationalStatus?.toLowerCase() as Organization["operationalStatus"]) ?? "active",
        rank: item.rank as OrgUnitRankName | undefined,
        childCount: 0,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : "",
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : "", updatedBy: (item.updatedBy ?? undefined),
      }));
    } catch {
      await delay();
      const s = query.toLowerCase();
      return organizations.filter(o =>
        o.name.toLowerCase().includes(s) ||
        (o.description || '').toLowerCase().includes(s)
      );
    }
  },
};
