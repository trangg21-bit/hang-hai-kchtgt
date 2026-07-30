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

// ── PortStatus (NEW unified status replacing operationalStatus + approvalStatus) ─

export type PortStatusValue = 'NHAP' | 'CHO_PHE_DUYET' | 'DA_PHE_DUYET' | 'TU_CHOI' | 'TAM_NGUNG' | 'DA_XOA';

import { statusDraft, statusAttention, statusOperational, statusCritical } from '../tokens';

export const PORT_STATUS_MAP: Record<string, { color: string; label: string }> = {
  NHAP: { color: statusDraft, label: 'Nháp' },
  CHO_PHE_DUYET: { color: statusAttention, label: 'Chờ phê duyệt' },
  DA_PHE_DUYET: { color: statusOperational, label: 'Đã phê duyệt' },
  TU_CHOI: { color: statusCritical, label: 'Từ chối' },
  TAM_NGUNG: { color: statusAttention, label: 'Tạm ngừng' },
  DA_XOA: { color: statusDraft, label: 'Đã xóa' },
};

// ── 1. Cảng Biển ─────────────────────────────────────────────────────

export interface Port {
  id: string;
  portCode: string;
  portName: string;
  province: string;
  area: number;
  khaNangTiepNhan: number;
  portStatus: string;            // NEW: unified status
  // KEPT for backward compatibility (other entities still use them)
  operationalStatus?: string;
  approvalStatus?: string;
  orgUnitId: string;
  managingUnitId?: string;       // NEW
  portGroup?: number;
  bieuTuongId?: string;
  mapSymbolId?: string;
  spatialId?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  // Extended fields (V53)
  detailedLocation?: string;
  diaDiemChiTiet?: string;
  portClass?: number;
  phanCap?: number;
  coordinateSystem?: number;
  heQuyChieu?: number;
  displayRule?: number;
  quyTacHienThi?: number;
  waterAreaScope?: string;
  phamViVungNuoc?: string;
  // 14 composite indicator fields
  totalBerth?: number;
  tongSoBenCang?: number;
  totalAnchorageTransshipment?: number;
  tongSoKhuNeoDauChuyenTai?: number;
  totalPublicChannel?: number;
  tongSoTuyenLuongCongCong?: number;
  totalDedicatedChannel?: number;
  tongSoTuyenLuongChuyenDung?: number;
  totalPublicChannelLength?: number;
  tongChieuDaiLuongCongCong?: number;
  totalDedicatedChannelLength?: number;
  tongChieuDaiLuongChuyenDung?: number;
  totalBeaconMarker?: number;
  tongSoPhaoTieuBaoHieu?: number;
  totalDikeRevetment?: number;
  tongSoDeKe?: number;
  totalDikeRevetmentLength?: number;
  tongChieuDaiDeKe?: number;
  totalLighthouseBeacon?: number;
  tongSoDenBienDangTieu?: number;
  buoyBerthCount?: number;
  quantityBenPhao?: number;
  anchorageCount?: number;
  quantityKhuNeoDau?: number;
  transshipmentCount?: number;
  quantityKhuChuyenTai?: number;
  otherWaterAreas?: string;
  cacKhuNuocKhac?: string;
  remarks?: string;
  notes?: string;
  // Sub-resources
  portCoordinates?: Array<{ id?: string; latitude: number; longitude: number; sortOrder: number }>;
  portInfrastructures?: Array<{ id?: string; sequenceNumber: number; infrastructureName: string; quantity: number }>;
  attachments?: Array<{ id: string; fileName: string; filePath: string; fileSize: number; contentType: string }>;
}

