import api from './api';

export interface AccessLogEntry {
  id: string;
  userId: number;
  username: string;
  email?: string;
  orgUnit?: string;
  action: string;
  targetResource?: string;
  ipAddress: string;
  userAgent?: string;
  sessionId?: string;
  requestPath?: string;
  responseCode?: number;
  durationMs?: number;
  status: string;
  type: string;
  severity: string;
  detail?: string;
  metadata?: string;
  createdAt: string;
}

export const logService = {
  async listAccessLogs(params: Record<string, any>) {
    const resp = await api.get('/access-logs', { params });
    const data = resp.data?.data ?? resp.data;
    return {
      content: data.content ?? [],
      totalElements: data.totalElements ?? 0,
    };
  },

  async getAccessLogById(id: string) {
    const resp = await api.get(`/access-logs/${id}`);
    return resp.data?.data ?? resp.data;
  },

  async exportCsv(params: Record<string, any>) {
    const resp = await api.get('/logs/export/csv', { params, responseType: 'blob' });
    return resp.data;
  },

  async getDailyStats(): Promise<{ status: string; count: number }[]> {
    const resp = await api.get('/logs/stats/daily');
    const data = resp.data?.data ?? resp.data ?? [];
    return Array.isArray(data) ? data.map((item: any) => ({ status: item[0], count: Number(item[1]) })) : [];
  },

  async getLogAggregate(params?: { from?: string; to?: string }): Promise<any[]> {
    const resp = await api.get('/logs/aggregate', { params });
    return resp.data?.data ?? resp.data ?? [];
  },
};
