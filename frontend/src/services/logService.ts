import api from './api';
import type { PaginatedResponse } from '../types/common';

// ============================================================
// Types
// ============================================================
export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  component: string;
  action: string;
  user?: string;
  ipAddress?: string;
  message: string;
  details?: string;
  duration?: number;
  requestId?: string;
}

export interface LogFilters {
  search?: string;
  level?: string;
  component?: string;
  startDate?: string;
  endDate?: string;
  action?: string;
}

export interface LogReport {
  totalLogs: number;
  byLevel: Record<string, number>;
  byComponent: Record<string, number>;
  byHour: Record<string, number>;
  errorRate: number;
  avgResponseTime: number;
  topErrors: Array<{ message: string; count: number }>;
}

// ============================================================
// Service
// ============================================================
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 300));

const mockLogs: SystemLog[] = [
  { id: 'log-001', timestamp: '2026-06-17T09:15:00Z', level: 'INFO', component: 'auth', action: 'LOGIN_SUCCESS', user: 'admin', ipAddress: '192.168.1.100', message: 'Đăng nhập thành công', requestId: 'req-001' },
  { id: 'log-002', timestamp: '2026-06-17T09:14:30Z', level: 'INFO', component: 'user', action: 'USER_CREATED', user: 'admin', ipAddress: '192.168.1.100', message: 'Tạo mới người dùng: user-001', requestId: 'req-002' },
  { id: 'log-003', timestamp: '2026-06-17T09:10:00Z', level: 'WARN', component: 'auth', action: 'LOGIN_FAILED', user: 'unknown', ipAddress: '10.0.0.55', message: 'Đăng nhập thất bại — sai mật khẩu', requestId: 'req-003' },
  { id: 'log-004', timestamp: '2026-06-17T09:05:00Z', level: 'ERROR', component: 'connection', action: 'CONNECTION_TIMEOUT', user: 'system', ipAddress: '-', message: 'Kết nối đến API bên ngoài bị timeout sau 30s', requestId: 'req-004', details: 'endpoint=https://api.external.com/v1, timeout=30000' },
  { id: 'log-005', timestamp: '2026-06-17T08:55:00Z', level: 'INFO', component: 'group', action: 'GROUP_UPDATED', user: 'tuanla', ipAddress: '192.168.1.101', message: 'Cập nhật nhóm: grp-001', requestId: 'req-005' },
  { id: 'log-006', timestamp: '2026-06-17T08:50:00Z', level: 'DEBUG', component: 'db', action: 'QUERY', user: 'system', ipAddress: '-', message: 'Thực thi query SELECT * FROM users WHERE status = active', duration: 45, requestId: 'req-006' },
  { id: 'log-007', timestamp: '2026-06-17T08:45:00Z', level: 'ERROR', component: 'symbol', action: 'SYMBOL_VALIDATION_FAILED', user: 'admin', ipAddress: '192.168.1.100', message: 'Biểu tượng không hợp lệ: trùng khóa', requestId: 'req-007', details: 'symbolCode=SYM-001' },
  { id: 'log-008', timestamp: '2026-06-17T08:40:00Z', level: 'INFO', component: 'org', action: 'ORG_CREATED', user: 'tuanla', ipAddress: '192.168.1.101', message: 'Tạo mới đơn vị: org-007', requestId: 'req-008' },
  { id: 'log-009', timestamp: '2026-06-17T08:35:00Z', level: 'WARN', component: 'auth', action: 'RATE_LIMIT', user: 'unknown', ipAddress: '10.0.0.99', message: 'Đã đạt giới hạn rate limit', requestId: 'req-009' },
  { id: 'log-010', timestamp: '2026-06-17T08:30:00Z', level: 'INFO', component: 'system', action: 'SYSTEM_STARTUP', user: 'system', ipAddress: '-', message: 'Hệ thống khởi động thành công', requestId: '-' },
  { id: 'log-011', timestamp: '2026-06-17T08:25:00Z', level: 'INFO', component: 'auth', action: 'TOTP_VERIFIED', user: 'admin', ipAddress: '192.168.1.100', message: 'Xác thực TOTP thành công', requestId: 'req-011' },
  { id: 'log-012', timestamp: '2026-06-17T08:20:00Z', level: 'ERROR', component: 'db', action: 'CONNECTION_ERROR', user: 'system', ipAddress: '-', message: 'Mất kết nối CSDL MSSQL', requestId: 'req-012', details: 'database=hh_db, retry=3' },
  { id: 'log-013', timestamp: '2026-06-17T08:15:00Z', level: 'INFO', component: 'connection', action: 'HEALTH_CHECK', user: 'system', ipAddress: '-', message: 'Kiểm tra sức khỏe kết nối thành công', duration: 120, requestId: 'req-013' },
  { id: 'log-014', timestamp: '2026-06-17T08:10:00Z', level: 'WARN', component: 'disk', action: 'DISK_LOW', user: 'system', ipAddress: '-', message: 'Dung lượng đĩa còn 15%', requestId: 'req-014' },
  { id: 'log-015', timestamp: '2026-06-17T08:05:00Z', level: 'INFO', component: 'backup', action: 'BACKUP_COMPLETE', user: 'system', ipAddress: '-', message: 'Sao lưu dữ liệu hoàn tất', duration: 120000, requestId: 'req-015' },
];