export interface CreatePortRequest {
  portName: string;
  province?: string | null;
  area: number;
  khaNangTiepNhan?: number | null;
  action: 'draft' | 'submit';
  orgUnitId?: string | null;
  managingUnitId?: string | null;
  portGroup?: number | null;
  bieuTuongId?: string | null;
  mapSymbolId?: string | null;
  spatialId?: string | null;
  loaiHinhHoc?: string;
  toaDo?: string;
  detailedLocation?: string | null;
  diaDiemChiTiet?: string | null;
  portClass?: number | null;
  phanCap?: number | null;
  coordinateSystem?: number | null;
  heQuyChieu?: number | null;
  displayRule?: number | null;
  quyTacHienThi?: number | null;
  waterAreaScope?: string | null;
  phamViVungNuoc?: string | null;
  totalBerth?: number | null;
  tongSoBenCang?: number | null;
  totalAnchorageTransshipment?: number | null;
  tongSoKhuNeoDauChuyenTai?: number | null;
  totalPublicChannel?: number | null;
  tongSoTuyenLuongCongCong?: number | null;
  totalDedicatedChannel?: number | null;
  tongSoTuyenLuongChuyenDung?: number | null;
  totalPublicChannelLength?: number | null;
  tongChieuDaiLuongCongCong?: number | null;
  totalDedicatedChannelLength?: number | null;
  tongChieuDaiLuongChuyenDung?: number | null;
  totalBeaconMarker?: number | null;
  tongSoPhaoTieuBaoHieu?: number | null;
  totalDikeRevetment?: number | null;
  tongSoDeKe?: number | null;
  totalDikeRevetmentLength?: number | null;
  tongChieuDaiDeKe?: number | null;
  totalLighthouseBeacon?: number | null;
  tongSoDenBienDangTieu?: number | null;
  buoyBerthCount?: number | null;
  quantityBenPhao?: number | null;
  anchorageCount?: number | null;
  quantityKhuNeoDau?: number | null;
  transshipmentCount?: number | null;
  quantityKhuChuyenTai?: number | null;
  otherWaterAreas?: string | null;
  cacKhuNuocKhac?: string | null;
  remarks?: string | null;
  notes?: string | null;
  portCoordinates?: Array<{ latitude: number; longitude: number; sortOrder: number }>;
  portInfrastructures?: Array<{ sequenceNumber: number; infrastructureName: string; quantity: number }>;
}

export interface UpdatePortRequest {
  id: string;
  portName?: string | null;
  province?: string | null;
  area?: number | null;
  khaNangTiepNhan?: number | null;
  orgUnitId?: string | null;
  managingUnitId?: string | null;
  portGroup?: number | null;
  bieuTuongId?: string | null;
  mapSymbolId?: string | null;
  spatialId?: string | null;
  loaiHinhHoc?: string;
  toaDo?: string;
  detailedLocation?: string | null;
  diaDiemChiTiet?: string | null;
  portClass?: number | null;
  phanCap?: number | null;
  coordinateSystem?: number | null;
  heQuyChieu?: number | null;
  displayRule?: number | null;
  quyTacHienThi?: number | null;
  waterAreaScope?: string | null;
  phamViVungNuoc?: string | null;
  // 14 composite indicator fields
  totalBerth?: number | null;
  tongSoBenCang?: number | null;
  totalAnchorageTransshipment?: number | null;
  tongSoKhuNeoDauChuyenTai?: number | null;
  totalPublicChannel?: number | null;
  tongSoTuyenLuongCongCong?: number | null;
  totalDedicatedChannel?: number | null;
  tongSoTuyenLuongChuyenDung?: number | null;
  totalPublicChannelLength?: number | null;
  tongChieuDaiLuongCongCong?: number | null;
  totalDedicatedChannelLength?: number | null;
  tongChieuDaiLuongChuyenDung?: number | null;
  totalBeaconMarker?: number | null;
  tongSoPhaoTieuBaoHieu?: number | null;
  totalDikeRevetment?: number | null;
  tongSoDeKe?: number | null;
  totalDikeRevetmentLength?: number | null;
  tongChieuDaiDeKe?: number | null;
  totalLighthouseBeacon?: number | null;
  tongSoDenBienDangTieu?: number | null;
  buoyBerthCount?: number | null;
  quantityBenPhao?: number | null;
  anchorageCount?: number | null;
  quantityKhuNeoDau?: number | null;
  transshipmentCount?: number | null;
  quantityKhuChuyenTai?: number | null;
  otherWaterAreas?: string | null;
  cacKhuNuocKhac?: string | null;
  remarks?: string | null;
  notes?: string | null;
  portCoordinates?: Array<{ latitude: number; longitude: number; sortOrder: number }>;
  portInfrastructures?: Array<{ sequenceNumber: number; infrastructureName: string; quantity: number }>;
}

// ── 2. Bến Cảng ──────────────────────────────────────────────────────

