import api from '../api';
import type {
  PageResponse,
  CoastalStationVTSRequest,
  CoastalStationVTSResponse,
  CoastalStationInmarsatRequest,
  CoastalStationInmarsatUpdateRequest,
  CoastalStationInmarsatResponse,
  CoastalStationInmarsatOptionResponse,
  CoastalStationInmarsatHistoryResponse,
} from './types';

// ==========================================
// 1. Đài duyên hải / VTS
// ==========================================
export async function fetchCoastalVTSList(params: {
  page?: number;
  size?: number;
  keyword?: string;
}): Promise<PageResponse<CoastalStationVTSResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));

  let url = '/v1/stations/coastal';
  if (params.keyword) {
    sp.set('keyword', params.keyword);
    url = '/v1/stations/coastal/search';
  }

  const res = await api.get(`${url}?${sp}`);
  const rawList = res.data || [];
  const list = rawList.map((item: any) => ({
    ...item,
    stationCode: item.stationCode || item.code,
    stationName: item.stationName || item.name,
  }));
  return {
    content: list,
    totalElements: list.length,
    totalPages: 1,
    size: list.length,
    number: 0,
  } as any;
}

export async function fetchCoastalVTSById(id: string): Promise<CoastalStationVTSResponse> {
  const res = await api.get(`/v1/stations/coastal/${id}`);
  return res.data;
}

export async function createCoastalVTS(payload: CoastalStationVTSRequest): Promise<CoastalStationVTSResponse> {
  const res = await api.post('/v1/stations/coastal', payload);
  return res.data;
}

export async function updateCoastalVTS(id: string, payload: CoastalStationVTSRequest): Promise<CoastalStationVTSResponse> {
  const res = await api.put(`/v1/stations/coastal/${id}`, payload);
  return res.data;
}

export async function deleteCoastalVTS(id: string): Promise<void> {
  await api.delete(`/v1/stations/coastal/${id}`);
}

// Phê duyệt 2 cấp — docs/conventions/approval-2-level-spec.md (mục 3)
export async function submitCoastalVTS(id: string): Promise<CoastalStationVTSResponse> {
  const res = await api.post(`/v1/stations/coastal/${id}/submit`);
  return res.data;
}

export async function approveCoastalVTSL1(id: string): Promise<CoastalStationVTSResponse> {
  const res = await api.post(`/v1/stations/coastal/${id}/approve-l1`);
  return res.data;
}

export async function approveCoastalVTSL2(id: string): Promise<CoastalStationVTSResponse> {
  const res = await api.post(`/v1/stations/coastal/${id}/approve-l2`);
  return res.data;
}

export async function rejectCoastalVTS(id: string, rejectionReason: string): Promise<CoastalStationVTSResponse> {
  const res = await api.post(`/v1/stations/coastal/${id}/reject`, { approved: false, rejectionReason });
  return res.data;
}

// ==========================================
// 2. Đài vệ tinh Inmarsat (M-004: F-098..F-103)
// ==========================================
export async function fetchInmarsatList(params: {
  page?: number;
  size?: number;
  orgUnitId?: string;
  keyword?: string;
  operatingOrgId?: string;
  provinceId?: number;
  conditionStatus?: string;
  approvalStatus?: string;
  updatedBy?: string;
  updatedFrom?: string;
  updatedTo?: string;
}): Promise<PageResponse<CoastalStationInmarsatResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.orgUnitId) sp.set('orgUnitId', params.orgUnitId);
  if (params.keyword) sp.set('keyword', params.keyword);
  if (params.operatingOrgId) sp.set('operatingOrgId', params.operatingOrgId);
  if (params.provinceId !== undefined) sp.set('provinceId', String(params.provinceId));
  if (params.conditionStatus) sp.set('conditionStatus', params.conditionStatus);
  if (params.approvalStatus && params.approvalStatus !== 'ALL') sp.set('approvalStatus', params.approvalStatus);
  if (params.updatedBy) sp.set('updatedBy', params.updatedBy);
  if (params.updatedFrom) sp.set('updatedFrom', params.updatedFrom);
  if (params.updatedTo) sp.set('updatedTo', params.updatedTo);

  const res = await api.get(`/v1/stations/inmarsat?${sp}`);
  return res.data;
}

export async function fetchInmarsatCounts(params: {
  orgUnitId?: string;
  keyword?: string;
  conditionStatus?: string;
}): Promise<Record<string, number>> {
  const sp = new URLSearchParams();
  if (params.orgUnitId) sp.set('orgUnitId', params.orgUnitId);
  if (params.keyword) sp.set('keyword', params.keyword);
  if (params.conditionStatus) sp.set('conditionStatus', params.conditionStatus);

  const res = await api.get(`/v1/stations/inmarsat/counts?${sp}`);
  return res.data || {};
}

export async function fetchInmarsatById(id: string): Promise<CoastalStationInmarsatResponse> {
  const res = await api.get(`/v1/stations/inmarsat/${id}`);
  return res.data;
}

export async function createInmarsat(payload: CoastalStationInmarsatRequest): Promise<CoastalStationInmarsatResponse> {
  const res = await api.post('/v1/stations/inmarsat', payload);
  return res.data;
}

export async function updateInmarsat(id: string, payload: CoastalStationInmarsatUpdateRequest): Promise<CoastalStationInmarsatResponse> {
  const res = await api.put(`/v1/stations/inmarsat/${id}`, payload);
  return res.data;
}

export async function deleteInmarsat(id: string): Promise<void> {
  await api.delete(`/v1/stations/inmarsat/${id}`);
}

export async function submitInmarsat(id: string): Promise<CoastalStationInmarsatResponse> {
  const res = await api.post(`/v1/stations/inmarsat/${id}/submit`);
  return res.data;
}

export async function approveInmarsatL1(id: string): Promise<CoastalStationInmarsatResponse> {
  const res = await api.post(`/v1/stations/inmarsat/${id}/approve-l1`);
  return res.data;
}

export async function approveInmarsatL2(id: string): Promise<CoastalStationInmarsatResponse> {
  const res = await api.post(`/v1/stations/inmarsat/${id}/approve-l2`);
  return res.data;
}

export async function rejectInmarsat(id: string, rejectionReason: string): Promise<CoastalStationInmarsatResponse> {
  const res = await api.post(`/v1/stations/inmarsat/${id}/reject`, { rejectionReason });
  return res.data;
}

export async function fetchInmarsatOptions(orgUnitId?: string): Promise<CoastalStationInmarsatOptionResponse[]> {
  const sp = new URLSearchParams();
  if (orgUnitId) sp.set('orgUnitId', orgUnitId);
  const res = await api.get(`/v1/stations/inmarsat/options?${sp}`);
  return res.data || [];
}

export async function fetchInmarsatHistory(id: string): Promise<CoastalStationInmarsatHistoryResponse[]> {
  const res = await api.get(`/v1/stations/inmarsat/${id}/history`);
  return res.data || [];
}
