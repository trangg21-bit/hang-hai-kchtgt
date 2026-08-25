// ── CCTV Response (matches CctvResponse.java) ────────────────────────

export interface CctvResponse {
  id: string;
  deviceCode: string;
  deviceName: string;
  detailedLocation: string | null;
  manufacturer: string | null;
  model: string | null;
  quantity: number | null;
  orgUnitId: string | null;
  orgUnitName: string | null;
  operatingUnitId: string | null;
  provinceId: string | null;
  attachedInfrastructureType: number | null;
  attachedInfrastructureId: string | null;
  unitOfMeasure: number | null;
  yearOfUse: number | null;
  operationalStatus: string | null;
  approvalStatus: string | null;
  specifications: string | null;
  maintenanceInformation: string | null;
  note: string | null;
  objectType: number | null;
  mapSymbolId: string | null;
  mapSymbolName: string | null;
  coordinateSystem: number | null;
  displayRule: number | null;
  spatialId: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdByName: string | null;
  updatedByName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// ── CreateCctvRequest (matches CreateCctvRequest.java) ──────────────

export interface CreateCctvRequest {
  deviceCode?: string;
  deviceName: string;
  detailedLocation?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  quantity: number;
  orgUnitId?: string | null;
  operatingUnitId?: string | null;
  provinceId?: string | null;
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
}

// ── UpdateCctvRequest (matches UpdateCctvRequest.java) ──────────────

export interface UpdateCctvRequest {
  id: string;
  deviceName?: string | null;
  detailedLocation?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  quantity?: number | null;
  orgUnitId?: string | null;
  operatingUnitId?: string | null;
  provinceId?: string | null;
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
  approvalStatus?: string | null;
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

export interface CctvOptionResponse {
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

export interface CctvHistoryResponse {
  entityId: string;
  entityType: string;
  currentApprovalStatus: string | null;
  changeHistory: ApprovalHistoryLine[];
  approvalLog: ApprovalHistoryLine[];
}
