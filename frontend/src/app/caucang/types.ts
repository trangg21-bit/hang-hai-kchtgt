// CauCang entity types — field names match BE EXACTLY
export interface CauCang {
  id: string;
  maCau: string;
  tenCau: string;
  benCangId: string;
  chieuDai: number | null;
  taiTrong: number | null;
  loaiCau: string;
  trangThaiHoatDong: 'HIEN_HANH' | 'TAM_NGUNG';
  trangThaiPheDuyet: 'CHO_PHE_DUYET' | 'DUOC_PHE_DUYET' | 'TU_CHOI';
  orgUnitId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CauCangListQuery {
  search?: string;
  status?: 'HIEN_HANH' | 'TAM_NGUNG';
  approvalStatus?: 'CHO_PHE_DUYET' | 'DUOC_PHE_DUYET' | 'TU_CHOI';
  benCangId?: string;
  orgUnitId?: string;
  sortBy?: 'maCau' | 'tenCau' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface CauCangCreateRequest {
  maCau: string;
  tenCau: string;
  benCangId: string;
  chieuDai?: number;
  taiTrong?: number;
  loaiCau?: string;
  trangThaiHoatDong?: 'HIEN_HANH' | 'TAM_NGUNG';
}

export interface CauCangUpdateRequest {
  id: string;
  tenCau?: string;
  benCangId?: string;
  chieuDai?: number;
  taiTrong?: number;
  loaiCau?: string;
  trangThaiHoatDong?: 'HIEN_HANH' | 'TAM_NGUNG';
}

export interface CauCangHistoryRecord {
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
  tenBen: string;
}

export type ApproveAction = 'APPROVE' | 'REJECT';
