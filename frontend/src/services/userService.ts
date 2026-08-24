import type { User, CreateUserPayload, UpdateUserPayload } from '../types/user';
import type { PaginatedResponse, ApiResponse } from '../types/common';
import api from './api';

function extractData<T>(response: any): T {
  return response.data?.data ?? response.data;
}

function mapUser(item: any): User {
  const statusMap: Record<string, User['status']> = {
    active: 'active',
    locked: 'locked',
    inactive: 'inactive',
    deleted: 'inactive',
    pending_verification: 'PENDING_VERIFICATION',
    pending_approval: 'PENDING_APPROVAL',
  };
  const statusKey = String(item.status || 'ACTIVE').toLowerCase();
  const permissions = Array.isArray(item.permissionCodes)
    ? item.permissionCodes
    : Array.isArray(item.permissions)
      ? item.permissions.map((permission: any) => typeof permission === 'string' ? permission : permission.code).filter(Boolean)
      : undefined;

  return {
    id: item.id ?? '',
    username: item.username ?? '',
    fullName: item.fullName ?? '',
    email: item.email ?? '',
    phone: item.phone ?? '',
    address: item.address ?? undefined,
    department: item.department ?? undefined,
    position: item.position ?? undefined,
    note: item.note ?? undefined,
    orgUnitId: item.orgUnitId ?? undefined,
    orgUnitName: item.orgUnitName ?? undefined,
    status: statusMap[statusKey] || 'active',
    lastLoginAt: item.lastLoginAt ? new Date(item.lastLoginAt).toISOString() : undefined,
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : '',
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : '',
    groupIds: Array.isArray(item.groupIds) ? item.groupIds : undefined,
    groupNames: Array.isArray(item.groupNames) ? item.groupNames : undefined,
    permissionCodes: permissions,
    createdBy: item.createdBy ?? undefined,
    createdByName: item.createdByName ?? undefined,
    updatedBy: item.updatedBy ?? undefined,
    updatedByName: item.updatedByName ?? undefined,
    deletedAt: item.deletedAt ? new Date(item.deletedAt).toISOString() : undefined,
    deletedBy: item.deletedBy ?? undefined,
    deletedByName: item.deletedByName ?? undefined,
  };
}

