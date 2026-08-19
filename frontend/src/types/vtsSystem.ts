export const ConditionStatus = {
  OPERATIONAL: 'OPERATIONAL',
  STOPPED: 'STOPPED',
  MAINTENANCE: 'MAINTENANCE',
  UNDER_CONSTRUCTION: 'UNDER_CONSTRUCTION',
} as const;

export type ConditionStatus = typeof ConditionStatus[keyof typeof ConditionStatus];

export const RecordSecurityLevel = {
  NORMAL: 'NORMAL',
  RESTRICTED: 'RESTRICTED',
  CONFIDENTIAL: 'CONFIDENTIAL',
} as const;

export type RecordSecurityLevel = typeof RecordSecurityLevel[keyof typeof RecordSecurityLevel];

export const RECORD_SECURITY_LEVEL_OPTIONS = [
  { value: RecordSecurityLevel.NORMAL, label: 'Thông thường' },
  { value: RecordSecurityLevel.RESTRICTED, label: 'Hạn chế' },
  { value: RecordSecurityLevel.CONFIDENTIAL, label: 'Mật' },
];

export const ApprovalStatus = {
  DRAFT: 'DRAFT',
  PROPOSED: 'PROPOSED',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED_LEVEL1: 'APPROVED_LEVEL1',
  APPROVED_LEVEL2: 'APPROVED_LEVEL2',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
} as const;

export type ApprovalStatus = typeof ApprovalStatus[keyof typeof ApprovalStatus];

export interface VtsSystemAttachment {
  id: string;
  fileName: string;
  filePath: string;
}

export interface VtsSystemResponse {
  id: string;
  zones?: VtsZoneDto[];
  systemName?: string;
  conditionStatus?: ConditionStatus;
  recordSecurityLevel?: RecordSecurityLevel;
  code?: string;
  province?: string;
  provinceId?: number;
  address?: string;
  maritimeNotice?: string;
  operationStartDate?: string; // ISO date string
  responsibilityLevel?: string;
  source?: string;
  partner?: string; // partner field unique to VTS
  orgUnitId?: string;
  orgUnitName?: string;
  owningOrgName?: string;
  operatingOrgName?: string;
  portName?: string;
  owningOrgId?: string;
  operatingOrgId?: string;
  portId?: string;
  scope?: string;
  note?: string;
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
  updatedByName?: string;
  updatedDate?: string;
  attachments?: VtsSystemAttachment[];
  history?: HistoryEntry[];
  spatialId?: string;
  geometryType?: 'POINT' | 'LINE' | 'POLYGON';
  coordinates?: string;
}

export interface VtsSystemListItem {
  id: string;
  code?: string;
  systemName: string;
  address?: string;
  conditionStatus?: ConditionStatus;
  recordSecurityLevel?: RecordSecurityLevel;
  responsibilityLevel?: string;
  partner?: string;
  orgUnitId?: string;
  orgUnitName?: string;
  approvalStatus: ApprovalStatus;
  approverLevel1?: string;
  updatedDate?: string;
}

export interface VtsZoneDto {
  id?: string;
  code: string;
  name: string;
  conditionStatus?: ConditionStatus;
}

export interface CreateVtsSystemRequest {
  zones?: VtsZoneDto[];
  systemName?: string;
  conditionStatus?: ConditionStatus;
  recordSecurityLevel?: RecordSecurityLevel;
  responsibilityLevel?: string;
  source?: string;
  partner?: string;
  orgUnitId?: string;
  owningOrgId?: string;
  operatingOrgId?: string;
  portId?: string;
  scope?: string;
  note?: string;
  code?: string;
  province?: string;
  provinceId?: number;
  address?: string;
  maritimeNotice?: string;
  operationStartDate?: string;
  geometryType?: 'POINT' | 'LINE' | 'POLYGON';
  coordinates?: string;
}

export interface UpdateVtsSystemRequest extends CreateVtsSystemRequest {}

export interface ApprovalRequest {
  decision: string;
  reason?: string;
}

export interface HistoryEntry {
  id: string;
  approvalLevel?: number | string;
  status: string;
  approvedBy: string;
  orgUnitName?: string;
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
  { value: ConditionStatus.OPERATIONAL, label: 'Đang hoạt động' },
  { value: ConditionStatus.STOPPED, label: 'Dừng hoạt động' },
  { value: ConditionStatus.MAINTENANCE, label: 'Đang bảo trì' },
  { value: ConditionStatus.UNDER_CONSTRUCTION, label: 'Đang xây dựng' },
];

export const CONDITION_STATUS_MAP: Record<ConditionStatus, string> = {
  [ConditionStatus.OPERATIONAL]: 'Đang hoạt động',
  [ConditionStatus.STOPPED]: 'Dừng hoạt động',
  [ConditionStatus.MAINTENANCE]: 'Đang bảo trì',
  [ConditionStatus.UNDER_CONSTRUCTION]: 'Đang xây dựng',
};