export interface Berth {
  id: string;
  berthCode: string;
  berthName: string;
  portId: string;
  tenCangBien?: string;
  tuyenDuongThuy?: string;
  waterway?: string;

  length?: number;
  width?: number;
  berthType?: string;
  doSauLuong?: number;
  channelDepth?: number;
  operationalCapacity?: string;
  latitude?: number;
  longitude?: number;
  // Unified portStatus (replaces operationalStatus + approvalStatus)
  portStatus?: string;
  // KEPT for backward compatibility
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
  // GIS
  loaiHinhHoc?: string;
  toaDo?: string;
  // Extra new fields from API
  locationCode?: string;
  detailedLocation?: string;
  coordinateSystem?: number;
  displayRule?: number;
  operator?: string;
  totalArea?: number;
  designThroughput?: number;
  currentThroughput?: number;
  maxVesselSize?: number;
  plannedThroughput?: number;
  latestCargoVolume?: number;
  openingAnnouncementDate?: string;
  openingDecision?: string;
  investmentAgreement?: string;
}

export interface CreateBerthRequest {
  action: 'draft' | 'submit';
  berthCode: string;
  berthName: string;
  portId: string;
  waterway?: string;
  tuyenDuongThuy?: string;

  length?: number;
  width?: number;
  berthType?: string;
  channelDepth?: number;
  doSauLuong?: number;
  operationalCapacity?: string;
  operationalStatus?: string;
  bieuTuongId?: string;
  // Extended fields
  orgUnitId?: string;
  location?: string;
  locationCode?: string;
  detailedLocation?: string;
  coordinateSystem?: number;
  displayRule?: number;
  operator?: string;
  donViKhaiThac?: string;
  diaDiemChiTiet?: string;
  heQuyChieu?: number;
  quyTacHienThi?: number;
  totalArea?: number;
  tongDienTich?: number;
  designThroughput?: number;
  nangLucThongQuaThietKe?: number;
  currentThroughput?: number;
  nangLucThongQuaHienTrang?: number;
  maxVesselSize?: number;
  coTauTiepNhanLonNhat?: number;
  plannedThroughput?: number;
  quyHoachNangLucThongQua?: number;
  latestCargoVolume?: number;
  sanLuongHangHoaNamGanNhat?: number;
  thoiDiemCongBoMo?: string;
  openingAnnouncementDate?: string;
  openingDecision?: string;
  quyetDinhCongBo?: string;
  investmentAgreement?: string;
  vanBanThoaThuanDauTu?: string;
  structureType?: number;
}

export interface UpdateBerthRequest {
  id: string;
  berthName?: string;
  portId?: string;
  waterway?: string;
  tuyenDuongThuy?: string;

  length?: number;
  width?: number;
  berthType?: string;
  channelDepth?: number;
  doSauLuong?: number;
  operationalCapacity?: string;
  operationalStatus?: string;
  bieuTuongId?: string | null;
  // Extended fields
  orgUnitId?: string;
  location?: string;
  locationCode?: string;
  detailedLocation?: string;
  coordinateSystem?: number;
  displayRule?: number;
  operator?: string;
  donViKhaiThac?: string;
  diaDiemChiTiet?: string;
  heQuyChieu?: number;
  quyTacHienThi?: number;
  totalArea?: number;
  tongDienTich?: number;
  designThroughput?: number;
  nangLucThongQuaThietKe?: number;
  currentThroughput?: number;
  nangLucThongQuaHienTrang?: number;
  maxVesselSize?: number;
  coTauTiepNhanLonNhat?: number;
  plannedThroughput?: number;
  quyHoachNangLucThongQua?: number;
  latestCargoVolume?: number;
  sanLuongHangHoaNamGanNhat?: number;
  thoiDiemCongBoMo?: string;
  openingAnnouncementDate?: string;
  openingDecision?: string;
  quyetDinhCongBo?: string;
  investmentAgreement?: string;
  vanBanThoaThuanDauTu?: string;
  structureType?: number;
  action?: 'draft' | 'submit';
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

export interface CreatePierRequest {
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

export interface UpdatePierRequest {
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

export interface CreateDryPortRequest {
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

export interface UpdateDryPortRequest {
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

export interface CreateWaterZoneRequest {
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

export interface UpdateWaterZoneRequest {
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
