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
  type?: "CUC" | "TCT" | "CHI_CUC" | "CANG_VU";
  description?: string;
  address?: string;
  phone?: string;
  contactPerson?: string;
  contactPhone?: string;
  coefficient?: number;
  status: "draft" | "pending" | "approved" | "rejected";
  childCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationPayload {
  name: string;
  code?: string;
  parentId?: string;
  type?: "CUC" | "TCT" | "CHI_CUC" | "CANG_VU";
  description?: string;
  address?: string;
  phone?: string;
  contactPerson?: string;
  contactPhone?: string;
  coefficient?: number;
}

export interface UpdateOrganizationPayload {
  name?: string;
  code?: string;
  parentId?: string;
  type?: "CUC" | "TCT" | "CHI_CUC" | "CANG_VU";
  description?: string;
  address?: string;
  phone?: string;
  contactPerson?: string;
  contactPhone?: string;
  coefficient?: number;
  status?: "draft" | "pending" | "approved" | "rejected";
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
    address: item.address,
    phone: item.phone,
    contactPerson: item.contactPerson,
    contactPhone: item.phone,
    status: (item.status?.toLowerCase() as Organization["status"]) ?? "draft",
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
      coefficient: item.coefficient,
      status: (item.status?.toLowerCase() as Organization["status"]) ?? "draft",
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
        address: item.address,
        phone: item.phone,
        contactPerson: item.contactPerson,
        contactPhone: item.phone,
        coefficient: item.coefficient,
        status: item.status as Organization["status"],
        childCount: 0, // placeholder
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : "",
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : "",
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
        address: item.address,
        phone: item.phone,
        contactPerson: item.contactPerson,
        contactPhone: item.phone,
        coefficient: item.coefficient,
        status: item.status as Organization["status"],
        childCount,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : "",
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : "",
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
      level: item.level,
      type: item.type as Organization["type"],
      description: item.description,
      address: item.address,
      phone: item.phone,
      contactPerson: item.contactPerson,
      contactPhone: item.contactPhone ?? item.phone,
      coefficient: item.coefficient,
      status: (item.status?.toLowerCase() as Organization["status"]) ?? "draft",
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
        phone: node.phone,
        coefficient: node.coefficient,
        status: (node.status?.toLowerCase() as Organization["status"]) ?? "draft",
        childCount: Array.isArray(node.children) ? node.children.length : 0,
        createdAt: node.createdAt ? new Date(node.createdAt).toISOString() : "",
        updatedAt: node.updatedAt ? new Date(node.updatedAt).toISOString() : "",
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
        description: item.description,
        address: item.address,
        phone: item.phone,
        contactPerson: item.contactPerson,
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
      type: payload.type,
      description: payload.description,
      address: payload.address,
      phone: payload.phone ?? payload.contactPhone,
      contactPerson: payload.contactPerson,
      coefficient: payload.coefficient,
      status: "DRAFT",
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
      coefficient: item.coefficient,
      status: (item.status?.toLowerCase() as Organization["status"]) ?? "draft",
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
      parentId: payload.parentId || "00000000-0000-0000-0000-000000000000",
      type: payload.type,
      description: payload.description,
      address: payload.address,
      phone: payload.phone ?? payload.contactPhone,
      contactPerson: payload.contactPerson,
      coefficient: payload.coefficient,
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
      type: item.type as Organization["type"],
      description: item.description ?? payload.description,
      address: item.address ?? payload.address,
      phone: item.phone ?? payload.phone,
      contactPerson: item.contactPerson ?? payload.contactPerson,
      contactPhone: payload.contactPhone ?? payload.phone,
      coefficient: item.coefficient,
      status:
        (payload.status ?? item.status?.toLowerCase()) as Organization["status"] ??
        "draft",
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

  /**
   * POST /api/org-units/:id/submit
   */
  async submit(id: string): Promise<Organization> {
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
      address: item.address,
      phone: item.phone,
      contactPerson: item.contactPerson,
      contactPhone: item.phone,
      status: (item.status?.toLowerCase() as Organization["status"]) ?? "active",
      childCount: 0,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : "",
      updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : "",
    };
  },

  /**
   * POST /api/org-units/:id/approve
   */
  async approve(id: string, comments?: string): Promise<Organization> {
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
      address: item.address,
      phone: item.phone,
      contactPerson: item.contactPerson,
      contactPhone: item.phone,
      status: (item.status?.toLowerCase() as Organization["status"]) ?? "active",
      childCount: 0,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : "",
      updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : "",
    };
  },

  /**
   * POST /api/org-units/:id/reject
   */
  async reject(id: string, comments?: string): Promise<Organization> {
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
      address: item.address,
      phone: item.phone,
      contactPerson: item.contactPerson,
      contactPhone: item.phone,
      status: (item.status?.toLowerCase() as Organization["status"]) ?? "active",
      childCount: 0,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : "",
      updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : "",
    };
  },
};
