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
  nhomCangBien?: number;
  bieuTuongId?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  // Extended fields (V53)
  diaDiemChiTiet?: string;
  phanCap?: number;
  heQuyChieu?: number;
  quyTacHienThi?: number;
  // zobjDataSub fields
  phamViVungNuoc?: string;
  tongSoBenCang?: number;
  tongSoKhuNeoDauChuyenTai?: number;
  tongSoTuyenLuongCongCong?: number;
  tongSoTuyenLuongChuyenDung?: number;
  tongChieuDaiLuongCongCong?: number;
  tongChieuDaiLuongChuyenDung?: number;
  tongSoPhaoTieuBaoHieu?: number;
  tongSoDeKe?: number;
  tongChieuDaiDeKe?: number;
  tongSoDenBienDangTieu?: number;
  soLuongBenPhao?: number;
  soLuongKhuNeoDau?: number;
  soLuongKhuChuyenTai?: number;
  cacKhuNuocKhac?: string;
  ghiChu?: string;
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
  nhomCangBien?: number;
  bieuTuongId?: string;
  // Extended fields (V53)
  diaDiemChiTiet?: string;
  phanCap?: number;
  heQuyChieu?: number;
  quyTacHienThi?: number;
  // zobjDataSub fields
  phamViVungNuoc?: string;
  tongSoBenCang?: number;
  tongSoKhuNeoDauChuyenTai?: number;
  tongSoTuyenLuongCongCong?: number;
  tongSoTuyenLuongChuyenDung?: number;
  tongChieuDaiLuongCongCong?: number;
  tongChieuDaiLuongChuyenDung?: number;
  tongSoPhaoTieuBaoHieu?: number;
  tongSoDeKe?: number;
  tongChieuDaiDeKe?: number;
  tongSoDenBienDangTieu?: number;
  soLuongBenPhao?: number;
  soLuongKhuNeoDau?: number;
  soLuongKhuChuyenTai?: number;
  cacKhuNuocKhac?: string;
  ghiChu?: string;
}

export interface UpdateCangBienRequest {
  maCang?: string;
  tenCang?: string;
  tinhThanhPho?: string;
  viDo?: number;
  kinhDo?: number;
  dienTich?: number;
  khaNangTiepNhan?: number;
  bieuTuongId?: string | null;
  trangThaiHoatDong?: string;
  trangThaiPheDuyet?: string;
  orgUnitId?: string;
  nhomCangBien?: number;
  // Extended fields (V53)
  diaDiemChiTiet?: string;
  phanCap?: number;
  heQuyChieu?: number;
  quyTacHienThi?: number;
  // zobjDataSub fields
  phamViVungNuoc?: string;
  tongSoBenCang?: number;
  tongSoKhuNeoDauChuyenTai?: number;
  tongSoTuyenLuongCongCong?: number;
  tongSoTuyenLuongChuyenDung?: number;
  tongChieuDaiLuongCongCong?: number;
  tongChieuDaiLuongChuyenDung?: number;
  tongSoPhaoTieuBaoHieu?: number;
  tongSoDeKe?: number;
  tongChieuDaiDeKe?: number;
  tongSoDenBienDangTieu?: number;
  soLuongBenPhao?: number;
  soLuongKhuNeoDau?: number;
  soLuongKhuChuyenTai?: number;
  cacKhuNuocKhac?: string;
  ghiChu?: string;
}

// ── 2. Bến Cảng ──────────────────────────────────────────────────────
// All field names match BE exactly (BenCang.java, BenCangResponse.java).
// loaiBen is free text (no enum). viDo/kinhDo are optional.

