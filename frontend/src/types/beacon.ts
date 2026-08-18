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

// ── Buoy Types ──────────────────────────────────────────────────────

export type BuoyType = 'CARDINAL' | 'SECTOR' | 'SPECIAL' | 'SAFE_WATER' | 'ISOLATED_DANGER';

export const BUOY_TYPE_OPTIONS: { value: BuoyType; label: string }[] = [
  { value: 'CARDINAL', label: 'Phao giới hạn hai bên' },
  { value: 'SECTOR', label: 'Phao phân luồng' },
  { value: 'SPECIAL', label: 'Phao chuyên dùng' },
  { value: 'SAFE_WATER', label: 'Phao vùng nước an toàn' },
  { value: 'ISOLATED_DANGER', label: 'Phao chướng ngại vật cô lập' },
];

export const BUOY_TYPE_MAP: Record<BuoyType, { color: string }> = {
  CARDINAL: { color: 'orange' },
  SECTOR: { color: 'blue' },
  SPECIAL: { color: 'purple' },
  SAFE_WATER: { color: 'green' },
  ISOLATED_DANGER: { color: 'red' },
};

// ── Status (shared) ─────────────────────────────────────────────────

export type BeaconStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED_L1'
  | 'APPROVED_L2'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'DELETED';

export const BEACON_STATUS_MAP: Record<BeaconStatus, { color: string; label: string }> = {
  DRAFT: { color: 'blue', label: 'Nháp' },
  PENDING_APPROVAL: { color: 'orange', label: 'Chờ duyệt L1' },
  APPROVED_L1: { color: 'magenta', label: 'Chờ duyệt L2' },
  APPROVED_L2: { color: 'purple', label: 'Đã duyệt L2' },
  PUBLISHED: { color: 'green', label: 'Đã công bố' },
  REJECTED: { color: 'red', label: 'Từ chối' },
  DELETED: { color: 'default', label: 'Đã xóa' },
};

// ── Entity Interfaces ───────────────────────────────────────────────

export interface BeaconLight {
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
  lastRepairDate?: string;
  isActive: boolean;
  status: BeaconStatus;
  approvalStatus: string;
  approvalLevel?: number;
  approvedBy?: number;
  approvedDate?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
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

export interface CreateBeaconLightRequest {
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
  lastRepairDate?: string;
  commissionedDate?: string;
  lastRepairDate?: string;
  isActive?: boolean;
  action?: 'draft' | 'submit';
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

export interface UpdateBeaconLightRequest {
  name?: string;
  type?: BeaconLightType;
  latitude?: number;
  longitude?: number;
  lightRange?: number;
  towerColor?: string;
  primaryLightModel?: string;
  area?: number;
  location?: string;
  unitId?: string;
  lastRepairDate?: string;
  commissionedDate?: string;
  lastRepairDate?: string;
  isActive?: boolean;
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

export interface Buoy {
  [key: string]: any;
  id: string;
  name: string;
  code: string;
  type: BuoyType;
  latitude: number;
  longitude: number;
  geometryType?: string;
  mapSymbolId?: string;
  coordinateSystem?: number;
  displayRule?: string;
  coordinates?: string;
  buoyStationId?: string;
  buoyStationName?: string;
  classification?: string;
  classificationBuoy?: string;
  classificationMark?: string;
  provinceId?: number;
  locationDetail?: string;
  condition?: string;
  structure?: string;
  area?: number;
  bodyHeight?: number;
  diameter?: number;
  beaconLight?: string;
  towerHeight?: number;
  lightHeight?: number;
  lightModel?: string;
  towerColor?: string;
  powerSupply?: string;
  commissionedDate?: string;
  lastRepairDate?: string;
  lightColor?: string;
  flashType?: string;
  period?: string;
  color?: string;
  shape?: string;
  lightCharacteristic?: string;
  range: number;
  description?: string;
  unitId?: string;
  unitName?: string;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  isActive: boolean;
  status: BeaconStatus;
  approvalStatus: string;
  approvalLevel?: number;
  approvedBy?: number;
  approvedDate?: string;
  level1ApprovedBy?: number;
  level1ApprovedDate?: string;
  level2ApprovedBy?: number;
  level2ApprovedDate?: string;
  rejectionReason?: string;
  createdBy?: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBuoyRequest {
  name: string;
  code: string;
  type?: BuoyType;
  latitude: number;
  longitude: number;
  geometryType?: string;
  mapSymbolId?: string;
  coordinateSystem?: number;
  displayRule?: string;
  coordinates?: string;
  color?: string;
  shape?: string;
  lightCharacteristic?: string;
  range: number;
  description?: string;
  unitId?: string;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  isActive?: boolean;
  action?: 'draft' | 'submit';
  buoyStationId: string;
  classification: string;
  classificationBuoy?: string;
  classificationMark?: string;
  provinceId?: number;
  locationDetail?: string;
  condition: string;
  structure?: string;
  area?: number;
  bodyHeight?: number;
  diameter?: number;
  beaconLight?: string;
  towerHeight?: number;
  lightHeight: number;
  lightModel?: string;
  towerColor?: string;
  powerSupply?: string;
  commissionedDate?: string;
  lastRepairDate?: string;
  lightColor?: string;
  flashType?: string;
  period?: string;
}

export interface UpdateBuoyRequest {
  name?: string;
  type?: BuoyType;
  latitude?: number;
  longitude?: number;
  geometryType?: string;
  mapSymbolId?: string;
  coordinateSystem?: number;
  displayRule?: string;
  coordinates?: string;
  color?: string;
  shape?: string;
  lightCharacteristic?: string;
  range?: number;
  description?: string;
  unitId?: string;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  isActive?: boolean;
  buoyStationId?: string;
  classification?: string;
  classificationBuoy?: string;
  classificationMark?: string;
  provinceId?: number;
  locationDetail?: string;
  condition?: string;
  structure?: string;
  area?: number;
  bodyHeight?: number;
  diameter?: number;
  beaconLight?: string;
  towerHeight?: number;
  lightHeight?: number;
  lightModel?: string;
  towerColor?: string;
  powerSupply?: string;
  commissionedDate?: string;
  lastRepairDate?: string;
  lightColor?: string;
  flashType?: string;
  period?: string;
}

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
  reason?: string;
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
