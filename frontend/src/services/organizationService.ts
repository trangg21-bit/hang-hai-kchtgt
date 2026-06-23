import api from "./api";
import type { PaginatedResponse } from "../types/common";

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
  description?: string;
  address?: string;
  phone?: string;
  contactPerson?: string;
  contactPhone?: string;
  status: "active" | "locked" | "inactive";
  childCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationPayload {
  name: string;
  code?: string;
  parentId?: string;
  description?: string;
  address?: string;
  phone?: string;
  contactPerson?: string;
  contactPhone?: string;
}

export interface UpdateOrganizationPayload {
  name?: string;
  code?: string;
  parentId?: string;
  description?: string;
  address?: string;
  phone?: string;
  contactPerson?: string;
  contactPhone?: string;
  status?: "active" | "locked" | "inactive";
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
    description: undefined, // backend doesn't have description in OrgUnitResponse
    address: item.address,
    phone: item.phone,
    contactPerson: undefined,
    contactPhone: item.phone,
    status: (item.status?.toLowerCase() as Organization["status"]) ?? "active",
    childCount,
    createdAt: item.createdAt
      ? new Date(item.createdAt).toISOString()
      : "",
    updatedAt: item.updatedAt
      ? new Date(item.updatedAt).toISOString()
      : "",
  };
}

