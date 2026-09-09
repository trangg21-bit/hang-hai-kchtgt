export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface PortTerminalAsset {
  id: string;
  parentOrgUnitId?: string;
  orgUnitId?: string;
  usingOrgUnitId?: string;
  berthId?: string;
  assetCode: string;
  assetName: string;
  assetType: 'PORT_TERMINAL';
  barcode?: string;
  assetCondition?: string;
  usageStatus?: string;
  assetGroup?: string;
  assetSubgroup?: string;
  address?: string;
  origin?: string;
  quantity?: number;
  quantityUnit?: string;
  model?: string;
  serialNumber?: string;
  countryOfOrigin?: string;
  manufacturer?: string;
  constructionYear?: number;
  useDate?: string;
  landArea?: number;
  floorArea?: number;
  assetLocation?: string;
  attachmentName?: string;
  declarationDate?: string;
  originalValue?: number;
  depreciationRate?: number;
  accumulatedDepreciation?: number;
  remainingValue?: number;
  assignmentDecisionNumber?: string;
  depreciationStartDate?: string;
  depreciationMonths?: number;
  depreciationEndDate?: string;
  monthlyDepreciation?: number;
  disposalMethod?: string;
  status?: string;
  approvalStatus?: string;
  submittedBy?: string;
  submittedByName?: string;
  submittedAt?: string;
  portAuthorityApprovedBy?: string;
  portAuthorityApprovedByName?: string;
  portAuthorityApprovedAt?: string;
  portAuthorityApprovalContent?: string;
  departmentApprovedBy?: string;
  departmentApprovedByName?: string;
  departmentApprovedAt?: string;
  departmentApprovalContent?: string;
  createdBy?: string;
  updatedBy?: string;
  updatedByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PortTerminalAssetPayload = Omit<PortTerminalAsset, 'id' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'>;

export interface PortTerminalAssetFilters {
  page?: number;
  size?: number;
  assetCode?: string;
  assetName?: string;
  parentOrgUnitId?: string;
  orgUnitId?: string;
  usingOrgUnitId?: string;
  berthId?: string;
  assetCondition?: string;
  approvalStatus?: string;
  updatedFrom?: string;
  updatedTo?: string;
}

export interface AssetIncreaseRequest {
  assetId: string;
  assetName: string;
  quantity: number;
  unitOfMeasure: string;
  reason: string;
  increaseCode: string;
  adjustmentDetails?: AssetValueAdjustmentDetails;
}

export interface AssetIncreaseResponse {
  id: string;
  assetId: string;
  assetName: string;
  quantity: number;
  unitOfMeasure: string;
  reason: string;
  status: string;
  increaseCode: string;
  adjustmentDetails?: AssetValueAdjustmentDetails;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetDecreaseRequest {
  assetId: string;
  assetName: string;
  quantity: number;
  unitOfMeasure: string;
  reason: string;
  decreaseReason: string;
  adjustmentDetails?: AssetValueAdjustmentDetails;
}

export interface AssetDecreaseResponse {
  id: string;
  assetId: string;
  assetName: string;
  quantity: number;
  unitOfMeasure: string;
  reason: string;
  status: string;
  decreaseReason: string;
  adjustmentDetails?: AssetValueAdjustmentDetails;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetValueAdjustmentDetails {
  decisionNumber?: string;
  decisionDate?: string;
  adjustmentDate?: string;
  adjustmentReason?: string;
  adjustmentNotes?: string;
  originalValueBefore?: number;
  originalValueAfter?: number;
  remainingValueBefore?: number;
  remainingValueAfter?: number;
  declarationDate?: string;
  depreciationRate?: number;
  valueUnit?: string;
  assignmentDecisionNumber?: string;
  depreciationStartDate?: string;
  depreciationMonths?: number;
  depreciationEndDate?: string;
  accumulatedDepreciation?: number;
  monthlyDepreciation?: number;
  disposalMethod?: string;
}

export interface InventoryPlanRequest {
  planName: string;
  scope: string;
  inventoryType: 'DINH_KY' | 'DOT_XUAT';
  startDate: string;
  endDate: string;
  inventoryLeader: string;
  description: string;
}

export interface InventoryPlanResponse {
  id: string;
  planName: string;
  description: string;
  status: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryReportRequest {
  planId: string;
  reportName: string;
  totalQuantity: number;
  quantityVariance: number;
  result: string;
  description: string;
}

export interface InventoryReportResponse {
  id: string;
  planId: string;
  reportName: string;
  totalQuantity: number;
  quantityVariance: number;
  result: string;
  description: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetExploitationRequest {
  assetId: string;
  assetName: string;
  exploitationYear: number;
  doanhThu: number;
  depreciation: number;
  description: string;
  operatorOrgUnitId?: string;
  assetCategory?: string;
  unitOfMeasure?: string;
  quantity?: number;
  exploitationDeadline?: string;
  totalRevenue?: number;
  relatedCosts?: number;
  stateBudgetPayment?: number;
  projectAmount?: number;
}

export interface AssetExploitationResponse {
  id: string;
  assetId: string;
  assetName: string;
  exploitationYear: number;
  doanhThu: number;
  depreciation: number;
  description: string;
  operatorOrgUnitId?: string;
  assetCategory?: string;
  unitOfMeasure?: string;
  quantity?: number;
  exploitationDeadline?: string;
  totalRevenue?: number;
  relatedCosts?: number;
  stateBudgetPayment?: number;
  projectAmount?: number;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetProcessingRecordRequest {
  assetId: string;
  assetName: string;
  processingType: string;
  recipient: string;
  processingReason: string;
  description: string;
}

export interface AssetProcessingRecordResponse {
  id: string;
  assetId: string;
  assetName: string;
  processingType: string;
  description: string;
  documentStatus: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}
