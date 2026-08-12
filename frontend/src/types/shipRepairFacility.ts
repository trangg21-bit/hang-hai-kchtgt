// ShipRepairFacility (Cơ sở Sửa chữa / Đóng tàu) — F-050..F-055

export interface ShipRepairFacilityAttachment {
  id: string;
  fileName: string;
  filePath: string;
}

export interface ShipRepairFacilityResponse {
  id: string;
  facilityName: string;
  address: string;
  province: string;
  phone?: string;
  email?: string;
  facilityType: string;
  capacity?: string;
  authority?: string;
  orgUnitId?: string;
  orgUnitName?: string;
  approvalStatus: string; // status as plain String, not enum
  approvedC1?: boolean;
  approverLevel1?: string;
  approvedDateLevel1?: string;
  approvedC2?: boolean;
  approverLevel2?: string;
  approvedDateLevel2?: string;
  rejectionReason?: string;
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedDate?: string;
  isDeleted?: boolean;
  attachments?: ShipRepairFacilityAttachment[];
  history?: HistoryEntry[];
  spatialId?: string;
  loaiHinhHoc?: 'POINT' | 'LINE' | 'POLYGON';
  toaDo?: string;
  bieuTuongId?: string;
}

export interface CreateShipRepairFacilityRequest {
  facilityName: string;
  address: string;
  province: string;
  phone?: string;
  email?: string;
  facilityType: string;
  capacity?: string;
  authority?: string;
  orgUnitId?: string;
  loaiHinhHoc?: 'POINT' | 'LINE' | 'POLYGON';
  toaDo?: string;
  bieuTuongId?: string;
}

export interface UpdateShipRepairFacilityRequest extends CreateShipRepairFacilityRequest {}

export interface ApprovalRequest {
  decision: string;
  reason?: string;
}

export interface HistoryEntry {
  id: number;
  approvalLevel?: number;
  approvalStatus: string;
  approvedBy: string;
  approvedDate: string;
  reason?: string;
}

export interface ListParams {
  page?: number;
  size?: number;
  orgUnitId?: string;
  keyword?: string;
  province?: string;
  approvalStatus?: string;
}

export interface SearchResponse<T> {
  items: T[];
  total: number;
  page?: number;
  size?: number;
}
