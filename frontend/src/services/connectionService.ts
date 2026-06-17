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
// Service
// ============================================================
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 300));

let connections: Connection[] = [
  { id: 'conn-001', name: 'API Dữ liệu Hàng hải', type: 'rest', url: 'https://api.haiphong.gov.vn/v1', status: 'healthy', lastCheckedAt: '2026-06-17T09:00:00Z', responseTime: 120, uptime: 99.9, description: 'API chính dữ liệu hàng hải', config: { timeout: 30000, retry: 3 }, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2026-06-15T00:00:00Z' },
  { id: 'conn-002', name: 'API Khí tượng', type: 'rest', url: 'https://api.met.gov.vn/v2', status: 'degraded', lastCheckedAt: '2026-06-17T08:55:00Z', responseTime: 2500, uptime: 95.5, description: 'API dự báo khí tượng', config: { timeout: 60000, retry: 5 }, createdAt: '2025-02-01T00:00:00Z', updatedAt: '2026-06-10T00:00:00Z' },
  { id: 'conn-003', name: 'Hệ thống GIS', type: 'soap', url: 'https://gis.haiphong.gov.vn/soap', status: 'healthy', lastCheckedAt: '2026-06-17T09:00:00Z', responseTime: 350, uptime: 98.7, description: 'Dịch vụ bản đồ GIS', config: { timeout: 45000, retry: 2 }, createdAt: '2025-03-01T00:00:00Z', updatedAt: '2026-05-20T00:00:00Z' },
  { id: 'conn-004', name: 'Messaging Queue', type: 'mq', url: 'amqp://mq.haiphong.gov.vn', status: 'down', lastCheckedAt: '2026-06-17T08:30:00Z', responseTime: 0, uptime: 85.0, description: 'RabbitMQ messaging', config: { timeout: 10000, retry: 10 }, createdAt: '2025-04-01T00:00:00Z', updatedAt: '2026-06-16T00:00:00Z' },
  { id: 'conn-005', name: 'API Chứng thư số', type: 'rest', url: 'https://api.vnpt.gov.vn/v1', status: 'healthy', lastCheckedAt: '2026-06-17T09:00:00Z', responseTime: 200, uptime: 99.5, description: 'Dịch vụ chứng thực chữ ký số', config: { timeout: 15000, retry: 3 }, createdAt: '2025-05-01T00:00:00Z', updatedAt: '2026-06-12T00:00:00Z' },
  { id: 'conn-006', name: 'FTP Dữ liệu', type: 'file', url: 'ftp://ftp.haiphong.gov.vn/data', status: 'unknown', lastCheckedAt: '2026-06-16T18:00:00Z', responseTime: 0, uptime: 0, description: 'Truy cập file qua FTP', config: { timeout: 30000, retry: 3 }, createdAt: '2025-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
];

export const connectionService = {
  async list(params?: { page?: number; pageSize?: number; search?: string; type?: string; status?: string }): Promise<PaginatedResponse<Connection>> {
    await delay();

    let filtered = [...connections];

    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(q) || c.url.toLowerCase().includes(q));
    }
    if (params?.type) {
      filtered = filtered.filter((c) => c.type === params.type);
    }
    if (params?.status) {
      filtered = filtered.filter((c) => c.status === params.status);
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

  async getById(id: string): Promise<Connection> {
    await delay(300);
    const conn = connections.find((c) => c.id === id);
    if (!conn) throw new Error('Kết nối không tồn tại');
    return conn;
  },

  async create(payload: CreateConnectionPayload): Promise<Connection> {
    await delay(700);
    const newConn: Connection = {
      id: `conn-${Date.now()}`,
      ...payload,
      status: 'unknown',
      lastCheckedAt: new Date().toISOString(),
      responseTime: 0,
      uptime: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    connections.push(newConn);
    return newConn;
  },

  async update(id: string, payload: UpdateConnectionPayload): Promise<Connection> {
    await delay(500);
    const idx = connections.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Kết nối không tồn tại');

    connections[idx] = { ...connections[idx], ...payload, updatedAt: new Date().toISOString() };
    return connections[idx];
  },

  async delete(id: string): Promise<void> {
    await delay(400);
    const idx = connections.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Kết nối không tồn tại');
    connections = connections.filter((c) => c.id !== id);
  },

  // --- Health ---
  async getHealth(connectionId: string): Promise<ConnectionHealth> {
    await delay(500);
    const conn = connections.find((c) => c.id === connectionId);
    if (!conn) throw new Error('Kết nối không tồn tại');

    return {
      connectionId: conn.id,
      name: conn.name,
      status: conn.status,
      lastCheckedAt: conn.lastCheckedAt || new Date().toISOString(),
      responseTime: conn.responseTime || 0,
      uptime: conn.uptime,
      uptimeHistory: [
        { timestamp: '2026-06-16T00:00:00Z', uptime: 98.5 },
        { timestamp: '2026-06-15T00:00:00Z', uptime: 99.2 },
        { timestamp: '2026-06-14T00:00:00Z', uptime: 97.8 },
        { timestamp: '2026-06-13T00:00:00Z', uptime: 99.5 },
        { timestamp: '2026-06-12T00:00:00Z', uptime: 100 },
      ],
      errorLog: conn.status === 'down' || conn.status === 'degraded'
        ? [{ timestamp: '2026-06-17T08:30:00Z', message: 'Connection timeout' }]
        : [],
      isReachable: conn.status === 'healthy' || conn.status === 'degraded',
      certificateExpiry: '2027-01-01T00:00:00Z',
    };
  },

  async testConnection(id: string): Promise<{ success: boolean; message: string; responseTime: number }> {
    await delay(1000);
    const conn = connections.find((c) => c.id === id);
    if (!conn) throw new Error('Kết nối không tồn tại');

    const success = conn.status !== 'down';
    const responseTime = success ? Math.floor(Math.random() * 500 + 50) : 0;

    if (success) {
      conn.status = 'healthy';
      conn.responseTime = responseTime;
      conn.lastCheckedAt = new Date().toISOString();
    }

    return {
      success,
      message: success ? 'Kết nối thành công' : 'Không thể kết nối',
      responseTime,
    };
  },

  async getHealthSummary(): Promise<{ total: number; healthy: number; degraded: number; down: number; unknown: number; avgUptime: number }> {
    await delay(300);

    const total = connections.length;
    const healthy = connections.filter((c) => c.status === 'healthy').length;
    const degraded = connections.filter((c) => c.status === 'degraded').length;
    const down = connections.filter((c) => c.status === 'down').length;
    const unknown = connections.filter((c) => c.status === 'unknown').length;

    const tracked = connections.filter((c) => c.uptime > 0);
    const avgUptime = tracked.length > 0
      ? tracked.reduce((sum, c) => sum + c.uptime, 0) / tracked.length
      : 0;

    return { total, healthy, degraded, down, unknown, avgUptime };
  },
};
