// ── BuoyStation feature types — feature-scoped envelopes + response (F-085) ──
// Chuẩn cấu trúc /services/buoy/types.ts: response đầy đủ field khớp backend
// BuoyStationResponse.java + envelope types (ChangeHistory, history payload, approval).

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface CreateBuoyStationRequest {
  code: string;
  name: string;
  type: string;
  latitude?: number;
  longitude?: number;
  color?: string;
  shape?: string;
  lightCharacteristic?: string;
  range: number;
  description?: string;
  unitId?: string;
  operatingOrgId?: string;
  portId?: string;
  waterwayId?: string;
  waterwayRouteId?: string;
  province?: string;
  address?: string;
  constructionDate?: string;
  totalArea?: number;
  usableArea?: number;
  staffCount?: number;
  lastMaintenanceYear?: number;
  note?: string;
  objectType?: string;
  icon?: string;
  coordinateSystem?: string;
  displayFormat?: string;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  lastRepairDate?: string;
  condition?: string;
  isActive: boolean;
  status?: string;
  geometryType?: string;
  coordinates?: string;
  action?: string;
}

export interface BuoyStationResponse {
  id: string;
  code: string;
  name: string;
  type: string;
  latitude?: number;
  longitude?: number;
  color?: string;
  shape?: string;
  lightCharacteristic?: string;
  range?: number;
  description?: string;
  unitId?: string;
  operatingOrgId?: string;
  portId?: string;
  waterwayId?: string;
  waterwayRouteId?: string;
  province?: string;
  address?: string;
  constructionDate?: string;
  totalArea?: number;
  usableArea?: number;
  staffCount?: number;
  lastMaintenanceYear?: number;
  note?: string;
  objectType?: string;
  icon?: string;
  coordinateSystem?: string;
  displayFormat?: string;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  lastRepairDate?: string;
  condition?: string;
  isActive: boolean;
  status: string;
  approvalStatus: string;
  approvalLevel?: string;
  approvedBy?: string;
  approvedDate?: string;
  level1ApprovedBy?: string;
  level1ApprovedDate?: string;
  level2ApprovedBy?: string;
  level2ApprovedDate?: string;
  level1ApprovalContent?: string;
  level2ApprovalContent?: string;
  sentApprovedBy?: string;
  sentApprovedDate?: string;
  rejectionReason?: string;
  operationPlanCode?: string;
  operationPlanName?: string;
  operationStartDate?: string;
  operationEndDate?: string;
  maintenancePlanCode?: string;
  maintenancePlanName?: string;
  maintenanceStartTime?: string;
  maintenanceEndTime?: string;
  incidentCode?: string;
  incidentType?: string;
  incidentLocation?: string;
  incidentTime?: string;
  createdBy: string;
  createdByName?: string;
  updatedByName?: string;
  createdAt: string;
  updatedAt: string;
  geometryType?: string;
  coordinates?: string;
  spatialId?: string;
}

/** One ChangeLog row (matches ChangeLog serialization — BuoyStationController GET /{id}/history). */
export interface ChangeHistory {
  id: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
  changedAt: string;
  createdAt: string;
}

/** Body of GET /v1/buoy-station/{id}/history. */
export interface BuoyStationHistoryPayload {
  changeHistory: ChangeHistory[];
  approvalLog: unknown[];
}

/** Body of GET /v1/buoy-station/history/all. */
export interface BuoyStationAllHistoryPayload {
  entityType: string;
  changeHistory: ChangeHistory[];
  entityNames: Record<string, string>;
}

/** Một phao tiêu thuộc nhà trạm (CSV 34-38 — section Danh sách phao tiêu, read-only). */
export interface StationBuoySummary {
  id: string;
  code: string;
  name: string;
  classification?: string;
  classificationBuoy?: string;
  classificationMark?: string;
}
