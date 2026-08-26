import { ConditionStatus, ApprovalStatus } from './vtsSystem';

export const UnitOfMeasure = {
  SET: 1,
  PIECE: 2,
  SYSTEM: 3,
  STATION: 4,
} as const;

export type UnitOfMeasure = typeof UnitOfMeasure[keyof typeof UnitOfMeasure];

export const UNIT_OF_MEASURE_OPTIONS = [
  { value: UnitOfMeasure.SET, label: 'Bộ' },
  { value: UnitOfMeasure.PIECE, label: 'Cái' },
  { value: UnitOfMeasure.SYSTEM, label: 'Hệ thống' },
  { value: UnitOfMeasure.STATION, label: 'Trạm' },
];

export const UNIT_OF_MEASURE_MAP: Record<number, string> = {
  1: 'Bộ',
  2: 'Cái',
  3: 'Hệ thống',
  4: 'Trạm',
};

export interface AisSystemAttachment {
  id: string;
  fileName: string;
  fileSize?: number;
  uploadedDate?: string;
  filePath?: string;
  uploadedBy?: string;
}

export interface AisSystemResponse {
  id: string;
  code: string;
  name: string;
  vtsOperationCenterId: string;
  vtsOperationCenterName?: string;
  vtsSystemId?: string;
  vtsSystemName?: string;
  operatingOrgId: string;
  operatingOrgName?: string;
  orgUnitId: string;
  orgUnitName?: string;
  provinceId?: number;
  provinceName?: string;
  detailedLocation?: string;
  unitOfMeasure: UnitOfMeasure;
  unitOfMeasureLabel?: string;
  quantity: number;
  model?: string;
  specifications?: string;
  manufacturer?: string;
  commissioningYear?: number;
  conditionStatus: ConditionStatus;
  conditionStatusLabel?: string;
  maintenanceInfo?: string;
  note?: string;
  spatialId?: string;
  geometryType?: string;
  coordinates?: string;
  symbolId?: string;
  approvalStatus: ApprovalStatus;
  approvalStatusLabel?: string;
  approverLevel1?: string;
  approverLevel1Name?: string;
  approvedDateLevel1?: string;
  approverLevel2?: string;
  approverLevel2Name?: string;
  approvedDateLevel2?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  attachments?: AisSystemAttachment[];
}

export interface AisSystemListItem {
  id: string;
  code: string;
  name: string;
  vtsOperationCenterId: string;
  vtsOperationCenterName?: string;
  vtsSystemId?: string;
  vtsSystemName?: string;
  operatingOrgId: string;
  operatingOrgName?: string;
  orgUnitId: string;
  orgUnitName?: string;
  provinceId?: number;
  provinceName?: string;
  detailedLocation?: string;
  unitOfMeasure: UnitOfMeasure;
  unitOfMeasureLabel?: string;
  quantity: number;
  model?: string;
  manufacturer?: string;
  commissioningYear?: number;
  conditionStatus: ConditionStatus;
  approvalStatus: ApprovalStatus;
  approvalStatusLabel?: string;
  updatedAt?: string;
  updatedBy?: string;
  updatedByName?: string;
  createdAt?: string;
  createdBy?: string;
  createdByName?: string;
  approverLevel1?: string;
  approverLevel1Name?: string;
  approvedDateLevel1?: string;
  approverLevel2?: string;
  approverLevel2Name?: string;
  approvedDateLevel2?: string;
}

export interface CreateAisSystemRequest {
  code: string;
  name: string;
  vtsOperationCenterId: string;
  operatingOrgId: string;
  orgUnitId: string;
  provinceId?: number;
  detailedLocation?: string;
  unitOfMeasure: UnitOfMeasure;
  quantity: number;
  model?: string;
  specifications?: string;
  manufacturer?: string;
  commissioningYear?: number;
  conditionStatus: ConditionStatus;
  maintenanceInfo?: string;
  note?: string;
  spatialId?: string;
  geometryType?: string;
  coordinates?: string;
  symbolId?: string;
  approvalStatus?: ApprovalStatus;
}

export interface UpdateAisSystemRequest extends CreateAisSystemRequest {}
