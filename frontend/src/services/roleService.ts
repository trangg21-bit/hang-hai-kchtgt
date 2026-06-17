import type { Role, CreateRolePayload, UpdateRolePayload } from '../types/role';
import type { ApiResponse } from '../types/common';
import { MOCK_ROLES } from './mockData';

const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 200));

let roles: Role[] = [...MOCK_ROLES];

export const roleService = {
  async list(params?: { search?: string }): Promise<Role[]> {
    await delay();

    let result = [...roles];
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter((r) => r.name.toLowerCase().includes(q));
    }
    return result;
  },

  async getById(id: string): Promise<ApiResponse<Role>> {
    await delay(300);
    const role = roles.find((r) => r.id === id);
    if (!role) throw new Error('Vai trò không tồn tại');
    return { success: true, data: role };
  },

  async create(payload: CreateRolePayload): Promise<ApiResponse<Role>> {
    await delay(600);
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: payload.name,
      description: payload.description,
      permissions: payload.permissions,
      userCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    roles.unshift(newRole);
    return { success: true, data: newRole };
  },

  async update(id: string, payload: UpdateRolePayload): Promise<ApiResponse<Role>> {
    await delay(500);
    const idx = roles.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Vai trò không tồn tại');

    roles[idx] = {
      ...roles[idx],
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: roles[idx] };
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    await delay(400);
    const idx = roles.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Vai trò không tồn tại');
    roles = roles.filter((r) => r.id !== id);
    return { success: true, data: null };
  },
};