export const userService = {
  async getMe(): Promise<{ orgUnitId?: string; orgUnitName?: string } | null> {
    try {
      const response = await api.get('/users/me');
      const raw: any = response.data?.data ?? response.data;
      return raw ? { orgUnitId: raw.orgUnitId ?? undefined, orgUnitName: raw.orgUnitName ?? undefined } : null;
    } catch {
      return null;
    }
  },

  async list(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    fullName?: string;
    status?: string;
    orgUnitId?: string;
    sortField?: string;
    sortOrder?: 'ascend' | 'descend' | null;
  }): Promise<PaginatedResponse<User>> {
    const response = await api.get('/users', {
      params: {
        search: params.search?.trim() || undefined,
        fullName: params.fullName?.trim() || undefined,
        status: params.status ? params.status.toUpperCase() : undefined,
        orgUnitId: params.orgUnitId || undefined,
        page: params.page ? params.page - 1 : 0,
        size: params.pageSize || 20,
        sortField: params.sortField || undefined,
        sortOrder: params.sortOrder || undefined,
      },
    });
    const rawData: any = extractData(response);
    const items: any[] = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.content) ? rawData.content : []);
    return {
      data: items.map(mapUser),
      total: Array.isArray(rawData) ? rawData.length : (rawData?.totalElements || 0),
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      statusCounts: rawData?.statusCounts,
    };
  },

  async getById(id: string): Promise<ApiResponse<User>> {
    const response = await api.get(`/users/${id}`);
    return { success: true, data: mapUser(extractData(response)) };
  },

  async create(payload: CreateUserPayload): Promise<ApiResponse<User>> {
    const response = await api.post('/users', {
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      ...(payload.username ? { username: payload.username } : {}),
      ...(payload.password ? { password: payload.password } : {}),
      permissionCodes: payload.permissionCodes,
      orgUnitId: payload.orgUnitId,
      status: payload.status?.toUpperCase(),
      address: payload.address,
      department: payload.department,
      position: payload.position,
      note: payload.note,
    });
    return { success: true, data: mapUser(extractData(response)) };
  },

  async update(id: string, payload: UpdateUserPayload): Promise<ApiResponse<User>> {
    const response = await api.put(`/users/${id}`, {
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      permissionCodes: payload.permissionCodes,
      orgUnitId: payload.orgUnitId,
      status: payload.status ? payload.status.toUpperCase() : undefined,
      address: payload.address,
      department: payload.department,
      position: payload.position,
      note: payload.note,
    });
    return { success: true, data: mapUser(extractData(response)) };
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    await api.delete(`/users/${id}`);
    return { success: true, data: null };
  },

  async toggleLock(id: string, currentStatus: string, reason?: string): Promise<ApiResponse<User>> {
    const endpoint = currentStatus.toLowerCase() === 'locked' ? `/users/${id}/unlock` : `/users/${id}/lock`;
    const response = reason ? await api.post(endpoint, { reason: reason.trim() }) : await api.post(endpoint);
    return { success: true, data: mapUser(extractData(response)) };
  },

  async changeStatus(id: string, status: string, reason?: string): Promise<ApiResponse<User>> {
    const response = await api.patch(`/users/${id}/status`, { status, ...(reason ? { reason: reason.trim() } : {}) });
    return { success: true, data: mapUser(extractData(response)) };
  },

  async resetPassword(id: string, newPassword: string): Promise<ApiResponse<null>> {
    await api.post(`/users/${id}/reset-password`, { newPassword });
    return { success: true, data: null };
  },

  async forgotPassword(email: string): Promise<ApiResponse<null>> {
    await api.post('/auth/forgot-password', { email: email.trim() });
    return { success: true, data: null };
  },

  async getUserPermissions(userId: string): Promise<any[]> {
    const response = await api.get(`/users/${userId}/permissions`);
    return extractData<any[]>(response) || [];
  },

  async grantUserPermission(userId: string, permissionCode: string, reason?: string): Promise<ApiResponse<any>> {
    const response = await api.post(`/users/${userId}/permissions`, { permissionCode: permissionCode.trim(), reason });
    return { success: true, data: extractData(response) };
  },

  async replaceDirectPermissions(userId: string, permissionCodes: string[]): Promise<string[]> {
    const requested = [...new Set(
      (permissionCodes || [])
        .map((code) => code.trim().toLowerCase())
        .filter(Boolean),
    )];

    try {
      const response = await api.put(`/users/${userId}/permissions`, requested);
      const items = extractData<any[]>(response) || [];
      return items.map((item) => typeof item === 'string' ? item : item.permissionCode).filter(Boolean);
    } catch (error: any) {
      // Keep compatibility with a BE instance that has the GET/POST/DELETE
      // endpoints but has not loaded the newer bulk PUT endpoint yet.
      if (error.response?.status !== 404) throw error;

      const currentItems = await userService.getUserPermissions(userId);
      const current = new Set(currentItems
        .map((item) => typeof item === 'string' ? item : item.permissionCode)
        .filter(Boolean)
        .map((code: string) => code.trim().toLowerCase()));
      const next = new Set(requested);

      await Promise.all([
        ...requested
          .filter((code) => !current.has(code))
          .map((code) => userService.grantUserPermission(userId, code)),
        ...[...current]
          .filter((code) => !next.has(code))
          .map((code) => userService.revokeUserPermission(userId, code)),
      ]);

      return requested;
    }
  },

  async revokeUserPermission(userId: string, permissionCode: string): Promise<ApiResponse<null>> {
    await api.delete(`/users/${userId}/permissions/${permissionCode.trim()}`);
    return { success: true, data: null };
  },
};
