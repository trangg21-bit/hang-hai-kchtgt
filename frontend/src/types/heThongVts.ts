// HeThongVTS (Hệ thống VTS) — F-062..F-067

export interface HeThongVTSAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
}

export interface HeThongVTSResponse {
  id: number;
  tenHeThong?: string;
  viTri: string;
  tinhTrang?: string;
  mucDoPhuTrach?: string;
  nguonGoc?: string;
  doiTac?: string; // partner field unique to VTS
  trangThai: string; // status as plain String
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
  attachments?: HeThongVTSAttachment[];
  history?: HistoryEntry[];
}

export interface CreateHeThongVTSRequest {
  tenHeThong?: string;
  viTri: string;
  tinhTrang?: string;
  mucDoPhuTrach?: string;
  nguonGoc?: string;
  doiTac?: string;
}

export interface UpdateHeThongVTSRequest extends CreateHeThongVTSRequest {}

export interface PheDuyetRequest {
  quyetDinh: string;
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
  tinhTrang?: string;
  trangThai?: string;
}

export interface SearchResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
