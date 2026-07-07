import api from './api';
import type { PaginatedResponse } from '../types/common';
import type {
  CangBien,
  CreateCangBienRequest,
  UpdateCangBienRequest,
  BenCang,
  CreateBenCangRequest,
  UpdateBenCangRequest,
  CauCang,
  CreateCauCangRequest,
  UpdateCauCangRequest,
  CangCan,
  CreateCangCanRequest,
  UpdateCangCanRequest,
  VungNuoc,
  CreateVungNuocRequest,
  UpdateVungNuocRequest,
} from '../types/cangben';

// ── Helper: search params builder ──────────────────────────────────

function buildSearchParams(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  return sp;
}

// ── CangBien CRUD ───────────────────────────────────────────────────

export const cangBienCRUD = {
  async findAll(params?: {
    page?: number;
    size?: number;
    orgUnitId?: string;
  }): Promise<PaginatedResponse<CangBien>> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.size,
      orgUnitId: params?.orgUnitId,
    });
    const res = await api.get(`/cang-bien?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1, // 0-based → 1-based
      pageSize: pageData.size ?? 20,
    };
  },

  async findById(id: string): Promise<CangBien> {
    const res = await api.get(`/cang-bien/${id}`);
    return res.data.data;
  },

  async search(params?: {
    maCang?: string;
    tenCang?: string;
    tinhThanhPho?: string;
    trangThaiHoatDong?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<CangBien>> {
    const sp = buildSearchParams({
      maCang: params?.maCang,
      tenCang: params?.tenCang,
      tinhThanhPho: params?.tinhThanhPho,
      trangThaiHoatDong: params?.trangThaiHoatDong,
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.pageSize,
    });
    const res = await api.get(`/cang-bien?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async create(payload: CreateCangBienRequest): Promise<CangBien> {
    const res = await api.post('/cang-bien', payload);
    return res.data.data;
  },

  async update(payload: UpdateCangBienRequest & { id: string }): Promise<CangBien> {
    const res = await api.put('/cang-bien', payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/cang-bien/${id}`);
  },
};

// ── BenCang CRUD ────────────────────────────────────────────────────

export const benCangCRUD = {
  async findAll(params?: {
    page?: number;
    size?: number;
    orgUnitId?: string;
  }): Promise<PaginatedResponse<BenCang>> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.size,
      orgUnitId: params?.orgUnitId,
    });
    const res = await api.get(`/ben-cang?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async findById(id: string): Promise<BenCang> {
    const res = await api.get(`/ben-cang/${id}`);
    return res.data.data;
  },

  async search(params?: {
    maBen?: string;
    tenBen?: string;
    cangBienId?: string;
    loaiBen?: string;
    trangThaiHoatDong?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<BenCang>> {
    const sp = buildSearchParams({
      maBen: params?.maBen,
      tenBen: params?.tenBen,
      cangBienId: params?.cangBienId,
      loaiBen: params?.loaiBen,
      trangThaiHoatDong: params?.trangThaiHoatDong,
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.pageSize,
    });
    const res = await api.get(`/ben-cang?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async create(payload: CreateBenCangRequest): Promise<BenCang> {
    const res = await api.post('/ben-cang', payload);
    return res.data.data;
  },

  async update(payload: UpdateBenCangRequest & { id: string }): Promise<BenCang> {
    const res = await api.put('/ben-cang', payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/ben-cang/${id}`);
  },
};

// ── CauCang CRUD ────────────────────────────────────────────────────

export const cauCangCRUD = {
  async findAll(params?: {
    page?: number;
    size?: number;
    orgUnitId?: string;
  }): Promise<PaginatedResponse<CauCang>> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.size,
      orgUnitId: params?.orgUnitId,
    });
    const res = await api.get(`/cau-cang?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async findById(id: string): Promise<CauCang> {
    const res = await api.get(`/cau-cang/${id}`);
    return res.data.data;
  },

  async search(params?: {
    maCau?: string;
    tenCau?: string;
    benCangId?: string;
    loaiCau?: string;
    trangThaiHoatDong?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<CauCang>> {
    const sp = buildSearchParams({
      maCau: params?.maCau,
      tenCau: params?.tenCau,
      benCangId: params?.benCangId,
      loaiCau: params?.loaiCau,
      trangThaiHoatDong: params?.trangThaiHoatDong,
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.pageSize,
    });
    const res = await api.get(`/cau-cang?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async create(payload: CreateCauCangRequest): Promise<CauCang> {
    const res = await api.post('/cau-cang', payload);
    return res.data.data;
  },

  async update(payload: UpdateCauCangRequest & { id: string }): Promise<CauCang> {
    const res = await api.put('/cau-cang', payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/cau-cang/${id}`);
  },
};

// ── CangCan CRUD ────────────────────────────────────────────────────

export const cangCanCRUD = {
  async findAll(params?: {
    page?: number;
    size?: number;
    orgUnitId?: string;
  }): Promise<PaginatedResponse<CangCan>> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.size,
      orgUnitId: params?.orgUnitId,
    });
    const res = await api.get(`/cang-can?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async findById(id: string): Promise<CangCan> {
    const res = await api.get(`/cang-can/${id}`);
    return res.data.data;
  },

  async search(params?: {
    maCangCan?: string;
    tenCangCan?: string;
    tinhThanhPho?: string;
    trangThaiHoatDong?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<CangCan>> {
    const sp = buildSearchParams({
      maCangCan: params?.maCangCan,
      tenCangCan: params?.tenCangCan,
      tinhThanhPho: params?.tinhThanhPho,
      trangThaiHoatDong: params?.trangThaiHoatDong,
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.pageSize,
    });
    const res = await api.get(`/cang-can?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async create(payload: CreateCangCanRequest): Promise<CangCan> {
    const res = await api.post('/cang-can', payload);
    return res.data.data;
  },

  async update(payload: UpdateCangCanRequest & { id: string }): Promise<CangCan> {
    const res = await api.put('/cang-can', payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/cang-can/${id}`);
  },
};

// ── VungNuoc CRUD ───────────────────────────────────────────────────

export const vungNuocCRUD = {
  async findAll(params?: {
    page?: number;
    size?: number;
    orgUnitId?: string;
    cangBienId?: string;
  }): Promise<PaginatedResponse<VungNuoc>> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.size,
      orgUnitId: params?.orgUnitId,
      cangBienId: params?.cangBienId,
    });
    const res = await api.get(`/vung-nuoc?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async findById(id: string): Promise<VungNuoc> {
    const res = await api.get(`/vung-nuoc/${id}`);
    return res.data.data;
  },

  async search(params?: {
    maVungNuoc?: string;
    tenVungNuoc?: string;
    cangBienId?: string;
    loaiVungNuoc?: string;
    trangThaiHoatDong?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<VungNuoc>> {
    const sp = buildSearchParams({
      maVungNuoc: params?.maVungNuoc,
      tenVungNuoc: params?.tenVungNuoc,
      cangBienId: params?.cangBienId,
      loaiVungNuoc: params?.loaiVungNuoc,
      trangThaiHoatDong: params?.trangThaiHoatDong,
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.pageSize,
    });
    const res = await api.get(`/vung-nuoc?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async create(payload: CreateVungNuocRequest): Promise<VungNuoc> {
    const res = await api.post('/vung-nuoc', payload);
    return res.data.data;
  },

  async update(payload: UpdateVungNuocRequest & { id: string }): Promise<VungNuoc> {
    const res = await api.put('/vung-nuoc', payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/vung-nuoc/${id}`);
  },
};

// ── Approval (per-entity approve/reject) ────────────────────────────

export const cangBienApproval = {
  async approve(id: string): Promise<void> {
    await api.post(`/cang-bien/${id}/approve`);
  },

  async reject(id: string, reason: string): Promise<void> {
    await api.post(`/cang-bien/${id}/reject`, null, { params: { reason } });
  },
};

export const benCangApproval = {
  async approve(id: string): Promise<void> {
    await api.post(`/ben-cang/${id}/approve`);
  },

  async reject(id: string, reason: string): Promise<void> {
    await api.post(`/ben-cang/${id}/reject`, null, { params: { reason } });
  },
};

export const cauCangApproval = {
  async approve(id: string): Promise<void> {
    await api.post(`/cau-cang/${id}/approve`);
  },

  async reject(id: string, reason: string): Promise<void> {
    await api.post(`/cau-cang/${id}/reject`, null, { params: { reason } });
  },
};

export const cangCanApproval = {
  async approve(id: string): Promise<void> {
    await api.post(`/cang-can/${id}/approve`);
  },

  async reject(id: string, reason: string): Promise<void> {
    await api.post(`/cang-can/${id}/reject`, null, { params: { reason } });
  },
};

export const vungNuocApproval = {
  async approve(id: string): Promise<void> {
    await api.post(`/vung-nuoc/${id}/approve`);
  },

  async reject(id: string, reason: string): Promise<void> {
    await api.post(`/vung-nuoc/${id}/reject`, null, { params: { reason } });
  },
};

// ── History ─────────────────────────────────────────────────────────

export const cangBienHistory = {
  async getHistory(entityId: string, params?: { page?: number; size?: number }): Promise<{
    data: unknown[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.size,
    });
    const res = await api.get(`/cang-bien/${entityId}/history?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },
};

export const benCangHistory = {
  async getHistory(entityId: string, params?: { page?: number; size?: number }): Promise<{
    data: unknown[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.size,
    });
    const res = await api.get(`/ben-cang/${entityId}/history?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },
};

export const cauCangHistory = {
  async getHistory(entityId: string, params?: { page?: number; size?: number }): Promise<{
    data: unknown[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.size,
    });
    const res = await api.get(`/cau-cang/${entityId}/history?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },
};

export const cangCanHistory = {
  async getHistory(entityId: string, params?: { page?: number; size?: number }): Promise<{
    data: unknown[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.size,
    });
    const res = await api.get(`/cang-can/${entityId}/history?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },
};

export const vungNuocHistory = {
  async getHistory(entityId: string, params?: { page?: number; size?: number }): Promise<{
    data: unknown[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.size,
    });
    const res = await api.get(`/vung-nuoc/${entityId}/history?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },
};
