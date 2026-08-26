// DikeRevetment (Đê/Kè) — F-044..F-049
// Contract khớp backend /api/v1/dike-revetment theo chuẩn M-1006.

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

export const DIKE_REVETMENT_STATUS_MAP: Record<string, { label: string }> = {
  DRAFT: { label: 'Lưu tạm' },
  PENDING_APPROVAL: { label: 'Chờ Cảng vụ duyệt' },
  APPROVED_LEVEL1: { label: 'Chờ Cục duyệt' },
  REJECTED_LEVEL1: { label: 'Cảng vụ trả về' },
  REJECTED_LEVEL2: { label: 'Cục trả về' },
  APPROVED: { label: 'Đã duyệt' },
  PROPOSED: { label: 'Lưu tạm' },
  APPROVED_LEVEL2: { label: 'Đã duyệt' },
  REJECTED: { label: 'Bị trả về' },
};

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

export interface DikeRevetmentAttachment {
  id: string;
  fileName: string;
  fileUrl?: string;
  fileSize?: number;
  uploadedDate?: string;
}

export type DikeRevetmentType =
  | 'RIVER_DIKE'
  | 'SAND_DIKE'
  | 'FLOW_GUIDE_REVETMENT'
  | 'BANK_PROTECTION_REVETMENT'
  | 'TRAFFIC'
  | 'WAVE_BREAK_REVETMENT'
  | 'SAND_BREAK_REVETMENT'
  | string;

export interface DikeRevetmentOptionResponse {
  id: string;
  code: string;
  dikeRevetmentName: string;
  orgUnitId?: string;
  seaportId?: string;
}

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
  surfaceMaterial?: string;
  status?: string;
  conditionStatus?: string;
  note?: string;
  orgUnitId?: string;
  orgUnitName?: string;
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
  deletedAt?: string;
  deletedBy?: string;
  attachments?: DikeRevetmentAttachment[];
  approvalHistory?: any[];
  history?: HistoryEntry[];
  spatialId?: string;
  geometryType?: 'POINT' | 'LINE' | 'POLYGON';
  coordinates?: string;
  symbolId?: string;
}

export interface CreateDikeRevetmentRequest {
  dikeRevetmentType: DikeRevetmentType;
  location: string;
  dikeRevetmentName: string;
  code?: string;
  seaportId?: string;
  donViVanHanhName?: string;
  locationDetail?: string;
  constructionDate?: string;
  lastMaintenanceYear?: string;
  length?: number;
  crestElevation?: number;
  commissioningDate?: string;
  height?: number;
  surfaceMaterial?: string;
  status?: string;
  note?: string;
  orgUnitId?: string;
  geometryType?: 'POINT' | 'LINE' | 'POLYGON';
  coordinates?: string;
  symbolId?: string;
}

export interface UpdateDikeRevetmentRequest extends CreateDikeRevetmentRequest {
  id?: string;
}

export interface HistoryEntry {
  id: string;
  approvalLevel?: string;
  status?: string;
  approvedBy?: string;
  approvedDate?: string;
  reason?: string;
}

export const DIKE_REVETMENT_TYPE_LABELS: Record<DikeRevetmentType, string> = {
  RIVER_DIKE: 'Đê sông',
  SAND_DIKE: 'Đê cát',
  FLOW_GUIDE_REVETMENT: 'Kè hướng dòng',
  BANK_PROTECTION_REVETMENT: 'Kè bảo vệ bờ',
  TRAFFIC: 'Đê giao thông',
  WAVE_BREAK_REVETMENT: 'Kè chắn sóng',
  SAND_BREAK_REVETMENT: 'Kè chắn cát',
};
