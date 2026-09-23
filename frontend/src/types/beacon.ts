// ── Beacon Light Types ──────────────────────────────────────────────

export type BeaconLightType = 'LIGHTHOUSE' | 'BEACON_LIGHT' | 'BEACON_MARK';

export const BEACON_LIGHT_TYPE_OPTIONS: { value: BeaconLightType; label: string }[] = [
  { value: 'LIGHTHOUSE', label: 'Cấp I' },
  { value: 'BEACON_LIGHT', label: 'Cấp II' },
  { value: 'BEACON_MARK', label: 'Cấp III' },
];

export const BEACON_LIGHT_TYPE_MAP: Record<BeaconLightType, { color: string }> = {
  LIGHTHOUSE: { color: 'cyan' },
  BEACON_LIGHT: { color: 'blue' },
  BEACON_MARK: { color: 'purple' },
};

// ── Buoy Types (Re-exported from ./buoy for backward compatibility) ─
export type { BuoyType, BuoyStatus } from './buoy';
export { BUOY_TYPE_OPTIONS, BUOY_TYPE_MAP, BUOY_STATUS_MAP } from './buoy';

// ── Status (shared) ─────────────────────────────────────────────────

export type BeaconStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED_LEVEL1'
  | 'REJECTED_LEVEL1'
  | 'REJECTED_LEVEL2'
  | 'APPROVED'
  | 'PROPOSED'
  | 'APPROVED_LEVEL2'
  | 'REJECTED'
  | 'ARCHIVED'
  | string;

