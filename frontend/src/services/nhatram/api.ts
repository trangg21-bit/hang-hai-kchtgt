import api from '../api';
import type {
  PageResponse,
  CreateNhaTramDenRequest,
  NhaTramDenResponse,
  CreateNhaTramPhaoRequest,
  NhaTramPhaoResponse,
} from './types';

// ==========================================
// 1. Nhà trạm đèn biển
// ==========================================
export async function fetchNhaTramDenList(params: {
  page?: number;
  size?: number;
  code?: string;
  name?: string;
  type?: string;
  status?: string;
}): Promise<PageResponse<NhaTramDenResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.code) sp.set('code', params.code);
  if (params.name) sp.set('name', params.name);
  if (params.type) sp.set('type', params.type);
  if (params.status) sp.set('status', params.status);

  const hasFilter = params.code || params.name || params.type || params.status;
  const url = hasFilter ? '/v1/nhatram/den/search' : '/v1/nhatram/den';

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

export async function fetchNhaTramDenById(id: string): Promise<NhaTramDenResponse> {
  const res = await api.get(`/v1/nhatram/den/${id}`);
  return res.data.data;
}

export async function createNhaTramDen(payload: CreateNhaTramDenRequest): Promise<NhaTramDenResponse> {
  const res = await api.post('/v1/nhatram/den', payload);
  return res.data.data;
}

export async function updateNhaTramDen(id: string, payload: CreateNhaTramDenRequest): Promise<NhaTramDenResponse> {
  const res = await api.put(`/v1/nhatram/den/${id}`, payload);
  return res.data.data;
}

export async function deleteNhaTramDen(id: string): Promise<void> {
  await api.delete(`/v1/nhatram/den/${id}`);
}

// ==========================================
// 2. Nhà trạm phao tiêu
// ==========================================
export async function fetchNhaTramPhaoList(params: {
  page?: number;
  size?: number;
  code?: string;
  name?: string;
  type?: string;
  status?: string;
}): Promise<PageResponse<NhaTramPhaoResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.code) sp.set('code', params.code);
  if (params.name) sp.set('name', params.name);
  if (params.type) sp.set('type', params.type);
  if (params.status) sp.set('status', params.status);

  const hasFilter = params.code || params.name || params.type || params.status;
  const url = hasFilter ? '/v1/nhatram/phao/search' : '/v1/nhatram/phao';

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

export async function fetchNhaTramPhaoById(id: string): Promise<NhaTramPhaoResponse> {
  const res = await api.get(`/v1/nhatram/phao/${id}`);
  return res.data.data;
}

export async function createNhaTramPhao(payload: CreateNhaTramPhaoRequest): Promise<NhaTramPhaoResponse> {
  const res = await api.post('/v1/nhatram/phao', payload);
  return res.data.data;
}

export async function updateNhaTramPhao(id: string, payload: CreateNhaTramPhaoRequest): Promise<NhaTramPhaoResponse> {
  const res = await api.put(`/v1/nhatram/phao/${id}`, payload);
  return res.data.data;
}

export async function deleteNhaTramPhao(id: string): Promise<void> {
  await api.delete(`/v1/nhatram/phao/${id}`);
}
