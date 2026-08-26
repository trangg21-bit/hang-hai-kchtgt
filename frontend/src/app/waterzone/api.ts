// ── WaterZone API helpers ──────────────────────────────────────────────
// Mirrors the patterns used in cangbenService.ts (same project convention)

import api from '../../services/api';
import type {
  WaterZone,
  CreateVungNuocRequest,
  UpdateVungNuocRequest,
  VungNuocFilters,
  waterZoneHistoryRecord,
} from './types';

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

export const waterZoneApi = {
  async list(params?: Partial<VungNuocFilters>) {
    const sp = new URLSearchParams();
    if (params?.page !== undefined) sp.set("page", String((params.page ?? 1) - 1)); // 1-based → 0-based
    if (params?.pageSize !== undefined) sp.set("size", String(params.pageSize));
    if (params?.portId) sp.set("portId", params.portId);
    if (params?.search) sp.set("search", params.search);
    if (params?.operationalStatus) sp.set("status", params.operationalStatus);
    if (params?.approvalStatus) sp.set("approvalStatus", params.approvalStatus);
    if (params?.loaiVungNuoc) sp.set("loaiVungNuoc", params.loaiVungNuoc);
    const res = await api.get(`/v1/water-zones?${sp}`);
    return parsePage<WaterZone>(res);
  },

  async findById(id: string) {
    const res = await api.get(`/v1/water-zones/${id}`);
    return res.data.data as WaterZone;
  },

  async findByCode(waterZoneCode: string) {
    const res = await api.get(`/v1/water-zones/code/${waterZoneCode}`);
    return res.data.data as WaterZone;
  },

  async create(payload: CreateVungNuocRequest) {
    const res = await api.post('/v1/water-zones', payload);
    return res.data.data as WaterZone;
  },

  async update(payload: UpdateVungNuocRequest) {
    const res = await api.put('/v1/water-zones', payload);
    return res.data.data as WaterZone;
  },

  async delete(id: string) {
    await api.delete(`/v1/water-zones/${id}`);
  },

  /* ── Phê duyệt 2 cấp (approval-2-level-spec §3.2) ──────────────────── */

  async submit(id: string) {
    await api.post(`/v1/water-zones/${id}/submit`);
  },

  async approveC1(id: string, reason?: string) {
    await api.post(`/v1/water-zones/${id}/approve/c1`, null, { params: { reason } });
  },

  async approveC2(id: string, reason?: string) {
    await api.post(`/v1/water-zones/${id}/approve/c2`, null, { params: { reason } });
  },

  /**
   * Duyệt vòng đang mở. Backend suy ra vòng từ trạng thái hồ sơ nên màn hình
   * chưa chuyển đổi vẫn chạy đúng quy trình 2 cấp.
   */
  async approve(id: string) {
    await api.post(`/v1/water-zones/${id}/approve`);
  },

  async reject(id: string, reason: string) {
    await api.post(`/v1/water-zones/${id}/reject`, null, { params: { reason } });
  },

  /* ── History ──────────────────────────────────────────────────────── */

  async getHistory(entityId: string) {
    const res = await api.get(`/v1/water-zones/${entityId}/history`);
    return (res.data.data || []) as waterZoneHistoryRecord[];
  },
};
