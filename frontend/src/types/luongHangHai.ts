// LuongHangHai (Luồng hàng hải) — F-038..F-043

export type ApprovalStatus = 'PROPOSED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface LuongHangHaiAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
}

export interface LuongHangHaiResponse {
  id: string;
  ten: string;
  maLuongHangHai?: string;
  soLuongTram?: number;
  thoiDiemSuaChuaTramGanNhat?: string; // date
  cangBienId?: string;
  donViVanHanhId?: string;
  diaDiem?: string;
  diaDiemChiTiet?: string;
  tramQuanLyLuong?: string;
  soLuongNhanSuTaiTram?: number;
  namBaoTriGanNhat?: number;
  khoiLuongNaoVet?: number;
  soLuongPhao?: number;
  soLuongTieu?: number;
  tinhTrang?: number;
  chieuCaoTinhKhong?: string;
  dienTichTram?: number;
  ghiChu?: string;
  donViId?: string;
  approvalStatus: ApprovalStatus;
  pheDuyetC1?: boolean;
  nguoiPheDuyetC1?: string;
  ngayPheDuyetC1?: string;
  pheDuyetC2?: boolean;
  nguoiPheDuyetC2?: string;
  ngayPheDuyetC2?: string;
  lyDoTuChoi?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  attachments?: LuongHangHaiAttachment[];
  approvalHistory?: PheDuyetResponse[];
  history?: HistoryEntry[];
  khongGianId?: string;
  loaiHinhHoc?: 'POINT' | 'LINE' | 'POLYGON';
  toaDo?: string;
  bieuTuongId?: string;
}

export interface CreateLuongHangHaiRequest {
  ten: string;
  maLuongHangHai?: string;
  soLuongTram?: number;
  thoiDiemSuaChuaTramGanNhat?: string;
  cangBienId?: string;
  donViVanHanhId?: string;
  diaDiem?: string;
  diaDiemChiTiet?: string;
  tramQuanLyLuong?: string;
  soLuongNhanSuTaiTram?: number;
  namBaoTriGanNhat?: number;
  khoiLuongNaoVet?: number;
  soLuongPhao?: number;
  soLuongTieu?: number;
  tinhTrang?: number;
  chieuCaoTinhKhong?: string;
  dienTichTram?: number;
  ghiChu?: string;
  donViId?: string;
  loaiHinhHoc?: 'POINT' | 'LINE' | 'POLYGON';
  toaDo?: string;
  bieuTuongId?: string;
}

export interface UpdateLuongHangHaiRequest extends CreateLuongHangHaiRequest {
  id: string;
}

export interface PheDuyetRequest {
  capPheDuyet?: number;
  nguoiPheDuyet: string;
  trangThai: string; // 'APPROVED' | 'REJECTED'
  lyDo?: string;
}

export interface PheDuyetResponse {
  id: string;
  capPheDuyet?: number;
  trangThai: string;
  nguoiPheDuyet: string;
  ngayPheDuyet: string;
  lyDo?: string;
}

export interface HistoryEntry {
  id: number;
  capPheDuyet?: number;
  trangThai: string;
  nguoiPheDuyet: string;
  ngayPheDuyet: string;
  lyDo?: string;
}

export interface ListParams {
  page?: number;
  size?: number;
  donViId?: string;
  keyword?: string;
  maLuongHangHai?: string;
  trangThaiPheDuyet?: ApprovalStatus;
}

export interface SearchResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
