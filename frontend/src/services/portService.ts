import api from './api';
import type { PaginatedResponse } from '../types/common';
import type {
  Port,
  CreatePortRequest,
  UpdatePortRequest,
  Berth,
  CreateBerthRequest,
  UpdateBerthRequest,
  Pier,
  CreatePierRequest,
  UpdatePierRequest,
  DryPort,
  CreateDryPortRequest,
  UpdateDryPortRequest,
  WaterZone,
  CreateWaterZoneRequest,
  UpdateWaterZoneRequest,
} from '../types/port';

// ── Helper: search params builder ──────────────────────────────────

function buildSearchParams(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  return sp;
}

// ── Port CRUD ───────────────────────────────────────────────────

export const portCRUD = {
  async findAll(params?: {
    page?: number;
    size?: number;
    orgUnitId?: string;
  }): Promise<PaginatedResponse<Port>> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.size,
      orgUnitId: params?.orgUnitId,
    });
    const res = await api.get(`/v1/ports?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1, // 0-based → 1-based
      pageSize: pageData.size ?? 20,
    };
  },

  async findById(id: string): Promise<Port> {
    const res = await api.get(`/v1/ports/${id}`);
    return res.data.data;
  },

  async search(params?: {
    portName?: string;
    province?: string;
    portGroup?: number;
    portClassification?: number;
    managingUnitId?: string;
    status?: string;
    approvalStatus?: string;
    operationalStatus?: string;
    updatedFrom?: string;
    updatedTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Port>> {
    const sp = buildSearchParams({
      portName: params?.portName,
      province: params?.province,
      portGroup: params?.portGroup,
      portClassification: params?.portClassification,
      managingUnitId: params?.managingUnitId,
      status: params?.status,
      approvalStatus: params?.approvalStatus,
      operationalStatus: params?.operationalStatus,
      updatedFrom: params?.updatedFrom,
      updatedTo: params?.updatedTo,
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.pageSize,
    });
    const res = await api.get(`/v1/ports?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async create(payload: CreatePortRequest): Promise<Port> {
    const res = await api.post('/v1/ports', payload);
    return res.data.data;
  },

  async update(payload: UpdatePortRequest & { id: string }): Promise<Port> {
    const res = await api.put('/v1/ports', payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/ports/${id}`);
  },
};

// ── Berth CRUD ────────────────────────────────────────────────────

export const berthCRUD = {
  async findAll(params?: {
    page?: number;
    size?: number;
    orgUnitId?: string;
  }): Promise<PaginatedResponse<Berth>> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.size,
      orgUnitId: params?.orgUnitId,
    });
    const res = await api.get(`/v1/berths?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async findById(id: string): Promise<Berth> {
    const res = await api.get(`/v1/berths/${id}`);
    return res.data.data;
  },

  async search(params?: {
    search?: string;
    berthCode?: string;
    berthName?: string;
    portId?: string;
    berthType?: string;
    waterway?: string;
    operationalFunction?: string;
    operationalStatus?: string;
    approvalStatus?: string;
    orgUnitId?: string;
    structureType?: number;
    provinceId?: string;
    updatedFrom?: string;
    updatedTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Berth>> {
    const sp = buildSearchParams({
      search: params?.search,
      berthCode: params?.berthCode,
      berthName: params?.berthName,
      portId: params?.portId,
      berthType: params?.berthType,
      waterway: params?.waterway,
      operationalFunction: params?.operationalFunction,
      operationalStatus: params?.operationalStatus,
      approvalStatus: params?.approvalStatus,
      orgUnitId: params?.orgUnitId,
      structureType: params?.structureType,
      provinceId: params?.provinceId,
      updatedFrom: params?.updatedFrom,
      updatedTo: params?.updatedTo,
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.pageSize,
    });
    const res = await api.get(`/v1/berths?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async create(payload: CreateBerthRequest): Promise<Berth> {
    const res = await api.post('/v1/berths', payload);
    return res.data.data;
  },

  async update(payload: UpdateBerthRequest & { id: string }): Promise<Berth> {
    const res = await api.put('/v1/berths', payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/berths/${id}`);
  },
};

// ── Pier CRUD ────────────────────────────────────────────────────

export const pierCRUD = {
  async findAll(params?: {
    page?: number;
    size?: number;
    orgUnitId?: string;
  }): Promise<PaginatedResponse<Pier>> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.size,
      orgUnitId: params?.orgUnitId,
    });
    const res = await api.get(`/v1/piers?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async findById(id: string): Promise<Pier> {
    const res = await api.get(`/v1/piers/${id}`);
    return res.data.data;
  },

  async search(params?: {
    pierCode?: string;
    pierName?: string;
    berthId?: string;
    loaiCau?: string;
    operationalStatus?: string;
    orgUnitId?: string;
    approvalStatus?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Pier>> {
    const sp = buildSearchParams({
      pierCode: params?.pierCode,
      pierName: params?.pierName,
      berthId: params?.berthId,
      loaiCau: params?.loaiCau,
      operationalStatus: params?.operationalStatus,
      orgUnitId: params?.orgUnitId,
      approvalStatus: params?.approvalStatus,
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.pageSize,
    });
    const res = await api.get(`/v1/piers?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async create(payload: CreatePierRequest): Promise<Pier> {
    const res = await api.post('/v1/piers', payload);
    return res.data.data;
  },

  async update(payload: UpdatePierRequest & { id: string }): Promise<Pier> {
    const res = await api.put('/v1/piers', payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/piers/${id}`);
  },
};

// ── DryPort CRUD ────────────────────────────────────────────────────

export const dryPortCRUD = {
  async findAll(params?: {
    page?: number;
    size?: number;
    orgUnitId?: string;
  }): Promise<PaginatedResponse<DryPort>> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.size,
      orgUnitId: params?.orgUnitId,
    });
    const res = await api.get(`/v1/dry-ports?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async findById(id: string): Promise<DryPort> {
    const res = await api.get(`/v1/dry-ports/${id}`);
    return res.data.data;
  },

  async search(params?: {
    dryPortCode?: string;
    dryPortName?: string;
    province?: string;
    operationalStatus?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<DryPort>> {
    const sp = buildSearchParams({
      dryPortCode: params?.dryPortCode,
      dryPortName: params?.dryPortName,
      province: params?.province,
      operationalStatus: params?.operationalStatus,
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.pageSize,
    });
    const res = await api.get(`/v1/dry-ports?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async create(payload: CreateDryPortRequest): Promise<DryPort> {
    const res = await api.post('/v1/dry-ports', payload);
    return res.data.data;
  },

  async update(payload: UpdateDryPortRequest & { id: string }): Promise<DryPort> {
    const res = await api.put('/v1/dry-ports', payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/dry-ports/${id}`);
  },
};

// ── WaterZone CRUD ─────────────────────────────────────────────────

export const waterZoneCRUD = {
  async findAll(params?: {
    page?: number;
    size?: number;
    orgUnitId?: string;
    portId?: string;
  }): Promise<PaginatedResponse<WaterZone>> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.size,
      orgUnitId: params?.orgUnitId,
      portId: params?.portId,
    });
    const res = await api.get(`/v1/water-zones?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async findById(id: string): Promise<WaterZone> {
    const res = await api.get(`/v1/water-zones/${id}`);
    return res.data.data;
  },

  async search(params?: {
    waterZoneCode?: string;
    waterZoneName?: string;
    portId?: string;
    loaiVungNuoc?: string;
    operationalStatus?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<WaterZone>> {
    const sp = buildSearchParams({
      waterZoneCode: params?.waterZoneCode,
      waterZoneName: params?.waterZoneName,
      portId: params?.portId,
      loaiVungNuoc: params?.loaiVungNuoc,
      operationalStatus: params?.operationalStatus,
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.pageSize,
    });
    const res = await api.get(`/v1/water-zones?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async create(payload: CreateWaterZoneRequest): Promise<WaterZone> {
    const res = await api.post('/v1/water-zones', payload);
    return res.data.data;
  },

  async update(payload: UpdateWaterZoneRequest & { id: string }): Promise<WaterZone> {
    const res = await api.put('/v1/water-zones', payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/water-zones/${id}`);
  },
};

// ── Approval (per-entity approve/reject) ────────────────────────────

export const portApproval = {
  async approve(id: string): Promise<void> {
    await api.post(`/v1/ports/${id}/approve`);
  },

  async reject(id: string, reason: string): Promise<void> {
    await api.post(`/v1/ports/${id}/reject`, null, { params: { reason } });
  },
};

export const berthApproval = {
  async approve(id: string, cap: string): Promise<void> {
    await api.post(`/v1/berths/${id}/approve`, { cap });
  },

  async reject(id: string, cap: string, lyDo: string): Promise<void> {
    await api.post(`/v1/berths/${id}/reject`, { cap, lyDo });
  },
};

export const pierApproval = {
  async approve(id: string): Promise<void> {
    await api.post(`/v1/piers/${id}/approve`);
  },

  async reject(id: string, reason: string): Promise<void> {
    await api.post(`/v1/piers/${id}/reject`, null, { params: { reason } });
  },
};

export const dryPortApproval = {
  async approve(id: string): Promise<void> {
    await api.post(`/v1/dry-ports/${id}/approve`);
  },

  async reject(id: string, reason: string): Promise<void> {
    await api.post(`/v1/dry-ports/${id}/reject`, null, { params: { reason } });
  },
};

export const waterZoneApproval = {
  async approve(id: string): Promise<void> {
    await api.post(`/v1/water-zones/${id}/approve`);
  },

  async reject(id: string, reason: string): Promise<void> {
    await api.post(`/v1/water-zones/${id}/reject`, null, { params: { reason } });
  },
};

// ── History ─────────────────────────────────────────────────────────

export const portHistory = {
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
    const res = await api.get(`/v1/ports/${entityId}/history?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },
};

export const berthHistory = {
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
    const res = await api.get(`/v1/berths/${entityId}/history?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },
};

export const pierHistory = {
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
    const res = await api.get(`/v1/piers/${entityId}/history?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },
};

export const dryPortHistory = {
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
    const res = await api.get(`/v1/dry-ports/${entityId}/history?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },
};

export const waterZoneHistory = {
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
    const res = await api.get(`/v1/water-zones/${entityId}/history?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },
};
