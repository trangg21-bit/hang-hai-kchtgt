// RadarStation (Trạm Radar) — F-056..F-068
// Contract khớp backend /api/v1/radar-station (backend đang cập nhật song song).

export interface RadarStationAttachment {
  id: string;
  fileName: string;
  fileSize?: number;
  uploadedDate?: string;
  filePath?: string;
}

// Trạng thái phê duyệt 1 cấp (mirror beacon): Nháp → Chờ phê duyệt → Đã phê duyệt / Từ chối
export type RadarStationStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export const RADAR_STATION_STATUS_MAP: Record<RadarStationStatus, { label: string }> = {
  DRAFT: { label: 'Nháp' },
  PENDING_APPROVAL: { label: 'Chờ phê duyệt' },
  APPROVED: { label: 'Đã phê duyệt' },
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
  approvalStatus: string;
  status: RadarStationStatus;
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
  radarRange?: string;
  coverage?: string;
  emissionArea?: number;
  stationType?: string;
  source?: string;
  note?: string;
  longitude?: number;
  latitude?: number;
  geometryType?: 'POINT' | 'LINE' | 'POLYGON';
  coordinates?: string;
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
  status?: RadarStationStatus;
  approvalStatus?: string;
  updatedBy?: string;
  updatedFrom?: string;
  updatedTo?: string;
  page?: number;
  size?: number;
}

export interface HistoryEntry {
  id?: string;
  approvalLevel?: number | string;
  status: string;
  approvedBy?: string;
  approvedDate?: string;
  reason?: string;
}

export interface SearchResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface GenerateCodeResponse {
  code: string;
}

// ── Danh mục hiển thị (tiếng Việt có dấu) ────────────────────────────

export const CONDITION_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '0', label: 'Ngừng hoạt động' },
  { value: '1', label: 'Đang khai thác' },
  { value: '2', label: 'Chưa hoạt động' },
];

export const CONDITION_STATUS_MAP: Record<string, string> = {
  '0': 'Ngừng hoạt động',
  '1': 'Đang khai thác',
  '2': 'Chưa hoạt động',
};

export const APPROVAL_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'PENDING_APPROVAL', label: 'Chờ phê duyệt' },
  { value: 'APPROVED', label: 'Đã phê duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
];

// Danh mục DVT (đơn vị tính) — chưa có endpoint riêng, dùng danh sách tĩnh
// theo danh mục `DVT` trong đặc tả F-056 (đơn vị tính thông dụng cho trạm radar).
export const UNIT_OF_MEASURE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Cái', label: 'Cái' },
  { value: 'Bộ', label: 'Bộ' },
  { value: 'Hệ thống', label: 'Hệ thống' },
  { value: 'Trạm', label: 'Trạm' },
];
