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
    'pending_verification': 'inactive',
    'pending_approval': 'inactive'
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
    status: statusMap[statusKey] || 'active',
    lastLoginAt: item.lastLoginAt ? new Date(item.lastLoginAt).toISOString() : undefined,
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : '',
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : '',
  };
}

export const userService = {
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
      role: payload.roleId,
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
      role: payload.roleId,
      status: payload.status ? payload.status.toUpperCase() : undefined
    });

    const u = mapUser(extractData(resp));
    return { success: true, data: u };
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    await api.delete(`/users/${id}`);
    return { success: true, data: null };
  },

  async toggleLock(id: string): Promise<ApiResponse<User>> {
    const detailResp = await api.get(`/users/${id}`);
    const rawUser = extractData(detailResp) as any;
    const isCurrentlyLocked = rawUser.status === 'LOCKED';

    const endpoint = isCurrentlyLocked ? `/users/${id}/unlock` : `/users/${id}/lock`;
    const resp = await api.post(endpoint);
    const u = mapUser(extractData(resp));
    return { success: true, data: u };
  },

  async resetPassword(id: string): Promise<ApiResponse<{ newPassword: string }>> {
    const newPassword = `HH@${Math.random().toString(36).slice(2, 10)}`;
    await api.post(`/users/${id}/reset-password`, { newPassword });
    return { success: true, data: { newPassword } };
  },
};
