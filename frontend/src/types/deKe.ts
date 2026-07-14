// DeKe (Đê/Kè) — F-044..F-049

export type ApprovalStatus = 'PROPOSED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface DeKeAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
}

export type LoaiDe = 'DE_DAT' | 'DE_BETONG' | 'KE_DA' | 'KE_BETONG' | 'KHAC';

export interface DeKeResponse {
  id: number;
  loaiDe: LoaiDe;
  viTri: string;
  chieuDai?: number;
  chieuRong?: number;
  chieuCao?: number;
  matVatLieu?: string;
  tinhTrang?: string;
  ghiChu?: string;
  donViId?: string;
  trangThaiPheDuyet: ApprovalStatus;
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
  attachments?: DeKeAttachment[];
  approvalHistory?: PheDuyetResponse[];
  history?: HistoryEntry[];
  khongGianId?: string;
  loaiHinhHoc?: 'POINT' | 'LINE' | 'POLYGON';
  toaDo?: string;
  bieuTuongId?: string;
}

export interface CreateDeKeRequest {
  loaiDe: LoaiDe;
  viTri: string;
  chieuDai?: number;
  chieuRong?: number;
  chieuCao?: number;
  matVatLieu?: string;
  tinhTrang?: string;
  ghiChu?: string;
  donViId?: string;
  loaiHinhHoc?: 'POINT' | 'LINE' | 'POLYGON';
  toaDo?: string;
  bieuTuongId?: string;
}

export interface UpdateDeKeRequest extends CreateDeKeRequest {
  id: number;
}

export interface PheDuyetRequest {
  capPheDuyet?: number;
  nguoiPheDuyet: string;
  quyetDinh: string; // Different from LuongHangHai — uses quyetDinh instead of trangThai
  lyDo?: string;
}

export interface PheDuyetResponse {
  id: number;
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
  loaiDe?: LoaiDe;
  tinhTrang?: string;
  trangThaiPheDuyet?: ApprovalStatus;
}

export interface SearchResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
