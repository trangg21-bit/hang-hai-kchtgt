import api from "./api";
import type { PaginatedResponse } from "../types/common";
import { MOCK_GROUPS } from './mockData';

const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 200));
let groups: Group[] = [...MOCK_GROUPS];
let memberMap: Record<string, GroupMember[]> = {};

// Helper to generate mock members for a group
function generateMembers(groupId: string, count: number): GroupMember[] {
  if (memberMap[groupId]) return memberMap[groupId];
  const names = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D', 'Hoàng Văn E', 'Vũ Thị F', 'Đỗ Văn G', 'Bùi Thị H', 'Ngô Văn I', 'Dương Thị K', 'Lý Văn L', 'Mai Thị M'];
  const result: GroupMember[] = [];
  for (let i = 0; i < count && i < names.length; i++) {
    result.push({
      id: `mem-${groupId}-${i + 1}`,
      userId: `user-${String(i + 1).padStart(3, '0')}`,
      fullName: names[i],
      username: names[i].toLowerCase().replace(/\s/g, ''),
      email: `${names[i].toLowerCase().replace(/\s/g, '')}@hh.gov.vn`,
      groupId,
      groupName: groups.find(g => g.id === groupId)?.name || '',
      status: 'active',
      joinedAt: '2025-06-01T00:00:00Z',
      createdAt: '2025-06-01T00:00:00Z',
    });
  }
  memberMap[groupId] = result;
  return result;
}

// ============================================================
// Types
// ============================================================
export interface Group {
  id: string;
  name: string;
  code?: string;
  description?: string;
  groupType?: string;
  permissions?: string[];
  memberCount?: number;
  status: "active" | "inactive";
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
  status: string;
  joinedAt: string;
  createdAt: string;
}

export interface GroupRole {
  id: string;
  name: string;
  code: string;
  description?: string;
  level?: number;
  hierarchyDepth?: number;
}

export interface CreateGroupPayload {
  name: string;
  code?: string;
  description?: string;
  groupType?: string;
  permissions?: string[];
  status?: "active" | "inactive";
  memberIds?: string[];
}

export interface UpdateGroupPayload {
  name?: string;
  code?: string;
  description?: string;
  groupType?: string;
  permissions?: string[];
  status?: "active" | "inactive";
}

