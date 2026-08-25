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
  ARCHIVED: 'ARCHIVED',
  REJECTED_LEVEL1: 'REJECTED_LEVEL1',
  REJECTED_LEVEL2: 'REJECTED_LEVEL2',
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
  approverLevel1?: string;
  approverLevel1Name?: string;
  approvedDateLevel1?: string;
  approvalContentLevel1?: string;
  approverLevel2?: string;
  approverLevel2Name?: string;
  approvedDateLevel2?: string;
  approvalContentLevel2?: string;
  rejectionReason?: string;
  createdBy?: string;
  createdByName?: string;
  createdDate?: string;
  submittedByName?: string;
  submittedDate?: string;
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
  orgUnitId?: string;
  orgUnitName?: string;
  owningOrgId?: string;
  owningOrgName?: string;
  operatingOrgId?: string;
  operatingOrgName?: string;
  portId?: string;
  portName?: string;
  provinceId?: number;
  operationStartDate?: string;
  approvalStatus: ApprovalStatus;
  approverLevel1?: string;
  updatedDate?: string;
  updatedByName?: string;
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
  id?: string | number;
  approvalLevel?: number | string;
  status?: string;
  approvedBy?: string;
  approver?: string;
  approverName?: string;
  orgUnitName?: string;
  approvedDate?: string;
  approvalDate?: string;
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

export const CONDITION_STATUS_MAP: Record<string, string> = {
  OPERATIONAL: 'Đang hoạt động',
  STOPPED: 'Dừng hoạt động',
  MAINTENANCE: 'Đang bảo trì',
  UNDER_CONSTRUCTION: 'Đang xây dựng',
};

export const APPROVAL_STATUS_MAP: Record<string, string> = {
  DRAFT: 'Lưu tạm',
  PROPOSED: 'Chờ Cảng vụ duyệt',
  PENDING_APPROVAL: 'Chờ Cảng vụ duyệt',
  APPROVED_LEVEL1: 'Chờ Cục duyệt',
  APPROVED_LEVEL2: 'Đã duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  ARCHIVED: 'Lưu trữ',
  REJECTED_LEVEL1: 'Cảng vụ trả về',
  REJECTED_LEVEL2: 'Cục trả về',
};

export const CONDITION_STATUS_TAG_MAP: Record<string, { label: string; color: string }> = {
  OPERATIONAL: { label: 'Đang hoạt động', color: 'success' },
  STOPPED: { label: 'Dừng hoạt động', color: 'default' },
  MAINTENANCE: { label: 'Đang bảo trì', color: 'warning' },
  UNDER_CONSTRUCTION: { label: 'Đang xây dựng', color: 'processing' },
};

export const APPROVAL_STATUS_TAG_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Lưu tạm', color: 'default' },
  PROPOSED: { label: 'Chờ Cảng vụ duyệt', color: 'processing' },
  PENDING_APPROVAL: { label: 'Chờ Cảng vụ duyệt', color: 'processing' },
  APPROVED_LEVEL1: { label: 'Chờ Cục duyệt', color: 'cyan' },
  APPROVED_LEVEL2: { label: 'Đã duyệt', color: 'success' },
  APPROVED: { label: 'Đã duyệt', color: 'success' },
  REJECTED: { label: 'Từ chối', color: 'error' },
  ARCHIVED: { label: 'Lưu trữ', color: 'default' },
  REJECTED_LEVEL1: { label: 'Cảng vụ trả về', color: 'error' },
  REJECTED_LEVEL2: { label: 'Cục trả về', color: 'error' },
};

