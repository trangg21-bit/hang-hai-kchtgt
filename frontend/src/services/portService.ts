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
  Anchorage,
  CreateAnchorageRequest,
  UpdateAnchorageRequest,
  AnchorageApprovalResponse,
  TransferArea,
  CreateTransferAreaRequest,
  UpdateTransferAreaRequest,
  TransferAreaApprovalResponse,
  StormShelterArea,
  CreateStormShelterRequest,
  UpdateStormShelterRequest,
  StormShelterApprovalResponse,
  BuoyBerth,
  CreateBuoyBerthRequest,
  UpdateBuoyBerthRequest,
  BuoyBerthApprovalResponse,
  ShipRepairYard,
  CreateShipRepairYardRequest,
  UpdateShipRepairYardRequest,
  ShipRepairYardApprovalResponse,
} from '../types/port';

// ── Helper: search params builder ──────────────────────────────────

function buildSearchParams(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  return sp;
}

let inFlightPortPromise: Promise<{ id: string; portCode?: string; portName?: string; orgUnitId?: string }[]> | null = null;

const clearPortOptionsCache = () => {
  const getWin = () => (window.top || window) as any;
  getWin().__portOptionsCache = null;
  inFlightPortPromise = null;
};

// ── Port CRUD ───────────────────────────────────────────────────

