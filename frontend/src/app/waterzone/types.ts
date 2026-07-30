// ── WaterZone types — grounded on BE WaterZone.java ────────────────────
// Fields: id, waterZoneCode, waterZoneName, portId, area, doSauMax,
//          doSauTrungBinh, loaiVungNuoc, operationalStatus,
//          approvalStatus, orgUnitId, createdBy, updatedBy,
//          createdAt, updatedAt, deletedAt

export type VungNuocTrangThaiHoatDong = 'HIEN_HANH' | 'TAM_NGUNG';

export type VungNuocTrangThaiPheDuyet =
  | 'CHO_PHE_DUYET'
  | 'DUOC_PHE_DUYET'
  | 'TU_CHOI';

export interface WaterZone {
  id: string;
  waterZoneCode: string;
  waterZoneName: string;
  portId: string;
  tenCangBien?: string;
  area: number | null;
  doSauMax: number | null;
  doSauTrungBinh: number | null;
  loaiVungNuoc: string | null;
  operationalStatus: VungNuocTrangThaiHoatDong;
  approvalStatus: VungNuocTrangThaiPheDuyet;
  orgUnitId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  khongGianId?: string | null;
  loaiHinhHoc?: string | null;
  toaDo?: string | null;
  bieuTuongId?: string | null;
}

export interface CreateVungNuocRequest {
  waterZoneCode: string;
  waterZoneName: string;
  portId: string;
  area?: number | null;
  doSauMax?: number | null;
  doSauTrungBinh?: number | null;
  loaiVungNuoc?: string | null;
  operationalStatus?: VungNuocTrangThaiHoatDong;
  bieuTuongId?: string | null;
  loaiHinhHoc?: string | null;
  toaDo?: string | null;
}

export interface UpdateVungNuocRequest {
  id: string;
  waterZoneName?: string;
  portId?: string;
  area?: number | null;
  doSauMax?: number | null;
  doSauTrungBinh?: number | null;
  loaiVungNuoc?: string | null;
  operationalStatus?: VungNuocTrangThaiHoatDong;
  bieuTuongId?: string | null;
  loaiHinhHoc?: string | null;
  toaDo?: string | null;
}

// Approval / Reject
export interface ApproveVungNuocRequest {
  userId: string;
}

export interface RejectVungNuocRequest {
  reason: string;
}

// History
export interface waterZoneHistoryRecord {
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
  operationalStatus?: VungNuocTrangThaiHoatDong;
  approvalStatus?: VungNuocTrangThaiPheDuyet;
  portId?: string;
  loaiVungNuoc?: LoaiVungNuoc;
  sortBy?: 'waterZoneCode' | 'waterZoneName' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

// ── Status maps ───────────────────────────────────────────────────────

export const WaterZone_HOAT_DONG_MAP: Record<VungNuocTrangThaiHoatDong, { color: string; label: string }> = {
  'HIEN_HANH': { color: 'green', label: 'Hiện hành' },
  'TAM_NGUNG': { color: 'orange', label: 'Tạm ngưng' },
};

export const WaterZone_PHE_DUYET_MAP: Record<VungNuocTrangThaiPheDuyet, { color: string; label: string }> = {
  'CHO_PHE_DUYET': { color: 'orange', label: 'Chờ phê duyệt' },
  'DUOC_PHE_DUYET': { color: 'green', label: 'Được phê duyệt' },
  'TU_CHOI': { color: 'red', label: 'Từ chối' },
};

export type LoaiVungNuoc = 'ANCHORAGE' | 'QUARANTINE' | 'PILOT_BOARDING' | 'TURNING_BASIN' | 'MOORING_BUOY' | 'TRANSSHIPMENT' | 'STORM_SHELTER';

export const LOAI_VUNG_NUOC_OPTIONS = [
  { value: 'ANCHORAGE', label: 'Khu neo đậu' },
  { value: 'QUARANTINE', label: 'Khu kiểm dịch' },
  { value: 'PILOT_BOARDING', label: 'Khu đón trả hoa tiêu' },
  { value: 'TURNING_BASIN', label: 'Vùng quay trở tàu' },
  { value: 'MOORING_BUOY', label: 'Bến phao' },
  { value: 'TRANSSHIPMENT', label: 'Khu chuyển tải' },
  { value: 'STORM_SHELTER', label: 'Khu tránh trú bão' },
];

export const translateLoaiVungNuoc = (val: string | null): string => {
  if (!val) return '—';
  const found = LOAI_VUNG_NUOC_OPTIONS.find(o => o.value === val);
  return found ? found.label : val;
};
