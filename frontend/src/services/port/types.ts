// ── Port Response (matches CangBienResponse.java exactly) ─
// BigDecimal fields are serialized as JSON number by Spring.

export interface CangBienResponse {
  id: string;
  portCode: string;
  portName: string;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
  area: number | null;
  khaNangTiepNhan: number | null;
  operationalStatus: string | null;
  approvalStatus: string | null;
  orgUnitId: string | null;
  portGroup: number | null;
  bieuTuongId: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  // Extended fields (V53)
  diaDiemChiTiet: string | null;
  phanCap: number | null;
  heQuyChieu: number | null;
  quyTacHienThi: number | null;
  // zobjDataSub fields
  phamViVungNuoc: string | null;
  tongSoBenCang: number | null;
  tongSoKhuNeoDauChuyenTai: number | null;
  tongSoTuyenLuongCongCong: number | null;
  tongSoTuyenLuongChuyenDung: number | null;
  tongChieuDaiLuongCongCong: number | null;
  tongChieuDaiLuongChuyenDung: number | null;
  tongSoPhaoTieuBaoHieu: number | null;
  tongSoDeKe: number | null;
  tongChieuDaiDeKe: number | null;
  tongSoDenBienDangTieu: number | null;
  quantityBenPhao: number | null;
  quantityKhuNeoDau: number | null;
  quantityKhuChuyenTai: number | null;
  cacKhuNuocKhac: string | null;
  remarks: string | null;
  loaiHinhHoc?: string;
  toaDo?: string;
}

// ── CreateCangBienRequest (matches CreateCangBienRequest.java) ─

export interface CreateCangBienRequest {
  portCode: string;
  portName: string;
  province?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  area: number;
  khaNangTiepNhan?: number | null;
  operationalStatus?: string | null;
  approvalStatus?: string | null;
  orgUnitId?: string | null;
  portGroup?: number | null;
  bieuTuongId?: string | null;
  // Extended fields (V53)
  diaDiemChiTiet?: string | null;
  phanCap?: number | null;
  heQuyChieu?: number | null;
  quyTacHienThi?: number | null;
  // zobjDataSub fields
  phamViVungNuoc?: string | null;
  tongSoBenCang?: number | null;
  tongSoKhuNeoDauChuyenTai?: number | null;
  tongSoTuyenLuongCongCong?: number | null;
  tongSoTuyenLuongChuyenDung?: number | null;
  tongChieuDaiLuongCongCong?: number | null;
  tongChieuDaiLuongChuyenDung?: number | null;
  tongSoPhaoTieuBaoHieu?: number | null;
  tongSoDeKe?: number | null;
  tongChieuDaiDeKe?: number | null;
  tongSoDenBienDangTieu?: number | null;
  quantityBenPhao?: number | null;
  quantityKhuNeoDau?: number | null;
  quantityKhuChuyenTai?: number | null;
  cacKhuNuocKhac?: string | null;
  remarks?: string | null;
}

// ── UpdateCangBienRequest (matches UpdateCangBienRequest.java) ─

export interface UpdateCangBienRequest {
  id: string;
  portName?: string | null;
  province?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  area?: number | null;
  khaNangTiepNhan?: number | null;
  operationalStatus?: string | null;
  orgUnitId?: string | null;
  portGroup?: number | null;
  bieuTuongId?: string | null;
  // Extended fields (V53)
  diaDiemChiTiet?: string | null;
  phanCap?: number | null;
  heQuyChieu?: number | null;
  quyTacHienThi?: number | null;
  // zobjDataSub fields
  phamViVungNuoc?: string | null;
  tongSoBenCang?: number | null;
  tongSoKhuNeoDauChuyenTai?: number | null;
  tongSoTuyenLuongCongCong?: number | null;
  tongSoTuyenLuongChuyenDung?: number | null;
  tongChieuDaiLuongCongCong?: number | null;
  tongChieuDaiLuongChuyenDung?: number | null;
  tongSoPhaoTieuBaoHieu?: number | null;
  tongSoDeKe?: number | null;
  tongChieuDaiDeKe?: number | null;
  tongSoDenBienDangTieu?: number | null;
  quantityBenPhao?: number | null;
  quantityKhuNeoDau?: number | null;
  quantityKhuChuyenTai?: number | null;
  cacKhuNuocKhac?: string | null;
  remarks?: string | null;
}

// ── ChangeHistory record (matches LichSuThayDoi.java) ─

export interface ChangeHistory {
  id: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string | null;
  changedAt: string | null;
  createdAt: string | null;
}

// ── Paginated response (Spring Data Page) ─

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ── ApiResponse envelope (matches ApiResponse.java wrapper) ─

export interface ApiResponseEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── Approval result (from approve/reject endpoints — returns void wrapper) ─

export interface ApprovalResult {
  success: boolean;
  message: string;
  data: null;
}

// ── Approval history line ─

export interface ApprovalHistoryLine {
  id: string;
  entityId: string;
  approvedBy: string | null;
  approvedAt: string | null;
  approved: boolean;
  reason: string | null;
}
