import api from '../api';
import type {
  PageResponse,
  YeuCauTangTaiSanRequest,
  YeuCauTangTaiSanResponse,
  YeuCauGiamTaiSanRequest,
  YeuCauGiamTaiSanResponse,
  KeHoachKiemKeRequest,
  KeHoachKiemKeResponse,
  BaoCaoKiemKeRequest,
  BaoCaoKiemKeResponse,
  KhaiThacTaiSanRequest,
  KhaiThacTaiSanResponse,
  HoSoXuLyTaiSanRequest,
  HoSoXuLyTaiSanResponse,
} from './types';

// ==========================================
// 1. Yêu cầu tăng tài sản
// ==========================================
export async function fetchYeuCauTangList(params: {
  page?: number;
  size?: number;
  taiSanId?: string;
}): Promise<PageResponse<YeuCauTangTaiSanResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.taiSanId) sp.set('taiSanId', params.taiSanId);

  const res = await api.get(`/v1/asset/yeu-cau-tang?${sp}`);
  return res.data.data;
}

export async function fetchYeuCauTangById(id: string): Promise<YeuCauTangTaiSanResponse> {
  const res = await api.get(`/v1/asset/yeu-cau-tang/${id}`);
  return res.data.data;
}

export async function createYeuCauTang(payload: YeuCauTangTaiSanRequest): Promise<YeuCauTangTaiSanResponse> {
  const res = await api.post('/v1/asset/yeu-cau-tang', payload);
  return res.data.data;
}

export async function updateYeuCauTang(id: string, payload: YeuCauTangTaiSanRequest): Promise<YeuCauTangTaiSanResponse> {
  const res = await api.put(`/v1/asset/yeu-cau-tang/${id}`, payload);
  return res.data.data;
}

export async function deleteYeuCauTang(id: string): Promise<void> {
  await api.delete(`/v1/asset/yeu-cau-tang/${id}`);
}

// ==========================================
// 2. Yêu cầu giảm tài sản
// ==========================================
export async function fetchYeuCauGiamList(params: {
  page?: number;
  size?: number;
  taiSanId?: string;
}): Promise<PageResponse<YeuCauGiamTaiSanResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.taiSanId) sp.set('taiSanId', params.taiSanId);

  const res = await api.get(`/v1/asset/yeu-cau-giam?${sp}`);
  return res.data.data;
}

export async function fetchYeuCauGiamById(id: string): Promise<YeuCauGiamTaiSanResponse> {
  const res = await api.get(`/v1/asset/yeu-cau-giam/${id}`);
  return res.data.data;
}

export async function createYeuCauGiam(payload: YeuCauGiamTaiSanRequest): Promise<YeuCauGiamTaiSanResponse> {
  const res = await api.post('/v1/asset/yeu-cau-giam', payload);
  return res.data.data;
}

export async function updateYeuCauGiam(id: string, payload: YeuCauGiamTaiSanRequest): Promise<YeuCauGiamTaiSanResponse> {
  const res = await api.put(`/v1/asset/yeu-cau-giam/${id}`, payload);
  return res.data.data;
}

export async function deleteYeuCauGiam(id: string): Promise<void> {
  await api.delete(`/v1/asset/yeu-cau-giam/${id}`);
}

// ==========================================
// 3. Kế hoạch kiểm kê
// ==========================================
export async function fetchKeHoachKiemKeList(params: {
  page?: number;
  size?: number;
}): Promise<PageResponse<KeHoachKiemKeResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));

  const res = await api.get(`/v1/asset/ke-hoach-kiem-ke?${sp}`);
  return res.data.data;
}

export async function createKeHoachKiemKe(payload: KeHoachKiemKeRequest): Promise<KeHoachKiemKeResponse> {
  const res = await api.post('/v1/asset/ke-hoach-kiem-ke', payload);
  return res.data.data;
}

// ==========================================
// 4. Báo cáo kiểm kê
// ==========================================
export async function fetchBaoCaoKiemKeList(params: {
  page?: number;
  size?: number;
  keHoachId?: string;
}): Promise<PageResponse<BaoCaoKiemKeResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.keHoachId) sp.set('keHoachId', params.keHoachId);

  const res = await api.get(`/v1/asset/bao-cao-kiem-ke?${sp}`);
  return res.data.data;
}

export async function createBaoCaoKiemKe(payload: BaoCaoKiemKeRequest): Promise<BaoCaoKiemKeResponse> {
  const res = await api.post('/v1/asset/bao-cao-kiem-ke', payload);
  return res.data.data;
}

