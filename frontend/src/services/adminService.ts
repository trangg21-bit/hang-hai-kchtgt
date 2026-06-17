import api from './api';
import type { PaginatedResponse } from '../types/common';
import type { Status } from '../types/common';

// ============================================================
// Types
// ============================================================
export interface Admin {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  roleId: string;
  roleName: string;
  status: Status;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  ipAddress?: string;
  userAgent?: string;
  result: 'success' | 'failure';
  details?: string;
  createdAt: string;
}

export interface CreateAdminPayload {
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  roleId: string;
}

export interface UpdateAdminPayload {
  fullName?: string;
  email?: string;
  phone?: string;
  roleId?: string;
  status?: Status;
}

export interface AdminFilters {
  search?: string;
  roleId?: string;
  status?: Status;
}

export interface AuditFilters {
  adminId?: string;
  action?: string;
  result?: 'success' | 'failure';
  startDate?: string;
  endDate?: string;
}

// ============================================================
// Service
// ============================================================
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 300));

let admins: Admin[] = [
  { id: 'adm-001', username: 'superadmin', fullName: 'Nguyễn Văn An', email: 'admin@hh.gov.vn', phone: '0901234567', roleId: 'role-001', roleName: 'Super Admin', status: 'active', lastLoginAt: '2026-06-17T08:30:00Z', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2026-06-15T00:00:00Z' },
  { id: 'adm-002', username: 'sysadmin1', fullName: 'Lê Anh Tuấn', email: 'tuanla@hh.gov.vn', phone: '0902345678', roleId: 'role-002', roleName: 'System Admin', status: 'active', lastLoginAt: '2026-06-17T09:15:00Z', createdAt: '2025-02-10T00:00:00Z', updatedAt: '2026-06-10T00:00:00Z' },
  { id: 'adm-003', username: 'sysadmin2', fullName: 'Nguyễn Thị Hương', email: 'huongnt@hh.gov.vn', phone: '0903456789', roleId: 'role-002', roleName: 'System Admin', status: 'locked', lastLoginAt: '2026-05-01T10:00:00Z', createdAt: '2025-03-15T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
];

const auditLogs: AdminAuditLog[] = [
  { id: 'al-001', adminId: 'adm-001', adminName: 'Nguyễn Văn An', action: 'CREATE_USER', targetType: 'User', targetId: 'user-001', targetName: 'Nguyễn Văn A', ipAddress: '192.168.1.100', userAgent: 'Chrome/120.0', result: 'success', details: 'Tạo mới user user-001', createdAt: '2026-06-17T08:30:00Z' },
  { id: 'al-002', adminId: 'adm-002', adminName: 'Lê Anh Tuấn', action: 'UPDATE_GROUP', targetType: 'Group', targetId: 'grp-001', targetName: 'Nhóm Quản trị', ipAddress: '192.168.1.101', userAgent: 'Firefox/121.0', result: 'success', details: 'Cập nhật thông tin nhóm', createdAt: '2026-06-17T07:45:00Z' },
  { id: 'al-003', adminId: 'adm-003', adminName: 'Nguyễn Thị Hương', action: 'DELETE_USER', targetType: 'User', targetId: 'user-099', targetName: 'Nguyễn Văn X', ipAddress: '192.168.1.102', userAgent: 'Chrome/120.0', result: 'failure', details: 'Không tìm thấy user', createdAt: '2026-06-16T16:00:00Z' },
  { id: 'al-004', adminId: 'adm-001', adminName: 'Nguyễn Văn An', action: 'LOCK_USER', targetType: 'User', targetId: 'user-004', targetName: 'Phạm Đức Minh', ipAddress: '192.168.1.100', userAgent: 'Chrome/120.0', result: 'success', details: 'Khóa tài khoản user-004', createdAt: '2026-06-16T10:20:00Z' },
  { id: 'al-005', adminId: 'adm-002', adminName: 'Lê Anh Tuấn', action: 'CREATE_ORG', targetType: 'Organization', targetId: 'org-007', targetName: 'Chi nhánh miền Bắc', ipAddress: '192.168.1.101', userAgent: 'Firefox/121.0', result: 'success', details: 'Tạo mới đơn vị org-007', createdAt: '2026-06-15T14:30:00Z' },
  { id: 'al-006', adminId: 'adm-001', adminName: 'Nguyễn Văn An', action: 'LOGIN', targetType: 'System', result: 'success', ipAddress: '192.168.1.100', userAgent: 'Chrome/120.0', createdAt: '2026-06-17T08:00:00Z' },
  { id: 'al-007', adminId: 'adm-003', adminName: 'Nguyễn Thị Hương', action: 'LOGIN', targetType: 'System', result: 'failure', ipAddress: '10.0.0.55', userAgent: 'Safari/17.0', details: 'Sai mật khẩu', createdAt: '2026-06-16T09:00:00Z' },
  { id: 'al-008', adminId: 'adm-001', adminName: 'Nguyễn Văn An', action: 'UPDATE_SYMBOL', targetType: 'Symbol', targetId: 'sym-001', targetName: 'Biểu tượng A', ipAddress: '192.168.1.100', userAgent: 'Chrome/120.0', result: 'success', details: 'Cập nhật ký hiệu sym-001', createdAt: '2026-06-14T11:15:00Z' },
  { id: 'al-009', adminId: 'adm-002', adminName: 'Lê Anh Tuấn', action: 'TEST_CONNECTION', targetType: 'Connection', targetId: 'conn-001', targetName: 'Kết nối A', ipAddress: '192.168.1.101', userAgent: 'Firefox/121.0', result: 'failure', details: 'Thời gian chờ hết', createdAt: '2026-06-14T09:00:00Z' },
  { id: 'al-010', adminId: 'adm-001', adminName: 'Nguyễn Văn An', action: 'EXPORT_LOG', targetType: 'System', result: 'success', ipAddress: '192.168.1.100', userAgent: 'Chrome/120.0', createdAt: '2026-06-13T17:00:00Z' },
];

export const adminService = {
  async list(params?: { page?: number; pageSize?: number; search?: string; roleId?: string; status?: Status }): Promise<PaginatedResponse<Admin>> {
    await delay();

    let filtered = [...admins];

    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((a) => a.fullName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.username.toLowerCase().includes(q));
    }
    if (params?.roleId) {
      filtered = filtered.filter((a) => a.roleId === params.roleId);
    }
    if (params?.status) {
      filtered = filtered.filter((a) => a.status === params.status);
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

  async getById(id: string): Promise<Admin> {
    await delay(300);
    const admin = admins.find((a) => a.id === id);
    if (!admin) throw new Error('Quản trị viên không tồn tại');
    return admin;
  },

  async create(payload: CreateAdminPayload): Promise<Admin> {
    await delay(700);
    const roleNames: Record<string, string> = { 'role-001': 'Super Admin', 'role-002': 'System Admin', 'role-003': 'Quản lý' };
    const newAdmin: Admin = {
      id: `adm-${Date.now()}`,
      ...payload,
      status: 'active',
      roleId: payload.roleId,
      roleName: roleNames[payload.roleId] || 'Quản trị viên',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    admins.unshift(newAdmin);
    return newAdmin;
  },

  async update(id: string, payload: UpdateAdminPayload): Promise<Admin> {
    await delay(500);
    const idx = admins.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Quản trị viên không tồn tại');

    admins[idx] = { ...admins[idx], ...payload, updatedAt: new Date().toISOString() };
    return admins[idx];
  },

  async delete(id: string): Promise<void> {
    await delay(400);
    const idx = admins.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Quản trị viên không tồn tại');
    admins = admins.filter((a) => a.id !== id);
  },

  async toggleLock(id: string): Promise<Admin> {
    await delay(400);
    const idx = admins.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Quản trị viên không tồn tại');

    admins[idx].status = admins[idx].status === 'locked' ? 'active' : 'locked';
    admins[idx].updatedAt = new Date().toISOString();
    return admins[idx];
  },

  // --- Audit ---
  async getAuditLogs(params?: { page?: number; pageSize?: number; adminId?: string; action?: string; result?: 'success' | 'failure'; startDate?: string; endDate?: string }): Promise<PaginatedResponse<AdminAuditLog>> {
    await delay();

    let filtered = [...auditLogs];

    if (params?.adminId) {
      filtered = filtered.filter((a) => a.adminId === params.adminId);
    }
    if (params?.action) {
      filtered = filtered.filter((a) => a.action === params.action);
    }
    if (params?.result) {
      filtered = filtered.filter((a) => a.result === params.result);
    }
    if (params?.startDate) {
      filtered = filtered.filter((a) => a.createdAt >= params.startDate!);
    }
    if (params?.endDate) {
      filtered = filtered.filter((a) => a.createdAt <= params.endDate!);
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

  async getAuditStats(adminId?: string): Promise<{ total: number; successCount: number; failureCount: number; topActions: Array<{ action: string; count: number }> }> {
    await delay(300);

    let filtered = auditLogs.filter((a) => !adminId || a.adminId === adminId);

    const successCount = filtered.filter((a) => a.result === 'success').length;
    const failureCount = filtered.filter((a) => a.result === 'failure').length;

    const actionMap = new Map<string, number>();
    filtered.forEach((a) => {
      actionMap.set(a.action, (actionMap.get(a.action) || 0) + 1);
    });

    const topActions = Array.from(actionMap.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { total: filtered.length, successCount, failureCount, topActions };
  },
};
