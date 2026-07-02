// CoSuaChua (Cơ sở Sửa chữa / Đóng tàu) — F-050..F-055

export interface CoSuaChuaAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
}

export interface CoSuaChuaResponse {
  id: number;
  tenCoSo: string;
  diaChi: string;
  tinhThanh: string;
  soDienThoai?: string;
  email?: string;
  loaiCoSo: string;
  khaNang?: string;
  chuQuan?: string;
  trangThai: string; // status as plain String, not enum
  pheDuyetC1?: boolean;
  nguoiPheDuyetC1?: string;
  ngayPheDuyetC1?: string;
  pheDuyetC2?: boolean;
  nguoiPheDuyetC2?: string;
  ngayPheDuyetC2?: string;
  lyDoTuChoi?: string;
  nguoiTao?: string;
  ngayTao?: string;
  nguoiSuaDoi?: string;
  ngaySuaDoi?: string;
  isDeleted?: boolean;
  attachments?: CoSuaChuaAttachment[];
  history?: HistoryEntry[];
}

export interface CreateCoSuaChuaRequest {
  tenCoSo: string;
  diaChi: string;
  tinhThanh: string;
  soDienThoai?: string;
  email?: string;
  loaiCoSo: string;
  khaNang?: string;
  chuQuan?: string;
}

export interface UpdateCoSuaChuaRequest extends CreateCoSuaChuaRequest {}

export interface PheDuyetRequest {
  quyetDinh: string; // Uses quyetDinh field
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
  tinhThanh?: string;
  trangThai?: string;
  trangThaiPheDuyet?: string;
}

export interface SearchResponse<T> {
  items: T[];
  total: number;
  page?: number;
  size?: number;
}
