import api from './api';
import * as buoyApi from './buoy/api';
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
    unitId?: string;
    seaportId?: string;
    operator?: string;
    provinceId?: number | string;
    operationalStatus?: number | string;
    stationArea?: number;
    approvalStatus?: string;
    updatedBy?: string;
    commissionedFrom?: string;
    commissionedTo?: string;
    updatedFrom?: string;
    updatedTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<BeaconLight>> {
    const sp = buildSearchParams({
      name: params?.name,
      code: params?.code,
      type: params?.type,
      status: params?.status,
      unitId: params?.unitId,
      seaportId: params?.seaportId,
      operator: params?.operator,
      provinceId: params?.provinceId,
      operationalStatus: params?.operationalStatus,
      stationArea: params?.stationArea,
      approvalStatus: params?.approvalStatus,
      updatedBy: params?.updatedBy,
      commissionedFrom: params?.commissionedFrom,
      commissionedTo: params?.commissionedTo,
      updatedFrom: params?.updatedFrom,
      updatedTo: params?.updatedTo,
      page: params?.page !== undefined ? params.page - 1 : 0,
      size: params?.pageSize || 20,
    });
    const res = await api.get(`/beacon-lights/search-paged?${sp}`);
    const pageData = res.data.data;
    return {
      data: pageData.content || [],
      total: pageData.totalElements ?? 0,
      page: (pageData.number ?? 0) + 1,
      pageSize: pageData.size ?? 20,
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

  async uploadAttachments(id: string, files: File[]): Promise<void> {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    await api.post(`/beacon-lights/${id}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  async listAttachments(id: string): Promise<any[]> {
    const res = await api.get(`/beacon-lights/${id}/attachments`);
    return res.data.data || [];
  },

  async deleteAttachment(id: string, attachmentId: string): Promise<void> {
    await api.delete(`/beacon-lights/${id}/attachments/${attachmentId}`);
  },
};

// ── Buoy CRUD (delegates to services/buoy/api.ts — D-2) ──────────────

export const buoyCRUD = {
  async findAll(): Promise<Buoy[]> {
    return buoyApi.fetchAllBuoys();
  },

  async findById(id: string): Promise<Buoy> {
    return buoyApi.fetchBuoyById(id);
  },

  async search(params?: {
    name?: string;
    code?: string;
    type?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Buoy>> {
    const data = await buoyApi.searchBuoys({
      name: params?.name,
      code: params?.code,
      type: params?.type,
      status: params?.status,
    });
    return {
      data,
      total: data.length,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
    };
  },

  async create(payload: CreateBuoyRequest): Promise<Buoy> {
    return buoyApi.createBuoy(payload);
  },

  async update(id: string, payload: UpdateBuoyRequest): Promise<Buoy> {
    return buoyApi.updateBuoy(id, payload);
  },

  async delete(id: string): Promise<void> {
    await buoyApi.deleteBuoy(id);
  },
};

// ── Approval (shared pattern for both BeaconLight & Buoy) ───────────

export const approval = {
  async submitForApproval(entityId: string): Promise<void> {
    await api.post(`/beacon-lights/${entityId}/submit-approval`);
  },

  async submitBuoyForApproval(entityId: string): Promise<void> {
    await buoyApi.submitBuoyForApproval(entityId);
  },

  async approveL1(entityId: string, approverId: string): Promise<unknown> {
    const res = await api.post(`/beacon-lights/${entityId}/approve-l1`, null, {
      params: { approverId },
    });
    return res.data.data;
  },

  async approveBuoyL1(entityId: string, approverId: string): Promise<unknown> {
    return buoyApi.approveBuoyL1(entityId, approverId);
  },

  async approveBuoyL2(entityId: string, approverId: string): Promise<unknown> {
    return buoyApi.approveBuoyL2(entityId, approverId);
  },

  async reject(entityId: string, rejectReason: string, approverId: string): Promise<unknown> {
    const res = await api.post(`/beacon-lights/${entityId}/reject`, null, {
      params: { rejectReason, approverId },
    });
    return res.data.data;
  },

  async rejectBuoy(entityId: string, rejectReason: string, approverId: string): Promise<unknown> {
    return buoyApi.rejectBuoy(entityId, rejectReason, approverId);
  },
};

// ── History ─────────────────────────────────────────────────────────

export const beaconHistory = {
  async getHistory(params: {
    type: BeaconType;
    entityId?: string;
    entityCode?: string;
    actionType?: BeaconHistoryActionType;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
  }): Promise<{ data: BeaconHistoryResponse[]; total: number; page: number; pageSize: number }> {
    const sp = buildSearchParams({
      type: params.type,
      entityId: params.entityId,
      entityCode: params.entityCode,
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