export interface AddMemberPayload {
  userId: string;
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
    params?: { page?: number; pageSize?: number; search?: string; status?: string; groupType?: string; myGroups?: boolean }
  ): Promise<PaginatedResponse<Group> & { activeCount: number; inactiveCount: number }> {
    try {
      // Build query string
      const qParams = new URLSearchParams();
      if (params?.page) qParams.append("page", String(params.page - 1)); // Frontend is 1-indexed, backend is 0-indexed
      if (params?.pageSize) qParams.append("size", String(params.pageSize));
      if (params?.search) qParams.append("search", params.search);
      if (params?.status) qParams.append("status", params.status);
      if (params?.groupType) qParams.append("groupType", params.groupType);
      if (params?.myGroups) qParams.append("myGroups", "true");

      const resp = await api.get(`/groups?${qParams.toString()}`);
      const rawData: any = extractData(resp);
      const items: any[] = Array.isArray(rawData) ? rawData : (rawData?.items || rawData?.content || []);
      const totalElements = rawData?.total ?? items.length;

      // Map backend DTO -> frontend Group interface
      const data: Group[] = items
        .map((item) => ({
          id: item.id ?? "",
          name: item.name ?? "",
          code: item.code,
          description: item.description,
          groupType: item.groupType?.toLowerCase(),
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
        total: totalElements,
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
        activeCount: rawData?.activeCount ?? 0,
        inactiveCount: rawData?.inactiveCount ?? 0,
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * GET /api/groups/:id
   */
  async getById(id: string): Promise<Group> {
    try {
      const resp = await api.get(`/groups/${id}`);
      const item: any = extractData(resp);
      if (!item) throw new Error("Nhóm không tồn tại");

      return {
        id: item.id ?? "",
        name: item.name ?? "",
        code: item.code,
        description: item.description,
        groupType: item.groupType?.toLowerCase(),
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
    } catch (error) {
      throw error;
    }
  },

  /**
   * POST /api/groups
   */
  async create(payload: CreateGroupPayload): Promise<Group> {
    try {
      const resp = await api.post("/groups", {
        name: payload.name,
        code: payload.code ?? payload.name.substring(0, 10).replace(/\\s+/g, "_").toLowerCase(),
        description: payload.description,
        groupType: payload.groupType,
        permissions: payload.permissions,
        status: (payload.status ?? "active").toUpperCase(),
      });
      const item: any = extractData(resp);

      return {
        id: item.id ?? "",
        name: item.name ?? payload.name,
        code: item.code,
        description: item.description,
        groupType: item.groupType?.toLowerCase() ?? payload.groupType,
        permissions: item.permissions,
        memberCount: 0,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * PUT /api/groups/:id
   */
  async update(id: string, payload: UpdateGroupPayload): Promise<Group> {
    try {
      const resp = await api.put(`/groups/${id}`, {
        name: payload.name,
        code: payload.code,
        description: payload.description,
        groupType: payload.groupType,
        permissions: payload.permissions,
        status: payload.status?.toUpperCase(),
      });
      const item: any = extractData(resp);

      return {
        id: item.id ?? id,
        name: item.name ?? payload.name ?? "",
        code: item.code,
        description: item.description ?? payload.description,
        groupType: item.groupType?.toLowerCase() ?? payload.groupType,
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
    } catch (error) {
      throw error;
    }
  },

  /**
   * DELETE /api/groups/:id
   */
  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/groups/${id}`);
    } catch (error) {
      throw error;
    }
  },

  // --- Members ---
  /**
   * GET /api/groups/:id/members
   */
  async getMembers(groupId: string, params?: { page?: number; pageSize?: number; search?: string }): Promise<PaginatedResponse<GroupMember>> {
    try {
      const qParams = new URLSearchParams();
      if (params?.page) qParams.append("page", String(params.page - 1));
      if (params?.pageSize) qParams.append("size", String(params.pageSize));
      if (params?.search) qParams.append("search", params.search);

      const resp = await api.get(`/groups/${groupId}/members?${qParams.toString()}`);
      const rawData: any = extractData(resp);
      const items: any[] = Array.isArray(rawData)
        ? rawData
        : (rawData && Array.isArray(rawData.items)
          ? rawData.items
          : (rawData && Array.isArray(rawData.content) ? rawData.content : []));
      
      const data = items.map((item) => ({
        id: item.id ?? "",
        userId: item.userId ?? "",
        fullName: item.fullName ?? "",
        username: item.username ?? "",
        email: item.email ?? "",
        groupId: item.groupId ?? groupId,
        groupName: item.groupName ?? "",
        status: item.status ?? "active",
        joinedAt: item.joinedAt
          ? new Date(item.joinedAt).toISOString()
          : "",
        createdAt: item.createdAt
          ? new Date(item.createdAt).toISOString()
          : "",
      }));

      return {
        data,
        total: rawData?.total ?? rawData?.totalElements ?? items.length,
        page: params?.page || 1,
        pageSize: params?.pageSize || 20
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * POST /api/groups/:id/members
   */
  async addMember(
    groupId: string,
    payload: AddMemberPayload
  ): Promise<void> {
    try {
      await api.post(`/groups/${groupId}/members`, {
        userId: payload.userId,
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * DELETE /api/groups/:id/members/:userId
   */
  async removeMember(groupId: string, userId: string): Promise<void> {
    try {
      await api.delete(`/groups/${groupId}/members/${userId}`);
    } catch (error) {
      throw error;
    }
  },

  /** GET /api/groups/:id/roles — các vai trò đang gán cho nhóm. */
  async getRoles(groupId: string): Promise<GroupRole[]> {
    const resp = await api.get(`/groups/${groupId}/roles`);
    const rawData: any = extractData(resp);
    const items: any[] = Array.isArray(rawData) ? rawData : [];
    return items.map((item) => ({
      id: String(item.id ?? ''),
      name: item.name ?? '',
      code: item.code ?? '',
      description: item.description,
      level: item.level,
      hierarchyDepth: item.hierarchyDepth,
    }));
  },

  /** PUT /api/groups/:id/roles — thay thế toàn bộ role của nhóm. */
  async updateRoles(groupId: string, roleIds: string[]): Promise<GroupRole[]> {
    const resp = await api.put(`/groups/${groupId}/roles`, { roleIds });
    const rawData: any = extractData(resp);
    const items: any[] = Array.isArray(rawData) ? rawData : [];
    return items.map((item) => ({
      id: String(item.id ?? ''),
      name: item.name ?? '',
      code: item.code ?? '',
      description: item.description,
      level: item.level,
      hierarchyDepth: item.hierarchyDepth,
    }));
  },
};
