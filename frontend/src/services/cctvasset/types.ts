export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CctvSystemAsset {
  id: string;
  assetCode: string;
  assetName: string;
  parentOrgUnitId?: string;
  parentOrgUnitName?: string;
  orgUnitId: string;
  orgUnitName?: string;
  usingOrgUnitId?: string;
  usingOrgUnitName?: string;
  cctvId?: string;
  cctvCode?: string;
  cctvName?: string;
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
  remainingValue?: number;
  valueUnit?: string;
  assignmentDecisionNumber?: string;
  depreciationStartDate?: string;
  depreciationMonths?: number;
  depreciationEndDate?: string;
  accumulatedDepreciation?: number;
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
  createdByName?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt?: string;
}

export type CctvSystemAssetPayload = Omit<
  CctvSystemAsset,
  'id' | 'createdBy' | 'createdByName' | 'createdAt' | 'updatedBy' | 'updatedByName' | 'updatedAt'
>;

export interface CctvSystemAssetFilters {
  page?: number;
  size?: number;
  assetCode?: string;
  assetName?: string;
  parentOrgUnitId?: string;
  orgUnitId?: string;
  usingOrgUnitId?: string;
  cctvId?: string;
  assetType?: string;
  assetCondition?: string;
  approvalStatus?: string;
  updatedFrom?: string;
  updatedTo?: string;
  updatedRange?: unknown;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

export interface CctvDeviceOption {
  id: string;
  deviceCode: string;
  deviceName: string;
  orgUnitId?: string;
}
