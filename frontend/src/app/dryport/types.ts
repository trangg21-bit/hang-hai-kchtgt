// DryPort entity type — matches backend DryPort.java exactly
export interface DryPort {
  id: string;
  dryPortCode: string;
  dryPortName: string;
  province: string;
  viDo: number | null;
  kinhDo: number | null;
  area: number;
  congSuatTEU: number | null;
  operationalStatus: string; // 'HIEN_HANH' | 'TAM_NGUNG'
  approvalStatus: string; // 'CHO_PHE_DUYET' | 'DUOC_PHE_DUYET' | 'TU_CHOI'
  orgUnitId: string;
  bieuTuongId?: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCangCanPayload {
  dryPortCode: string;
  dryPortName: string;
  province?: string;
  viDo?: number | null;
  kinhDo?: number | null;
  area: number;
  congSuatTEU?: number | null;
  operationalStatus?: string;
  approvalStatus?: string;
  bieuTuongId?: string | null;
}

export interface UpdateCangCanPayload {
  id: string;
  dryPortCode?: string;
  dryPortName?: string;
  province?: string;
  viDo?: number | null;
  kinhDo?: number | null;
  area?: number;
  congSuatTEU?: number | null;
  operationalStatus?: string;
  bieuTuongId?: string | null;
}

export interface dryPortHistoryRecord {
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
  { label: 'Hoạt động', value: 'HIEN_HANH' },
  { label: 'Tạm ngừng', value: 'TAM_NGUNG' },
];

export const TRANG_THAI_PHE_DUYET_OPTIONS = [
  { label: 'Chờ phê duyệt', value: 'CHO_PHE_DUYET' },
  { label: 'Được phê duyệt', value: 'DUOC_PHE_DUYET' },
  { label: 'Từ chối', value: 'TU_CHOI' },
];

export const TRANG_THAI_HOAT_DONG_MAP: Record<string, { color: string; label: string }> = {
  'HIEN_HANH': { color: 'green', label: 'Hoạt động' },
  'TAM_NGUNG': { color: 'orange', label: 'Tạm ngừng' },
};

export const TRANG_THAI_PHE_DUYET_MAP: Record<string, { color: string; label: string }> = {
  'CHO_PHE_DUYET': { color: 'orange', label: 'Chờ phê duyệt' },
  'DUOC_PHE_DUYET': { color: 'green', label: 'Được phê duyệt' },
  'TU_CHOI': { color: 'red', label: 'Từ chối' },
};

// ── Pagination ──────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
