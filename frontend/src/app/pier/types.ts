// Pier entity types — field names match BE EXACTLY
export interface Pier {
  id: string;
  pierCode: string;
  pierName: string;
  berthId: string;
  tenBenCang?: string;
  length: number | null;
  taiTrong: number | null;
  loaiCau: string;
  congNangKhaiThac?: string | null;
  operationalStatus: 'HIEN_HANH' | 'TAM_NGUNG';
  approvalStatus: 'CHO_PHE_DUYET' | 'DUOC_PHE_DUYET' | 'TU_CHOI';
  orgUnitId: string;
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
  status?: 'HIEN_HANH' | 'TAM_NGUNG';
  approvalStatus?: 'CHO_PHE_DUYET' | 'DUOC_PHE_DUYET' | 'TU_CHOI';
  berthId?: string;
  orgUnitId?: string;
  loaiCau?: LoaiCau;
  sortBy?: 'pierCode' | 'pierName' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface CauCangCreateRequest {
  pierCode: string;
  pierName: string;
  berthId: string;
  length?: number | null | '';
  taiTrong?: number | null | '';
  loaiCau?: string;
  congNangKhaiThac?: string;
  operationalStatus?: 'HIEN_HANH' | 'TAM_NGUNG';
  loaiHinhHoc?: string;
  toaDo?: string;
  bieuTuongId?: string;
}

export interface CauCangUpdateRequest {
  id: string;
  pierName?: string;
  berthId?: string;
  length?: number | null | '';
  taiTrong?: number | null | '';
  loaiCau?: string;
  congNangKhaiThac?: string;
  operationalStatus?: 'HIEN_HANH' | 'TAM_NGUNG';
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
