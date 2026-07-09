export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface YeuCauTangTaiSanRequest {
  taiSanId: string;
  tenTaiSan: string;
  soLuong: number;
  donViTinh: string;
  lyDo: string;
  maSoTang: string;
}

export interface YeuCauTangTaiSanResponse {
  id: string;
  taiSanId: string;
  tenTaiSan: string;
  soLuong: number;
  donViTinh: string;
  lyDo: string;
  trangThai: string;
  maSoTang: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface YeuCauGiamTaiSanRequest {
  taiSanId: string;
  tenTaiSan: string;
  soLuong: number;
  donViTinh: string;
  lyDo: string;
  nguyenNhanGiam: string;
}

export interface YeuCauGiamTaiSanResponse {
  id: string;
  taiSanId: string;
  tenTaiSan: string;
  soLuong: number;
  donViTinh: string;
  lyDo: string;
  trangThai: string;
  nguyenNhanGiam: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface KeHoachKiemKeRequest {
  tenKeHoach: string;
  phamVi: string;
  loaiKiemKe: 'DINH_KY' | 'DOT_XUAT';
  ngayBatDau: string;
  ngayKetThuc: string;
  toTruongKiemKe: string;
  moTa: string;
}

export interface KeHoachKiemKeResponse {
  id: string;
  tenKeHoach: string;
  moTa: string;
  trangThai: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface BaoCaoKiemKeRequest {
  keHoachId: string;
  tenBaoCao: string;
  tongSoLuong: number;
  soLuongChenhLech: number;
  ketQua: string;
  moTa: string;
}

export interface BaoCaoKiemKeResponse {
  id: string;
  keHoachId: string;
  tenBaoCao: string;
  tongSoLuong: number;
  soLuongChenhLech: number;
  ketQua: string;
  moTa: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface KhaiThacTaiSanRequest {
  taiSanId: string;
  tenTaiSan: string;
  namKhaiThac: number;
  doanhThu: number;
  haoMon: number;
  moTa: string;
}

export interface KhaiThacTaiSanResponse {
  id: string;
  taiSanId: string;
  tenTaiSan: string;
  namKhaiThac: number;
  doanhThu: number;
  haoMon: number;
  moTa: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface HoSoXuLyTaiSanRequest {
  taiSanId: string;
  tenTaiSan: string;
  loaiXuLy: string;
  benNhan: string;
  lyDoXuLy: string;
  moTa: string;
}

export interface HoSoXuLyTaiSanResponse {
  id: string;
  taiSanId: string;
  tenTaiSan: string;
  loaiXuLy: string;
  moTa: string;
  trangThaiHoSo: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}