export interface BenCang {
  id: string;
  maBen: string;
  tenBen: string;
  cangBienId: string;
  tenCangBien?: string;
  tuyenDuongThuy?: string;
  viDo?: number;
  kinhDo?: number;
  chieuDai?: number;
  chieuRong?: number;
  loaiBen?: string;
  doSauLuong?: number;
  congNangKhaiThac?: string;
  trangThaiHoatDong?: string;
  trangThaiPheDuyet: string;
  orgUnitId?: string;
  bieuTuongId?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  // Extended fields
  diaDiem?: string;
  diaDiemChiTiet?: string;
  heQuyChieu?: number;
  quyTacHienThi?: number;
  donViKhaiThac?: string;
  tongDienTich?: number;
  nangLucThongQuaThietKe?: number;
  nangLucThongQuaHienTrang?: number;
  coTauTiepNhanLonNhat?: number;
  quyHoachNangLucThongQua?: number;
  sanLuongHangHoaNamGanNhat?: number;
  thoiDiemCongBoMo?: string;
  quyetDinhCongBo?: string;
  vanBanThoaThuanDauTu?: string;
  loaiKetCau?: number;
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
  congNangKhaiThac?: string;
  trangThaiHoatDong?: string;
  bieuTuongId?: string;
  // Extended fields
  orgUnitId?: string;
  diaDiem?: string;
  diaDiemChiTiet?: string;
  heQuyChieu?: number;
  quyTacHienThi?: number;
  donViKhaiThac?: string;
  tongDienTich?: number;
  nangLucThongQuaThietKe?: number;
  nangLucThongQuaHienTrang?: number;
  coTauTiepNhanLonNhat?: number;
  quyHoachNangLucThongQua?: number;
  sanLuongHangHoaNamGanNhat?: number;
  thoiDiemCongBoMo?: string;
  quyetDinhCongBo?: string;
  vanBanThoaThuanDauTu?: string;
  loaiKetCau?: number;
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
  congNangKhaiThac?: string;
  trangThaiHoatDong?: string;
  bieuTuongId?: string | null;
  // Extended fields
  orgUnitId?: string;
  diaDiem?: string;
  diaDiemChiTiet?: string;
  heQuyChieu?: number;
  quyTacHienThi?: number;
  donViKhaiThac?: string;
  tongDienTich?: number;
  nangLucThongQuaThietKe?: number;
  nangLucThongQuaHienTrang?: number;
  coTauTiepNhanLonNhat?: number;
  quyHoachNangLucThongQua?: number;
  sanLuongHangHoaNamGanNhat?: number;
  thoiDiemCongBoMo?: string;
  quyetDinhCongBo?: string;
  vanBanThoaThuanDauTu?: string;
  loaiKetCau?: number;
}

// ── 3. Cầu Cảng ──────────────────────────────────────────────────────

export interface CauCang {
  id: string;
  maCau: string;
  tenCau: string;
  benCangId: string;
  tenBenCang?: string;
  chieuDai: number;
  taiTrong: number;
  loaiCau: string;
  trangThaiHoatDong: string;
  trangThaiPheDuyet: string;
  donViId: string;
  bieuTuongId?: string;
  khongGianId?: string;
  loaiHinhHoc?: 'POINT' | 'LINE' | 'POLYGON';
  toaDo?: string;
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
  bieuTuongId?: string;
  loaiHinhHoc?: 'POINT' | 'LINE' | 'POLYGON';
  toaDo?: string;
}

export interface UpdateCauCangRequest {
  id: string;
  maCau?: string;
  tenCau?: string;
  benCangId?: string;
  chieuDai?: number;
  taiTrong?: number;
  loaiCau?: string;
  trangThaiHoatDong?: string;
  trangThaiPheDuyet?: string;
  bieuTuongId?: string | null;
  loaiHinhHoc?: 'POINT' | 'LINE' | 'POLYGON';
  toaDo?: string;
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
  bieuTuongId?: string;
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
  bieuTuongId?: string;
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
  bieuTuongId?: string | null;
}

// ── 5. Vùng nước ─────────────────────────────────────────────────────

export interface VungNuoc {
  id: string;
  maVungNuoc: string;
  tenVungNuoc: string;
  cangBienId: string;
  tenCangBien?: string;
  dienTich: number;
  doSauMax: number;
  doSauTrungBinh: number;
  loaiVungNuoc: string;
  trangThaiHoatDong: string;
  trangThaiPheDuyet: string;
  donViId: string;
  bieuTuongId?: string;
  khongGianId?: string;
  loaiHinhHoc?: 'POINT' | 'LINE' | 'POLYGON';
  toaDo?: string;
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
  bieuTuongId?: string;
  loaiHinhHoc?: 'POINT' | 'LINE' | 'POLYGON';
  toaDo?: string;
}

export interface UpdateVungNuocRequest {
  id: string;
  maVungNuoc?: string;
  tenVungNuoc?: string;
  cangBienId?: string;
  dienTich?: number;
  doSauMax?: number;
  doSauTrungBinh?: number;
  loaiVungNuoc?: string;
  trangThaiHoatDong?: string;
  trangThaiPheDuyet?: string;
  bieuTuongId?: string | null;
  loaiHinhHoc?: 'POINT' | 'LINE' | 'POLYGON';
  toaDo?: string;
}
