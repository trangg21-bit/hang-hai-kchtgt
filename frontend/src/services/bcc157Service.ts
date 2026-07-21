import api from './api';

export interface Bcc157CreateRequest {
  orgUnitId: string;
  reportYear: number;
  nguonDuLieu?: string;

  // Section 1: Nguyên giá
  maSoNguyenGiaSoDuDauNam?: string;
  taiSanNguyenGiaSoDuDauNam?: number;
  maSoNguyenGiaTangTrongNam?: string;
  taiSanNguyenGiaTangTrongNam?: number;
  maSoNguyenGiaGiamTrongNam?: string;
  taiSanNguyenGiaGiamTrongNam?: number;
  maSoNguyenGiaSoDuCuoiNam?: string;
  taiSanNguyenGiaSoDuCuoiNam?: number;

  // Section 2: Giá trị hao mòn lũy kế
  maSoGiaTriHaoMonSoDuDauNam?: string;
  taiSanGiaTriHaoMonSoDuDauNam?: number;
  maSoGiaTriHaoMonTangTrongNam?: string;
  taiSanGiaTriHaoMonTangTrongNam?: number;
  maSoGiaTriHaoMonGiamTrongNam?: string;
  taiSanGiaTriHaoMonGiamTrongNam?: number;
  maSoGiaTriHaoMonSoDuCuoiNam?: string;
  taiSanGiaTriHaoMonSoDuCuoiNam?: number;

  // Section 3: Giá trị còn lại
  maSoGiaTriConLaiTuNgayDauNam?: string;
  taiSanGiaTriConLaiTuNgayDauNam?: number;
  maSoGiaTriConLaiTuNgayCuoiNam?: string;
  taiSanGiaTriConLaiTuNgayCuoiNam?: number;
}

export interface Bcc157Response {
  id: string;
  orgUnitId: string;
  reportYear: number;
  nguonDuLieu: string;
  status: string;

  maSoNguyenGiaSoDuDauNam?: string;
  taiSanNguyenGiaSoDuDauNam?: number;
  maSoNguyenGiaTangTrongNam?: string;
  taiSanNguyenGiaTangTrongNam?: number;
  maSoNguyenGiaGiamTrongNam?: string;
  taiSanNguyenGiaGiamTrongNam?: number;
  maSoNguyenGiaSoDuCuoiNam?: string;
  taiSanNguyenGiaSoDuCuoiNam?: number;

  maSoGiaTriHaoMonSoDuDauNam?: string;
  taiSanGiaTriHaoMonSoDuDauNam?: number;
  maSoGiaTriHaoMonTangTrongNam?: string;
  taiSanGiaTriHaoMonTangTrongNam?: number;
  maSoGiaTriHaoMonGiamTrongNam?: string;
  taiSanGiaTriHaoMonGiamTrongNam?: number;
  maSoGiaTriHaoMonSoDuCuoiNam?: string;
  taiSanGiaTriHaoMonSoDuCuoiNam?: number;

  maSoGiaTriConLaiTuNgayDauNam?: string;
  taiSanGiaTriConLaiTuNgayDauNam?: number;
  maSoGiaTriConLaiTuNgayCuoiNam?: string;
  taiSanGiaTriConLaiTuNgayCuoiNam?: number;

  createdAt?: string;
  updatedAt?: string;
}

export interface Bcc157SearchParams {
  orgUnitId?: string;
  reportYear?: number;
  nguonDuLieu?: string;
}

export const bcc157Service = {
  /**
   * Create a new BCC_157 report
   */
  async create(data: Bcc157CreateRequest): Promise<Bcc157Response> {
    const res = await api.post('/v1/bcc157', data);
    return res.data.data;
  },

  /**
   * Search BCC_157 reports with optional filters
   */
  async search(params: Bcc157SearchParams): Promise<Bcc157Response[]> {
    const res = await api.get('/v1/bcc157', { params });
    return res.data.data;
  },

  /**
   * Get a BCC_157 report by id
   */
  async getById(id: string): Promise<Bcc157Response> {
    const res = await api.get(`/v1/bcc157/${id}`);
    return res.data.data;
  },

  /**
   * Delete a BCC_157 report by id
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/v1/bcc157/${id}`);
  },
};