export const logService = {
  async list(params?: { page?: number; pageSize?: number; search?: string; level?: string; component?: string; startDate?: string; endDate?: string; action?: string }): Promise<PaginatedResponse<SystemLog>> {
    await delay();

    let filtered = [...mockLogs];

    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((l) => l.message.toLowerCase().includes(q) || l.user?.toLowerCase().includes(q) || l.component.toLowerCase().includes(q));
    }
    if (params?.level) {
      filtered = filtered.filter((l) => l.level === params.level);
    }
    if (params?.component) {
      filtered = filtered.filter((l) => l.component === params.component);
    }
    if (params?.action) {
      filtered = filtered.filter((l) => l.action === params.action);
    }
    if (params?.startDate) {
      filtered = filtered.filter((l) => l.timestamp >= params.startDate!);
    }
    if (params?.endDate) {
      filtered = filtered.filter((l) => l.timestamp <= params.endDate!);
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

  async getById(id: string): Promise<SystemLog> {
    await delay(300);
    const log = mockLogs.find((l) => l.id === id);
    if (!log) throw new Error('Nhật ký không tồn tại');
    return log;
  },

  async getReport(params?: { startDate?: string; endDate?: string }): Promise<LogReport> {
    await delay(400);

    let filtered = [...mockLogs];
    if (params?.startDate) filtered = filtered.filter((l) => l.timestamp >= params.startDate!);
    if (params?.endDate) filtered = filtered.filter((l) => l.timestamp <= params.endDate!);

    const byLevel: Record<string, number> = {};
    const byComponent: Record<string, number> = {};
    const byHour: Record<string, number> = {};
    const errorMessages = new Map<string, number>();

    filtered.forEach((log) => {
      byLevel[log.level] = (byLevel[log.level] || 0) + 1;
      byComponent[log.component] = (byComponent[log.component] || 0) + 1;

      const hour = log.timestamp.substring(11, 13);
      byHour[hour] = (byHour[hour] || 0) + 1;

      if (log.level === 'ERROR') {
        errorMessages.set(log.message, (errorMessages.get(log.message) || 0) + 1);
      }
    });

    const errorCount = filtered.filter((l) => l.level === 'ERROR').length;
    const durations = filtered.filter((l) => l.duration).map((l) => l.duration!);
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    const topErrors = Array.from(errorMessages.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalLogs: filtered.length,
      byLevel,
      byComponent,
      byHour,
      errorRate: filtered.length > 0 ? (errorCount / filtered.length) * 100 : 0,
      avgResponseTime: avgDuration,
      topErrors,
    };
  },
};
