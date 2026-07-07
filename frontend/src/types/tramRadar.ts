// TramRadar (Trạm Radar) — F-056..F-061

export interface TramRadarAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
}

export interface TramRadarResponse {
  id: number;
  tenTram?: string; // optional
  viTri: string;
  kinhDo?: number; // BigDecimal on BE, number on FE
  viDo?: number;
  loaiTram?: string;
  coTrinh?: string;
  dienTichPhaXa?: number;
  nguonGoc?: string;
  tinhTrang?: string;
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
  attachments?: TramRadarAttachment[];
  history?: HistoryEntry[];
}

export interface CreateTramRadarRequest {
  tenTram?: string;
  viTri: string;
  kinhDo?: number;
  viDo?: number;
  loaiTram?: string;
  coTrinh?: string;
  dienTichPhaXa?: number;
  nguonGoc?: string;
  tinhTrang?: string;
}

export interface UpdateTramRadarRequest extends CreateTramRadarRequest {}

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
