export enum ConditionStatus {
  GOOD = 'GOOD',
  DEGRADED = 'DEGRADED',
  DAMAGED = 'DAMAGED',
}

export enum ApprovalStatus {
  PROPOSED = 'PROPOSED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface VtsSystemAttachment {
  id: string;
  fileName: string;
  filePath: string;
}

export interface VtsSystemResponse {
  id: string;
  systemName?: string;
  location: string;
  conditionStatus?: ConditionStatus;
  responsibilityLevel?: string;
  source?: string;
  partner?: string; // partner field unique to VTS
  orgUnitId?: string;
  orgUnitName?: string;
  scope?: string;
  approvalStatus: ApprovalStatus; // status as plain String
  approvedLevel1?: boolean;
  approverLevel1?: string;
  approvedDateLevel1?: string;
  approvedLevel2?: boolean;
  approverLevel2?: string;
  approvedDateLevel2?: string;
  rejectionReason?: string;
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedDate?: string;
  attachments?: VtsSystemAttachment[];
  history?: HistoryEntry[];
  spatialId?: string;
  geometryType?: 'POINT' | 'LINE' | 'POLYGON';
  coordinates?: string;
}

export interface CreateVtsSystemRequest {
  systemName?: string;
  location: string;
  conditionStatus?: ConditionStatus;
  responsibilityLevel?: string;
  source?: string;
  partner?: string;
  orgUnitId?: string;
  scope?: string;
  geometryType?: 'POINT' | 'LINE' | 'POLYGON';
  coordinates?: string;
}

export interface UpdateVtsSystemRequest extends CreateVtsSystemRequest {}

export interface ApprovalRequest {
  quyetDinh: string;
  reason?: string;
}

export interface HistoryEntry {
  id: string;
  approvalLevel?: number | string;
  status: string;
  approvedBy: string;
  approvedDate: string;
  reason?: string;
  changedField?: string;
  previousValue?: string;
  newValue?: string;
}

export interface ListParams {
  page?: number;
  size?: number;
  orgUnitId?: string;
  keyword?: string;
  conditionStatus?: ConditionStatus;
  approvalStatus?: ApprovalStatus;
  year?: number;
}

export interface SearchResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

// Vietnamese display labels (keep Vietnamese labels)
export const CONDITION_STATUS_OPTIONS = [
  { value: ConditionStatus.GOOD, label: 'Tốt' },
  { value: ConditionStatus.DEGRADED, label: 'Xuống cấp' },
  { value: ConditionStatus.DAMAGED, label: 'Hư hỏng' },
];

export const CONDITION_STATUS_MAP: Record<ConditionStatus, string> = {
  [ConditionStatus.GOOD]: 'Tốt',
  [ConditionStatus.DEGRADED]: 'Xuống cấp',
  [ConditionStatus.DAMAGED]: 'Hư hỏng',
};
