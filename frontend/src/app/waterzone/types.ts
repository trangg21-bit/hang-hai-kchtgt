// ── WaterZone types — grounded on BE WaterZone.java ────────────────────
// Fields: id, waterZoneCode, waterZoneName, portId, area, doSauMax,
//          doSauTrungBinh, loaiVungNuoc, operationalStatus,
//          approvalStatus, orgUnitId, createdBy, updatedBy,
//          createdAt, updatedAt, deletedAt

export type VungNuocTrangThaiHoatDong = 'HIEN_HANH' | 'TAM_NGUNG';

export type VungNuocTrangThaiPheDuyet =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED_LEVEL1'
  | 'APPROVED'
  | 'REJECTED_LEVEL1'
  | 'REJECTED_LEVEL2'
  | 'ARCHIVED'
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
  loaiVungNuoc?: string;
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
  'DRAFT': { color: '#93A3B3', label: 'Lưu tạm' },
  'PENDING_APPROVAL': { color: '#EDA100', label: 'Chờ Cảng vụ duyệt' },
  'APPROVED_LEVEL1': { color: '#0284C7', label: 'Chờ Cục duyệt' },
  'APPROVED': { color: '#1BAF7A', label: 'Đã duyệt' },
  'REJECTED_LEVEL1': { color: '#E34948', label: 'Cảng vụ trả về' },
  'REJECTED_LEVEL2': { color: '#E34948', label: 'Cục trả về' },
  'ARCHIVED': { color: '#E34948', label: 'Đã xóa' },
  'CHO_PHE_DUYET': { color: '#EDA100', label: 'Chờ phê duyệt' },
  'DUOC_PHE_DUYET': { color: '#1BAF7A', label: 'Được phê duyệt' },
  'TU_CHOI': { color: '#E34948', label: 'Từ chối' },
};

export const translateLoaiVungNuoc = (val: string | null): string => {
  return val || '—';
};
