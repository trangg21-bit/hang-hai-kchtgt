export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export type InfrastructureAssetType =
  | "PORT_TERMINAL"
  | "ANCHORAGE"
  | "LIGHTHOUSE"
  | "DIKE_REVETMENT";

export interface PortTerminalAsset {
  [key: string]: unknown;
  id: string;
  parentOrgUnitId?: string;
  orgUnitId?: string;
  usingOrgUnitId?: string;
  berthId?: string;
  anchorageId?: string;
  beaconStationId?: string;
  dikeRevetmentId?: string;
  assetCode: string;
  assetName: string;
  assetType: InfrastructureAssetType;
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
  rejectionReason?: string;
  createdBy?: string;
  updatedBy?: string;
  updatedByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PortTerminalAssetPayload = Omit<
  PortTerminalAsset,
  "id" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt"
>;

export interface PortTerminalAssetFilters {
  [key: string]: unknown;
  page?: number;
  size?: number;
  assetCode?: string;
  assetName?: string;
  parentOrgUnitId?: string;
  orgUnitId?: string;
  usingOrgUnitId?: string;
  berthId?: string;
  anchorageId?: string;
  beaconStationId?: string;
  dikeRevetmentId?: string;
  assetType?: InfrastructureAssetType;
  assetCondition?: string;
  approvalStatus?: string;
  updatedFrom?: string;
  updatedTo?: string;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
}

export interface TransferAreaAsset {
  id: string;
  parentOrgUnitId?: string;
  orgUnitId?: string;
  usingOrgUnitId?: string;
  transferAreaId?: string;
  assetCode: string;
  assetName: string;
  assetType: "TRANSFER_AREA";
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
  [key: string]: unknown;
}

export type TransferAreaAssetPayload = Omit<
  TransferAreaAsset,
  "id" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt"
>;

export interface TransferAreaAssetFilters {
  page?: number;
  size?: number;
  assetCode?: string;
  assetName?: string;
  assetType?: string;
  parentOrgUnitId?: string;
  orgUnitId?: string;
  usingOrgUnitId?: string;
  transferAreaId?: string;
  assetCondition?: string;
  approvalStatus?: string;
  updatedFrom?: string;
  updatedTo?: string;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  [key: string]: unknown;
}

export interface StormShelterAsset {
  id: string;
  parentOrgUnitId?: string;
  orgUnitId?: string;
  usingOrgUnitId?: string;
  stormShelterId?: string;
  assetCode: string;
  assetName: string;
  assetType: "STORM_SHELTER";
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
  [key: string]: unknown;
}

export type StormShelterAssetPayload = Omit<
  StormShelterAsset,
  "id" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt"
>;

export interface StormShelterAssetFilters {
  page?: number;
  size?: number;
  assetCode?: string;
  assetName?: string;
  parentOrgUnitId?: string;
  orgUnitId?: string;
  usingOrgUnitId?: string;
  stormShelterId?: string;
  assetCondition?: string;
  approvalStatus?: string;
  updatedFrom?: string;
  updatedTo?: string;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  [key: string]: unknown;
}

export interface BuoyBerthAsset {
  id: string;
  parentOrgUnitId?: string;
  orgUnitId?: string;
  usingOrgUnitId?: string;
  buoyBerthId?: string;
  assetCode: string;
  assetName: string;
  assetType: "BUOY_BERTH";
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
  [key: string]: unknown;
}

export type BuoyBerthAssetPayload = Omit<
  BuoyBerthAsset,
  "id" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt"
>;

export interface BuoyBerthAssetFilters {
  page?: number;
  size?: number;
  assetCode?: string;
  assetName?: string;
  parentOrgUnitId?: string;
  orgUnitId?: string;
  usingOrgUnitId?: string;
  buoyBerthId?: string;
  assetCondition?: string;
  approvalStatus?: string;
  updatedFrom?: string;
  updatedTo?: string;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  [key: string]: unknown;
}

export interface PierAsset {
  id: string;
  parentOrgUnitId?: string;
  orgUnitId?: string;
  usingOrgUnitId?: string;
  pierId?: string;
  assetCode: string;
  assetName: string;
  assetType: "PIER";
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
  [key: string]: unknown;
}

export type PierAssetPayload = Omit<
  PierAsset,
  "id" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt"
>;

export interface PierAssetFilters {
  page?: number;
  size?: number;
  assetCode?: string;
  assetName?: string;
  parentOrgUnitId?: string;
  orgUnitId?: string;
  usingOrgUnitId?: string;
  pierId?: string;
  assetCondition?: string;
  approvalStatus?: string;
  updatedFrom?: string;
  updatedTo?: string;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  [key: string]: unknown;
  updatedRange?: unknown;
}

export interface BuoyAsset extends Omit<PortTerminalAsset, "assetType"> {
  buoyId?: string;
  buoyStationId?: string;
  assetType: "BUOY";
}

export type BuoyAssetPayload = Omit<
  BuoyAsset,
  "id" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt"
>;

export interface BuoyAssetFilters extends Omit<
  PortTerminalAssetFilters,
  | "assetType"
  | "berthId"
  | "anchorageId"
  | "beaconStationId"
  | "dikeRevetmentId"
> {
  refId?: string;
  buoyId?: string;
  buoyStationId?: string;
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
  decisionNumber?: string;
  decisionDate?: string;
  increaseAmount?: number;
  notes?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface AssetDecreaseRequest {
  assetId: string;
  assetName: string;
  quantity: number;
  unitOfMeasure: string;
  reason: string;
  decreaseReason: string;
  decreaseCode?: string;
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
  decreaseCode?: string;
  adjustmentDetails?: AssetValueAdjustmentDetails;
  decisionNumber?: string;
  decisionDate?: string;
  decreaseAmount?: number;
  notes?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
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
  originalValue?: number;
  remainingValue?: number;
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
  notes?: string;
  [key: string]: unknown;
}

export interface InventoryPlanRequest {
  planName: string;
  scope: string;
  inventoryType: "DINH_KY" | "DOT_XUAT";
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
  exploitationOrgUnitId?: string;
  exploitationTerm?: string | number;
  assetCategory?: string;
  unitOfMeasure?: string;
  quantity?: number;
  exploitationDeadline?: string;
  totalRevenue?: number;
  relatedCosts?: number;
  stateBudgetPayment?: number;
  projectAmount?: number;
  notes?: string;
  [key: string]: unknown;
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
  exploitationOrgUnitId?: string;
  exploitationTerm?: string | number;
  assetCategory?: string;
  unitOfMeasure?: string;
  quantity?: number;
  exploitationDeadline?: string;
  totalRevenue?: number;
  relatedCosts?: number;
  stateBudgetPayment?: number;
  projectAmount?: number;
  notes?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
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

// ==========================================
// Tài sản luồng hàng hải
// ==========================================
export interface ChannelAsset {
  id: string;
  parentOrgUnitId?: string;
  orgUnitId?: string;
  usingOrgUnitId?: string;
  navigationChannelId?: string;
  assetCode: string;
  assetName: string;
  assetType: "NAVIGATION_CHANNEL";
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

export type ChannelAssetPayload = Omit<
  ChannelAsset,
  "id" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt"
>;

export interface ChannelAssetFilters {
  page?: number;
  size?: number;
  assetCode?: string;
  assetName?: string;
  parentOrgUnitId?: string;
  orgUnitId?: string;
  usingOrgUnitId?: string;
  navigationChannelId?: string;
  assetCondition?: string;
  approvalStatus?: string;
  updatedFrom?: string;
  updatedTo?: string;
}
