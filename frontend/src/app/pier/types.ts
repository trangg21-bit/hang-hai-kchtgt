// Pier entity types — field names match BE EXACTLY
export interface Pier {
  id: string;
  pierCode: string;
  pierName: string;
  berthId: string;
  portId?: string;
  navigationChannelId?: string;
  tenBenCang?: string;
  tenPort?: string;
  tenNavigationChannel?: string;
  length: number | null;
  width?: number | null;
  taiTrong: number | null;
  loaiCau: string;
  pierType?: string;
  operationalCapacity?: string | null;
  operationalFunction?: string;
  operationalStatus: 'OPERATIONAL' | 'SUSPENDED';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  orgUnitId: string;
  province?: string;
  detailedLocation?: string;
  constructionGrade?: number;
  conditionStatus?: number;
  currentWaterDepth?: string;
  designBedElevation?: string;
  publishedVesselDWT?: string;
  maintenanceApprovalDate?: string;
  safetyAssessmentDate?: string;
  lastInspectionDate?: string;
  operatingPierCount?: number;
  publishedPierCount?: number;
  investmentAgreementPierCount?: number;
  cargoThroughput?: number;
  receivesLargeVessel?: boolean;
  documentNumber?: string;
  documentDate?: string;
  openingAnnouncementDate?: string;
  openingDecision?: string;
  investmentAgreementDoc?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  loaiHinhHoc: string | null;
  toaDo: string | null;
  bieuTuongId: string | null;
}

export interface CauCangListQuery {
  search?: string;
  status?: 'OPERATIONAL' | 'SUSPENDED';
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  berthId?: string;
  orgUnitId?: string;
  loaiCau?: LoaiCau;
  province?: string;
  sortBy?: 'pierCode' | 'pierName' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface CauCangCreateRequest {
  pierCode: string;
  pierName: string;
  portId?: string;
  berthId: string;
  navigationChannelId?: string;
  orgUnitId?: string;
  province?: string;
  detailedLocation?: string;
  constructionGrade?: number;
  pierType?: string;
  loaiCau?: string;
  operationalFunction?: string;
  operationalCapacity?: string;
  conditionStatus?: number;
  length?: number | null | '';
  width?: number | null | '';
  taiTrong?: number | null | '';
  currentWaterDepth?: string;
  designBedElevation?: string;
  publishedVesselDWT?: string;
  maintenanceApprovalDate?: string;
  safetyAssessmentDate?: string;
  lastInspectionDate?: string;
  operatingPierCount?: number;
  publishedPierCount?: number;
  investmentAgreementPierCount?: number;
  cargoThroughput?: number;
  receivesLargeVessel?: boolean;
  documentNumber?: string;
  documentDate?: string;
  openingAnnouncementDate?: string;
  openingDecision?: string;
  investmentAgreementDoc?: string;
  operationalStatus?: 'OPERATIONAL' | 'SUSPENDED';
  loaiHinhHoc?: string;
  toaDo?: string;
  bieuTuongId?: string;
}

export interface CauCangUpdateRequest {
  id: string;
  pierName?: string;
  portId?: string;
  berthId?: string;
  navigationChannelId?: string;
  length?: number | null | '';
  width?: number | null | '';
  taiTrong?: number | null | '';
  loaiCau?: string;
  pierType?: string;
  operationalCapacity?: string;
  operationalFunction?: string;
  operationalStatus?: 'OPERATIONAL' | 'SUSPENDED';
  province?: string;
  detailedLocation?: string;
  constructionGrade?: number;
  conditionStatus?: number;
  currentWaterDepth?: string;
  designBedElevation?: string;
  publishedVesselDWT?: string;
  maintenanceApprovalDate?: string;
  safetyAssessmentDate?: string;
  lastInspectionDate?: string;
  operatingPierCount?: number;
  publishedPierCount?: number;
  investmentAgreementPierCount?: number;
  cargoThroughput?: number;
  receivesLargeVessel?: boolean;
  documentNumber?: string;
  documentDate?: string;
  openingAnnouncementDate?: string;
  openingDecision?: string;
  investmentAgreementDoc?: string;
  loaiHinhHoc?: string;
  toaDo?: string;
  bieuTuongId?: string | null;
}

export interface pierHistoryRecord {
  id: string;
  cauCangId: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
  reason?: string;
  actionType: 'CREATE' | 'UPDATE' | 'APPROVE' | 'REJECT' | 'DELETE' | 'RESTORE';
}

export interface BenCangOption {
  id: string;
  berthName: string;
}

export interface PortOption {
  id: string;
  portName: string;
}

export interface NavigationChannelOption {
  id: string;
  channelName: string;
}

export type ApproveAction = 'APPROVE' | 'REJECT';

export type LoaiCau = 'CONTAINER' | 'TONG_HOP' | 'HANH_KHACH' | 'CHUYEN_DUNG_XANG_DAU' | 'CHUYEN_DUNG_ROI_QUANG' | 'KHAC';

export const LOAI_CAU_OPTIONS = [
  { value: 'CONTAINER', label: 'Cầu cảng container' },
  { value: 'TONG_HOP', label: 'Cầu cảng tổng hợp' },
  { value: 'HANH_KHACH', label: 'Cầu cảng hành khách' },
  { value: 'CHUYEN_DUNG_XANG_DAU', label: 'Cầu cảng chuyên dụng xăng dầu' },
  { value: 'CHUYEN_DUNG_ROI_QUANG', label: 'Cầu cảng chuyên dụng rời quặng' },
  { value: 'KHAC', label: 'Khác' },
];

export const translateLoaiCau = (val: string | null): string => {
  if (!val) return '—';
  const found = LOAI_CAU_OPTIONS.find(o => o.value === val);
  return found ? found.label : val;
};
