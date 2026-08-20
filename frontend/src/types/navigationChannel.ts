// NavigationChannel (Luồng hàng hải) — F-038..F-043

export type ApprovalStatus = 'PROPOSED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface NavigationChannelAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
}

export interface NavigationChannelResponse {
  id: string;
  channelName: string;
  channelCode?: string;
  stationAmountt?: number;
  latestStationRepairDate?: string; // date
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
  attachments?: NavigationChannelAttachment[];
  approvalHistory?: ApprovalResponse[];
  history?: HistoryEntry[];
  spatialId?: string;
  loaiHinhHoc?: 'POINT' | 'LINE' | 'POLYGON';
  toaDo?: string;
  bieuTuongId?: string;

  // New fields
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
  loaiHinhHoc?: 'POINT' | 'LINE' | 'POLYGON';
  toaDo?: string;
  bieuTuongId?: string;
}

export interface UpdateNavigationChannelRequest extends CreateNavigationChannelRequest {
  id: string;
}

export interface ApprovalRequest {
  approvalLevel?: number;
  status: string; // 'APPROVED' | 'REJECTED'
  reason?: string;
}

export interface ApprovalResponse {
  id: string;
  navigationChannelId?: string;
  approvalLevel?: number;
  status: string;
  approvedBy: string;
  approvedDate: string;
  reason?: string;
}

export interface HistoryEntry {
  id: number;
  navigationChannelId?: string;
  approvalLevel?: number;
  status: string;
  approvedBy: string;
  approvedDate: string;
  reason?: string;
}

export interface ListParams {
  page?: number;
  size?: number;
  orgUnitId?: string;
  keyword?: string;
  channelCode?: string;
  approvalStatus?: ApprovalStatus;
}

export interface SearchResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
