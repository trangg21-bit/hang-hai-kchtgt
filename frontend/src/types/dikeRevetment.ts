// DikeRevetment (Đê/Kè) — F-044..F-049

export type ApprovalStatus = 'PROPOSED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface DikeRevetmentAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
}

export type DikeRevetmentType = 'RIVER_DIKE' | 'SAND_DIKE' | 'FLOW_GUIDE_REVETMENT' | 'BANK_PROTECTION_REVETMENT' | 'TRAFFIC' | 'WAVE_BREAK_REVETMENT' | 'SAND_BREAK_REVETMENT';

export interface DikeRevetmentResponse {
  id: string;
  code?: string;
  dikeRevetmentType: DikeRevetmentType;
  location: string;
  dikeRevetmentName?: string;
  length?: number;
  crestElevation?: number;
  commissioningDate?: string;
  height?: number;
  status?: string;
  note?: string;
  orgUnitId?: string;
  orgUnitName?: string;
  // Sheet QL đê kè — trường bổ sung theo đặc tả (optional, chờ backend tích hợp)
  seaportId?: string;
  seaportName?: string;
  donViVanHanhId?: string;
  donViVanHanhName?: string;
  locationDetail?: string;
  constructionDate?: string;
  lastMaintenanceYear?: string;
  submittedAt?: string;
  submittedByName?: string;
  approvedByNameLevel1?: string;
  approvedByNameLevel2?: string;
  approvalNoteLevel1?: string;
  approvalNoteLevel2?: string;
  operationPlanCode?: string;
  operationPlanName?: string;
  operationStartDate?: string;
  operationEndDate?: string;
  maintenancePlanCode?: string;
  maintenancePlanName?: string;
  maintenanceStartDate?: string;
  maintenanceEndDate?: string;
  incidentCode?: string;
  incidentType?: string;
  incidentLocation?: string;
  incidentTime?: string;
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
  deletedAt?: string;
  deletedBy?: string;
  attachments?: DikeRevetmentAttachment[];
  approvalHistory?: ApprovalResponse[];
  history?: HistoryEntry[];
  khongGianId?: string;
  geometryType?: 'POINT' | 'LINE' | 'POLYGON';
  coordinates?: string;
  symbolId?: string;
}

export interface CreateDikeRevetmentRequest {
  dikeRevetmentType: DikeRevetmentType;
  location: string;
  dikeRevetmentName: string;
  seaportId?: string;
  donViVanHanhName?: string;
  locationDetail?: string;
  constructionDate?: string;
  lastMaintenanceYear?: string;
  length?: number;
  crestElevation?: number;
  commissioningDate?: string;
  height?: number;
  status?: string;
  note?: string;
  orgUnitId?: string;
  geometryType?: 'POINT' | 'LINE' | 'POLYGON';
  coordinates?: string;
  symbolId?: string;
}

export interface UpdateDikeRevetmentRequest extends CreateDikeRevetmentRequest {
  id: string;
}

export interface ApprovalRequest {
  approvalLevel?: number;
  approver: string;
  decision: string;
  reason?: string;
}

export interface ApprovalResponse {
  id: string;
  approvalLevel?: number;
  status: string;
  approver: string;
  approvalDate: string;
  reason?: string;
}

export interface HistoryEntry {
  id: number;
  approvalLevel?: number;
  status: string;
  approver: string;
  approvalDate: string;
  reason?: string;
}

export interface ListParams {
  page?: number;
  size?: number;
  orgUnitId?: string;
  code?: string;
  keyword?: string;
  seaportId?: string;
  location?: string;
  dikeRevetmentType?: DikeRevetmentType;
  status?: string;
  approvalStatus?: ApprovalStatus;
  commissioningYear?: string;
  updatedFrom?: string;
  updatedTo?: string;
}

export interface SearchResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
