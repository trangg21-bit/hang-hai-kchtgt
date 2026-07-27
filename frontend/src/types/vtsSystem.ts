export interface VtsSystemAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
}

export interface VtsSystemResponse {
  id: string;
  systemName?: string;
  location: string;
  conditionStatus?: string;
  responsibilityLevel?: string;
  source?: string;
  partner?: string; // partner field unique to VTS
  orgUnitId?: string;
  scope?: string;
  approvalStatus: string; // status as plain String
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
  khongGianId?: string;
  loaiHinhHoc?: 'POINT' | 'LINE' | 'POLYGON';
  toaDo?: string;
}

export interface CreateVtsSystemRequest {
  systemName?: string;
  location: string;
  conditionStatus?: string;
  responsibilityLevel?: string;
  source?: string;
  partner?: string;
  orgUnitId?: string;
  scope?: string;
  loaiHinhHoc?: 'POINT' | 'LINE' | 'POLYGON';
  toaDo?: string;
}

export interface UpdateVtsSystemRequest extends CreateVtsSystemRequest {}

export interface ApprovalRequest {
  quyetDinh: string;
  reason?: string;
}

export interface HistoryEntry {
  id: number;
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
  conditionStatus?: string;
  approvalStatus?: string;
}

export interface SearchResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

// Vietnamese display labels (keep Vietnamese labels)
export const CONDITION_STATUS_OPTIONS = [
  { value: 'TOT', label: 'Tốt' },
  { value: 'XUONG_CAP', label: 'Xuống cấp' },
  { value: 'HU_HONG', label: 'Hư hỏng' },
];

export const CONDITION_STATUS_MAP: Record<string, string> = {
  'TOT': 'Tốt',
  'XUONG_CAP': 'Xuống cấp',
  'HU_HONG': 'Hư hỏng',
};
