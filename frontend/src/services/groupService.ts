import api from "./api";
import type { PaginatedResponse } from "../types/common";
import { MOCK_GROUPS } from './mockData';

const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 200));
let groups: Group[] = [...MOCK_GROUPS];
let memberMap: Record<string, GroupMember[]> = {};

// Helper to generate mock members for a group
function generateMembers(groupId: string, count: number): GroupMember[] {
  if (memberMap[groupId]) return memberMap[groupId];
  const roles: Array<'admin' | 'member' | 'viewer'> = ['admin', 'member', 'member', 'viewer'];
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
      role: roles[i % roles.length],
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
    try {
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
    } catch {
      await delay();
      let filtered = [...groups];
      if (params?.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(g => g.name.toLowerCase().includes(s) || (g.code || '').toLowerCase().includes(s));
      }
      if (params?.status) {
        filtered = filtered.filter(g => g.status === params.status);
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
    } catch {
      await delay();
      const found = groups.find(g => g.id === id);
      if (!found) throw new Error("Nhóm không tồn tại");
      return { ...found };
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
    } catch {
      await delay();
      const newGroup: Group = {
        id: `grp-${Date.now()}`,
        name: payload.name,
        code: payload.code ?? payload.name.substring(0, 10).replace(/\s+/g, "_").toLowerCase(),
        description: payload.description,
        permissions: payload.permissions,
        memberCount: 0,
        status: payload.status ?? 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      groups.push(newGroup);
      return { ...newGroup };
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
    } catch {
      await delay();
      const idx = groups.findIndex(g => g.id === id);
      if (idx === -1) throw new Error("Nhóm không tồn tại");
      groups[idx] = {
        ...groups[idx],
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      return { ...groups[idx] };
    }
  },

  /**
   * DELETE /api/groups/:id
   */
  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/groups/${id}`);
    } catch {
      await delay();
      const idx = groups.findIndex(g => g.id === id);
      if (idx === -1) throw new Error("Nhóm không tồn tại");
      groups.splice(idx, 1);
      delete memberMap[id];
    }
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
    } catch {
      await delay();
      const group = groups.find(g => g.id === groupId);
      const count = group?.memberCount ?? 5;
      return generateMembers(groupId, count);
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
        roleInGroup: payload.role,
      });
    } catch {
      await delay();
      const group = groups.find(g => g.id === groupId);
      if (!group) throw new Error("Nhóm không tồn tại");
      group.memberCount = (group.memberCount || 0) + 1;
      // Clear cached members so generateMembers recreates them
      delete memberMap[groupId];
    }
  },

  /**
   * DELETE /api/groups/:id/members/:userId
   */
  async removeMember(groupId: string, userId: string): Promise<void> {
    try {
      await api.delete(`/groups/${groupId}/members/${userId}`);
    } catch {
      await delay();
      const group = groups.find(g => g.id === groupId);
      if (!group) throw new Error("Nhóm không tồn tại");
      group.memberCount = Math.max(0, (group.memberCount || 1) - 1);
      // Remove from cached members if present
      if (memberMap[groupId]) {
        memberMap[groupId] = memberMap[groupId].filter(m => m.userId !== userId);
      }
    }
  },
};
