import api from './api';
import type { PaginatedResponse } from '../types/common';
import type {
  BeaconLight,
  CreateBeaconLightRequest,
  UpdateBeaconLightRequest,
  Buoy,
  CreateBuoyRequest,
  UpdateBuoyRequest,
  BeaconType,
  BeaconHistoryActionType,
  BeaconHistoryResponse,
} from '../types/beacon';

// ── Helper: search params builder ──────────────────────────────────

function buildSearchParams(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  return sp;
}

// ── BeaconLight CRUD ────────────────────────────────────────────────

export const beaconLightCRUD = {
  async findAll(): Promise<BeaconLight[]> {
    const res = await api.get('/beacon-lights');
    return res.data.data || [];
  },

  async findById(id: string): Promise<BeaconLight> {
    const res = await api.get(`/beacon-lights/${id}`);
    return res.data.data;
  },

  async search(params?: {
    name?: string;
    code?: string;
    type?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<BeaconLight>> {
    const sp = buildSearchParams({
      name: params?.name,
      code: params?.code,
      type: params?.type,
      status: params?.status,
    });
    const res = await api.get(`/beacon-lights/search?${sp}`);
    const data = res.data.data || [];
    return {
      data,
      total: data.length,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
    };
  },

  async create(payload: CreateBeaconLightRequest): Promise<BeaconLight> {
    const res = await api.post('/beacon-lights', payload);
    return res.data.data;
  },

  async update(id: string, payload: UpdateBeaconLightRequest): Promise<BeaconLight> {
    const res = await api.put(`/beacon-lights/${id}`, payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/beacon-lights/${id}`);
  },
};

// ── Buoy CRUD ───────────────────────────────────────────────────────

export const buoyCRUD = {
  async findAll(): Promise<Buoy[]> {
    const res = await api.get('/buoys');
    return res.data.data || [];
  },

  async findById(id: string): Promise<Buoy> {
    const res = await api.get(`/buoys/${id}`);
    return res.data.data;
  },

  async search(params?: {
    name?: string;
    code?: string;
    type?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Buoy>> {
    const sp = buildSearchParams({
      name: params?.name,
      code: params?.code,
      type: params?.type,
      status: params?.status,
    });
    const res = await api.get(`/buoys/search?${sp}`);
    const data = res.data.data || [];
    return {
      data,
      total: data.length,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
    };
  },

  async create(payload: CreateBuoyRequest): Promise<Buoy> {
    const res = await api.post('/buoys', payload);
    return res.data.data;
  },

  async update(id: string, payload: UpdateBuoyRequest): Promise<Buoy> {
    const res = await api.put(`/buoys/${id}`, payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/buoys/${id}`);
  },
};

// ── Approval (shared pattern for both BeaconLight & Buoy) ───────────

export const approval = {
  async submitForApproval(entityId: string): Promise<void> {
    await api.post(`/beacon-lights/${entityId}/submit-approval`);
  },

  async submitBuoyForApproval(entityId: string): Promise<void> {
    await api.post(`/buoys/${entityId}/submit-approval`);
  },

  async approveL1(entityId: string, approverId: string): Promise<unknown> {
    const res = await api.post(`/beacon-lights/${entityId}/approve-l1`, null, {
      params: { approverId },
    });
    return res.data.data;
  },

  async approveBuoyL1(entityId: string, approverId: string): Promise<unknown> {
    const res = await api.post(`/buoys/${entityId}/approve-l1`, null, {
      params: { approverId },
    });
    return res.data.data;
  },

  async approveL2(entityId: string, approverId: string): Promise<unknown> {
    const res = await api.post(`/beacon-lights/${entityId}/approve-l2`, null, {
      params: { approverId },
    });
    return res.data.data;
  },

  async approveBuoyL2(entityId: string, approverId: string): Promise<unknown> {
    const res = await api.post(`/buoys/${entityId}/approve-l2`, null, {
      params: { approverId },
    });
    return res.data.data;
  },

  async reject(entityId: string, rejectReason: string, approverId: string): Promise<unknown> {
    const res = await api.post(`/beacon-lights/${entityId}/reject`, null, {
      params: { rejectReason, approverId },
    });
    return res.data.data;
  },

  async rejectBuoy(entityId: string, rejectReason: string, approverId: string): Promise<unknown> {
    const res = await api.post(`/buoys/${entityId}/reject`, null, {
      params: { rejectReason, approverId },
    });
    return res.data.data;
  },
};

// ── History ─────────────────────────────────────────────────────────

export const beaconHistory = {
  async getHistory(params: {
    type: BeaconType;
    entityId?: string;
    actionType?: BeaconHistoryActionType;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
  }): Promise<{ data: BeaconHistoryResponse[]; total: number; page: number; pageSize: number }> {
    const sp = buildSearchParams({
      type: params.type,
      entityId: params.entityId,
      actionType: params.actionType,
      from: params.from,
      to: params.to,
      page: params.page !== undefined ? params.page - 1 : undefined,
      size: params.size,
    });
    const res = await api.get(`/beacon-history?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1, // 0-based → 1-based
      pageSize: pageData.size ?? 20,
    };
  },
};
