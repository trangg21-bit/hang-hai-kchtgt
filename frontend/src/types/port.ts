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

export interface Port {
  id: string;
  portCode: string;
  portName: string;
  province: string;

  area: number;
  khaNangTiepNhan: number;
  operationalStatus: string;
  approvalStatus: string;
  orgUnitId: string;
  portGroup?: number;
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
  quantityBenPhao?: number;
  quantityKhuNeoDau?: number;
  quantityKhuChuyenTai?: number;
  cacKhuNuocKhac?: string;
  remarks?: string;
}

export interface CreateCangBienRequest {
  portCode: string;
  portName: string;
  province: string;

  area: number;
  khaNangTiepNhan: number;
  operationalStatus: string;
  approvalStatus: string;
  orgUnitId: string;
  portGroup?: number;
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
  quantityBenPhao?: number;
  quantityKhuNeoDau?: number;
  quantityKhuChuyenTai?: number;
  cacKhuNuocKhac?: string;
  remarks?: string;
}

export interface UpdateCangBienRequest {
  portCode?: string;
  portName?: string;
  province?: string;

  area?: number;
  khaNangTiepNhan?: number;
  bieuTuongId?: string | null;
  operationalStatus?: string;
  approvalStatus?: string;
  orgUnitId?: string;
  portGroup?: number;
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
  quantityBenPhao?: number;
  quantityKhuNeoDau?: number;
  quantityKhuChuyenTai?: number;
  cacKhuNuocKhac?: string;
  remarks?: string;
}

// ── 2. Bến Cảng ──────────────────────────────────────────────────────
// All field names match BE exactly (Berth.java, BenCangResponse.java).
// berthType is free text (no enum). latitude/longitude are optional.

export interface Berth {
  id: string;
  berthCode: string;
  berthName: string;
  portId: string;
  tenCangBien?: string;
  tuyenDuongThuy?: string;

  length?: number;
  width?: number;
  berthType?: string;
  doSauLuong?: number;
  operationalCapacity?: string;
  operationalStatus?: string;
  approvalStatus: string;
  orgUnitId?: string;
  bieuTuongId?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  // Extended fields
  location?: string;
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
  structureType?: number;
}

export interface CreateBenCangRequest {
  berthCode: string;
  berthName: string;
  portId: string;
  tuyenDuongThuy?: string;

  length?: number;
  width?: number;
  berthType?: string;
  doSauLuong?: number;
  operationalCapacity?: string;
  operationalStatus?: string;
  bieuTuongId?: string;
  // Extended fields
  orgUnitId?: string;
  location?: string;
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
  structureType?: number;
}

export interface UpdateBenCangRequest {
  id: string;
  berthName?: string;
  portId?: string;
  tuyenDuongThuy?: string;

  length?: number;
  width?: number;
  berthType?: string;
  doSauLuong?: number;
  operationalCapacity?: string;
  operationalStatus?: string;
  bieuTuongId?: string | null;
  // Extended fields
  orgUnitId?: string;
  location?: string;
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
  structureType?: number;
}

// ── 3. Cầu Cảng ──────────────────────────────────────────────────────

export interface Pier {
  id: string;
  pierCode: string;
  pierName: string;
  berthId: string;
  tenBenCang?: string;
  length: number;
  taiTrong: number;
  loaiCau: string;
  operationalStatus: string;
  approvalStatus: string;
  orgUnitId: string;
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
  pierCode: string;
  pierName: string;
  berthId: string;
  length: number;
  taiTrong: number;
  loaiCau: string;
  operationalStatus: string;
  approvalStatus: string;
  bieuTuongId?: string;
  loaiHinhHoc?: 'POINT' | 'LINE' | 'POLYGON';
  toaDo?: string;
}

export interface UpdateCauCangRequest {
  id: string;
  pierCode?: string;
  pierName?: string;
  berthId?: string;
  length?: number;
  taiTrong?: number;
  loaiCau?: string;
  operationalStatus?: string;
  approvalStatus?: string;
  bieuTuongId?: string | null;
  loaiHinhHoc?: 'POINT' | 'LINE' | 'POLYGON';
  toaDo?: string;
}

// ── 4. Cảng cạn ──────────────────────────────────────────────────────

export interface DryPort {
  id: string;
  dryPortCode: string;
  dryPortName: string;
  province: string;

  area: number;
  congSuatTEU: number;
  operationalStatus: string;
  approvalStatus: string;
  orgUnitId: string;
  bieuTuongId?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCangCanRequest {
  dryPortCode: string;
  dryPortName: string;
  province: string;

  area: number;
  congSuatTEU: number;
  operationalStatus: string;
  approvalStatus: string;
  orgUnitId: string;
  bieuTuongId?: string;
}

export interface UpdateCangCanRequest {
  dryPortCode?: string;
  dryPortName?: string;
  province?: string;

  area?: number;
  congSuatTEU?: number;
  operationalStatus?: string;
  approvalStatus?: string;
  bieuTuongId?: string | null;
}

// ── 5. Vùng nước ─────────────────────────────────────────────────────

export interface WaterZone {
  id: string;
  waterZoneCode: string;
  waterZoneName: string;
  portId: string;
  tenCangBien?: string;
  area: number;
  doSauMax: number;
  doSauTrungBinh: number;
  loaiVungNuoc: string;
  operationalStatus: string;
  approvalStatus: string;
  orgUnitId: string;
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
  waterZoneCode: string;
  waterZoneName: string;
  portId: string;
  area: number;
  doSauMax: number;
  doSauTrungBinh: number;
  loaiVungNuoc: string;
  operationalStatus: string;
  approvalStatus: string;
  bieuTuongId?: string;
  loaiHinhHoc?: 'POINT' | 'LINE' | 'POLYGON';
  toaDo?: string;
}

export interface UpdateVungNuocRequest {
  id: string;
  waterZoneCode?: string;
  waterZoneName?: string;
  portId?: string;
  area?: number;
  doSauMax?: number;
  doSauTrungBinh?: number;
  loaiVungNuoc?: string;
  operationalStatus?: string;
  approvalStatus?: string;
  bieuTuongId?: string | null;
  loaiHinhHoc?: 'POINT' | 'LINE' | 'POLYGON';
  toaDo?: string;
}

export const VUNGNUOOC_LOAI_OPTIONS = [
  { label: 'Khu neo đậu', value: 'NEO_DAU' },
  { label: 'Khu kiểm dịch', value: 'KIEM_DICH' },
  { label: 'Khu đón trả hoa tiêu', value: 'DON_TRA_HOA_TIEU' },
  { label: 'Vùng quay trở tàu', value: 'QUAY_TRO_TAU' },
  { label: 'Bến phao', value: 'BEN_PHAO' },
  { label: 'Khu chuyển tải', value: 'CHUYEN_TAI' },
  { label: 'Khu tránh trú bão', value: 'TRANH_BAO' },
];

export const VUNGNUOOC_LOAI_MAP = {
  NEO_DAU: { color: 'blue', label: 'Khu neo đậu' },
  KIEM_DICH: { color: 'cyan', label: 'Khu kiểm dịch' },
  DON_TRA_HOA_TIEU: { color: 'pink', label: 'Khu đón trả hoa tiêu' },
  QUAY_TRO_TAU: { color: 'orange', label: 'Vùng quay trở tàu' },
  BEN_PHAO: { color: 'purple', label: 'Bến phao' },
  CHUYEN_TAI: { color: 'geekblue', label: 'Khu chuyển tải' },
  TRANH_BAO: { color: 'red', label: 'Khu tránh trú bão' },
};
