import api from '../api';
import type {
  PageResponse,
  CoastalStationVTSRequest,
  CoastalStationVTSResponse,
  CoastalStationInmarsatRequest,
  CoastalStationInmarsatResponse,
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

