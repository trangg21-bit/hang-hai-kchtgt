import api from './api';
import type { PaginatedResponse } from '../types/common';

// ============================================================
// Types
// ============================================================
export interface Connection {
  id: string;
  name: string;
  type: 'rest' | 'soap' | 'grpc' | 'file' | 'mq';
  url: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  lastCheckedAt?: string;
  responseTime?: number;
  uptime: number; // percentage
  description?: string;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionHealth {
  connectionId: string;
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  lastCheckedAt: string;
  responseTime: number;
  uptime: number;
  uptimeHistory: Array<{ timestamp: string; uptime: number }>;
  errorLog: Array<{ timestamp: string; message: string }>;
  isReachable: boolean;
  certificateExpiry?: string;
}

export interface CreateConnectionPayload {
  name: string;
  type: 'rest' | 'soap' | 'grpc' | 'file' | 'mq';
  url: string;
  description?: string;
  config: Record<string, unknown>;
}

export interface UpdateConnectionPayload {
  name?: string;
  url?: string;
  description?: string;
  config?: Record<string, unknown>;
}

export interface ConnectionFilters {
  search?: string;
  type?: string;
  status?: string;
}

// ============================================================
// Helpers
// ============================================================
function mapConnection(backend: any): Connection {
  let type: Connection['type'] = 'rest';
  const cType = backend.connectionType || '';
  if (cType === 'SOAP') type = 'soap';
  else if (cType === 'FILE') type = 'file';
  else if (cType === 'REST') type = 'rest';

  let status: Connection['status'] = 'unknown';
  if (backend.status === 'ACTIVE') status = 'healthy';
  else if (backend.status === 'ERROR') status = 'down';
  else if (backend.status === 'INACTIVE') status = 'unknown';

  return {
    id: backend.id,
    name: backend.name,
    type,
    url: backend.endpointUrl || '',
    status,
    lastCheckedAt: backend.lastSyncAt || backend.updatedAt || backend.createdAt,
    responseTime: 0,
    uptime: 100.0,
    description: backend.targetSystem || '',
    config: {
      code: backend.code,
      authType: backend.authType,
      syncFrequency: backend.syncFrequency,
    },
    createdAt: backend.createdAt,
    updatedAt: backend.updatedAt,
  };
}

// ============================================================
// Service
// ============================================================
export const connectionService = {
  async list(params?: { page?: number; pageSize?: number; search?: string; type?: string; status?: string }): Promise<PaginatedResponse<Connection>> {
    const res = await api.get('/data-connections');
    const rawList = res.data.data || [];
    let mappedList: Connection[] = rawList.map(mapConnection);

    if (params?.search) {
      const q = params.search.toLowerCase();
      mappedList = mappedList.filter(
        (c) => c.name.toLowerCase().includes(q) || c.url.toLowerCase().includes(q),
      );
    }
    if (params?.type) {
      mappedList = mappedList.filter((c) => c.type === params.type);
    }
    if (params?.status) {
      mappedList = mappedList.filter((c) => c.status === params.status);
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;

    return {
      data: mappedList.slice(start, start + pageSize),
      total: mappedList.length,
      page,
      pageSize,
    };
  },

  async getById(id: string): Promise<Connection> {
    const res = await api.get(`/data-connections/${id}`);
    if (!res.data.success || !res.data.data) {
      throw new Error('Kết nối không tồn tại');
    }
    return mapConnection(res.data.data);
  },

  async create(payload: CreateConnectionPayload): Promise<Connection> {
    const code = 'CONN_' + payload.name.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 30) + '_' + Date.now().toString().slice(-4);
    
    let connectionType = 'REST';
    if (payload.type === 'soap') connectionType = 'SOAP';
    else if (payload.type === 'file') connectionType = 'FILE';

    const backendPayload = {
      name: payload.name,
      code,
      targetSystem: payload.description || 'External System',
      connectionType,
      endpointUrl: payload.url,
      authType: 'NONE',
      credentials: '',
      syncFrequency: 'MANUAL',
    };

    const res = await api.post('/data-connections', backendPayload);
    return mapConnection(res.data.data);
  },

  async update(id: string, payload: UpdateConnectionPayload): Promise<Connection> {
    const backendPayload: any = {};
    if (payload.name !== undefined) backendPayload.name = payload.name;
    if (payload.url !== undefined) backendPayload.endpointUrl = payload.url;
    if (payload.description !== undefined) backendPayload.targetSystem = payload.description;

    const res = await api.put(`/data-connections/${id}`, backendPayload);
    return mapConnection(res.data.data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/data-connections/${id}`);
  },

  // --- Health ---
  async getHealth(connectionId: string): Promise<ConnectionHealth> {
    const connRes = await api.get(`/data-connections/${connectionId}`);
    const conn = mapConnection(connRes.data.data);

    const historyRes = await api.get(`/data-connections/${connectionId}/health?hours=24`);
    const history = historyRes.data.data || [];

    const uptimeHistory = history.map((h: any) => ({
      timestamp: h.checkedAt,
      uptime: h.errorMessage ? 0.0 : 100.0,
    }));

    const errorLog = history
      .filter((h: any) => h.errorMessage)
      .map((h: any) => ({
        timestamp: h.checkedAt,
        message: h.errorMessage,
      }));

    const latestHealth = history[0];
    const responseTime = latestHealth && latestHealth.latencyMs ? latestHealth.latencyMs : 0;
    const isReachable = latestHealth ? !latestHealth.errorMessage : false;

    const healthyCount = history.filter((h: any) => !h.errorMessage).length;
    const uptime = history.length > 0 ? (100.0 * healthyCount) / history.length : 100.0;

    return {
      connectionId: conn.id,
      name: conn.name,
      status: conn.status,
      lastCheckedAt: latestHealth ? latestHealth.checkedAt : (conn.lastCheckedAt || new Date().toISOString()),
      responseTime,
      uptime,
      uptimeHistory: uptimeHistory.length > 0 ? uptimeHistory : [
        { timestamp: new Date().toISOString(), uptime: 100 }
      ],
      errorLog,
      isReachable,
      certificateExpiry: undefined,
    };
  },

  async testConnection(id: string): Promise<{ success: boolean; message: string; responseTime: number }> {
    const res = await api.post(`/data-connections/${id}/test`);
    const data = res.data.data;
    return {
      success: data.success,
      message: data.message || '',
      responseTime: data.responseTimeMs || 0,
    };
  },

  async getHealthSummary(): Promise<{ total: number; healthy: number; degraded: number; down: number; unknown: number; avgUptime: number }> {
    const res = await api.get('/data-connections/summary');
    const data = res.data.data;
    return {
      total: data.total || 0,
      healthy: data.healthy || 0,
      degraded: data.degraded || 0,
      down: data.down || 0,
      unknown: data.unknown || 0,
      avgUptime: data.avgUptime || 100.0,
    };
  },
};
