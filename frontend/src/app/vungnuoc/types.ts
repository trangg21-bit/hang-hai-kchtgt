// ── VungNuoc types — grounded on BE VungNuoc.java ────────────────────
// Fields: id, maVungNuoc, tenVungNuoc, cangBienId, dienTich, doSauMax,
//          doSauTrungBinh, loaiVungNuoc, trangThaiHoatDong,
//          trangThaiPheDuyet, orgUnitId, createdBy, updatedBy,
//          createdAt, updatedAt, deletedAt

export type VungNuocTrangThaiHoatDong = 'HIEN_HANH' | 'TAM_NGUNG';

export type VungNuocTrangThaiPheDuyet =
  | 'CHO_PHE_DUYET'
  | 'DUOC_PHE_DUYET'
  | 'TU_CHOI';

export interface VungNuoc {
  id: string;
  maVungNuoc: string;
  tenVungNuoc: string;
  cangBienId: string;
  dienTich: number | null;
  doSauMax: number | null;
  doSauTrungBinh: number | null;
  loaiVungNuoc: string | null;
  trangThaiHoatDong: VungNuocTrangThaiHoatDong;
  trangThaiPheDuyet: VungNuocTrangThaiPheDuyet;
  orgUnitId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateVungNuocRequest {
  maVungNuoc: string;
  tenVungNuoc: string;
  cangBienId: string;
  dienTich?: number | null;
  doSauMax?: number | null;
  doSauTrungBinh?: number | null;
  loaiVungNuoc?: string | null;
  trangThaiHoatDong?: VungNuocTrangThaiHoatDong;
}

export interface UpdateVungNuocRequest {
  id: string;
  tenVungNuoc?: string;
  cangBienId?: string;
  dienTich?: number | null;
  doSauMax?: number | null;
  doSauTrungBinh?: number | null;
  loaiVungNuoc?: string | null;
  trangThaiHoatDong?: VungNuocTrangThaiHoatDong;
}

// Approval / Reject
export interface ApproveVungNuocRequest {
  userId: string;
}

export interface RejectVungNuocRequest {
  reason: string;
}

// History
export interface VungNuocHistoryRecord {
  id: string;
  entityId: string;
  entityName: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  actor: string;
  reason: string | null;
  createdAt: string;
}

// List filters
export interface VungNuocFilters {
  search?: string;
  trangThaiHoatDong?: VungNuocTrangThaiHoatDong;
  trangThaiPheDuyet?: VungNuocTrangThaiPheDuyet;
  cangBienId?: string;
  loaiVungNuoc?: LoaiVungNuoc;
  sortBy?: 'maVungNuoc' | 'tenVungNuoc' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

// ── Status maps ───────────────────────────────────────────────────────

export const VUNGNUOC_HOAT_DONG_MAP: Record<VungNuocTrangThaiHoatDong, { color: string; label: string }> = {
  'HIEN_HANH': { color: 'green', label: 'Hiện hành' },
  'TAM_NGUNG': { color: 'orange', label: 'Tạm ngưng' },
};

export const VUNGNUOC_PHE_DUYET_MAP: Record<VungNuocTrangThaiPheDuyet, { color: string; label: string }> = {
  'CHO_PHE_DUYET': { color: 'orange', label: 'Chờ phê duyệt' },
  'DUOC_PHE_DUYET': { color: 'green', label: 'Được phê duyệt' },
  'TU_CHOI': { color: 'red', label: 'Từ chối' },
};

export type LoaiVungNuoc = 'NEO_DAU' | 'KIEM_DICH' | 'DON_TRA_HOA_TIEU' | 'QUAY_TRO_TAU' | 'BEN_PHAO' | 'CHUYEN_TAI' | 'TRANH_BAO';

export const LOAI_VUNG_NUOC_OPTIONS = [
  { value: 'NEO_DAU', label: 'Khu neo đậu' },
  { value: 'KIEM_DICH', label: 'Khu kiểm dịch' },
  { value: 'DON_TRA_HOA_TIEU', label: 'Khu đón trả hoa tiêu' },
  { value: 'QUAY_TRO_TAU', label: 'Vùng quay trở tàu' },
  { value: 'BEN_PHAO', label: 'Bến phao' },
  { value: 'CHUYEN_TAI', label: 'Khu chuyển tải' },
  { value: 'TRANH_BAO', label: 'Khu tránh trú bão' },
];

export const translateLoaiVungNuoc = (val: string | null): string => {
  if (!val) return '—';
  const found = LOAI_VUNG_NUOC_OPTIONS.find(o => o.value === val);
  return found ? found.label : val;
};
