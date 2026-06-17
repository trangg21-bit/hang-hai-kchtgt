import api from './api';
import type { PaginatedResponse } from '../types/common';

// ============================================================
// Types
// ============================================================
export interface Group {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  status: 'active' | 'locked' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  userId: string;
  fullName: string;
  username: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: string;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  memberIds?: string[];
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string;
  status?: 'active' | 'locked' | 'inactive';
}

export interface AddMemberPayload {
  userId: string;
  role: 'admin' | 'member' | 'viewer';
}

export interface GroupFilters {
  search?: string;
  status?: string;
}

// ============================================================
// Service
// ============================================================
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 300));

let groups: Group[] = [
  { id: 'grp-001', name: 'Nhóm Quản trị viên', description: 'Nhóm quản trị hệ thống', memberCount: 5, status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
  { id: 'grp-002', name: 'Nhóm Phát triển', description: 'Nhóm phát triển ứng dụng', memberCount: 12, status: 'active', createdAt: '2025-02-15T00:00:00Z', updatedAt: '2026-05-20T00:00:00Z' },
  { id: 'grp-003', name: 'Nhóm Kiểm thử', description: 'Nhóm QA và kiểm thử', memberCount: 8, status: 'active', createdAt: '2025-03-10T00:00:00Z', updatedAt: '2026-04-15T00:00:00Z' },
  { id: 'grp-004', name: 'Nhóm Vận hành', description: 'Nhóm vận hành hệ thống', memberCount: 3, status: 'locked', createdAt: '2025-04-01T00:00:00Z', updatedAt: '2026-06-10T00:00:00Z' },
];

let groupMembers: GroupMember[] = [
  { id: 'gm-001', userId: 'user-001', fullName: 'Nguyễn Văn An', username: 'admin', email: 'admin@hh.gov.vn', role: 'admin', joinedAt: '2025-01-01T00:00:00Z' },
  { id: 'gm-002', userId: 'user-007', fullName: 'Bùi Văn Anh', username: 'anhbv', email: 'anhbv@hh.gov.vn', role: 'member', joinedAt: '2025-01-15T00:00:00Z' },
  { id: 'gm-003', userId: 'user-011', fullName: 'Nguyễn Hồng Sơn', username: 'sonnh', email: 'sonnh@hh.gov.vn', role: 'member', joinedAt: '2025-02-01T00:00:00Z' },
  { id: 'gm-004', userId: 'user-002', fullName: 'Lê Anh Tuấn', username: 'tuanla', email: 'tuanla@hh.gov.vn', role: 'admin', joinedAt: '2025-02-10T00:00:00Z' },
  { id: 'gm-005', userId: 'user-003', fullName: 'Nguyễn Thị Hương', username: 'huongnt', email: 'huongnt@hh.gov.vn', role: 'member', joinedAt: '2025-03-01T00:00:00Z' },
  { id: 'gm-006', userId: 'user-012', fullName: 'Phạm Ngọc Hoài', username: 'hoaipn', email: 'hoaipn@hh.gov.vn', role: 'member', joinedAt: '2026-01-05T00:00:00Z' },
  { id: 'gm-007', userId: 'user-006', fullName: 'Trần Quốc Cường', username: 'cuongtq', email: 'cuongtq@hh.gov.vn', role: 'viewer', joinedAt: '2025-06-10T00:00:00Z' },
  { id: 'gm-008', userId: 'user-009', fullName: 'Vũ Hoàng Quân', username: 'quanvh', email: 'quanvh@hh.gov.vn', role: 'viewer', joinedAt: '2025-09-20T00:00:00Z' },
  { id: 'gm-009', userId: 'user-010', fullName: 'Đỗ Thanh Phương', username: 'phuongdt', email: 'phuongdt@hh.gov.vn', role: 'admin', joinedAt: '2025-10-01T00:00:00Z' },
  { id: 'gm-010', userId: 'user-008', fullName: 'Trần Thị Mai', username: 'maitt', email: 'maitt@hh.gov.vn', role: 'member', joinedAt: '2025-08-15T00:00:00Z' },
];

export const groupService = {
  async list(params?: { page?: number; pageSize?: number; search?: string; status?: string }): Promise<PaginatedResponse<Group>> {
    await delay();

    let filtered = [...groups];

    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((g) => g.name.toLowerCase().includes(q) || (g.description || '').toLowerCase().includes(q));
    }
    if (params?.status) {
      filtered = filtered.filter((g) => g.status === params.status);
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

  async getById(id: string): Promise<Group> {
    await delay(300);
    const group = groups.find((g) => g.id === id);
    if (!group) throw new Error('Nhóm không tồn tại');
    return group;
  },

  async create(payload: CreateGroupPayload): Promise<Group> {
    await delay(700);
    const newGroup: Group = {
      id: `grp-${Date.now()}`,
      name: payload.name,
      description: payload.description,
      memberCount: payload.memberIds?.length || 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    groups.unshift(newGroup);
    return newGroup;
  },

  async update(id: string, payload: UpdateGroupPayload): Promise<Group> {
    await delay(500);
    const idx = groups.findIndex((g) => g.id === id);
    if (idx === -1) throw new Error('Nhóm không tồn tại');

    groups[idx] = { ...groups[idx], ...payload, updatedAt: new Date().toISOString() };
    return groups[idx];
  },

  async delete(id: string): Promise<void> {
    await delay(400);
    const idx = groups.findIndex((g) => g.id === id);
    if (idx === -1) throw new Error('Nhóm không tồn tại');
    groups = groups.filter((g) => g.id !== id);
  },

  // --- Members ---
  async getMembers(groupId: string): Promise<GroupMember[]> {
    await delay(300);
    // Return all members as mock (real would filter by groupId)
    return [...groupMembers];
  },

  async addMember(groupId: string, payload: AddMemberPayload): Promise<void> {
    await delay(500);
    const member = groupMembers.find((m) => m.userId === payload.userId);
    if (member) {
      member.role = payload.role;
    } else {
      groupMembers.push({
        id: `gm-${Date.now()}`,
        userId: payload.userId,
        fullName: 'Người dùng mới',
        username: 'newuser',
        email: 'new@hh.gov.vn',
        role: payload.role,
        joinedAt: new Date().toISOString(),
      });
    }
    // Update member count
    const group = groups.find((g) => g.id === groupId);
    if (group) group.memberCount = groupMembers.length;
  },

  async removeMember(groupId: string, userId: string): Promise<void> {
    await delay(300);
    groupMembers = groupMembers.filter((m) => m.userId !== userId);
    const group = groups.find((g) => g.id === groupId);
    if (group) group.memberCount = groupMembers.length;
  },
};
