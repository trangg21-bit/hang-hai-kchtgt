// ── VungNuoc API helpers ──────────────────────────────────────────────
// Mirrors the patterns used in cangbenService.ts (same project convention)

import api from '../../services/api';
import type {
  VungNuoc,
  CreateVungNuocRequest,
  UpdateVungNuocRequest,
  VungNuocFilters,
  VungNuocHistoryRecord,
} from './types';

const BASE = '/v1/vung-nuoc';

/* ── Helpers ──────────────────────────────────────────────────────────── */

function parsePage<T>(res: any): { data: T[]; total: number; page: number; pageSize: number } {
  const pageData = res.data.data;
  return {
    data: pageData.content || [],
    total: pageData.totalElements ?? 0,
    page: (pageData.number ?? 0) + 1, // 0-based → 1-based
    pageSize: pageData.size ?? 20,
  };
}

/* ── CRUD ─────────────────────────────────────────────────────────────── */

export const vungNuocApi = {
  async list(params?: Partial<VungNuocFilters>) {
    const sp = new URLSearchParams();
    // BE VungNuocController.findAll only accepts: page, size, orgUnitId, cangBienId
    if (params?.page !== undefined) sp.set("page", String((params.page ?? 1) - 1)); // 1-based → 0-based
    if (params?.pageSize !== undefined) sp.set("size", String(params.pageSize));
    if (params?.cangBienId) sp.set("cangBienId", params.cangBienId);
    const res = await api.get(`${BASE}?${sp}`);
    return parsePage<VungNuoc>(res);
  },

  async findById(id: string) {
    const res = await api.get(`${BASE}/${id}`);
    return res.data.data as VungNuoc;
  },

  async findByCode(maVungNuoc: string) {
    const res = await api.get(`${BASE}/code/${maVungNuoc}`);
    return res.data.data as VungNuoc;
  },

  async create(payload: CreateVungNuocRequest) {
    const res = await api.post(BASE, payload);
    return res.data.data as VungNuoc;
  },

  async update(payload: UpdateVungNuocRequest) {
    const res = await api.put(BASE, payload);
    return res.data.data as VungNuoc;
  },

  async delete(id: string) {
    await api.delete(`${BASE}/${id}`);
  },

  /* ── Approval ─────────────────────────────────────────────────────── */

  async approve(id: string) {
    await api.post(`${BASE}/${id}/approve`);
  },

  async reject(id: string, reason: string) {
    await api.post(`${BASE}/${id}/reject`, null, { params: { reason } });
  },

  /* ── History ──────────────────────────────────────────────────────── */

  async getHistory(entityId: string) {
    const res = await api.get(`${BASE}/${entityId}/history`);
    return (res.data.data || []) as VungNuocHistoryRecord[];
  },
};
