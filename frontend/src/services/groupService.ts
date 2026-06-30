import api from "./api";
import type { PaginatedResponse } from "../types/common";

// ============================================================
// Types
// ============================================================
export interface Group {
  id: string;
  name: string;
  code?: string;
  description?: string;
  permissions?: string[];
  memberCount?: number;
  status: "active" | "locked" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  userId: string;
  fullName: string;
  username: string;
  email: string;
  groupId: string;
  groupName: string;
  role: "admin" | "member" | "viewer";
  status: string;
  joinedAt: string;
  createdAt: string;
}

export interface CreateGroupPayload {
  name: string;
  code?: string;
  description?: string;
  permissions?: string[];
  status?: "active" | "locked" | "inactive";
  memberIds?: string[];
}

export interface UpdateGroupPayload {
  name?: string;
  code?: string;
  description?: string;
  permissions?: string[];
  status?: "active" | "locked" | "inactive";
}

export interface AddMemberPayload {
  userId: string;
  role: "admin" | "member" | "viewer";
}

export interface GroupFilters {
  search?: string;
  status?: string;
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

export const groupService = {
  /**
   * GET /api/groups
   * Note: Backend returns flat list (no pagination endpoint).
   * Frontend applies pagination client-side.
   */
  async list(
    params?: { page?: number; pageSize?: number; search?: string; status?: string }
  ): Promise<PaginatedResponse<Group>> {
    const resp = await api.get("/groups");
    const rawData: any = extractData(resp);
    const items: any[] = Array.isArray(rawData)
      ? rawData
      : (rawData && Array.isArray(rawData.items)
        ? rawData.items
        : (rawData && Array.isArray(rawData.content) ? rawData.content : []));

    let filtered: any[] = [...items];

    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          (g.description || "").toLowerCase().includes(q)
      );
    }
    if (params?.status) {
      filtered = filtered.filter(
        (g) => g.status?.toLowerCase() === params.status?.toLowerCase()
      );
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;

    // Map backend DTO -> frontend Group interface
    const data: Group[] = filtered
      .slice(start, start + pageSize)
      .map((item) => ({
        id: item.id ?? "",
        name: item.name ?? "",
        code: item.code,
        description: item.description,
        permissions: item.permissions,
        memberCount: item.memberCount ?? 0,
        status: (item.status?.toLowerCase() as Group["status"]) ?? "active",
        createdAt: item.createdAt
          ? new Date(item.createdAt).toISOString()
          : "",
        updatedAt: item.updatedAt
          ? new Date(item.updatedAt).toISOString()
          : "",
      }));

    return {
      data,
      total: filtered.length,
      page,
      pageSize,
    };
  },

  /**
   * GET /api/groups/:id
   */
  async getById(id: string): Promise<Group> {
    const resp = await api.get(`/groups/${id}`);
    const item: any = extractData(resp);
    if (!item) throw new Error("NhÃ³m khÃ´ng tá»“n táº¡i");

    return {
      id: item.id ?? "",
      name: item.name ?? "",
      code: item.code,
      description: item.description,
      permissions: item.permissions,
      memberCount: undefined,
      status: (item.status?.toLowerCase() as Group["status"]) ?? "active",
      createdAt: item.createdAt
        ? new Date(item.createdAt).toISOString()
        : "",
      updatedAt: item.updatedAt
        ? new Date(item.updatedAt).toISOString()
        : "",
    };
  },

  /**
   * POST /api/groups
   */
  async create(payload: CreateGroupPayload): Promise<Group> {
    const resp = await api.post("/groups", {
      name: payload.name,
      code: payload.code ?? payload.name.substring(0, 10).replace(/\s+/g, "_").toLowerCase(),
      description: payload.description,
      permissions: payload.permissions,
      status: (payload.status ?? "active").toUpperCase(),
    });
    const item: any = extractData(resp);

    return {
      id: item.id ?? "",
      name: item.name ?? payload.name,
      code: item.code,
      description: item.description,
      permissions: item.permissions,
      memberCount: 0,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * PUT /api/groups/:id
   */
  async update(id: string, payload: UpdateGroupPayload): Promise<Group> {
    const resp = await api.put(`/groups/${id}`, {
      name: payload.name,
      code: payload.code,
      description: payload.description,
      permissions: payload.permissions,
      status: payload.status?.toUpperCase(),
    });
    const item: any = extractData(resp);

    return {
      id: item.id ?? id,
      name: item.name ?? payload.name ?? "",
      code: item.code,
      description: item.description ?? payload.description,
      permissions: item.permissions ?? payload.permissions,
      memberCount: undefined,
      status:
        (payload.status ?? item.status?.toLowerCase()) as Group["status"] ??
        "active",
      createdAt: item.createdAt
        ? new Date(item.createdAt).toISOString()
        : "",
      updatedAt: item.updatedAt
        ? new Date(item.updatedAt).toISOString()
        : "",
    };
  },

  /**
   * DELETE /api/groups/:id
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/groups/${id}`);
  },

  // --- Members ---
  /**
   * GET /api/groups/:id/members
   */
  async getMembers(groupId: string): Promise<GroupMember[]> {
    try {
      const resp = await api.get(`/groups/${groupId}/members`);
      const rawData: any = extractData(resp);
      const items: any[] = Array.isArray(rawData)
        ? rawData
        : (rawData && Array.isArray(rawData.items)
          ? rawData.items
          : (rawData && Array.isArray(rawData.content) ? rawData.content : []));
      return items.map((item) => ({
        id: item.id ?? "",
        userId: item.userId ?? "",
        fullName: item.fullName ?? "",
        username: item.username ?? "",
        email: item.email ?? "",
        groupId: item.groupId ?? groupId,
        groupName: item.groupName ?? "",
        role: (item.roleInGroup as GroupMember["role"]) ?? (item.role as GroupMember["role"]) ?? "member",
        status: item.status ?? "active",
        joinedAt: item.joinedAt
          ? new Date(item.joinedAt).toISOString()
          : "",
        createdAt: item.createdAt
          ? new Date(item.createdAt).toISOString()
          : "",
      }));
    } catch (e) {
      console.error("Error fetching group members:", e);
      return [];
    }
  },

  /**
   * POST /api/groups/:id/members
   */
  async addMember(
    groupId: string,
    payload: AddMemberPayload
  ): Promise<void> {
    await api.post(`/groups/${groupId}/members`, {
      userId: payload.userId,
      roleInGroup: payload.role,
    });
  },

  /**
   * DELETE /api/groups/:id/members/:userId
   */
  async removeMember(groupId: string, userId: string): Promise<void> {
    await api.delete(`/groups/${groupId}/members/${userId}`);
  },
};
