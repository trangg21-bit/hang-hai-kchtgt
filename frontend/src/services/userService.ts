import type { User, CreateUserPayload, UpdateUserPayload } from '../types/user';
import type { PaginatedResponse, ApiResponse } from '../types/common';
import { MOCK_USERS } from './mockData';

// Simulate network delay
const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 300));

// In-memory mutable copy
let users: User[] = [...MOCK_USERS];

export const userService = {
  async list(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    roleId?: string;
    status?: string;
  }): Promise<PaginatedResponse<User>> {
    await delay();

    let filtered = [...users];

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q),
      );
    }

    if (params.roleId) {
      filtered = filtered.filter((u) => u.roleId === params.roleId);
    }

    if (params.status) {
      filtered = filtered.filter((u) => u.status === params.status);
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const start = (page - 1) * pageSize;

    return {
      data: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  },

  async getById(id: string): Promise<ApiResponse<User>> {
    await delay(400);
    const user = users.find((u) => u.id === id);
    if (!user) throw new Error('Người dùng không tồn tại');
    return { success: true, data: user };
  },

  async create(payload: CreateUserPayload): Promise<ApiResponse<User>> {
    await delay(800);
    const newUser: User = {
      id: `user-${Date.now()}`,
      username: payload.username,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      roleId: payload.roleId,
      roleName: payload.roleId === 'role-001' ? 'Quản trị viên (Super Admin)' :
                payload.roleId === 'role-002' ? 'Quản trị viên (Admin)' :
                payload.roleId === 'role-003' ? 'Quản lý người dùng' :
                'Người xem (Viewer)',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.unshift(newUser);
    return { success: true, data: newUser };
  },

  async update(id: string, payload: UpdateUserPayload): Promise<ApiResponse<User>> {
    await delay(600);
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('Người dùng không tồn tại');

    users[idx] = {
      ...users[idx],
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: users[idx] };
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    await delay(500);
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('Người dùng không tồn tại');
    users = users.filter((u) => u.id !== id);
    return { success: true, data: null };
  },

  async toggleLock(id: string): Promise<ApiResponse<User>> {
    await delay(400);
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('Người dùng không tồn tại');

    const newStatus = users[idx].status === 'locked' ? 'active' : 'locked';
    users[idx] = {
      ...users[idx],
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: users[idx] };
  },

  async resetPassword(id: string): Promise<ApiResponse<{ newPassword: string }>> {
    await delay(700);
    const user = users.find((u) => u.id === id);
    if (!user) throw new Error('Người dùng không tồn tại');
    // Mock: generate a random password
    const newPassword = `HH@${Math.random().toString(36).slice(2, 10)}`;
    return { success: true, data: { newPassword } };
  },
};
