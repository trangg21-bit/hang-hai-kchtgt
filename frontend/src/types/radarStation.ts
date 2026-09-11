// RadarStation (Trạm Radar) — F-056..F-068
// Contract khớp backend /api/v1/radar-station theo chuẩn M-1006.

export interface RadarStationAttachment {
  id: string;
  fileName: string;
  fileSize?: number;
  uploadedDate?: string;
  filePath?: string;
  documentType?: string;
  uploadedBy?: string;
}

export type RadarStationStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED_LEVEL1'
  | 'REJECTED_LEVEL1'
  | 'REJECTED_LEVEL2'
  | 'APPROVED'
  | 'DELETED'
  | 'ARCHIVED'
  | 'PROPOSED'
  | 'APPROVED_LEVEL2'
  | 'REJECTED'
  | string;

export const RADAR_STATION_STATUS_MAP: Record<string, { label: string }> = {
  DRAFT: { label: 'Lưu tạm' },
  PROPOSED: { label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PENDING_APPROVAL: { label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  APPROVED_LEVEL1: { label: 'Chờ phê duyệt cấp Cục' },
  REJECTED_LEVEL1: { label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL2: { label: 'Từ chối cấp Cục' },
  APPROVED: { label: 'Đã phê duyệt' },
  APPROVED_LEVEL2: { label: 'Đã phê duyệt' },
  REJECTED: { label: 'Từ chối cấp Cảng vụ/Chi cục' },
  DELETED: { label: 'Đã xóa' },
  ARCHIVED: { label: 'Đã xóa' },
};

export interface RadarStationResponse {
  id: string;
  code?: string;
  stationName?: string;
  location?: string;
  orgUnitId?: string;
  orgUnitName?: string;
  seaportId?: string;
  seaportName?: string;
  vtsSystemId?: string;
  vtsSystemName?: string;
  vtsOperationCenterId?: string;
  vtsOperationCenterName?: string;
  operatingUnitId?: string;
  operatingUnitName?: string;
  provinceId?: string;
  provinceName?: string;
  unitOfMeasure?: string;
  quantity?: number;
  conditionStatus?: string;
  towerHeight?: number | string;
  radarRange?: string | number;
  coverage?: string;
  emissionArea?: number | string;
  stationType?: string;
  source?: string;
  note?: string;
  longitude?: number;
  latitude?: number;
  approvalStatus: RadarStationStatus;
  status?: string;
  submittedForApprovalAt?: string;
  submittedForApprovalBy?: string;
  approvedLevel1?: boolean;
  approverLevel1?: string;
  approvedDateLevel1?: string;
  approvedLevel2?: boolean;
  approverLevel2?: string;
  approvedDateLevel2?: string;
  rejectionReason?: string;
  level1ApprovalContent?: string;
  level2ApprovalContent?: string;
  attachments?: RadarStationAttachment[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  createdByName?: string;
  updatedByName?: string;
  submittedByName?: string;
  approverLevel1Name?: string;
  approverLevel2Name?: string;
  createdDate?: string;
  updatedDate?: string;
  spatialId?: string;
  geometryType?: 'POINT' | 'LINE' | 'POLYGON';
  coordinates?: string;
  coordinateSystem?: number;
  mapIcon?: string;
  deletedBy?: string;
  deletedByName?: string;
  deletedAt?: string;
}

export interface RadarStationOptionResponse {
  id: string;
  code: string;
  stationName: string;
  orgUnitId?: string;
}

// Tạo mới: KHÔNG gửi `code` — mã tự sinh phía backend (RADAR-{seq}).
export interface CreateRadarStationRequest {
  stationName: string;
  location: string;
  orgUnitId?: string;
  seaportId?: string;
  vtsSystemId?: string;
  vtsOperationCenterId?: string;
  operatingUnitId?: string;
  provinceId?: string;
  unitOfMeasure?: string;
  quantity?: number;
  conditionStatus?: string;
  towerHeight?: number | string;
  radarRange?: string | number;
  coverage?: string;
  emissionArea?: number | string;
  stationType?: string;
  source?: string;
  note?: string;
  longitude?: number;
  latitude?: number;
  geometryType?: 'POINT' | 'LINE' | 'POLYGON';
  coordinates?: string;
  mapIcon?: string;
  action?: 'draft' | 'submit';
}

export interface UpdateRadarStationRequest extends Partial<CreateRadarStationRequest> {}

export interface ListParams {
  keyword?: string;
  stationName?: string;
  code?: string;
  orgUnitId?: string;
  seaportId?: string;
  vtsSystemId?: string;
  vtsOperationCenterId?: string;
  operatingUnitId?: string;
  provinceId?: string;
  conditionStatus?: string;
  approvalStatus?: string;
  status?: string;
  updatedBy?: string;
  updatedFrom?: string;
  updatedTo?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface HistoryEntry {
  id: string;
  approvalLevel?: string;
  status?: string;
  action?: string;
  approvedBy?: string;
  approvedDate?: string;
  performedBy?: string;
  performedDate?: string;
  reason?: string;
  [key: string]: any;
}

export const CONDITION_STATUS_MAP: Record<string, { label: string }> = {
  '0': { label: 'Chưa khai thác/vận hành' },
  '1': { label: 'Đang khai thác/vận hành' },
  '2': { label: 'Dừng khai thác/vận hành' },
  OPERATIONAL: { label: 'Đang khai thác/vận hành' },
  STOPPED: { label: 'Dừng khai thác/vận hành' },
  MAINTENANCE: { label: 'Bảo trì' },
};

export const CONDITION_STATUS_OPTIONS = [
  { value: '0', label: 'Chưa khai thác/vận hành' },
  { value: '1', label: 'Đang khai thác/vận hành' },
  { value: '2', label: 'Dừng khai thác/vận hành' },
];

export const UNIT_OF_MEASURE_OPTIONS = [
  { value: 'Cái', label: 'Cái' },
  { value: 'Trạm', label: 'Trạm' },
  { value: 'Bộ', label: 'Bộ' },
  { value: 'Hệ thống', label: 'Hệ thống' },
];
