// DeKe (Đê/Kè) — F-044..F-049

export type ApprovalStatus = 'PROPOSED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface DeKeAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
}

export interface DeKeResponse {
  id: number;
  loaiDe: string;
  viTri: string;
  chieuDai?: number;
  chieuRong?: number;
  chieuCao?: number;
  matVatLieu?: string;
  tinhTrang?: string;
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
}

export interface CreateDeKeRequest {
  loaiDe: string;
  viTri: string;
  chieuDai?: number;
  chieuRong?: number;
  chieuCao?: number;
  matVatLieu?: string;
  tinhTrang?: string;
  ghiChu?: string;
}

export interface UpdateDeKeRequest extends CreateDeKeRequest {}

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
  keyword?: string;
  loaiDe?: string;
  tinhTrang?: string;
  trangThaiPheDuyet?: ApprovalStatus;
}

export interface SearchResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
