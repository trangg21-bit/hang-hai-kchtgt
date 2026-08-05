// DikeRevetment (Đê/Kè) — F-044..F-049

export type ApprovalStatus = 'PROPOSED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface DikeRevetmentAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
}

export type DikeRevetmentType = 'RIVER_DIKE' | 'SAND_DIKE' | 'FLOW_GUIDE_REVETMENT' | 'BANK_PROTECTION_REVETMENT' | 'TRAFFIC' | 'WAVE_BREAK_REVETMENT' | 'SAND_BREAK_REVETMENT';

export interface DikeRevetmentResponse {
  id: string;
  dikeRevetmentType: DikeRevetmentType;
  location: string;
  dikeRevetmentName?: string;
  length?: number;
  crestElevation?: number;
  commissioningDate?: string;
  height?: number;
  surfaceMaterial?: string;
  status?: string;
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
  deletedAt?: string;
  deletedBy?: string;
  attachments?: DikeRevetmentAttachment[];
  approvalHistory?: ApprovalResponse[];
  history?: HistoryEntry[];
  khongGianId?: string;
  loaiHinhHoc?: 'POINT' | 'LINE' | 'POLYGON';
  toaDo?: string;
  bieuTuongId?: string;
}

export interface CreateDikeRevetmentRequest {
  dikeRevetmentType: DikeRevetmentType;
  location: string;
  dikeRevetmentName: string;
  length?: number;
  crestElevation?: number;
  commissioningDate?: string;
  height?: number;
  surfaceMaterial?: string;
  status?: string;
  note?: string;
  orgUnitId?: string;
  loaiHinhHoc?: 'POINT' | 'LINE' | 'POLYGON';
  toaDo?: string;
  bieuTuongId?: string;
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
  keyword?: string;
  dikeRevetmentType?: DikeRevetmentType;
  status?: string;
  approvalStatus?: ApprovalStatus;
}

export interface SearchResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
