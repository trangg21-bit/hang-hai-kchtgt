// ── Buoy Types (Phao, tiêu hàng hải) ──────────────────────────────────
// Độc lập hoàn toàn với Beacon (Đèn biển)

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

// ── Buoy Status ─────────────────────────────────────────────────────

export type BuoyStatus =
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

export const BUOY_STATUS_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: 'default', label: 'Lưu tạm' },
  PROPOSED: { color: 'orange', label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PENDING: { color: 'orange', label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PENDING_APPROVAL: { color: 'orange', label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  APPROVED_L1: { color: 'blue', label: 'Chờ phê duyệt cấp Cục' },
  APPROVED_LEVEL1: { color: 'blue', label: 'Chờ phê duyệt cấp Cục' },
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
  navigationChannelId?: string;
  navigationChannelName?: string;
  orgUnitId?: string;
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
  beaconLight?: string; // Tên trường DB giữ nguyên là beacon_light, ngữ nghĩa UI: 'Đèn hiệu'
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
  level1ApprovalContent?: string;
  level2ApprovalContent?: string;
  operationPlanCode?: string;
  operationPlanName?: string;
  operationStartDate?: string;
  operationEndDate?: string;
  maintenancePlanCode?: string;
  maintenancePlanName?: string;
  maintenanceStartTime?: string;
  maintenanceEndTime?: string;
  incidentCode?: string;
  incidentType?: string;
  incidentLocation?: string;
  incidentTime?: string;
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
  status: BuoyStatus;
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
  navigationChannelId?: string;
  orgUnitId?: string;
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
  beaconLight?: string; // Tên trường DB giữ nguyên là beacon_light, ngữ nghĩa UI: 'Đèn hiệu'
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
  orgUnitId?: string;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  isActive?: boolean;
  buoyStationId?: string;
  navigationChannelId?: string;
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
  beaconLight?: string; // Tên trường DB giữ nguyên là beacon_light, ngữ nghĩa UI: 'Đèn hiệu'
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