export const BEACON_STATUS_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: 'default', label: 'Lưu tạm' },
  PROPOSED: { color: 'blue', label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PENDING: { color: 'blue', label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PENDING_APPROVAL: { color: 'blue', label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  APPROVED_L1: { color: 'orange', label: 'Chờ phê duyệt cấp Cục' },
  APPROVED_LEVEL1: { color: 'orange', label: 'Chờ phê duyệt cấp Cục' },
  APPROVED_L2: { color: 'green', label: 'Đã phê duyệt' },
  APPROVED_LEVEL2: { color: 'green', label: 'Đã phê duyệt' },
  PUBLISHED: { color: 'green', label: 'Đã phê duyệt' },
  APPROVED: { color: 'green', label: 'Đã phê duyệt' },
  REJECTED: { color: 'red', label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_L1: { color: 'red', label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL1: { color: 'red', label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_L2: { color: 'red', label: 'Từ chối cấp Cục' },
  REJECTED_LEVEL2: { color: 'red', label: 'Từ chối cấp Cục' },
  ARCHIVED: { color: 'default', label: 'Đã xóa' },
};

// ── Entity Interfaces ───────────────────────────────────────────────

export interface BeaconStation {
  [key: string]: any;
  id: string;
  name: string;
  code: string;
  type: BeaconLightType;
  latitude: number;
  longitude: number;
  lightRange: number;
  towerColor?: string;
  primaryLightModel?: string;
  area?: number;
  location?: string;
  unitId?: string;
  unitName?: string;
  lastRepairDate?: string;
  commissionedDate?: string;
  isActive: boolean;
  status: BeaconStatus;
  approvalStatus: string;
  approvedBy?: number;
  approvedDate?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  deletedBy?: string;
  provinceId?: number;
  seaportId?: string;
  operator?: string;
  detailedLocation?: string;
  operationalStatus?: number;
  region?: string;
  identifyingFeature?: string;
  note?: string;
  geometryType?: string;
  mapSymbolId?: string;
  coordinateSystem?: number;
  displayRule?: string;
  updatedBy?: string;
  updatedByName?: string;
  submittedBy?: string;
  submittedAt?: string;
  submittedByName?: string;
  approverLevel1?: string;
  approverLevel1Name?: string;
  approvedDateLevel1?: string;
  approvalContentLevel1?: string;
  approverLevel2?: string;
  approverLevel2Name?: string;
  approvedDateLevel2?: string;
  approvalContentLevel2?: string;
  shape?: string;
  structure?: string;
  towerHeight?: number;
  lightHeight?: number;
  geographicRange?: string;
  backupLightModel?: string;
  powerSupply?: string;
  staffCount?: number;
  stationArea?: number;
}

export interface CreateBeaconStationRequest {
  name: string;
  code: string;
  type: BeaconLightType;
  latitude?: number;
  longitude?: number;
  lightRange: number | string;
  towerColor?: string;
  primaryLightModel?: string;
  area?: number | string;
  location?: string;
  unitId?: string;
  lastRepairDate?: string;
  commissionedDate?: string;
  isActive?: boolean;
  action?: 'draft' | 'submit' | 'approved';
  provinceId?: number;
  seaportId?: string;
  operator?: string;
  detailedLocation?: string;
  operationalStatus?: number;
  region?: string;
  identifyingFeature?: string;
  note?: string;
  geometryType?: string;
  mapSymbolId?: string;
  coordinateSystem?: number;
  displayRule?: string;
  shape?: string;
  structure?: string;
  towerHeight?: number | string;
  lightHeight?: number | string;
  geographicRange?: string;
  backupLightModel?: string;
  powerSupply?: string;
  staffCount?: number;
  stationArea?: number | string;
}

export interface UpdateBeaconStationRequest {
  /** Hành động lưu khi cập nhật: draft (giữ trạng thái) | submit (gửi phê duyệt) | approved (Lưu và phê duyệt). */
  action?: 'draft' | 'submit' | 'approved';
  name?: string;
  type?: BeaconLightType;
  latitude?: number;
  longitude?: number;
  lightRange?: number | string;
  towerColor?: string;
  primaryLightModel?: string;
  area?: number | string;
  location?: string;
  unitId?: string;
  lastRepairDate?: string;
  commissionedDate?: string;
  isActive?: boolean;
  provinceId?: number;
  seaportId?: string;
  operator?: string;
  detailedLocation?: string;
  operationalStatus?: number;
  region?: string;
  identifyingFeature?: string;
  note?: string;
  geometryType?: string;
  mapSymbolId?: string;
  coordinateSystem?: number;
  displayRule?: string;
  shape?: string;
  structure?: string;
  towerHeight?: number | string;
  lightHeight?: number | string;
  geographicRange?: string;
  backupLightModel?: string;
  powerSupply?: string;
  staffCount?: number;
  stationArea?: number | string;
}

export type { Buoy, CreateBuoyRequest, UpdateBuoyRequest } from './buoy';

// ── Shared / History ────────────────────────────────────────────────

export type BeaconType = 'BEACON_LIGHT' | 'BUOY';

export type BeaconHistoryActionType =
  | 'CREATE'
  | 'UPDATE'
  | 'APPROVE_L1'
  | 'APPROVE_L2'
  | 'REJECT'
  | 'SOFT_DELETE';

export const BEACON_HISTORY_ACTION_MAP: Record<BeaconHistoryActionType, { color: string; label: string }> = {
  CREATE: { color: 'blue', label: 'Tạo mới' },
  UPDATE: { color: 'cyan', label: 'Cập nhật' },
  APPROVE_L1: { color: 'orange', label: 'Phê duyệt L1' },
  APPROVE_L2: { color: 'magenta', label: 'Phê duyệt L2' },
  REJECT: { color: 'red', label: 'Từ chối' },
  SOFT_DELETE: { color: 'default', label: 'Xóa mềm' },
};

export interface BeaconHistoryResponse {
  [key: string]: any;
  id: string;
  beaconType: BeaconType;
  entityId: string;
  actionType: BeaconHistoryActionType;
  changedField?: string;
  newValue?: string;
  previousValue?: string;
  changedBy: number;
  changedAt: string;
}

export interface BeaconHistoryFilters {
  type: BeaconType;
  entityId?: string;
  entityCode?: string;
  actionType?: BeaconHistoryActionType;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}