// ==========================================
// 5. Khai thác tài sản
// ==========================================
export async function fetchKhaiThacList(params: {
  page?: number;
  size?: number;
  taiSanId?: string;
  namKhaiThac?: number;
}): Promise<PageResponse<KhaiThacTaiSanResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.taiSanId) sp.set('taiSanId', params.taiSanId);
  if (params.namKhaiThac !== undefined) sp.set('namKhaiThac', String(params.namKhaiThac));

  const res = await api.get(`/v1/asset/khai-thac?${sp}`);
  return res.data.data;
}

export async function createKhaiThac(payload: KhaiThacTaiSanRequest): Promise<KhaiThacTaiSanResponse> {
  const res = await api.post('/v1/asset/khai-thac', payload);
  return res.data.data;
}

export async function deleteKhaiThac(id: string): Promise<void> {
  await api.delete(`/v1/asset/khai-thac/${id}`);
}

// ==========================================
// 6. Hồ sơ xử lý tài sản
// ==========================================
export async function fetchHoSoXuLyList(params: {
  page?: number;
  size?: number;
  taiSanId?: string;
}): Promise<PageResponse<HoSoXuLyTaiSanResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.taiSanId) sp.set('taiSanId', params.taiSanId);

  const res = await api.get(`/v1/asset/ho-so-xu-ly?${sp}`);
  return res.data.data;
}

export async function createHoSoXuLy(payload: HoSoXuLyTaiSanRequest): Promise<HoSoXuLyTaiSanResponse> {
  const res = await api.post('/v1/asset/ho-so-xu-ly', payload);
  return res.data.data;
}

// ==========================================
// 7. Lưu phê duyệt (Note: UTF-8 encoded Vietnamese characters in URL)
// ==========================================
export async function fetchLuuPheDuyetHistory(id: string): Promise<any> {
  const res = await api.get(`/v1/asset/luu-phe-duy%E1%BB%87t/${id}`);
  return res.data.data;
}

// ==========================================
// 8. Bổ sung: Lấy danh sách tài sản KCHT và duyệt tăng/giam
// ==========================================
export async function fetchTaiSanKCHTList(params?: {
  page?: number;
  size?: number;
}): Promise<PageResponse<any>> {
  const sp = new URLSearchParams();
  if (params?.page !== undefined) sp.set('page', String(params.page));
  if (params?.size !== undefined) sp.set('size', String(params.size));
  const res = await api.get(`/v1/asset/tai-san?${sp}`);
  return res.data.data;
}

export async function approveYeuCauTang(id: string, remarks?: string): Promise<YeuCauTangTaiSanResponse> {
  const res = await api.post(`/v1/asset/yeu-cau-tang/${id}/approve`, { remarks });
  return res.data.data;
}

export async function rejectYeuCauTang(id: string, remarks?: string): Promise<YeuCauTangTaiSanResponse> {
  const res = await api.post(`/v1/asset/yeu-cau-tang/${id}/reject`, { remarks });
  return res.data.data;
}

export async function approveYeuCauGiam(id: string, remarks?: string): Promise<YeuCauGiamTaiSanResponse> {
  const res = await api.post(`/v1/asset/yeu-cau-giam/${id}/approve`, { remarks });
  return res.data.data;
}

export async function rejectYeuCauGiam(id: string, remarks?: string): Promise<YeuCauGiamTaiSanResponse> {
  const res = await api.post(`/v1/asset/yeu-cau-giam/${id}/reject`, { remarks });
  return res.data.data;
}

export async function approveKeHoachKiemKe(id: string, remarks?: string): Promise<KeHoachKiemKeResponse> {
  const res = await api.post(`/v1/asset/ke-hoach-kiem-ke/${id}/approve`, { remarks });
  return res.data.data;
}

export async function rejectKeHoachKiemKe(id: string, remarks?: string): Promise<KeHoachKiemKeResponse> {
  const res = await api.post(`/v1/asset/ke-hoach-kiem-ke/${id}/reject`, { remarks });
  return res.data.data;
}

export async function startKeHoachKiemKe(id: string): Promise<KeHoachKiemKeResponse> {
  const res = await api.post(`/v1/asset/ke-hoach-kiem-ke/${id}/start`);
  return res.data.data;
}

export async function completeKeHoachKiemKe(id: string): Promise<KeHoachKiemKeResponse> {
  const res = await api.post(`/v1/asset/ke-hoach-kiem-ke/${id}/complete`);
  return res.data.data;
}

export async function approveBaoCaoKiemKe(id: string, remarks?: string): Promise<BaoCaoKiemKeResponse> {
  const res = await api.post(`/v1/asset/bao-cao-kiem-ke/${id}/approve`, { remarks });
  return res.data.data;
}

export async function rejectBaoCaoKiemKe(id: string, remarks?: string): Promise<BaoCaoKiemKeResponse> {
  const res = await api.post(`/v1/asset/bao-cao-kiem-ke/${id}/reject`, { remarks });
  return res.data.data;
}

