// CangCan entity type — matches backend CangCan.java exactly
export interface CangCan {
  id: string;
  maCangCan: string;
  tenCangCan: string;
  tinhThanhPho: string;
  viDo: number | null;
  kinhDo: number | null;
  dienTich: number;
  congSuatTEU: number | null;
  trangThaiHoatDong: string; // 'HIỆN_HÀNH' | 'TẠM_NGƯNG'
  trangThaiPheDuyet: string; // 'CHỜ_PHE_DUYỆT' | 'ĐƯỢC_PHE_DUYỆT' | 'TỪ_CHỐI'
  orgUnitId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCangCanPayload {
  maCangCan: string;
  tenCangCan: string;
  tinhThanhPho?: string;
  viDo?: number | null;
  kinhDo?: number | null;
  dienTich: number;
  congSuatTEU?: number | null;
  trangThaiHoatDong?: string;
  trangThaiPheDuyet?: string;
}

export interface UpdateCangCanPayload {
  id: string;
  maCangCan?: string;
  tenCangCan?: string;
  tinhThanhPho?: string;
  viDo?: number | null;
  kinhDo?: number | null;
  dienTich?: number;
  congSuatTEU?: number | null;
  trangThaiHoatDong?: string;
}

export interface CangCanHistoryRecord {
  id: string;
  fieldChanged: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
  changedAt: string;
  reason: string | null;
}

// ── Status maps ─────────────────────────────────────────────────────────

export const TRANG_THAI_HOAT_DONG_OPTIONS = [
  { label: 'Hoạt động', value: 'HIỆN_HÀNH' },
  { label: 'Tạm ngừng', value: 'TẠM_NGƯNG' },
];

export const TRANG_THAI_PHE_DUYET_OPTIONS = [
  { label: 'Chờ phê duyệt', value: 'CHỜ_PHE_DUYỆT' },
  { label: 'Được phê duyệt', value: 'ĐƯỢC_PHE_DUYỆT' },
  { label: 'Từ chối', value: 'TỪ_CHỐI' },
];

export const TRANG_THAI_HOAT_DONG_MAP: Record<string, { color: string; label: string }> = {
  'HIỆN_HÀNH': { color: 'green', label: 'Hoạt động' },
  'TẠM_NGƯNG': { color: 'orange', label: 'Tạm ngừng' },
};

export const TRANG_THAI_PHE_DUYET_MAP: Record<string, { color: string; label: string }> = {
  'CHỜ_PHE_DUYỆT': { color: 'orange', label: 'Chờ phê duyệt' },
  'ĐƯỢC_PHE_DUYỆT': { color: 'green', label: 'Được phê duyệt' },
  'TỪ_CHỐI': { color: 'red', label: 'Từ chối' },
};

// ── Pagination ──────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
