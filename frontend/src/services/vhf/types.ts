// ── VHF Response (matches VhfResponse.java) ─────────────────────────
// Clone từ services/cctv/types.ts — Quản lý hệ thống thông tin liên lạc VHF

export interface VhfResponse {
  id: string;
  deviceCode: string;
  deviceName: string;
  detailedLocation: string | null;
  manufacturer: string | null;
  model: string | null;
  quantity: number | null;
  seaportId?: string | null;
  seaportName?: string | null;
  orgUnitId: string | null;
  orgUnitName: string | null;
  operatingUnitId: string | null;
  operatingUnitName: string | null;
  provinceName: string | null;
  attachedInfrastructureType: number | null;
  attachedInfrastructureId: string | null;
  attachedInfrastructureName: string | null;
  unitOfMeasure: number | null;
  yearOfUse: number | null;
  operationalStatus: string | null;
  approvalStatus: string | null;
  approverLevel1: string | null;
  approverLevel1Name: string | null;
  approvedDateLevel1: string | null;
  approverLevel2: string | null;
  approverLevel2Name: string | null;
  approvedDateLevel2: string | null;
  rejectionReason: string | null;
  specifications: string | null;
  maintenanceInformation: string | null;
  note: string | null;
  objectType: number | null;
  mapSymbolId: string | null;
  coordinateSystem: number | null;
  displayRule: number | null;
  spatialId: string | null;
  geometryType: string | null;
  coordinates: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// ── CreateVhfRequest (matches CreateVhfRequest.java) ────────────────

export interface CreateVhfRequest {
  deviceCode?: string;
  deviceName: string;
  detailedLocation?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  quantity: number;
  seaportId?: string | null;
  orgUnitId?: string | null;
  operatingUnitId?: string | null;
  provinceName?: string | null;
  attachedInfrastructureType?: number | null;
  attachedInfrastructureId?: string | null;
  unitOfMeasure?: number | null;
  yearOfUse?: number | null;
  operationalStatus?: string | null;
  specifications?: string | null;
  maintenanceInformation?: string | null;
  note?: string | null;
  objectType?: number | null;
  mapSymbolId?: string | null;
  coordinateSystem?: number | null;
  displayRule?: number | null;
  spatialId?: string | null;
  geometryType?: 'POINT' | 'LINE' | 'POLYGON' | null;
  coordinates?: string | null;
  approvalStatus?: string | null;
}

// ── UpdateVhfRequest (matches UpdateVhfRequest.java) ────────────────

export interface UpdateVhfRequest extends CreateVhfRequest {
  id: string;
}

// ── Page response (Spring Data Page) ────────────────────────────────

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ── ApiResponse envelope ────────────────────────────────────────────

export interface ApiResponseEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── Option response for dropdowns ───────────────────────────────────

export interface VhfOptionResponse {
  id: string;
  deviceCode: string;
  deviceName: string;
  orgUnitId: string | null;
}

// ── Approval / Reject result ────────────────────────────────────────

export interface ApprovalResult {
  success: boolean;
  message: string;
}

// ── Approval request (2 cấp: C1 Cảng vụ / C2 Cục) ──────────────────

export interface ApprovalRequest {
  decision: string;
  reason?: string;
}

// ── Approval / Change history record ────────────────────────────────

export interface ApprovalHistoryLine {
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

export interface VhfHistoryResponse {
  entityId: string;
  entityType: string;
  currentApprovalStatus: string | null;
  changeHistory: ApprovalHistoryLine[];
  approvalLog: ApprovalHistoryLine[];
}
