// ── Status types (shared across all CangBen entities) ────────────────

// ── Activity status (trang_thai_hoat_dong) ────────────────────────
export type CangBenActivityStatus = 'HIỆN_HÀNH' | 'TẠM_NGƯNG';

export const ACTIVITY_STATUS_MAP: Record<CangBenActivityStatus, { color: string; label: string }> = {
  'HIỆN_HÀNH': { color: 'green', label: 'Hiện hành' },
  'TẠM_NGƯNG': { color: 'orange', label: 'Tạm ngừng' },
};

// ── Approval status (trang_thai_phe_duyet) ────────────────────────
export type CangBenApprovalStatus = 'CHO_PHE_DUYET' | 'DUOC_PHE_DUYET' | 'TU_CHOI';

export const APPROVAL_STATUS_MAP: Record<CangBenApprovalStatus, { color: string; label: string }> = {
  CHO_PHE_DUYET: { color: 'orange', label: 'Chờ phê duyệt' },
  DUOC_PHE_DUYET: { color: 'green', label: 'Được phê duyệt' },
  TU_CHOI: { color: 'red', label: 'Từ chối' },
};

// Legacy map (kept for backward compatibility with existing pages)
export type CangBenStatus = CangBenApprovalStatus;
export const BECBANG_STATUS_MAP = APPROVAL_STATUS_MAP;
export const BECBANG_APPROVAL_STATUS_MAP = APPROVAL_STATUS_MAP;

// ── 1. Cảng Biển ─────────────────────────────────────────────────────

export interface CangBien {
  id: string;
  maCang: string;
  tenCang: string;
  tinhThanhPho: string;
  viDo: number;
  kinhDo: number;
  dienTich: number;
  khaNangTiepNhan: number;
  trangThaiHoatDong: string;
  trangThaiPheDuyet: string;
  orgUnitId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCangBienRequest {
  maCang: string;
  tenCang: string;
  tinhThanhPho: string;
  viDo: number;
  kinhDo: number;
  dienTich: number;
  khaNangTiepNhan: number;
  trangThaiHoatDong: string;
  trangThaiPheDuyet: string;
  orgUnitId: string;
}

export interface UpdateCangBienRequest {
  maCang?: string;
  tenCang?: string;
  tinhThanhPho?: string;
  viDo?: number;
  kinhDo?: number;
  dienTich?: number;
  khaNangTiepNhan?: number;
  trangThaiHoatDong?: string;
  trangThaiPheDuyet?: string;
}

// ── 2. Bến Cảng ──────────────────────────────────────────────────────
// All field names match BE exactly (BenCang.java, BenCangResponse.java).
// loaiBen is free text (no enum). viDo/kinhDo are optional.

export interface BenCang {
  id: string;
  maBen: string;
  tenBen: string;
  cangBienId: string;
  tuyenDuongThuy?: string;
  viDo?: number;
  kinhDo?: number;
  chieuDai?: number;
  chieuRong?: number;
  loaiBen?: string;
  doSauLuong?: number;
  trangThaiHoatDong?: string;
  trangThaiPheDuyet: string;
  orgUnitId?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBenCangRequest {
  maBen: string;
  tenBen: string;
  cangBienId: string;
  tuyenDuongThuy?: string;
  viDo?: number;
  kinhDo?: number;
  chieuDai?: number;
  chieuRong?: number;
  loaiBen?: string;
  doSauLuong?: number;
  trangThaiHoatDong?: string;
}

export interface UpdateBenCangRequest {
  id: string;
  tenBen?: string;
  cangBienId?: string;
  tuyenDuongThuy?: string;
  viDo?: number;
  kinhDo?: number;
  chieuDai?: number;
  chieuRong?: number;
  loaiBen?: string;
  doSauLuong?: number;
  trangThaiHoatDong?: string;
}

// ── 3. Cầu Cảng ──────────────────────────────────────────────────────

export interface CauCang {
  id: string;
  maCau: string;
  tenCau: string;
  benCangId: string;
  chieuDai: number;
  taiTrong: number;
  loaiCau: string;
  trangThaiHoatDong: string;
  trangThaiPheDuyet: string;
  orgUnitId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCauCangRequest {
  maCau: string;
  tenCau: string;
  benCangId: string;
  chieuDai: number;
  taiTrong: number;
  loaiCau: string;
  trangThaiHoatDong: string;
  trangThaiPheDuyet: string;
  orgUnitId: string;
}

export interface UpdateCauCangRequest {
  maCau?: string;
  tenCau?: string;
  benCangId?: string;
  chieuDai?: number;
  taiTrong?: number;
  loaiCau?: string;
  trangThaiHoatDong?: string;
  trangThaiPheDuyet?: string;
}

// ── 4. Cảng cạn ──────────────────────────────────────────────────────

export interface CangCan {
  id: string;
  maCangCan: string;
  tenCangCan: string;
  tinhThanhPho: string;
  viDo: number;
  kinhDo: number;
  dienTich: number;
  congSuatTEU: number;
  trangThaiHoatDong: string;
  trangThaiPheDuyet: string;
  orgUnitId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCangCanRequest {
  maCangCan: string;
  tenCangCan: string;
  tinhThanhPho: string;
  viDo: number;
  kinhDo: number;
  dienTich: number;
  congSuatTEU: number;
  trangThaiHoatDong: string;
  trangThaiPheDuyet: string;
  orgUnitId: string;
}

export interface UpdateCangCanRequest {
  maCangCan?: string;
  tenCangCan?: string;
  tinhThanhPho?: string;
  viDo?: number;
  kinhDo?: number;
  dienTich?: number;
  congSuatTEU?: number;
  trangThaiHoatDong?: string;
  trangThaiPheDuyet?: string;
}

// ── 5. Vùng nước ─────────────────────────────────────────────────────

export interface VungNuoc {
  id: string;
  maVungNuoc: string;
  tenVungNuoc: string;
  cangBienId: string;
  dienTich: number;
  doSauMax: number;
  doSauTrungBinh: number;
  loaiVungNuoc: string;
  trangThaiHoatDong: string;
  trangThaiPheDuyet: string;
  orgUnitId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVungNuocRequest {
  maVungNuoc: string;
  tenVungNuoc: string;
  cangBienId: string;
  dienTich: number;
  doSauMax: number;
  doSauTrungBinh: number;
  loaiVungNuoc: string;
  trangThaiHoatDong: string;
  trangThaiPheDuyet: string;
  orgUnitId: string;
}

export interface UpdateVungNuocRequest {
  maVungNuoc?: string;
  tenVungNuoc?: string;
  cangBienId?: string;
  dienTich?: number;
  doSauMax?: number;
  doSauTrungBinh?: number;
  loaiVungNuoc?: string;
  trangThaiHoatDong?: string;
  trangThaiPheDuyet?: string;
}