export const portCRUD = {
  async getOptions(): Promise<{ id: string; portCode?: string; portName?: string; orgUnitId?: string }[]> {
    const getWin = () => (window.top || window) as any;
    if (getWin().__portOptionsCache) {
      return getWin().__portOptionsCache;
    }
    if (inFlightPortPromise) {
      return inFlightPortPromise;
    }
    inFlightPortPromise = (async () => {
      try {
        const res = await api.get('/common/options/ports');
        const list = res.data?.data || [];
        getWin().__portOptionsCache = list;
        return list;
      } catch {
        return [];
      } finally {
        inFlightPortPromise = null;
      }
    })();
    return inFlightPortPromise;
  },

  async findAll(params?: {
    page?: number;
    size?: number;
    orgUnitId?: string;
    approvalStatus?: string;
  }): Promise<PaginatedResponse<Port>> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.size,
      orgUnitId: params?.orgUnitId,
      approvalStatus: params?.approvalStatus,
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
    orgUnitId?: string;
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
      orgUnitId: params?.orgUnitId,
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
    clearPortOptionsCache();
    return res.data.data;
  },

  async update(payload: UpdatePortRequest & { id: string }): Promise<Port> {
    const res = await api.put('/v1/ports', payload);
    clearPortOptionsCache();
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/ports/${id}`);
    clearPortOptionsCache();
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
    waterwayId?: string;
    operationalFunction?: string;
    operationalStatus?: string;
    approvalStatus?: string;
    orgUnitId?: string;
    structureType?: number;
    provinceId?: number | string;
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
      waterwayId: params?.waterwayId,
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
    search?: string;
    pierCode?: string;
    pierName?: string;
    berthId?: string;
    portId?: string;
    pierType?: string;
    province?: string;
    status?: string;
    orgUnitId?: string;
    approvalStatus?: string;
    navigationChannelId?: string;
    constructionGrade?: number;
    structureType?: number;
    operationalFunction?: string;
    updatedFrom?: string;
    updatedTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Pier>> {
    const sp = buildSearchParams({
      search: params?.search,
      pierCode: params?.pierCode,
      pierName: params?.pierName,
      berthId: params?.berthId,
      portId: params?.portId,
      pierType: params?.pierType,
      province: params?.province,
      status: params?.status,
      orgUnitId: params?.orgUnitId,
      approvalStatus: params?.approvalStatus,
      navigationChannelId: params?.navigationChannelId,
      constructionGrade: params?.constructionGrade,
      structureType: params?.structureType,
      operationalFunction: params?.operationalFunction,
      updatedFrom: params?.updatedFrom,
      updatedTo: params?.updatedTo,
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
  async generateCode(): Promise<{ code: string }> {
    const res = await api.get('/v1/dry-ports/generate-code');
    return res.data.data;
  },

  async findAll(params?: {
    page?: number;
    size?: number;
    orgUnitId?: string;
    provinceId?: number;
    search?: string;
    code?: string;
    status?: string;
    approvalStatus?: string;
    region?: string;
    transportCorridor?: string;
    portStatus?: number;
    updatedFrom?: string;
    updatedTo?: string;
  }): Promise<PaginatedResponse<DryPort>> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.size,
      orgUnitId: params?.orgUnitId,
      provinceId: params?.provinceId,
      search: params?.search,
      code: params?.code,
      status: params?.status,
      approvalStatus: params?.approvalStatus,
      region: params?.region,
      transportCorridor: params?.transportCorridor,
      portStatus: params?.portStatus,
      updatedFrom: params?.updatedFrom,
      updatedTo: params?.updatedTo,
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
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<DryPort>> {
    const sp = buildSearchParams({
      search: params?.search,
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

  async update(payload: UpdateDryPortRequest): Promise<DryPort> {
    const res = await api.put('/v1/dry-ports', payload);
    return res.data.data;
  },

  async submit(id: string): Promise<DryPort> {
    const res = await api.put(`/v1/dry-ports/${id}/submit`);
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
    clearPortOptionsCache();
  },

  async reject(id: string, reason: string): Promise<void> {
    await api.post(`/v1/ports/${id}/reject`, null, { params: { reason } });
    clearPortOptionsCache();
  },
};

// ── Phê duyệt 2 cấp (approval-2-level-spec §3.2) ──────────────────────────
// Vòng 1 = Cảng vụ/Chi cục, vòng 2 = Cục. `approve()` giữ nguyên chữ ký cũ cho
// các màn chưa chuyển đổi — backend nay tự duyệt đúng vòng đang mở thay vì
// duyệt một phát, nên không còn đường vòng bỏ qua quy trình.

export const berthApproval = {
  async submit(id: string): Promise<void> {
    await api.post(`/v1/berths/${id}/submit`);
  },

  async approveC1(id: string, reason?: string): Promise<void> {
    await api.post(`/v1/berths/${id}/approve/c1`, null, { params: { reason } });
  },

  async approveC2(id: string, reason?: string): Promise<void> {
    await api.post(`/v1/berths/${id}/approve/c2`, null, { params: { reason } });
  },

  async approve(id: string, cap: string, content?: string): Promise<void> {
    await api.post(`/v1/berths/${id}/approve`, { cap, content: content?.trim() || undefined });
  },

  async reject(id: string, cap: string, lyDo: string): Promise<void> {
    await api.post(`/v1/berths/${id}/reject`, { cap, lyDo });
  },
};

export const pierApproval = {
  async submit(id: string): Promise<void> {
    await api.post(`/v1/piers/${id}/submit`);
  },

  async approveC1(id: string, reason?: string): Promise<void> {
    await api.post(`/v1/piers/${id}/approve/c1`, null, { params: { reason } });
  },

  async approveC2(id: string, reason?: string): Promise<void> {
    await api.post(`/v1/piers/${id}/approve/c2`, null, { params: { reason } });
  },

  async approve(id: string, cap: string, content?: string): Promise<void> {
    await api.post(`/v1/piers/${id}/approve`, { cap, content: content?.trim() || undefined });
  },

  async reject(id: string, cap: string, lyDo: string): Promise<void> {
    await api.post(`/v1/piers/${id}/reject`, { cap, lyDo });
  },
};

export const dryPortApproval = {
  async approveC1(id: string, reason?: string): Promise<void> {
    await api.post(`/v1/dry-ports/${id}/approve/c1`, null, { params: { reason } });
  },

  async approveC2(id: string, reason?: string): Promise<void> {
    await api.post(`/v1/dry-ports/${id}/approve/c2`, null, { params: { reason } });
  },

  async approve(id: string): Promise<void> {
    await api.post(`/v1/dry-ports/${id}/approve`);
  },

  async reject(id: string, reason: string): Promise<void> {
    await api.post(`/v1/dry-ports/${id}/reject`, null, { params: { reason } });
  },
};

export const waterZoneApproval = {
  async submit(id: string): Promise<void> {
    await api.post(`/v1/water-zones/${id}/submit`);
  },

  async approveC1(id: string, reason?: string): Promise<void> {
    await api.post(`/v1/water-zones/${id}/approve/c1`, null, { params: { reason } });
  },

  async approveC2(id: string, reason?: string): Promise<void> {
    await api.post(`/v1/water-zones/${id}/approve/c2`, null, { params: { reason } });
  },

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
  async getHistory(entityId: string, params?: { page?: number; size?: number }): Promise<any> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page : undefined,
      size: params?.size,
    });
    const res = await api.get(`/v1/dry-ports/${entityId}/history?${sp}`);
    return res.data.data;
  },
  async getAll(params?: { page?: number; size?: number }): Promise<any> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page : undefined,
      size: params?.size,
    });
    const res = await api.get(`/v1/dry-ports/history/all?${sp}`);
    return res.data.data;
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

// ── Anchorage CRUD ──────────────────────────────────────────────────

export const anchorageCRUD = {
  async findAll(params?: {
    page?: number;
    size?: number;
    orgUnitId?: string;
  }): Promise<PaginatedResponse<Anchorage>> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.size,
      orgUnitId: params?.orgUnitId,
    });
    const res = await api.get(`/v1/anchorage?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async findById(id: string): Promise<Anchorage> {
    const res = await api.get(`/v1/anchorage/${id}`);
    return res.data.data;
  },

  async search(params?: {
    anchorageName?: string;
    anchorageCode?: string;
    portId?: string;
    orgUnitId?: string;
    navigationChannelId?: string;
    buoyStationId?: string;
    provinceId?: number;
    operationalStatus?: string;
    approvalStatus?: string;
    updatedFrom?: string;
    updatedTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Anchorage>> {
    const sp = buildSearchParams({
      anchorageName: params?.anchorageName,
      anchorageCode: params?.anchorageCode,
      portId: params?.portId,
      orgUnitId: params?.orgUnitId,
      navigationChannelId: params?.navigationChannelId,
      buoyStationId: params?.buoyStationId,
      provinceId: params?.provinceId,
      operationalStatus: params?.operationalStatus,
      approvalStatus: params?.approvalStatus,
      updatedFrom: params?.updatedFrom,
      updatedTo: params?.updatedTo,
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.pageSize,
    });
    const res = await api.get(`/v1/anchorage?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async create(payload: CreateAnchorageRequest): Promise<Anchorage> {
    const res = await api.post('/v1/anchorage', payload);
    return res.data.data;
  },

  async update(payload: UpdateAnchorageRequest): Promise<Anchorage> {
    const res = await api.put('/v1/anchorage', payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/anchorage/${id}`);
  },

  async generateCode(portId: string): Promise<{ anchorageCode: string }> {
    const res = await api.get(`/v1/anchorage/generate-code?portId=${portId}`);
    return res.data.data;
  },

  async approve(id: string, cap: string, content?: string): Promise<void> {
    await api.post(`/v1/anchorage/${id}/approve`, { cap, content });
  },

  async reject(id: string, cap: string, lyDo: string): Promise<void> {
    await api.post(`/v1/anchorage/${id}/reject`, { cap, lyDo });
  },

  async getHistory(id: string): Promise<AnchorageApprovalResponse> {
    const res = await api.get(`/v1/anchorage/${id}/history`);
    return res.data.data;
  },

  async getAllHistory(): Promise<any> {
    const res = await api.get('/v1/anchorage/history/all');
    return res.data.data;
  },

  async uploadAttachments(id: string, files: File[]): Promise<any> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    const res = await api.post(`/v1/anchorage/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  async listAttachments(id: string): Promise<any> {
    const res = await api.get(`/v1/anchorage/${id}/attachments`);
    return res.data.data;
  },

  async deleteAttachment(id: string, attId: string): Promise<void> {
    await api.delete(`/v1/anchorage/${id}/attachments/${attId}`);
  },
};

// ── Transfer Area (Khu chuyển tải) CRUD ───────────────────────────

export const transferAreaCRUD = {
  async findAll(params?: {
    page?: number;
    size?: number;
    orgUnitId?: string;
  }): Promise<PaginatedResponse<TransferArea>> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.size,
      orgUnitId: params?.orgUnitId,
    });
    const res = await api.get(`/v1/transfer-area?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async findById(id: string): Promise<TransferArea> {
    const res = await api.get(`/v1/transfer-area/${id}`);
    return res.data.data;
  },

  async search(params?: {
    transferAreaName?: string;
    transferAreaCode?: string;
    portId?: string;
    orgUnitId?: string;
    provinceId?: number;
    operationalFunctions?: string;
    operationalStatus?: string;
    approvalStatus?: string;
    updatedFrom?: string;
    updatedTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<TransferArea>> {
    const sp = buildSearchParams({
      transferAreaName: params?.transferAreaName,
      transferAreaCode: params?.transferAreaCode,
      portId: params?.portId,
      orgUnitId: params?.orgUnitId,
      provinceId: params?.provinceId,
      operationalFunctions: params?.operationalFunctions,
      operationalStatus: params?.operationalStatus,
      approvalStatus: params?.approvalStatus,
      updatedFrom: params?.updatedFrom,
      updatedTo: params?.updatedTo,
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.pageSize,
    });
    const res = await api.get(`/v1/transfer-area?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async create(payload: CreateTransferAreaRequest): Promise<TransferArea> {
    const res = await api.post('/v1/transfer-area', payload);
    return res.data.data;
  },

  async update(payload: UpdateTransferAreaRequest): Promise<TransferArea> {
    const res = await api.put('/v1/transfer-area', payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/transfer-area/${id}`);
  },

  async generateCode(portId: string): Promise<{ transferAreaCode: string }> {
    const res = await api.get(`/v1/transfer-area/generate-code?portId=${portId}`);
    return res.data.data;
  },

  async approve(id: string, cap: string, content?: string): Promise<void> {
    await api.post(`/v1/transfer-area/${id}/approve`, { cap, content });
  },

  async reject(id: string, cap: string, lyDo: string): Promise<void> {
    await api.post(`/v1/transfer-area/${id}/reject`, { cap, lyDo });
  },

  async getHistory(id: string): Promise<TransferAreaApprovalResponse> {
    const res = await api.get(`/v1/transfer-area/${id}/history`);
    return res.data.data;
  },

  async getAllHistory(): Promise<any> {
    const res = await api.get('/v1/transfer-area/history/all');
    return res.data.data;
  },

  async uploadAttachments(id: string, files: File[]): Promise<any> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    const res = await api.post(`/v1/transfer-area/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  async listAttachments(id: string): Promise<any> {
    const res = await api.get(`/v1/transfer-area/${id}/attachments`);
    return res.data.data;
  },

  async deleteAttachment(id: string, attId: string): Promise<void> {
    await api.delete(`/v1/transfer-area/${id}/attachments/${attId}`);
  },
};

// ── Storm Shelter (Khu tránh trú bão) CRUD ─────────────────────────

export const stormShelterCRUD = {
  async findAll(params?: {
    page?: number;
    size?: number;
    orgUnitId?: string;
  }): Promise<PaginatedResponse<StormShelterArea>> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.size,
      orgUnitId: params?.orgUnitId,
    });
    const res = await api.get(`/v1/storm-shelter?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async findById(id: string): Promise<StormShelterArea> {
    const res = await api.get(`/v1/storm-shelter/${id}`);
    return res.data.data;
  },

  async search(params?: {
    stormShelterName?: string;
    stormShelterCode?: string;
    portId?: string;
    orgUnitId?: string;
    navigationChannelId?: string;
    buoyStationId?: string;
    classification?: string;
    provinceId?: number;
    operationalStatus?: string;
    approvalStatus?: string;
    updatedFrom?: string;
    updatedTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<StormShelterArea>> {
    const sp = buildSearchParams({
      stormShelterName: params?.stormShelterName,
      stormShelterCode: params?.stormShelterCode,
      portId: params?.portId,
      orgUnitId: params?.orgUnitId,
      navigationChannelId: params?.navigationChannelId,
      buoyStationId: params?.buoyStationId,
      classification: params?.classification,
      provinceId: params?.provinceId,
      operationalStatus: params?.operationalStatus,
      approvalStatus: params?.approvalStatus,
      updatedFrom: params?.updatedFrom,
      updatedTo: params?.updatedTo,
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.pageSize,
    });
    const res = await api.get(`/v1/storm-shelter?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async create(payload: CreateStormShelterRequest): Promise<StormShelterArea> {
    const res = await api.post('/v1/storm-shelter', payload);
    return res.data.data;
  },

  async update(payload: UpdateStormShelterRequest): Promise<StormShelterArea> {
    const res = await api.put('/v1/storm-shelter', payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/storm-shelter/${id}`);
  },

  async generateCode(portId: string): Promise<{ stormShelterCode: string }> {
    const res = await api.get(`/v1/storm-shelter/generate-code?portId=${portId}`);
    return res.data.data;
  },

  async approve(id: string, cap: string, content?: string): Promise<void> {
    await api.post(`/v1/storm-shelter/${id}/approve`, { cap, content });
  },

  async reject(id: string, cap: string, lyDo: string): Promise<void> {
    await api.post(`/v1/storm-shelter/${id}/reject`, { cap, lyDo });
  },

  async getHistory(id: string): Promise<StormShelterApprovalResponse> {
    const res = await api.get(`/v1/storm-shelter/${id}/history`);
    return res.data.data;
  },

  async getAllHistory(): Promise<any> {
    const res = await api.get('/v1/storm-shelter/history/all');
    return res.data.data;
  },

  async uploadAttachments(id: string, files: File[]): Promise<any> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    const res = await api.post(`/v1/storm-shelter/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  async listAttachments(id: string): Promise<any> {
    const res = await api.get(`/v1/storm-shelter/${id}/attachments`);
    return res.data.data;
  },

  async deleteAttachment(id: string, attId: string): Promise<void> {
    await api.delete(`/v1/storm-shelter/${id}/attachments/${attId}`);
  },
};

// ── Buoy Berth (Bến phao) CRUD ─────────────────────────

export const buoyBerthCRUD = {
  async findAll(params?: {
    page?: number;
    size?: number;
    orgUnitId?: string;
  }): Promise<PaginatedResponse<BuoyBerth>> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.size,
      orgUnitId: params?.orgUnitId,
    });
    const res = await api.get(`/v1/buoy-berth?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async findById(id: string): Promise<BuoyBerth> {
    const res = await api.get(`/v1/buoy-berth/${id}`);
    return res.data.data;
  },

  async search(params?: {
    buoyBerthName?: string;
    buoyBerthCode?: string;
    portId?: string;
    orgUnitId?: string;
    waterwayId?: string;
    classification?: string;
    provinceId?: number;
    operationalStatus?: string;
    approvalStatus?: string;
    updatedFrom?: string;
    updatedTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<BuoyBerth>> {
    const sp = buildSearchParams({
      buoyBerthName: params?.buoyBerthName,
      buoyBerthCode: params?.buoyBerthCode,
      portId: params?.portId,
      orgUnitId: params?.orgUnitId,
      waterwayId: params?.waterwayId,
      classification: params?.classification,
      provinceId: params?.provinceId,
      operationalStatus: params?.operationalStatus,
      approvalStatus: params?.approvalStatus,
      updatedFrom: params?.updatedFrom,
      updatedTo: params?.updatedTo,
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.pageSize,
    });
    const res = await api.get(`/v1/buoy-berth?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async create(payload: CreateBuoyBerthRequest): Promise<BuoyBerth> {
    const res = await api.post('/v1/buoy-berth', payload);
    return res.data.data;
  },

  async update(payload: UpdateBuoyBerthRequest): Promise<BuoyBerth> {
    const res = await api.put('/v1/buoy-berth', payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/buoy-berth/${id}`);
  },

  async generateCode(portId: string): Promise<{ buoyBerthCode: string }> {
    const res = await api.get(`/v1/buoy-berth/generate-code?portId=${portId}`);
    return res.data.data;
  },

  async approve(id: string, cap: string, content?: string): Promise<void> {
    await api.post(`/v1/buoy-berth/${id}/approve`, { cap, content });
  },

  async reject(id: string, cap: string, lyDo: string): Promise<void> {
    await api.post(`/v1/buoy-berth/${id}/reject`, { cap, lyDo });
  },

  async getHistory(id: string): Promise<BuoyBerthApprovalResponse> {
    const res = await api.get(`/v1/buoy-berth/${id}/history`);
    return res.data.data;
  },

  async getAllHistory(): Promise<any> {
    const res = await api.get('/v1/buoy-berth/history/all');
    return res.data.data;
  },

  async uploadAttachments(id: string, files: File[]): Promise<any> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    const res = await api.post(`/v1/buoy-berth/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  async listAttachments(id: string): Promise<any> {
    const res = await api.get(`/v1/buoy-berth/${id}/attachments`);
    return res.data.data;
  },

  async deleteAttachment(id: string, attId: string): Promise<void> {
    await api.delete(`/v1/buoy-berth/${id}/attachments/${attId}`);
  },
};

export const shipRepairYardCRUD = {
  async findAll(params?: {
    page?: number;
    size?: number;
    orgUnitId?: string;
  }): Promise<PaginatedResponse<ShipRepairYard>> {
    const sp = buildSearchParams({
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.size,
      orgUnitId: params?.orgUnitId,
    });
    const res = await api.get(`/v1/ship-repair-yard?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async findById(id: string): Promise<ShipRepairYard> {
    const res = await api.get(`/v1/ship-repair-yard/${id}`);
    return res.data.data;
  },

  async search(params?: {
    shipRepairYardName?: string;
    shipRepairYardCode?: string;
    portId?: string;
    pierId?: string;
    orgUnitId?: string;
    provinceId?: number;
    operationalStatus?: string;
    approvalStatus?: string;
    updatedFrom?: string;
    updatedTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<ShipRepairYard>> {
    const sp = buildSearchParams({
      shipRepairYardName: params?.shipRepairYardName,
      shipRepairYardCode: params?.shipRepairYardCode,
      portId: params?.portId,
      pierId: params?.pierId,
      orgUnitId: params?.orgUnitId,
      provinceId: params?.provinceId,
      operationalStatus: params?.operationalStatus,
      approvalStatus: params?.approvalStatus,
      updatedFrom: params?.updatedFrom,
      updatedTo: params?.updatedTo,
      page: params?.page !== undefined ? params.page - 1 : undefined,
      size: params?.pageSize,
    });
    const res = await api.get(`/v1/ship-repair-yard?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
    };
  },

  async create(payload: CreateShipRepairYardRequest): Promise<ShipRepairYard> {
    const res = await api.post('/v1/ship-repair-yard', payload);
    return res.data.data;
  },

  async update(payload: UpdateShipRepairYardRequest): Promise<ShipRepairYard> {
    const res = await api.put('/v1/ship-repair-yard', payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/ship-repair-yard/${id}`);
  },

  async generateCode(portId: string): Promise<{ shipRepairYardCode: string }> {
    const res = await api.get(`/v1/ship-repair-yard/generate-code?portId=${portId}`);
    return res.data.data;
  },

  async approve(id: string, cap: string, content?: string): Promise<void> {
    await api.post(`/v1/ship-repair-yard/${id}/approve`, { cap, content });
  },

  async reject(id: string, cap: string, lyDo: string): Promise<void> {
    await api.post(`/v1/ship-repair-yard/${id}/reject`, { cap, lyDo });
  },

  async getHistory(id: string): Promise<ShipRepairYardApprovalResponse> {
    const res = await api.get(`/v1/ship-repair-yard/${id}/history`);
    return res.data.data;
  },

  async getAllHistory(): Promise<any> {
    const res = await api.get('/v1/ship-repair-yard/history/all');
    return res.data.data;
  },

  async uploadAttachments(id: string, files: File[]): Promise<any> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    const res = await api.post(`/v1/ship-repair-yard/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  async listAttachments(id: string): Promise<any> {
    const res = await api.get(`/v1/ship-repair-yard/${id}/attachments`);
    return res.data.data;
  },

  async deleteAttachment(id: string, attId: string): Promise<void> {
    await api.delete(`/v1/ship-repair-yard/${id}/attachments/${attId}`);
  },
};
