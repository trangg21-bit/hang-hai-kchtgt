import api from '../api';
import type {
  PageResponse,
  VanBanPhapLyCreateRequest,
  VanBanPhapLyResponse,
  SuCoCreateRequest,
  SuCoResponse,
  QuyHoachBenCangCreateRequest,
  QuyHoachBenCangResponse,
} from './types';

// ==========================================
// 1. Văn bản pháp lý
// ==========================================
export async function fetchVanBanList(params: {
  page?: number;
  size?: number;
  keyword?: string;
  issuingAuthority?: string;
  type?: string;
  status?: string;
}): Promise<PageResponse<VanBanPhapLyResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.keyword) sp.set('keyword', params.keyword);
  if (params.issuingAuthority) sp.set('issuingAuthority', params.issuingAuthority);
  if (params.type) sp.set('type', params.type);
  if (params.status) sp.set('status', params.status);

  const res = await api.get(`/v1/legal-documents/search?${sp}`);
  const data = res.data.data;
  return {
    content: data.results || [],
    totalElements: data.totalElements || 0,
    totalPages: data.totalPages || 1,
    size: data.pageSize || 10,
    number: data.currentPage || 0,
  };
}

export async function fetchVanBanById(id: string): Promise<VanBanPhapLyResponse> {
  const res = await api.get(`/v1/legal-documents/${id}`);
  return res.data.data;
}

export async function createVanBan(payload: VanBanPhapLyCreateRequest): Promise<VanBanPhapLyResponse> {
  const res = await api.post('/v1/legal-documents', payload);
  return res.data.data;
}

export async function updateVanBan(id: string, payload: VanBanPhapLyCreateRequest): Promise<VanBanPhapLyResponse> {
  const res = await api.put(`/v1/legal-documents/${id}`, payload);
  return res.data.data;
}

export async function deleteVanBan(id: string): Promise<void> {
  await api.delete(`/v1/legal-documents/${id}`);
}

// ==========================================
// 2. Sự cố hàng hải
// ==========================================
export async function fetchIncidentList(params: {
  page?: number;
  size?: number;
  viTri?: string;
}): Promise<PageResponse<SuCoResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));

  let url = '/v1/incidents';
  if (params.viTri) {
    sp.set('location', params.viTri);
    url = '/v1/incidents/search/location';
  }

  const res = await api.get(`${url}?${sp}`);
  const data = res.data.data;
  if (Array.isArray(data)) {
    return {
      content: data,
      totalElements: data.length,
      totalPages: 1,
      size: data.length,
      number: 0,
    };
  }
  return data || { content: [], totalElements: 0, totalPages: 1, size: 10, number: 0 };
}

export async function createSuCo(payload: SuCoCreateRequest): Promise<SuCoResponse> {
  const res = await api.post('/v1/incidents', payload);
  return res.data.data;
}

export async function updateSuCo(id: string, payload: SuCoCreateRequest): Promise<SuCoResponse> {
  const res = await api.put(`/v1/incidents/${id}`, payload);
  return res.data.data;
}

export async function deleteSuCo(id: string): Promise<void> {
  await api.delete(`/v1/incidents/${id}`);
}

// ==========================================
// 3. Quy hoạch bến cảng
// ==========================================
export async function fetchPortPlanningList(params: {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
}): Promise<PageResponse<QuyHoachBenCangResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.keyword) sp.set('keyword', params.keyword);
  if (params.status) sp.set('status', params.status);

  const res = await api.get(`/v1/port-planning/search?${sp}`);
  const data = res.data.data;
  return {
    content: data.results || [],
    totalElements: data.totalElements || 0,
    totalPages: data.totalPages || 1,
    size: data.pageSize || 10,
    number: data.currentPage || 0,
  };
}

export async function createQuyHoach(payload: QuyHoachBenCangCreateRequest): Promise<QuyHoachBenCangResponse> {
  const res = await api.post('/v1/port-planning', payload);
  return res.data.data;
}

export async function updateQuyHoach(id: string, payload: QuyHoachBenCangCreateRequest): Promise<QuyHoachBenCangResponse> {
  const res = await api.put(`/v1/port-planning/${id}`, payload);
  return res.data.data;
}

export async function deleteQuyHoach(id: string): Promise<void> {
  await api.delete(`/v1/port-planning/${id}`);
}
