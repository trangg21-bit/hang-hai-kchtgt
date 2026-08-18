import api from '../../api';
import type {
  PageResponse,
  CreateLighthouseStationRequest,
  LighthouseStationResponse,
  CreateBuoyStationRequest,
  BuoyStationResponse,
} from './types';

// ==========================================
// 1. Nhà trạm đèn biển
// ==========================================
export async function fetchLighthouseStationList(params: {
  page?: number;
  size?: number;
  code?: string;
  name?: string;
  type?: string;
  status?: string;
}): Promise<PageResponse<LighthouseStationResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.code) sp.set('code', params.code);
  if (params.name) sp.set('name', params.name);
  if (params.type) sp.set('type', params.type);
  if (params.status) sp.set('status', params.status);

  const hasFilter = params.code || params.name || params.type || params.status;
  const url = hasFilter ? '/v1/lighthouse-station/search' : '/v1/lighthouse-station';

  const res = await api.get(`${url}?${sp}`);
  const list = res.data.data || [];
  return {
    content: list,
    totalElements: list.length,
    totalPages: 1,
    size: list.length,
    number: 0,
  } as any;
}

export async function fetchLighthouseStationById(id: string): Promise<LighthouseStationResponse> {
  const res = await api.get(`/v1/lighthouse-station/${id}`);
  return res.data.data;
}

export async function createLighthouseStation(payload: CreateLighthouseStationRequest): Promise<LighthouseStationResponse> {
  const res = await api.post('/v1/lighthouse-station', payload);
  return res.data.data;
}

export async function updateLighthouseStation(id: string, payload: CreateLighthouseStationRequest): Promise<LighthouseStationResponse> {
  const res = await api.put(`/v1/lighthouse-station/${id}`, payload);
  return res.data.data;
}

export async function deleteLighthouseStation(id: string): Promise<void> {
  await api.delete(`/v1/lighthouse-station/${id}`);
}

// ==========================================
// 2. Nhà trạm phao tiêu
// ==========================================
export async function fetchBuoyStationList(params: {
  page?: number;
  size?: number;
  code?: string;
  name?: string;
  type?: string;
  status?: string;
  unitId?: string;
  province?: string;
}): Promise<PageResponse<BuoyStationResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.code) sp.set('code', params.code);
  if (params.name) sp.set('name', params.name);
  if (params.type) sp.set('type', params.type);
  if (params.status) sp.set('status', params.status);
  if (params.unitId) sp.set('unitId', params.unitId);
  if (params.province) sp.set('province', params.province);

  const hasFilter = params.code || params.name || params.type || params.status || params.unitId || params.province;
  const url = hasFilter ? '/v1/buoy-station/search' : '/v1/buoy-station';

  const res = await api.get(`${url}?${sp}`);
  const list = res.data.data || [];
  return {
    content: list,
    totalElements: list.length,
    totalPages: 1,
    size: list.length,
    number: 0,
  } as any;
}

export async function fetchBuoyStationById(id: string): Promise<BuoyStationResponse> {
  const res = await api.get(`/v1/buoy-station/${id}`);
  return res.data.data;
}

export async function createBuoyStation(payload: CreateBuoyStationRequest): Promise<BuoyStationResponse> {
  const res = await api.post('/v1/buoy-station', payload);
  return res.data.data;
}

export async function updateBuoyStation(id: string, payload: CreateBuoyStationRequest): Promise<BuoyStationResponse> {
  const res = await api.put(`/v1/buoy-station/${id}`, payload);
  return res.data.data;
}

export async function deleteBuoyStation(id: string): Promise<void> {
  await api.delete(`/v1/buoy-station/${id}`);
}

export async function submitBuoyStationForApproval(id: string): Promise<void> {
  await api.post(`/v1/buoy-station/${id}/submit-approval`);
}

export async function approveBuoyStationL1(id: string, approverId: string): Promise<BuoyStationResponse> {
  const res = await api.post(`/v1/buoy-station/${id}/approve-l1`, null, { params: { approverId } });
  return res.data.data;
}

export async function approveBuoyStationL2(id: string, approverId: string): Promise<BuoyStationResponse> {
  const res = await api.post(`/v1/buoy-station/${id}/approve-l2`, null, { params: { approverId } });
  return res.data.data;
}

export async function rejectBuoyStation(id: string, rejectReason: string, approverId: string): Promise<BuoyStationResponse> {
  const res = await api.post(`/v1/buoy-station/${id}/reject`, null, { params: { rejectReason, approverId } });
  return res.data.data;
}

export async function generateBuoyStationCode(portId: string): Promise<string> {
  const res = await api.get('/v1/buoy-station/generate-code', { params: { portId } });
  return res.data?.data?.code ?? res.data?.data ?? '';
}
