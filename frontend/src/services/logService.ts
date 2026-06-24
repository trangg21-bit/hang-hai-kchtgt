import api from './api';
import type { ApiResponse } from '../types/common';

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
    const resp = await api.get('/access-logs', { params });
    const data = extractData<any>(resp);
    return {
      content: data.content ?? [],
      totalElements: data.totalElements ?? 0,
    };
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
    const resp = await api.get('/backups');
    return extractData<BackupRecord[]>(resp) ?? [];
  },

  /**
   * Create database backup
   */
  async createBackup(): Promise<ApiResponse<BackupRecord>> {
    const resp = await api.post('/backups');
    return resp.data;
  },

  /**
   * Restore database from backup
   */
  async restoreBackup(id: string): Promise<ApiResponse<string>> {
    const resp = await api.post(`/backups/${id}/restore`);
    return resp.data;
  },

  /**
   * Fetch SIEM metrics
   */
  async getSiemMetrics(): Promise<SiemMetrics> {
    const resp = await api.get('/siem/metrics');
    return extractData<SiemMetrics>(resp);
  },

  /**
   * Get SIEM report export url
   */
  getSiemExportUrl(format: string): string {
    return `/api/siem/reports/export?format=${format}`;
  }
};
