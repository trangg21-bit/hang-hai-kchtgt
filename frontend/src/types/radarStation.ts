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
  | 'ARCHIVED'
  | 'PROPOSED'
  | 'APPROVED_LEVEL2'
  | 'REJECTED'
  | string;

export const RADAR_STATION_STATUS_MAP: Record<string, { label: string }> = {
  DRAFT: { label: 'Lưu tạm' },
  PROPOSED: { label: 'Chờ Cảng vụ duyệt' },
  PENDING_APPROVAL: { label: 'Chờ Cảng vụ duyệt' },
  APPROVED_LEVEL1: { label: 'Chờ Cục duyệt' },
  REJECTED_LEVEL1: { label: 'Cảng vụ trả về' },
  REJECTED_LEVEL2: { label: 'Cục trả về' },
  APPROVED: { label: 'Đã duyệt' },
  APPROVED_LEVEL2: { label: 'Đã duyệt' },
  REJECTED: { label: 'Từ chối' },
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
  unitOfMeasure?: string;
  quantity?: number;
  conditionStatus?: string;
  towerHeight?: number;
  radarRange?: string | number;
  coverage?: string;
  emissionArea?: number;
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
  attachments?: RadarStationAttachment[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  spatialId?: string;
  geometryType?: 'POINT' | 'LINE' | 'POLYGON';
  coordinates?: string;
  mapIcon?: string;
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
  towerHeight?: number;
  radarRange?: string | number;
  coverage?: string;
  emissionArea?: number;
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
  '1': { label: 'Đang khai thác' },
  '0': { label: 'Ngừng hoạt động' },
  '2': { label: 'Chưa hoạt động' },
  OPERATIONAL: { label: 'Đang khai thác' },
  STOPPED: { label: 'Ngừng hoạt động' },
  MAINTENANCE: { label: 'Bảo trì' },
};

export const CONDITION_STATUS_OPTIONS = [
  { value: '1', label: 'Đang khai thác' },
  { value: '0', label: 'Ngừng hoạt động' },
  { value: '2', label: 'Chưa hoạt động' },
];

export const UNIT_OF_MEASURE_OPTIONS = [
  { value: 'Cái', label: 'Cái' },
  { value: 'Trạm', label: 'Trạm' },
  { value: 'Bộ', label: 'Bộ' },
  { value: 'Hệ thống', label: 'Hệ thống' },
];


