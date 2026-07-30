// ============================================================
// Berth — TypeScript types (BE ground truth)
// portStatus is the SINGLE status field (replaces operationalStatus + approvalStatus)
// ============================================================

export interface BenCangEntity {
  id: string;
  berthCode: string;
  berthName: string;
  portId: string;
  tenCangBien?: string;
  waterway?: string;
  latitude?: number;
  longitude?: number;
  length?: number;
  width?: number;
  berthType?: string;
  channelDepth?: number;
  portStatus: string;   // NHAP | CHO_PHE_DUYET | DA_PHE_DUYET | TU_CHOI | TAM_NGUNG
  orgUnitId?: string;
  operationalFunction?: string;
  mapSymbolId?: string;
  spatialId?: string;
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
  bieuTuongId?: string;
  // Extra
  locationCode?: string;
  detailedLocation?: string;
  coordinateSystem?: string;
  displayRule?: string;
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

// API wrapper shapes
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// History record from GET /{id}/history
export interface ChangeHistoryRecord {
  id?: string;
  fieldName: string;
  oldValue?: string;
  newValue?: string;
  changedBy?: string;
  changedAt?: string;
  reason?: string;
}

// Sort options for list page
export type SortField = "berthCode" | "berthName" | "createdAt" | "updatedAt";
export type SortOrder = "asc" | "desc";

// List filter query params
export interface BenCangListFilters {
  search?: string;
  portStatus?: string;
  portId?: string;
  orgUnitId?: string;
  sortBy: SortField;
  sortOrder: SortOrder;
  page: number;
  pageSize: number;
}
