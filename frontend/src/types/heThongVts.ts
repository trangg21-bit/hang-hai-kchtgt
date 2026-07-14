export type TinhTrangVTS = 'TOT' | 'XUONG_CAP' | 'HU_HONG';

export const TINH_TRANG_VTS_OPTIONS = [
  { value: 'TOT', label: 'Tốt' },
  { value: 'XUONG_CAP', label: 'Xuống cấp' },
  { value: 'HU_HONG', label: 'Hư hỏng' },
];

export const TINH_TRANG_VTS_MAP: Record<TinhTrangVTS, string> = {
  'TOT': 'Tốt',
  'XUONG_CAP': 'Xuống cấp',
  'HU_HONG': 'Hư hỏng',
};

export interface HeThongVTSAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
}

export interface HeThongVTSResponse {
  id: number;
  tenHeThong?: string;
  viTri: string;
  tinhTrang?: TinhTrangVTS;
  mucDoPhuTrach?: string;
  nguonGoc?: string;
  doiTac?: string; // partner field unique to VTS
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
  attachments?: HeThongVTSAttachment[];
  history?: HistoryEntry[];
}

export interface CreateHeThongVTSRequest {
  tenHeThong?: string;
  viTri: string;
  tinhTrang?: TinhTrangVTS;
  mucDoPhuTrach?: string;
  nguonGoc?: string;
  doiTac?: string;
  orgUnitId?: string;
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
  orgUnitId?: string;
  keyword?: string;
  tinhTrang?: TinhTrangVTS;
  trangThai?: string;
}

export interface SearchResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
