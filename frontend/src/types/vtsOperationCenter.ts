import { ConditionStatus, ApprovalStatus } from './vtsSystem';

export interface VtsOperationCenterAttachment {
  id: string;
  fileName: string;
  fileSize?: number;
  uploadedDate?: string;
  filePath?: string;
  uploadedBy?: string;
  uploadedByName?: string;
  fileType?: string;
  file?: File;
  [key: string]: any;
}

export interface VtsOperationCenterResponse {
  id: string;
  code: string;
  name: string;
  vtsSystemId: string;
  vtsSystemName?: string;
  portId?: string;
  portName?: string;
  orgUnitId: string;
  orgUnitName?: string;
  provinceId?: number;
  provinceName?: string;
  detailedLocation?: string;
  coverage?: string;
  conditionStatus: ConditionStatus;
  note?: string;
  spatialId?: string;
  geometryType?: string;
  coordinates?: string;
  symbolId?: string;
  approvalStatus: ApprovalStatus;
  approvalStatusLabel?: string;
  submittedAt?: string;
  submittedDate?: string;
  submittedBy?: string;
  submittedByName?: string;
  approverLevel1?: string;
  approverLevel1Name?: string;
  approvedDateLevel1?: string;
  approvalContentLevel1?: string;
  approvalReasonLevel1?: string;
  rejectionReasonLevel1?: string;
  approverLevel2?: string;
  approverLevel2Name?: string;
  approvedDateLevel2?: string;
  approvalContentLevel2?: string;
  approvalReasonLevel2?: string;
  rejectionReasonLevel2?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
  updatedDate?: string;
  createdBy?: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  attachments?: VtsOperationCenterAttachment[];
}

export interface VtsOperationCenterListItem {
  id: string;
  code: string;
  name: string;
  vtsSystemId: string;
  vtsSystemName?: string;
  portId?: string;
  portName?: string;
  orgUnitId: string;
  orgUnitName?: string;
  provinceId?: number;
  provinceName?: string;
  detailedLocation?: string;
  coverage?: string;
  conditionStatus: ConditionStatus;
  approvalStatus: ApprovalStatus;
  approvalStatusLabel?: string;
  updatedAt?: string;
  updatedBy?: string;
  updatedByName?: string;
  createdAt?: string;
  createdBy?: string;
  createdByName?: string;
  submittedAt?: string;
  submittedBy?: string;
  submittedByName?: string;
  approverLevel1?: string;
  approverLevel1Name?: string;
  approvedDateLevel1?: string;
  approverLevel2?: string;
  approverLevel2Name?: string;
  approvedDateLevel2?: string;
  rejectionReason?: string;
}

export interface CreateVtsOperationCenterRequest {
  code?: string;
  name: string;
  vtsSystemId: string;
  portId?: string;
  orgUnitId: string;
  provinceId: number;
  detailedLocation?: string;
  coverage?: string;
  conditionStatus: ConditionStatus;
  note?: string;
  spatialId?: string;
  geometryType?: string;
  coordinates?: string;
  symbolId?: string;
  coordinateSystem?: string;
  displayRule?: string;
  approvalStatus?: ApprovalStatus | string;
}

export interface UpdateVtsOperationCenterRequest extends CreateVtsOperationCenterRequest {}
