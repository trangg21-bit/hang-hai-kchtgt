export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  statusCounts?: Record<string, number>;
}

export interface LegalDocumentCreateRequest {
  documentName: string;
  documentNumber: string;
  issuingAuthority: string;
  issueDate: string;
  effectiveDate: string;
  expirationDate?: string;
  documentType?: string;
  applicationArea?: string;
  signer?: string;
  validityStatus?: string;
  description?: string;
  draft?: boolean;
}

export interface LegalDocumentResponse {
  id: string;
  documentName: string;
  documentNumber: string;
  issuingAuthority: string;
  issueDate: string;
  effectiveDate: string;
  expirationDate?: string;
  documentType?: string;
  applicationArea?: string;
  validityStatus?: string;
  signer?: string;
  description?: string;
  attachedDocuments?: Array<{
    id: string; documentName: string; filePath: string; fileSize?: number; uploadedAt: string;
  }>;
  draft?: boolean;
  createdBy?: string; createdByName?: string; createdDate?: string; updatedBy?: string; updatedByName?: string; updatedDate?: string;
}

export interface LegalDocumentHistoryResponse {
  id: string;
  action: string;
  changedBy?: string;
  changedByName?: string;
  orgUnitName?: string;
  unitName?: string;
  changedAt: string;
  documentName: string;
  documentNumber?: string;
  validityStatus?: string;
  description?: string;
  note?: string;
}

// ==========================================
// 2. Sự cố hàng hải (F-131) — D1 contract (design plan §3.1/§7.1)
// ==========================================

export type IncidentProcessingStatus =
  | 'RECEIVED'
  | 'PROCESSING'
  | 'RESOLVED'
  | 'UNRESOLVED'
  | 'CLOSED';

export type IncidentSeverity = 'MINOR' | 'MODERATE' | 'SEVERE' | 'CRITICAL';

/** Bảng con incident_evolution (diễn biến sự cố). */
export interface IncidentEvolutionItem {
  id?: string;
  fromDate?: string;
  toDate?: string;
  event?: string;
}

/** Bảng con incident_handling (chỉ đạo / xử lý). */
export interface IncidentHandlingItem {
  id?: string;
  handler?: string;
  directiveContent?: string;
  directiveDate?: string;
  measure?: string;
  result?: string;
  note?: string;
}

/** Bảng con incident_file — file thông tin (INFO) / file kết quả xử lý (RESULT). */
export type IncidentFileCategory = 'INFO' | 'RESULT';

export interface IncidentFileItem {
  id?: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  fileCategory?: IncidentFileCategory;
  uploadedAt?: string;
}

export interface SuCoCreateRequest {
  orgUnitId: string;
  incidentType?: string;
  occurredFrom?: string;
  occurredTo?: string;
  location?: string;
  infrastructureType?: string;
  infrastructureId?: string;
  infrastructureName?: string;
  description?: string;
  damageStatus?: string;
  processingStatus?: IncidentProcessingStatus;
  severityLevel?: IncidentSeverity;
  note?: string;
  evolution?: IncidentEvolutionItem[];
  handling?: IncidentHandlingItem[];
  files?: IncidentFileItem[];
}

export interface SuCoResponse {
  id: string;
  code?: string;
  orgUnitId?: string;
  orgUnitName?: string;
  incidentType?: string;
  occurredFrom?: string;
  occurredTo?: string;
  location?: string;
  infrastructureType?: string;
  infrastructureId?: string;
  infrastructureName?: string;
  description?: string;
  damageStatus?: string;
  processingStatus?: string;
  severityLevel?: string;
  note?: string;
  reporter?: string;
  incidentEvolution?: IncidentEvolutionItem[];
  incidentHandling?: IncidentHandlingItem[];
  incidentFiles?: IncidentFileItem[];
  createdBy?: string;
  createdByName?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedByName?: string;
  updatedDate?: string;
}

// ==========================================
// 3. Quy hoạch bến cảng (F-132/133/134) — D1 contract (design plan §4.1/§7.2)
// ==========================================

export type PlanningGroup = 'SEAPORT' | 'DRY_PORT';

export type PlanningStatus = 'DRAFT' | 'EFFECTIVE' | 'REPLACED' | 'HISTORY';

/** Bảng con port_planning_cargo_forecast (dự báo hàng hóa thông qua cảng). */
export interface PortPlanningCargoForecast {
  id?: string;
  classification?: string;
  portName?: string;
  portId?: string;
  containerMin?: number;
  containerMax?: number;
  generalCargoMin?: number;
  generalCargoMax?: number;
  liquidMin?: number;
  liquidMax?: number;
  totalMin?: number;
  totalMax?: number;
  note?: string;
}

/** Bảng con planning_categories (danh mục quy hoạch chi tiết — hiện trạng / sau quy hoạch). */
export type PlanningCategoryPhase = 'HIEN_TRANG' | 'SAU_QUY_HOACH';

export interface PortPlanningCategoryItem {
  id?: string;
  phase?: PlanningCategoryPhase | string;
  portCategory?: string;
  portName?: string;
  portId?: string;
  exploitationFunction?: string;
  classification?: string;
  berthCount?: number;
  length?: number;
  shipSize?: string;
  capacity?: number;
  landArea?: number;
  waterArea?: number;
  note?: string;
}

/** Bảng con port_planning_file / planning_files (tệp đính kèm). */
export interface PlanningFileItem {
  id?: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  uploadedAt?: string;
}

export interface QuyHoachBenCangCreateRequest {
  orgUnitId: string;
  decisionNumber: string;
  decisionDate?: string;
  planningGroup?: PlanningGroup;
  seaportId?: string;
  seaportGroup?: string;
  dryPortId?: string;
  planToYear?: number;
  planContent?: string;
  landWaterDemand?: string;
  capitalDemand?: string;
  implementationSolution?: string;
  priorityProjects?: string;
  implementationOrg?: string;
  status?: PlanningStatus;
  cargoForecasts?: PortPlanningCargoForecast[];
  planningCategories?: PortPlanningCategoryItem[];
  fileUploadIds?: string[];
}

export interface QuyHoachBenCangResponse {
  id: string;
  projectName?: string;
  orgUnitId?: string;
  orgUnitName?: string;
  decisionNumber?: string;
  decisionDate?: string;
  planningGroup?: string;
  seaportId?: string;
  seaportName?: string;
  seaportGroup?: string;
  dryPortId?: string;
  dryPortName?: string;
  planToYear?: number;
  planContent?: string;
  landWaterDemand?: string;
  capitalDemand?: string;
  implementationSolution?: string;
  priorityProjects?: string;
  implementationOrg?: string;
  status?: string;
  cargoForecasts?: PortPlanningCargoForecast[];
  planningCategories?: PortPlanningCategoryItem[];
  planningFiles?: PlanningFileItem[];
  createdBy?: string;
  createdByName?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedByName?: string;
  updatedDate?: string;
}
