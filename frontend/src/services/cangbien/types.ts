// ── CangBien Response (matches CangBienResponse.java exactly) ─
// BigDecimal fields are serialized as JSON number by Spring.

export interface CangBienResponse {
  id: string;
  maCang: string;
  tenCang: string;
  tinhThanhPho: string | null;
  viDo: number | null;
  kinhDo: number | null;
  dienTich: number | null;
  khaNangTiepNhan: number | null;
  trangThaiHoatDong: string | null;
  trangThaiPheDuyet: string | null;
  orgUnitId: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// ── CreateCangBienRequest (matches CreateCangBienRequest.java) ─

export interface CreateCangBienRequest {
  maCang: string;
  tenCang: string;
  tinhThanhPho?: string | null;
  viDo?: number | null;
  kinhDo?: number | null;
  dienTich: number;
  khaNangTiepNhan?: number | null;
  trangThaiHoatDong?: string | null;
  trangThaiPheDuyet?: string | null;
}

// ── UpdateCangBienRequest (matches UpdateCangBienRequest.java) ─

export interface UpdateCangBienRequest {
  id: string;
  tenCang?: string | null;
  tinhThanhPho?: string | null;
  viDo?: number | null;
  kinhDo?: number | null;
  dienTich?: number | null;
  khaNangTiepNhan?: number | null;
  trangThaiHoatDong?: string | null;
}

// ── ChangeHistory record (matches LichSuThayDoi.java) ─

export interface ChangeHistory {
  id: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string | null;
  changedAt: string | null;
  createdAt: string | null;
}

// ── Paginated response (Spring Data Page) ─

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ── ApiResponse envelope (matches ApiResponse.java wrapper) ─

export interface ApiResponseEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── Approval result (from approve/reject endpoints — returns void wrapper) ─

export interface ApprovalResult {
  success: boolean;
  message: string;
  data: null;
}

// ── Approval history line ─

export interface ApprovalHistoryLine {
  id: string;
  entityId: string;
  approvedBy: string | null;
  approvedAt: string | null;
  approved: boolean;
  reason: string | null;
}
