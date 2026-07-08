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
  soHieu?: string;
  tenVanBan?: string;
}): Promise<PageResponse<VanBanPhapLyResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.soHieu) sp.set('soHieu', params.soHieu);
  if (params.tenVanBan) sp.set('tenVanBan', params.tenVanBan);

  const res = await api.get(`/v1/van-ban-phap-ly?${sp}`);
  return res.data.data;
}

export async function fetchVanBanById(id: string): Promise<VanBanPhapLyResponse> {
  const res = await api.get(`/v1/van-ban-phap-ly/${id}`);
  return res.data.data;
}

export async function createVanBan(payload: VanBanPhapLyCreateRequest): Promise<VanBanPhapLyResponse> {
  const res = await api.post('/v1/van-ban-phap-ly', payload);
  return res.data.data;
}

export async function updateVanBan(id: string, payload: VanBanPhapLyCreateRequest): Promise<VanBanPhapLyResponse> {
  const res = await api.put(`/v1/van-ban-phap-ly/${id}`, payload);
  return res.data.data;
}

export async function deleteVanBan(id: string): Promise<void> {
  await api.delete(`/v1/van-ban-phap-ly/${id}`);
}

// ==========================================
// 2. Sự cố hàng hải
// ==========================================
export async function fetchSuCoList(params: {
  page?: number;
  size?: number;
  tenSuCo?: string;
}): Promise<PageResponse<SuCoResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.tenSuCo) sp.set('tenSuCo', params.tenSuCo);

  const res = await api.get(`/v1/su-co?${sp}`);
  return res.data.data;
}

export async function createSuCo(payload: SuCoCreateRequest): Promise<SuCoResponse> {
  const res = await api.post('/v1/su-co', payload);
  return res.data.data;
}

export async function updateSuCo(id: string, payload: SuCoCreateRequest): Promise<SuCoResponse> {
  const res = await api.put(`/v1/su-co/${id}`, payload);
  return res.data.data;
}

export async function deleteSuCo(id: string): Promise<void> {
  await api.delete(`/v1/su-co/${id}`);
}

// ==========================================
// 3. Quy hoạch bến cảng
// ==========================================
export async function fetchQuyHoachList(params: {
  page?: number;
  size?: number;
  tenQuyHoach?: string;
}): Promise<PageResponse<QuyHoachBenCangResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.tenQuyHoach) sp.set('tenQuyHoach', params.tenQuyHoach);

  const res = await api.get(`/v1/quy-hoach-ben-cang?${sp}`);
  return res.data.data;
}

export async function createQuyHoach(payload: QuyHoachBenCangCreateRequest): Promise<QuyHoachBenCangResponse> {
  const res = await api.post('/v1/quy-hoach-ben-cang', payload);
  return res.data.data;
}

export async function updateQuyHoach(id: string, payload: QuyHoachBenCangCreateRequest): Promise<QuyHoachBenCangResponse> {
  const res = await api.put(`/v1/quy-hoach-ben-cang/${id}`, payload);
  return res.data.data;
}

export async function deleteQuyHoach(id: string): Promise<void> {
  await api.delete(`/v1/quy-hoach-ben-cang/${id}`);
}