export const organizationService = {
  /**
   * GET /api/org-units
   * Note: Backend returns flat list (no pagination endpoint).
   * Frontend applies pagination client-side.
   */
  async list(
    params?: { page?: number; pageSize?: number; search?: string; status?: string }
  ): Promise<PaginatedResponse<Organization>> {
    const resp = await api.get("/org-units", {
      params: params?.parentId ? { parentId: params.parentId } : undefined,
    });
    const items: any[] = extractData(resp) ?? [];

    // Build flat list first for parent lookups
    const flatList = items.map((item) => ({
      ...item,
      // Map to frontend Organization type
      id: item.id ?? "",
      name: item.name ?? "",
      code: item.code,
      parentId: item.parentId ? String(item.parentId) : undefined,
      status: (item.status?.toLowerCase() as Organization["status"]) ?? "active",
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
        level: 1, // placeholder
        description: undefined,
        address: item.address,
        phone: item.phone,
        contactPerson: undefined,
        contactPhone: item.phone,
        status: item.status as Organization["status"],
        childCount: 0, // placeholder
        createdAt: "",
        updatedAt: "",
      });
    });

    // Now compute parentOrgName and level
    const data: Organization[] = flatList.map((item) => {
      let level = 1;
      let parentOrgName: string | undefined;
      if (item.parentId) {
        const parent = orgMap.get(item.parentId);
        if (parent) {
          level = parent.level !== undefined ? parent.level + 1 : 2;
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
        description: undefined,
        address: item.address,
        phone: item.phone,
        contactPerson: undefined,
        contactPhone: item.phone,
        status: item.status as Organization["status"],
        childCount,
        createdAt: "",
        updatedAt: "",
      };
    });

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
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;

    return {
      data: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  },

  /**
   * GET /api/org-units/:id
   */
  async getById(id: string): Promise<Organization> {
    const resp = await api.get(`/org-units/${id}`);
    const item: any = extractData(resp);
    if (!item) throw new Error("ÄÆ¡n vá»‹ khÃ´ng tá»“n táº¡i");

    return {
      id: item.id ?? "",
      name: item.name ?? "",
      code: item.code,
      parentId: item.parentId ? String(item.parentId) : undefined,
      parentOrgName: undefined,
      level: undefined,
      description: undefined,
      address: item.address,
      phone: item.phone,
      contactPerson: undefined,
      contactPhone: item.phone,
      status: (item.status?.toLowerCase() as Organization["status"]) ?? "active",
      childCount: 0,
      createdAt: item.createdAt
        ? new Date(item.createdAt).toISOString()
        : "",
      updatedAt: item.updatedAt
        ? new Date(item.updatedAt).toISOString()
        : "",
    };
  },

  /**
   * GET /api/org-units/tree
   * Returns hierarchical tree with children populated.
   */
  async getTree(): Promise<Organization[]> {
    const resp = await api.get("/org-units/tree");
    const items: any[] = extractData(resp) ?? [];

    if (!Array.isArray(items)) return [];

    // Build a flat map first for parent lookups
    const orgMap = new Map<string, Organization>();
    const flatList = items.map((item) => ({
      ...item,
      id: item.id ?? "",
      name: item.name ?? "",
      code: item.code,
      parentId: item.parentId ? String(item.parentId) : undefined,
      status: (item.status?.toLowerCase() as Organization["status"]) ?? "active",
    }));

    flatList.forEach((item) => {
      orgMap.set(item.id, {
        id: item.id,
        name: item.name,
        code: item.code,
        parentId: item.parentId,
        parentOrgName: undefined,
        level: 1,
        description: undefined,
        address: item.address,
        phone: item.phone,
        contactPerson: undefined,
        contactPhone: item.phone,
        status: item.status as Organization["status"],
        childCount: 0,
        createdAt: "",
        updatedAt: "",
      });
    });

    // Compute parentOrgName and level
    const enrichedList: Organization[] = flatList.map((item) => {
      let level = 1;
      let parentOrgName: string | undefined;
      if (item.parentId) {
        const parent = orgMap.get(item.parentId);
        if (parent) {
          level = parent.level !== undefined ? parent.level + 1 : 2;
          parentOrgName = parent.name;
        }
      }

      const childCount = flatList.filter(
        (o) => o.parentId === item.id
      ).length;

      return {
        ...item,
        parentOrgName,
        level,
        childCount,
        createdAt: item.createdAt
          ? new Date(item.createdAt).toISOString()
          : "",
        updatedAt: item.updatedAt
          ? new Date(item.updatedAt).toISOString()
          : "",
      };
    });

    // Build tree from flat list
    const result: Organization[] = [];
    const rootIds = new Set<string>();
    enrichedList.forEach((org) => {
      if (!org.parentId) {
        rootIds.add(org.id);
      }
    });

    enrichedList.forEach((org) => {
      const orgWithChildren: Organization = { ...org };
      // Find direct children
      const children = enrichedList.filter(
        (o) => o.parentId === org.id
      );
      if (children.length > 0) {
        orgWithChildren.childCount = children.length;
      }
      if (rootIds.has(org.id)) {
        result.push(orgWithChildren);
      }
    });

    return result;
  },

  /**
   * GET /api/org-units?parentId=:id
   * Fetches direct children of a parent unit.
   */
  async getChildren(parentId: string): Promise<Organization[]> {
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
        description: undefined,
        address: item.address,
        phone: item.phone,
        contactPerson: undefined,
        contactPhone: item.phone,
        status: (item.status?.toLowerCase() as Organization["status"]) ?? "active",
        childCount: 0,
        createdAt: item.createdAt
          ? new Date(item.createdAt).toISOString()
          : "",
        updatedAt: item.updatedAt
          ? new Date(item.updatedAt).toISOString()
          : "",
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
  },

  /**
   * POST /api/org-units
   */
  async create(
    payload: CreateOrganizationPayload
  ): Promise<Organization> {
    const resp = await api.post("/org-units", {
      name: payload.name,
      code:
        payload.code ??
        payload.name.substring(0, 10).replace(/\s+/g, "_").toLowerCase(),
      parentId: payload.parentId,
      address: payload.address,
      phone: payload.phone ?? payload.contactPhone,
      status: "ACTIVE",
    });
    const item: any = extractData(resp);

    return {
      id: item.id ?? "",
      name: item.name ?? payload.name,
      code: item.code,
      parentId: payload.parentId,
      parentOrgName: undefined,
      level: undefined,
      description: undefined,
      address: item.address ?? payload.address,
      phone: item.phone ?? payload.phone,
      contactPerson: payload.contactPerson,
      contactPhone: payload.contactPhone ?? payload.phone,
      status: "active",
      childCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * PUT /api/org-units/:id
   */
  async update(
    id: string,
    payload: UpdateOrganizationPayload
  ): Promise<Organization> {
    const resp = await api.put(`/org-units/${id}`, {
      name: payload.name,
      code: payload.code,
      parentId: payload.parentId,
      address: payload.address,
      phone: payload.phone ?? payload.contactPhone,
      status: payload.status?.toUpperCase(),
    });
    const item: any = extractData(resp);

    return {
      id: item.id ?? id,
      name: item.name ?? payload.name ?? "",
      code: item.code,
      parentId: payload.parentId,
      parentOrgName: undefined,
      level: undefined,
      description: undefined,
      address: item.address ?? payload.address,
      phone: item.phone ?? payload.phone,
      contactPerson: payload.contactPerson,
      contactPhone: payload.contactPhone ?? payload.phone,
      status:
        (payload.status ?? item.status?.toLowerCase()) as Organization["status"] ??
        "active",
      childCount: 0,
      createdAt: item.createdAt
        ? new Date(item.createdAt).toISOString()
        : "",
      updatedAt: item.updatedAt
        ? new Date(item.updatedAt).toISOString()
        : "",
    };
  },

  /**
   * DELETE /api/org-units/:id
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/org-units/${id}`);
  },
};
