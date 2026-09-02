export const ConditionStatus = {
  OPERATIONAL: 'OPERATIONAL',
  STOPPED: 'STOPPED',
  MAINTENANCE: 'MAINTENANCE',
  UNDER_CONSTRUCTION: 'UNDER_CONSTRUCTION',
} as const;

export type ConditionStatus = typeof ConditionStatus[keyof typeof ConditionStatus];

export const ApprovalStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED_LEVEL1: 'APPROVED_LEVEL1',
  APPROVED: 'APPROVED',
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
  rejectionReason?: string;
  createdBy?: string;
  createdByName?: string;
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
  code: string;
  systemName: string;
  orgUnitId: string;
  owningOrgId?: string;
  operatingOrgId?: string;
  portId?: string;
  province?: string;
  provinceId: number;
  address?: string;
  scope?: string;
  maritimeNotice?: string;
  operationStartDate?: string;
  conditionStatus: ConditionStatus;
  approvalStatus?: ApprovalStatus;
  note?: string;
  zones?: VtsZoneDto[];
  geometryType?: 'POINT' | 'LINE' | 'POLYGON' | string;
  coordinates?: string;
  addedAttachmentNames?: string[];
  removedAttachmentNames?: string[];
}

export interface UpdateVtsSystemRequest extends CreateVtsSystemRequest {}

export interface ApprovalRequest {
  decision: 'APPROVED' | 'REJECTED';
  reason?: string;
}

export interface HistoryEntry {
  id: string;
  refId: string;
  refType: string;
  action: string;
  actor: string;
  actorName?: string;
  timestamp: string;
  reason?: string;
  changedField?: string;
  oldValue?: string;
  newValue?: string;
  status?: string;
  approvalLevel?: string;
}

export interface ListParams {
  page?: number;
  size?: number;
  keyword?: string;
  conditionStatus?: ConditionStatus;
  approvalStatus?: ApprovalStatus;
  orgUnitId?: string;
  portId?: string;
  provinceId?: number;
  year?: number;
  operationStartDateFrom?: string;
  operationStartDateTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
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
  PENDING_APPROVAL: 'Chờ Cảng vụ duyệt',
  APPROVED_LEVEL1: 'Chờ Cục duyệt',
  APPROVED: 'Đã duyệt',
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
  PENDING_APPROVAL: { label: 'Chờ Cảng vụ duyệt', color: 'processing' },
  APPROVED_LEVEL1: { label: 'Chờ Cục duyệt', color: 'cyan' },
  APPROVED: { label: 'Đã duyệt', color: 'success' },
  ARCHIVED: { label: 'Lưu trữ', color: 'default' },
  REJECTED_LEVEL1: { label: 'Cảng vụ trả về', color: 'error' },
  REJECTED_LEVEL2: { label: 'Cục trả về', color: 'error' },
};
