import api from './api';
import { toArray, toSingle, toTotalCount } from './resilient';
import type {
  ShipRepairFacilityResponse,
  CreateShipRepairFacilityRequest,
  UpdateShipRepairFacilityRequest,
  ApprovalRequest,
  HistoryEntry,
  ListParams,
  SearchResponse,
} from '../types/shipRepairFacility';

export const shipRepairFacilityCRUD = {
  async list(params?: ListParams): Promise<{ items: ShipRepairFacilityResponse[]; total: number }> {
    const res = await api.get('/v1/ship-repair-facility', {
      params: {
        page: params?.page || 0,
        size: params?.size || 20,
      },
    });
    return {
      items: toArray<ShipRepairFacilityResponse>(res.data),
      total: toTotalCount(res.data, 0),
    };
  },

  async search(params?: ListParams): Promise<SearchResponse<ShipRepairFacilityResponse>> {
    const res = await api.get('/v1/ship-repair-facility/search', {
      params: {
        orgUnitId: params?.orgUnitId,
        keyword: params?.keyword,
        tinhThanh: params?.province,
        trangThai: params?.approvalStatus,
        approvalStatus: params?.approvalStatus,
      },
    });
    const data = res.data || {};
    const items = toArray<ShipRepairFacilityResponse>(data);
    return {
      items,
      total: toTotalCount(data, items.length),
      page: params?.page || 0,
      size: params?.size || 20,
    };
  },

  async getById(id: string): Promise<ShipRepairFacilityResponse> {
    const res = await api.get(`/v1/ship-repair-facility/${id}`);
    return toSingle<ShipRepairFacilityResponse>(res.data) || {} as ShipRepairFacilityResponse;
  },

  async create(data: CreateShipRepairFacilityRequest): Promise<ShipRepairFacilityResponse> {
    const res = await api.post('/v1/ship-repair-facility', data);
    return toSingle<ShipRepairFacilityResponse>(res.data) || {} as ShipRepairFacilityResponse;
  },

  async update(id: string, data: UpdateShipRepairFacilityRequest): Promise<ShipRepairFacilityResponse> {
    const res = await api.put(`/v1/ship-repair-facility/${id}`, data);
    return toSingle<ShipRepairFacilityResponse>(res.data) || {} as ShipRepairFacilityResponse;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/ship-repair-facility/${id}`);
  },

  async getByStatus(status: string): Promise<ShipRepairFacilityResponse[]> {
    const res = await api.get(`/v1/ship-repair-facility/status-phe-duyet/${status}`);
    return toArray<ShipRepairFacilityResponse>(res.data);
  },
};

export const shipRepairFacilityApproval = {
  async approveC1(id: string, data: ApprovalRequest): Promise<ShipRepairFacilityResponse> {
    const res = await api.post(`/v1/ship-repair-facility/${id}/approve/c1`, data);
    return toSingle<ShipRepairFacilityResponse>(res.data) || {} as ShipRepairFacilityResponse;
  },

  async approveC2(id: string, data: ApprovalRequest): Promise<ShipRepairFacilityResponse> {
    const res = await api.post(`/v1/ship-repair-facility/${id}/approve/c2`, data);
    return toSingle<ShipRepairFacilityResponse>(res.data) || {} as ShipRepairFacilityResponse;
  },

  async getHistory(id: string): Promise<HistoryEntry[]> {
    const res = await api.get(`/v1/ship-repair-facility/${id}/history`);
    return toArray<HistoryEntry>(res.data);
  },
};
