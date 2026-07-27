import api from './api';

export interface AccessLogEntry {
  id: number;
  userId: number;
  username: string;
  email?: string;
  donVi?: string;
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
  message?: string;
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

  async getAccessLogById(id: number) {
    const resp = await api.get(`/access-logs/${id}`);
    return resp.data?.data ?? resp.data;
  },

  async getLogAggregate(params?: { from?: string; to?: string }): Promise<any[]> {
    const resp = await api.get('/logs/aggregate', { params });
    return resp.data?.data ?? resp.data ?? [];
  },
};
