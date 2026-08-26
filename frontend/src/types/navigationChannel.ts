// NavigationChannel (Luồng hàng hải) — F-038..F-043
// Chuẩn hóa theo kiến trúc phê duyệt 2 cấp M-1006.

export type ApprovalStatus =
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

export const NAVIGATION_CHANNEL_STATUS_MAP: Record<string, { label: string }> = {
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

export const CONDITION_STATUS_MAP: Record<number | string, { label: string }> = {
  '1': { label: 'Đang khai thác' },
  '0': { label: 'Ngừng hoạt động' },
  '2': { label: 'Chưa hoạt động' },
};

export const CONDITION_STATUS_OPTIONS = [
  { value: 1, label: 'Đang khai thác' },
  { value: 0, label: 'Ngừng hoạt động' },
  { value: 2, label: 'Chưa hoạt động' },
];

export interface NavigationChannelAttachment {
  id: string;
  fileName: string;
  filePath?: string;
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
  uploadedDate?: string;
}

export interface NavigationChannelOptionResponse {
  id: string;
  channelCode: string;
  channelName: string;
  orgUnitId?: string;
  seaportId?: string;
}

export interface NavigationChannelResponse {
  id: string;
  channelName: string;
  channelCode?: string;
  stationAmountt?: number;
  latestStationRepairDate?: string;
  seaportId?: string;
  seaportName?: string;
  operatingUnitId?: string;
  operatingUnitName?: string;
  location?: string;
  detailedLocation?: string;
  channelManagementStation?: string;
  stationStaffAmount?: number;
  latestMaintenanceYear?: number;
  dredgingVolume?: number;
  buoyAmount?: number;
  beaconAmount?: number;
  status?: number;
  clearanceHeight?: string;
  stationArea?: number;
  note?: string;
  orgUnitId?: string;
  orgUnitName?: string;
  approvalStatus: ApprovalStatus;
  isApprovedLevel1?: boolean;
  approverLevel1?: string;
  approvedDateLevel1?: string;
  isApprovedLevel2?: boolean;
  approverLevel2?: string;
  approvedDateLevel2?: string;
  rejectionReason?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  updatedByName?: string;
  attachments?: NavigationChannelAttachment[];
  approvalHistory?: ApprovalResponse[];
  history?: HistoryEntry[];
  spatialId?: string;
  geometryType?: 'POINT' | 'LINE' | 'POLYGON';
  coordinates?: string;
  symbolId?: string;
  coordinateSystem?: string;
  displayRule?: string;
  registeredArea?: string;
  operatingHours?: string;
  recordedDate?: string;
  quantity?: number;
  loadCapacity?: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface CreateNavigationChannelRequest {
  channelName: string;
  channelCode?: string;
  stationAmountt?: number;
  latestStationRepairDate?: string;
  seaportId?: string;
  operatingUnitId?: string;
  location?: string;
  detailedLocation?: string;
  channelManagementStation?: string;
  stationStaffAmount?: number;
  latestMaintenanceYear?: number;
  dredgingVolume?: number;
  buoyAmount?: number;
  beaconAmount?: number;
  status?: number;
  clearanceHeight?: string;
  stationArea?: number;
  note?: string;
  orgUnitId?: string;
  geometryType?: 'POINT' | 'LINE' | 'POLYGON';
  coordinates?: string;
  symbolId?: string;
  coordinateSystem?: string;
  displayRule?: string;
  registeredArea?: string;
  operatingHours?: string;
  recordedDate?: string;
  quantity?: number;
  loadCapacity?: string;
}

export interface UpdateNavigationChannelRequest extends CreateNavigationChannelRequest {
  id?: string;
}

export interface ApprovalRequest {
  decision: 'APPROVED' | 'REJECTED';
  reason?: string;
  note?: string;
}

export interface ApprovalResponse {
  id: string;
  navigationChannelId: string;
  approvalLevel: string;
  status: string;
  approver: string;
  approvalDate: string;
  reason?: string;
}

export interface HistoryEntry {
  id: string;
  navigationChannelId?: string;
  approvalLevel?: string;
  status?: string;
  approvedBy?: string;
  approvedDate?: string;
  reason?: string;
}

export interface ListParams {
  keyword?: string;
  orgUnitId?: string;
  seaportId?: string;
  status?: number;
  approvalStatus?: string;
  updatedBy?: string;
  updatedFrom?: string;
  updatedTo?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface SearchResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
