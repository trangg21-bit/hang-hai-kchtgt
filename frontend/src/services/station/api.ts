import api from '../api';
import type {
  PageResponse,
  CoastalStationVTSRequest,
  CoastalStationVTSResponse,
  CoastalStationInmarsatRequest,
  CoastalStationInmarsatResponse,

  CreateBuoyStationRequest,
  BuoyStationResponse,
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

// ==========================================
// 2. Đài vệ tinh Inmarsat
// ==========================================
export async function fetchInmarsatList(params: {
  page?: number;
  size?: number;
  keyword?: string;
}): Promise<PageResponse<CoastalStationInmarsatResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));

  let url = '/v1/stations/inmarsat/list';
  if (params.keyword) {
    sp.set('keyword', params.keyword);
    url = '/v1/stations/inmarsat/search';
  }

  const res = await api.get(`${url}?${sp}`);
  const rawList = res.data || [];
  const list = rawList.map((item: any) => ({
    ...item,
    deviceCode: item.deviceCode || item.code,
    stationCode: item.deviceCode || item.code,
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

export async function fetchInmarsatById(id: string): Promise<CoastalStationInmarsatResponse> {
  const res = await api.get(`/v1/stations/inmarsat/${id}`);
  return res.data;
}

export async function createInmarsat(payload: CoastalStationInmarsatRequest): Promise<CoastalStationInmarsatResponse> {
  const res = await api.post('/v1/stations/inmarsat', payload);
  return res.data;
}

export async function updateInmarsat(id: string, payload: CoastalStationInmarsatRequest): Promise<CoastalStationInmarsatResponse> {
  const res = await api.put(`/v1/stations/inmarsat/${id}`, payload);
  return res.data;
}

export async function deleteInmarsat(id: string): Promise<void> {
  await api.delete(`/v1/stations/inmarsat/${id}`);
}

// ==========================================
// 4. Buoy Station (Nhà trạm phao tiêu)
// ==========================================
export async function fetchBuoyStationList(params: {
  page?: number;
  size?: number;
  code?: string;
  name?: string;
  type?: string;
  status?: string;
}): Promise<PageResponse<BuoyStationResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.code) sp.set('code', params.code);
  if (params.name) sp.set('name', params.name);
  if (params.type) sp.set('type', params.type);
  if (params.status) sp.set('status', params.status);

  const hasFilter = params.code || params.name || params.type || params.status;
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
