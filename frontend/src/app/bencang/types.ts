// ============================================================
// BenCang — TypeScript types (BE ground truth)
// ============================================================

export interface BenCangEntity {
  id: string;
  maBen: string;
  tenBen: string;
  cangBienId: string;
  tuyenDuongThuy?: string;
  viDo?: number;
  kinhDo?: number;
  chieuDai?: number;
  chieuRong?: number;
  loaiBen?: string;
  doSauLuong?: number;
  trangThaiHoatDong?: string;
  trangThaiPheDuyet: string;
  orgUnitId?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Approval statuses — values returned by the BE (ASCII, no diacritics)
export type ApprovalStatus = "CHO_PHE_DUYET" | "DUOC_PHE_DUYET" | "TU_CHOI";

// Activity statuses — free text, canonical display values
export type ActivityStatus = "HIỆN_HÀNH" | "TẠM_NGƯNG";

// API wrapper shapes
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// History record from GET /{id}/history
export interface ChangeHistoryRecord {
  fieldName: string;
  oldValue?: string;
  newValue?: string;
  changedBy?: string;
  changedAt?: string;
}

export interface ApprovalHistoryRecord {
  decision: string;
  reason?: string;
  decidedBy?: string;
  decidedAt?: string;
}

export interface HistoryResponse {
  entity: BenCangEntity;
  changeHistory: ChangeHistoryRecord[];
  approvalHistory: ApprovalHistoryRecord[];
}

// Sort options for list page
export type SortField = "maBen" | "tenBen" | "createdAt" | "updatedAt";
export type SortOrder = "asc" | "desc";

// List filter query params
export interface BenCangListFilters {
  search?: string;
  status?: ActivityStatus;
  approvalStatus?: ApprovalStatus;
  cangBienId?: string;
  orgUnitId?: string;
  sortBy: SortField;
  sortOrder: SortOrder;
  page: number;
  pageSize: number;
}
