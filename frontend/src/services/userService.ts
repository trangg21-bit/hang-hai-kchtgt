import type { User, CreateUserPayload, UpdateUserPayload } from '../types/user';
import type { PaginatedResponse, ApiResponse } from '../types/common';
import { MOCK_USERS } from './mockData';
import api from './api';

// Simulate network delay
const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 300));

// In-memory mutable copy
let users: User[] = [...MOCK_USERS];

function extractData<T>(response: any): T {
  return response.data?.data ?? response.data;
}

function mapUser(item: any): User {
  let roleCode = item.role ?? '';
  if (roleCode && !roleCode.startsWith('ROLE_')) {
    roleCode = `ROLE_${roleCode}`;
  }

  const roleName = roleCode === 'ROLE_SYSTEM_ADMIN' ? 'Quản trị hệ thống' :
                   roleCode === 'ROLE_ADMIN' ? 'Quản trị đơn vị' :
                   roleCode === 'ROLE_SPECIALIST' ? 'Chuyên viên' :
                   roleCode === 'ROLE_LEADER' ? 'Lãnh đạo' :
                   roleCode === 'ROLE_PORT_OPERATOR' ? 'Người dùng tại Cảng' :
                   roleCode === 'ROLE_PUBLIC_USER' ? 'Người dùng công cộng' :
                   roleCode === 'ROLE_SECURITY_MONITOR' ? 'Giám sát an ninh (SIEM)' :
                   roleCode === 'ROLE_MANAGER' ? 'Quản lý người dùng' :
                   'Người xem (Viewer)';

  const statusMap: Record<string, User['status']> = {
    'active': 'active',
    'locked': 'locked',
    'inactive': 'inactive',
    'deleted': 'inactive',
    'pending_verification': 'PENDING_VERIFICATION',
    'pending_approval': 'PENDING_APPROVAL'
  };

  const statusKey = (item.status || 'ACTIVE').toLowerCase();

  return {
    id: item.id ?? '',
    username: item.username ?? '',
    fullName: item.fullName ?? '',
    email: item.email ?? '',
    phone: item.phone ?? '',
    roleId: roleCode,
    roleName,
    orgUnitId: item.orgUnitId ?? undefined,
    orgUnitName: item.orgUnitName ?? undefined,
    status: statusMap[statusKey] || 'active',
    lastLoginAt: item.lastLoginAt ? new Date(item.lastLoginAt).toISOString() : undefined,
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : '',
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : '',
    groupIds: Array.isArray(item.groupIds) ? item.groupIds : undefined,
    groupNames: Array.isArray(item.groupNames) ? item.groupNames : undefined,
    permissionCodes: Array.isArray(item.permissionCodes)
      ? item.permissionCodes
      : Array.isArray(item.permissions)
        ? item.permissions.map((permission: any) => typeof permission === 'string' ? permission : permission.code).filter(Boolean)
        : undefined,
    permissionNames: Array.isArray(item.permissionNames)
      ? item.permissionNames
      : Array.isArray(item.permissions)
        ? item.permissions.map((permission: any) => typeof permission === 'string' ? permission : permission.name).filter(Boolean)
        : undefined,
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
  async getStatusCounts(): Promise<Record<string, number>> {
    const resp = await api.get('/users/status-counts');
    return extractData<Record<string, number>>(resp);
  },

  async list(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    roleId?: string;
    status?: string;
    sortField?: string;
    sortOrder?: 'ascend' | 'descend' | null;
  }): Promise<PaginatedResponse<User>> {
    const backendPage = params.page ? params.page - 1 : 0;

    const resp = await api.get('/users', {
      params: {
        search: params.search,
        roleCode: params.roleId,
        status: params.status ? params.status.toUpperCase() : undefined,
        page: backendPage,
        size: params.pageSize || 10,
      }
    });

    const rawData: any = extractData(resp);
    const items: any[] = Array.isArray(rawData)
      ? rawData
      : (rawData && Array.isArray(rawData.content) ? rawData.content : []);

    const total = Array.isArray(rawData) ? rawData.length : (rawData?.totalElements || 0);

    let mappedUsers = items.map(mapUser);

    if (params.sortField && params.sortOrder) {
      const field = params.sortField;
      const order = params.sortOrder;
      mappedUsers.sort((a: any, b: any) => {
        let valA = a[field] ?? '';
        let valB = b[field] ?? '';

        if (typeof valA === 'string') {
          valA = valA.localeCompare(valB, 'vi', { sensitivity: 'base' });
          return order === 'ascend' ? valA : -valA;
        }

        if (valA < valB) return order === 'ascend' ? -1 : 1;
        if (valA > valB) return order === 'ascend' ? 1 : -1;
        return 0;
      });
    }

    return {
      data: mappedUsers,
      total,
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      statusCounts: rawData?.statusCounts,
    };
  },

  async getById(id: string): Promise<ApiResponse<User>> {
    const resp = await api.get(`/users/${id}`);
    const u = mapUser(extractData(resp));
    return { success: true, data: u };
  },

  async create(payload: CreateUserPayload): Promise<ApiResponse<User>> {
    const resp = await api.post('/users', {
      username: payload.username,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      password: payload.password || 'admin123',
      role: payload.role,
      orgUnitId: payload.orgUnitId,
      status: 'ACTIVE'
    });

    const u = mapUser(extractData(resp));
    return { success: true, data: u };
  },

  async update(id: string, payload: UpdateUserPayload): Promise<ApiResponse<User>> {
    const resp = await api.put(`/users/${id}`, {
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      role: payload.role,
      orgUnitId: payload.orgUnitId,
      status: payload.status ? payload.status.toUpperCase() : undefined
    });

    const u = mapUser(extractData(resp));
    return { success: true, data: u };
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    await api.delete(`/users/${id}`);
    return { success: true, data: null };
  },

  async toggleLock(id: string, currentStatus: string): Promise<ApiResponse<User>> {
    const isCurrentlyLocked = currentStatus.toLowerCase() === 'locked';
    const endpoint = isCurrentlyLocked ? `/users/${id}/unlock` : `/users/${id}/lock`;
    const resp = await api.post(endpoint);
    const u = mapUser(extractData(resp));
    return { success: true, data: u };
  },

  async changeStatus(id: string, status: string): Promise<ApiResponse<User>> {
    const resp = await api.patch(`/users/${id}/status`, { status });
    const u = mapUser(extractData(resp));
    return { success: true, data: u };
  },

  async resetPassword(id: string, newPassword: string): Promise<ApiResponse<null>> {
    await api.post(`/users/${id}/reset-password`, { newPassword });
    return { success: true, data: null };
  },

  async forgotPassword(email: string): Promise<ApiResponse<null>> {
    await api.post('/auth/forgot-password', { email: email.trim() });
    return { success: true, data: null };
  },

  async getUserRoles(userId: string): Promise<any[]> {
    const resp = await api.get(`/v1/users/${userId}/roles`);
    return extractData<any[]>(resp) || [];
  },

  async assignUserRole(userId: string, roleCode: string): Promise<ApiResponse<User>> {
    const resp = await api.post(`/v1/users/${userId}/roles`, { roleCode });
    return { success: true, data: mapUser(extractData(resp)) };
  },

  async revokeUserRole(userId: string, roleId: string): Promise<ApiResponse<User>> {
    const resp = await api.delete(`/v1/users/${userId}/roles/${roleId}`);
    return { success: true, data: mapUser(extractData(resp)) };
  },

  async getUserPermissions(userId: string): Promise<any[]> {
    const resp = await api.get(`/v1/users/${userId}/permissions`);
    return extractData<any[]>(resp) || [];
  },

  async grantUserPermission(userId: string, permissionCode: string, reason?: string): Promise<ApiResponse<any>> {
    const resp = await api.post(`/v1/users/${userId}/permissions`, { permissionCode, reason });
    return { success: true, data: extractData(resp) };
  },

  async revokeUserPermission(userId: string, permissionCode: string): Promise<ApiResponse<null>> {
    await api.delete(`/v1/users/${userId}/permissions/${permissionCode}`);
    return { success: true, data: null };
  },
};
