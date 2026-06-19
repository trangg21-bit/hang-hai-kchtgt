import api from './api';
import type { Role, CreateRolePayload, UpdateRolePayload } from '../types/role';
import type { ApiResponse } from '../types/common';

// API Response normalizer
function extractData<T>(response: any): T {
  return response.data?.data ?? response.data;
}

export const roleService = {
  /**
   * GET /api/roles
   */
  async list(params?: { search?: string }): Promise<Role[]> {
    const resp = await api.get('/roles');
    const items: any[] = extractData(resp) ?? [];

    let result: Role[] = items.map((item) => ({
      id: item.id ?? '',
      name: item.name ?? '',
      code: item.code ?? '',
      description: item.description ?? '',
      permissions: item.permissions ?? [],
      userCount: item.userCount ?? 0,
      createdAt: item.createdAt
        ? new Date(item.createdAt).toISOString()
        : '',
      updatedAt: item.updatedAt
        ? new Date(item.updatedAt).toISOString()
        : '',
    }));

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter((r) =>
        r.name.toLowerCase().includes(q),
      );
    }

    return result;
  },

  /**
   * GET /api/roles/:id
   */
  async getById(id: string): Promise<ApiResponse<Role>> {
    const resp = await api.get(`/roles/${id}`);
    const item: any = extractData(resp);
    if (!item) throw new Error('Vai trò không tồn tại');

    return {
      success: true,
      data: {
        id: item.id ?? '',
        name: item.name ?? '',
        code: item.code ?? '',
        description: item.description ?? '',
        permissions: item.permissions ?? [],
        userCount: item.userCount ?? 0,
        createdAt: item.createdAt
          ? new Date(item.createdAt).toISOString()
          : '',
        updatedAt: item.updatedAt
          ? new Date(item.updatedAt).toISOString()
          : '',
      },
    };
  },

  /**
   * POST /api/roles
   */
  async create(payload: CreateRolePayload): Promise<ApiResponse<Role>> {
    const resp = await api.post('/roles', {
      name: payload.name,
      code: payload.code,
      description: payload.description,
      permissions: payload.permissions,
    });
    const item: any = extractData(resp);

    return {
      success: true,
      data: {
        id: item.id ?? '',
        name: item.name ?? payload.name,
        code: item.code ?? payload.code,
        description: item.description ?? payload.description,
        permissions: item.permissions ?? payload.permissions,
        userCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  },

  /**
   * PUT /api/roles/:id
   */
  async update(
    id: string,
    payload: UpdateRolePayload,
  ): Promise<ApiResponse<Role>> {
    const resp = await api.put(`/roles/${id}`, payload);
    const item: any = extractData(resp);

    return {
      success: true,
      data: {
        id: item.id ?? id,
        name: item.name ?? payload.name ?? '',
        code: item.code ?? payload.code ?? '',
        description: item.description ?? payload.description ?? '',
        permissions: item.permissions ?? payload.permissions ?? [],
        userCount: item.userCount ?? 0,
        createdAt: item.createdAt
          ? new Date(item.createdAt).toISOString()
          : '',
        updatedAt: item.updatedAt
          ? new Date(item.updatedAt).toISOString()
          : '',
      },
    };
  },

  /**
   * DELETE /api/roles/:id
   */
  async delete(id: string): Promise<ApiResponse<null>> {
    await api.delete(`/roles/${id}`);
    return { success: true, data: null };
  },
};
