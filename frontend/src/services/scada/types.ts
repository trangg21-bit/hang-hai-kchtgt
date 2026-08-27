// ── SCADA Response (matches ScadaResponse.java) ──────────────────────

export interface ScadaResponse {
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
  submittedDate: string | null;
  submittedBy: string | null;
  submittedByName: string | null;
  approvalContentLevel1: string | null;
  approvalContentLevel2: string | null;
  specifications: string | null;
  maintenanceInformation: string | null;
  note: string | null;
  objectType: number | null;
  mapSymbolId: string | null;
  mapSymbolName: string | null;
  coordinateSystem: number | null;
  displayRule: number | null;
  spatialId: string | null;
  geometryType: string | null;
  coordinates: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdByName: string | null;
  updatedByName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// ── CreateScadaRequest (matches CreateScadaRequest.java) ────────────

export interface CreateScadaRequest {
  deviceCode?: string;
  deviceName: string;
  detailedLocation?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  quantity: number;
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
  action?: string;
}

// ── UpdateScadaRequest (matches UpdateScadaRequest.java) ────────────

export interface UpdateScadaRequest {
  id: string;
  deviceName?: string | null;
  detailedLocation?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  quantity?: number | null;
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

export interface ScadaOptionResponse {
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

export interface ScadaHistoryResponse {
  entityId: string;
  entityType: string;
  currentApprovalStatus: string | null;
  changeHistory: ApprovalHistoryLine[];
  approvalLog: ApprovalHistoryLine[];
}
