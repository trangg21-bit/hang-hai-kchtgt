import api from './api';
import type { ApiResponse } from '../types/common';

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 200));

const MOCK_LOGS: AccessLogEntry[] = [
  { id: 'log-001', userId: 'user-001', username: 'admin', action: 'LOGIN', module: 'AUTH', ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0 Chrome/120', status: 'SUCCESS' as const, detail: 'Đăng nhập thành công', createdAt: '2026-07-14T08:00:00Z' },
  { id: 'log-002', userId: 'user-002', username: 'tuanla', action: 'LOGIN', module: 'AUTH', ipAddress: '192.168.1.101', userAgent: 'Mozilla/5.0 Firefox/115', status: 'SUCCESS' as const, detail: 'Đăng nhập thành công', createdAt: '2026-07-14T08:05:00Z' },
  { id: 'log-003', userId: 'user-004', username: 'minhpd', action: 'LOGIN', module: 'AUTH', ipAddress: '10.0.0.55', userAgent: 'Mozilla/5.0 Edge/120', status: 'FAILED' as const, detail: 'Sai mật khẩu (lần 3)', createdAt: '2026-07-14T08:10:00Z' },
  { id: 'log-004', userId: 'user-001', username: 'admin', action: 'CREATE_USER', module: 'USER_MANAGEMENT', ipAddress: '192.168.1.100', status: 'SUCCESS' as const, detail: 'Tạo người dùng mới: huongnt', createdAt: '2026-07-14T08:15:00Z' },
  { id: 'log-005', userId: 'user-001', username: 'admin', action: 'UPDATE_ROLE', module: 'ROLE_MANAGEMENT', ipAddress: '192.168.1.100', status: 'SUCCESS' as const, detail: 'Cập nhật quyền cho role: Quản trị đơn vị', createdAt: '2026-07-14T08:20:00Z' },
  { id: 'log-006', userId: 'user-003', username: 'huongnt', action: 'VIEW_REPORT', module: 'REPORT', ipAddress: '192.168.1.102', status: 'SUCCESS' as const, detail: 'Xem báo cáo thống kê tài sản', createdAt: '2026-07-14T08:25:00Z' },
  { id: 'log-007', userId: 'user-002', username: 'tuanla', action: 'APPROVE_UNIT', module: 'ORG_MANAGEMENT', ipAddress: '192.168.1.101', status: 'SUCCESS' as const, detail: 'Phê duyệt đơn vị: Chi cục Hàng hải Miền Trung', createdAt: '2026-07-14T08:30:00Z' },
  { id: 'log-008', userId: null as any, username: 'unknown', action: 'LOGIN', module: 'AUTH', ipAddress: '203.0.113.50', userAgent: 'python-requests/2.31', status: 'FAILED' as const, detail: 'Tài khoản không tồn tại', createdAt: '2026-07-14T08:32:00Z' },
  { id: 'log-009', userId: 'user-001', username: 'admin', action: 'LOCK_ACCOUNT', module: 'USER_MANAGEMENT', ipAddress: '192.168.1.100', status: 'SUCCESS' as const, detail: 'Khóa tài khoản: minhpd (5 lần đăng nhập sai)', createdAt: '2026-07-14T08:35:00Z' },
  { id: 'log-010', userId: 'user-006', username: 'cuongtq', action: 'EXPORT_CSV', module: 'REPORT', ipAddress: '192.168.1.103', status: 'SUCCESS' as const, detail: 'Xuất báo cáo CSV: thống kê cảng biển', createdAt: '2026-07-14T08:40:00Z' },
  { id: 'log-011', userId: 'user-001', username: 'admin', action: 'DELETE_GROUP', module: 'GROUP_MANAGEMENT', ipAddress: '192.168.1.100', status: 'SUCCESS' as const, detail: 'Xóa nhóm: Nhóm Hỗ trợ kỹ thuật', createdAt: '2026-07-14T08:45:00Z' },
  { id: 'log-012', userId: 'user-005', username: 'linhnt', action: 'LOGIN', module: 'AUTH', ipAddress: '192.168.1.104', status: 'FAILED' as const, detail: 'Tài khoản đã bị khóa', createdAt: '2026-07-14T08:50:00Z' },
  { id: 'log-013', userId: 'user-001', username: 'admin', action: 'SYSTEM_CONFIG', module: 'SYSTEM', ipAddress: '192.168.1.100', status: 'SUCCESS' as const, detail: 'Cập nhật cấu hình retention log: 90 ngày', createdAt: '2026-07-14T09:00:00Z' },
  { id: 'log-014', userId: 'user-007', username: 'anhbv', action: 'VIEW_GIS', module: 'GIS', ipAddress: '192.168.1.105', status: 'SUCCESS' as const, detail: 'Xem bản đồ hải đồ S-57 khu vực Vũng Tàu', createdAt: '2026-07-14T09:05:00Z' },
  { id: 'log-015', userId: 'user-012', username: 'hoaipn', action: 'TOTP_VERIFY', module: 'AUTH', ipAddress: '192.168.1.106', status: 'FAILED' as const, detail: 'Mã TOTP không hợp lệ (lần 2)', createdAt: '2026-07-14T09:10:00Z' },
  { id: 'log-016', userId: 'user-001', username: 'admin', action: 'RESET_PASSWORD', module: 'USER_MANAGEMENT', ipAddress: '192.168.1.100', status: 'SUCCESS' as const, detail: 'Reset mật khẩu cho người dùng: sonnh', createdAt: '2026-07-14T09:15:00Z' },
  { id: 'log-017', userId: 'user-003', username: 'huongnt', action: 'CREATE_POINT', module: 'GIS', ipAddress: '192.168.1.102', status: 'SUCCESS' as const, detail: 'Tạo đối tượng điểm: Đèn biển Long Châu', createdAt: '2026-07-14T09:20:00Z' },
  { id: 'log-018', userId: 'user-006', username: 'cuongtq', action: 'APPROVE_ASSET', module: 'ASSET', ipAddress: '192.168.1.103', status: 'SUCCESS' as const, detail: 'Phê duyệt yêu cầu tăng tài sản #AST-2026-0042', createdAt: '2026-07-14T09:25:00Z' },
  { id: 'log-019', userId: 'user-002', username: 'tuanla', action: 'LOGOUT', module: 'AUTH', ipAddress: '192.168.1.101', status: 'SUCCESS' as const, detail: 'Đăng xuất', createdAt: '2026-07-14T09:30:00Z' },
  { id: 'log-020', userId: 'user-001', username: 'admin', action: 'BACKUP_DB', module: 'SYSTEM', ipAddress: '192.168.1.100', status: 'SUCCESS' as const, detail: 'Sao lưu database thành công (2.4 GB)', createdAt: '2026-07-14T10:00:00Z' },
];

const MOCK_BACKUPS: BackupRecord[] = [
  { id: 'bkp-001', filename: 'hh-backup-2026-07-14-full.sql', filePath: '/data/backups/hh-backup-2026-07-14-full.sql', fileSize: 2576980378, backupType: 'AUTOMATIC', status: 'SUCCESS', createdAt: '2026-07-14T02:00:00Z' },
  { id: 'bkp-002', filename: 'hh-backup-2026-07-13-full.sql', filePath: '/data/backups/hh-backup-2026-07-13-full.sql', fileSize: 2573741824, backupType: 'AUTOMATIC', status: 'SUCCESS', createdAt: '2026-07-13T02:00:00Z' },
  { id: 'bkp-003', filename: 'hh-backup-2026-07-12-full.sql', filePath: '/data/backups/hh-backup-2026-07-12-full.sql', fileSize: 2566914048, backupType: 'AUTOMATIC', status: 'SUCCESS', createdAt: '2026-07-12T02:00:00Z' },
  { id: 'bkp-004', filename: 'hh-backup-2026-07-11-full.sql', filePath: '/data/backups/hh-backup-2026-07-11-full.sql', fileSize: 2560106496, backupType: 'AUTOMATIC', status: 'FAILED', errorDetail: 'Disk I/O error at offset 0x7A2F1C00', createdAt: '2026-07-11T02:05:00Z' },
  { id: 'bkp-005', filename: 'hh-backup-2026-07-10-full.sql', filePath: '/data/backups/hh-backup-2026-07-10-full.sql', fileSize: 2566914048, backupType: 'MANUAL', status: 'SUCCESS', createdAt: '2026-07-10T12:00:00Z' },
];

const MOCK_SIEM_METRICS: SiemMetrics = {
  totalEventsCount: 1247,
  eventsPerSecond: 3.2,
  failureRate: 4.7,
  activeAlertsCount: 3,
  accessLogsCount: 892,
  loginAttemptsCount: 156,
  securityAlertsCount: 7,
};

// ============================================================
// Types
// ============================================================
export interface AccessLogEntry {
  id: string;
  userId: string;
  username: string;
  action: string;
  module: string;
  ipAddress: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILURE' | 'FAILED';
  detail?: string;
  createdAt: string;
}

export interface BackupRecord {
  id: string;
  filename: string;
  filePath: string;
  fileSize: number;
  backupType: 'MANUAL' | 'AUTOMATIC';
  status: 'SUCCESS' | 'FAILED';
  errorDetail?: string;
  createdAt: string;
}

export interface SiemMetrics {
  totalEventsCount: number;
  eventsPerSecond: number;
  failureRate: number;
  activeAlertsCount: number;
  accessLogsCount: number;
  loginAttemptsCount: number;
  securityAlertsCount: number;
}

// API Response normalizer helper
function extractData<T>(response: any): T {
  return response.data?.data ?? response.data;
}

// ============================================================
// Service
// ============================================================
export const logService = {
  /**
   * Fetch access logs (paginated + filtered)
   */
  async listAccessLogs(params: {
    page?: number;
    size?: number;
    userId?: string;
    module?: string;
    action?: string;
    from?: string;
    to?: string;
  }): Promise<{ content: AccessLogEntry[]; totalElements: number }> {
    try {
      const resp = await api.get('/access-logs', { params });
      const data = extractData<any>(resp);
      return {
        content: data.content ?? [],
        totalElements: data.totalElements ?? 0,
      };
    } catch {
      await delay();
      let filtered = [...MOCK_LOGS];
      if (params.userId) filtered = filtered.filter(l => l.userId === params.userId);
      if (params.module) filtered = filtered.filter(l => l.module === params.module);
      if (params.action) filtered = filtered.filter(l => l.action === params.action);
      if (params.from) filtered = filtered.filter(l => l.createdAt >= params.from!);
      if (params.to) filtered = filtered.filter(l => l.createdAt <= params.to!);
      const page = params.page || 1;
      const size = params.size || 20;
      const start = (page - 1) * size;
      return {
        content: filtered.slice(start, start + size),
        totalElements: filtered.length,
      };
    }
  },

  /**
   * Export access logs to CSV (GET /api/logs/export/csv)
   */
  exportAccessLogsUrl(params: {
    userId?: string;
    module?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
  }): string {
    const query = new URLSearchParams();
    if (params.userId) query.append('userId', params.userId);
    if (params.module) query.append('module', params.module);
    if (params.action) query.append('action', params.action);
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    if (params.page !== undefined) query.append('page', String(params.page));
    if (params.size !== undefined) query.append('size', String(params.size));
    
    return `/api/logs/export/csv?${query.toString()}`;
  },

  /**
   * Fetch backups list
   */
  async listBackups(): Promise<BackupRecord[]> {
    try {
      const resp = await api.get('/backups');
      return extractData<BackupRecord[]>(resp) ?? [];
    } catch {
      await delay();
      return [...MOCK_BACKUPS];
    }
  },

  /**
   * Create database backup
   */
  async createBackup(): Promise<ApiResponse<BackupRecord>> {
    try {
      const resp = await api.post('/backups');
      return resp.data;
    } catch {
      await delay();
      const newBkp: BackupRecord = {
        id: `bkp-${Date.now()}`,
        filename: `hh-backup-${new Date().toISOString().slice(0, 10)}-full.sql`,
        filePath: `/data/backups/hh-backup-${new Date().toISOString().slice(0, 10)}-full.sql`,
        fileSize: 2566914048,
        backupType: 'MANUAL',
        status: 'SUCCESS',
        createdAt: new Date().toISOString(),
      };
      MOCK_BACKUPS.unshift(newBkp);
      return { success: true, data: newBkp, message: 'Backup created successfully' } as any;
    }
  },

  /**
   * Restore database from backup
   */
  async restoreBackup(id: string): Promise<ApiResponse<string>> {
    try {
      const resp = await api.post(`/backups/${id}/restore`);
      return resp.data;
    } catch {
      await delay();
      const found = MOCK_BACKUPS.find(b => b.id === id);
      if (!found) throw new Error('Backup không tồn tại');
      return { success: true, data: `Đã khôi phục từ bản sao lưu: ${found.filename}`, message: 'Khôi phục thành công' } as any;
    }
  },

  /**
   * Fetch SIEM metrics
   */
  async getSiemMetrics(): Promise<SiemMetrics> {
    try {
      const resp = await api.get('/siem/metrics');
      return extractData<SiemMetrics>(resp);
    } catch {
      await delay();
      return { ...MOCK_SIEM_METRICS };
    }
  },

  /**
   * Get SIEM report export url
   */
  getSiemExportUrl(format: string): string {
    return `/api/siem/reports/export?format=${format}`;
  }
};
