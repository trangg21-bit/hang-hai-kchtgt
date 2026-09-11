export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface VhfAsset extends Record<string, unknown> {
  id: string;
  parentOrgUnitId?: string;
  orgUnitId?: string;
  usingOrgUnitId?: string;
  transmissionId?: string;
  transmissionCode?: string;
  transmissionName?: string;
  assetCode: string;
  assetName: string;
  assetType?: string;
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

export type VhfAssetPayload = Omit<VhfAsset, 'id' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'>;

export interface VhfAssetFilters extends Record<string, unknown> {
  page?: number;
  size?: number;
  assetCode?: string;
  assetName?: string;
  parentOrgUnitId?: string;
  orgUnitId?: string;
  usingOrgUnitId?: string;
  transmissionId?: string;
  assetCondition?: string;
  approvalStatus?: string;
  assetType?: string;
  updatedFrom?: string;
  updatedTo?: string;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC' | 'asc' | 'desc';
}

export interface VhfAssetExploitation extends Record<string, unknown> {
  id: string;
  assetId: string;
  operatorOrgUnitId?: string;
  assetCategory?: string;
  unitOfMeasure?: string;
  quantity?: number;
  exploitationDeadline?: string;
  totalRevenue?: number;
  relatedCosts?: number;
  stateBudgetPayment?: number;
  projectAmount?: number;
  operatingTime?: string;
  exploitationLevel?: string;
  operatingCost?: number;
  maintenanceCost?: number;
  technicalStatus?: string;
  exploitationMonth?: number;
  exploitationYear?: number;
  description?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VhfAssetAdjustment extends Record<string, unknown> {
  id: string;
  assetId: string;
  adjustmentType: string;
  decisionNumber?: string;
  decisionDate?: string;
  adjustmentDate?: string;
  adjustmentReason?: string;
  notes?: string;
  originalValueBefore?: number;
  originalValueAfter?: number;
  remainingValueBefore?: number;
  remainingValueAfter?: number;
  declarationDate?: string;
  depreciationRate?: number;
  assignmentDecisionNumber?: string;
  depreciationStartDate?: string;
  depreciationMonths?: number;
  depreciationEndDate?: string;
  accumulatedDepreciation?: number;
  monthlyDepreciation?: number;
  disposalMethod?: string;
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
  status: string;
  createdAt?: string;
  updatedAt?: string;
}
