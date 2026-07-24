// TramRadar (Trạm Radar) — F-056..F-061

export interface TramRadarAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
}

export interface TramRadarResponse {
  id: string;
  tenTram?: string; // optional
  viTri: string;

  loaiTram?: string;
  coTrinh?: string;
  dienTichPhaXa?: number;
  nguonGoc?: string;
  tinhTrang?: string;
  orgUnitId?: string;
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
  loaiHinhHoc?: string;
  toaDo?: string;
  khongGianId?: string;
  chieuCaoThapRadar?: number;
  tamHieuLucRadar?: number;
  heThongVtsId?: string;
  tenHeThongVts?: string;
}

export interface CreateTramRadarRequest {
  tenTram?: string;
  viTri: string;

  loaiTram?: string;
  coTrinh?: string;
  dienTichPhaXa?: number;
  nguonGoc?: string;
  tinhTrang?: string;
  orgUnitId?: string;
  loaiHinhHoc?: string;
  toaDo?: string;
  chieuCaoThapRadar?: number;
  tamHieuLucRadar?: number;
  heThongVtsId?: string;
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
  orgUnitId?: string;
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
