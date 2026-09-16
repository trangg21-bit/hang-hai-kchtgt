export const ConditionStatus = {
  NOT_YET_OPERATIONAL: 'NOT_YET_OPERATIONAL',
  OPERATIONAL: 'OPERATIONAL',
  SUSPENDED: 'SUSPENDED',
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
  filePath?: string;
  fileSize?: number;
  uploadedByName?: string;
  uploadedDate?: string;
  file?: File;
  originFileObj?: File;
  [key: string]: unknown;
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
  geometryType?: 'POINT' | 'LINE' | 'POLYGON' | string;
  coordinates?: string;
  spatialId?: string;
  symbolId?: string;
  symbolName?: string;
  symbolCode?: string;
  symbolImage?: string;
}

export interface CreateVtsSystemRequest {
  code: string;
  systemName: string;
  orgUnitId: string;
  owningOrgId?: string;
  operatingOrgId?: string;
  portId?: string | null;
  province?: string;
  provinceId: number;
  address?: string;
  scope?: string;
  maritimeNotice?: string;
  operationStartDate?: string | null;
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
  decision: 'APPROVED' | 'REJECTED' | string;
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
  changedField?: string;
  oldValue?: string;
  newValue?: string;
  status?: string;
}

export interface ListParams {
  page?: number;
  size?: number;
  keyword?: string;
  systemName?: string;
  code?: string;
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

// Vietnamese display labels (Chuẩn 3 trạng thái KCHT: Chưa khai thác/vận hành, Đang khai thác/vận hành, Dừng khai thác/vận hành)
export const CONDITION_STATUS_OPTIONS = [
  { value: ConditionStatus.NOT_YET_OPERATIONAL, label: 'Chưa khai thác/vận hành' },
  { value: ConditionStatus.OPERATIONAL, label: 'Đang khai thác/vận hành' },
  { value: ConditionStatus.SUSPENDED, label: 'Dừng khai thác/vận hành' },
];

export const normalizeConditionStatus = (status?: unknown): ConditionStatus => {
  if (status == null || status === '' || status === '—') return ConditionStatus.OPERATIONAL;
  const s = String(status).toUpperCase();
  if (
    s === 'STOPPED' ||
    s === 'SUSPENDED' ||
    s === 'DUNG_KHAI_THAC' ||
    s === 'DUNG_HOAT_DONG' ||
    s === 'TAM_DUNG' ||
    s === '2' ||
    s === '5'
  ) {
    return ConditionStatus.SUSPENDED;
  }
  if (
    s === 'UNDER_CONSTRUCTION' ||
    s === 'NOT_YET_OPERATIONAL' ||
    s === 'CHUA_KHAI_THAC' ||
    s === 'CHUA_HOAT_DONG' ||
    s === '0' ||
    s === '3' ||
    s === '4'
  ) {
    return ConditionStatus.NOT_YET_OPERATIONAL;
  }
  return ConditionStatus.OPERATIONAL;
};

export const CONDITION_STATUS_MAP: Record<string, string> = {
  NOT_YET_OPERATIONAL: 'Chưa khai thác/vận hành',
  CHUA_KHAI_THAC: 'Chưa khai thác/vận hành',
  UNDER_CONSTRUCTION: 'Chưa khai thác/vận hành',
  OPERATIONAL: 'Đang khai thác/vận hành',
  DANG_KHAI_THAC: 'Đang khai thác/vận hành',
  DANG_HOAT_DONG: 'Đang khai thác/vận hành',
  SUSPENDED: 'Dừng khai thác/vận hành',
  STOPPED: 'Dừng khai thác/vận hành',
  DUNG_KHAI_THAC: 'Dừng khai thác/vận hành',
  NOT_OPERATIONAL: 'Dừng khai thác/vận hành',
  MAINTENANCE: 'Đang bảo trì',
};

export const CONDITION_STATUS_TAG_MAP: Record<string, { label: string; color: string }> = {
  NOT_YET_OPERATIONAL: { label: 'Chưa khai thác/vận hành', color: 'warning' },
  CHUA_KHAI_THAC: { label: 'Chưa khai thác/vận hành', color: 'warning' },
  OPERATIONAL: { label: 'Đang khai thác/vận hành', color: 'success' },
  DANG_KHAI_THAC: { label: 'Đang khai thác/vận hành', color: 'success' },
  SUSPENDED: { label: 'Dừng khai thác/vận hành', color: 'error' },
  STOPPED: { label: 'Dừng khai thác/vận hành', color: 'error' },
  DUNG_KHAI_THAC: { label: 'Dừng khai thác/vận hành', color: 'error' },
  MAINTENANCE: { label: 'Đang bảo trì', color: 'warning' },
  UNDER_CONSTRUCTION: { label: 'Chưa khai thác/vận hành', color: 'warning' },
};

export const APPROVAL_STATUS_TAG_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Lưu tạm', color: 'default' },
  PENDING_APPROVAL: { label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: 'processing' },
  APPROVED_LEVEL1: { label: 'Chờ phê duyệt cấp Cục', color: 'cyan' },
  APPROVED: { label: 'Đã phê duyệt', color: 'success' },
  ARCHIVED: { label: 'Lưu trữ', color: 'default' },
  REJECTED_LEVEL1: { label: 'Từ chối cấp Cảng vụ/Chi cục', color: 'error' },
  REJECTED_LEVEL2: { label: 'Từ chối cấp Cục', color: 'error' },
};
