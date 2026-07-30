// ── Port Response (matches the NEW backend contract) ─
// portStatus replaces operationalStatus + approvalStatus

export interface PortCoordinate {
  id?: string;
  latitude: number;
  longitude: number;
  sortOrder: number;
}

export interface PortInfrastructure {
  id?: string;
  sequenceNumber: number;
  infrastructureName: string;
  quantity: number;
}

export interface Attachment {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  contentType: string;
}

export interface CangBienResponse {
  id: string;
  portCode: string;
  portName: string;
  province: string | null;
  area: number | null;
  maxVesselCapacity: number | null;
  portStatus: string | null;           // unified status: NHAP | CHO_PHE_DUYET | DA_PHE_DUYET | TU_CHOI | TAM_NGUNG | DA_XOA
  orgUnitId: string | null;
  managingUnitId: string | null;       // NEW: Đơn vị quản lý
  portGroup: number | null;
  mapSymbolId: string | null;
  spatialId: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  // Extended fields
  detailedLocation: string | null;
  portClass: number | null;
  coordinateSystem: number | null;
  displayRule: number | null;
  waterAreaScope: string | null;
  // 14 composite indicator fields
  totalBerth: number | null;
  totalAnchorageTransshipment: number | null;
  totalPublicChannel: number | null;
  totalDedicatedChannel: number | null;
  totalPublicChannelLength: number | null;
  totalDedicatedChannelLength: number | null;
  totalBeaconMarker: number | null;
  totalDikeRevetment: number | null;
  totalDikeRevetmentLength: number | null;
  totalLighthouseBeacon: number | null;
  buoyBerthCount: number | null;
  anchorageCount: number | null;
  transshipmentCount: number | null;
  otherWaterAreas: string | null;
  remarks: string | null;
  // Portable GIS fields (kept from old schema)
  loaiHinhHoc?: string;
  toaDo?: string;
  latitude?: number;            // BACKWARD COMPAT: first coordinate's latitude
  longitude?: number;           // BACKWARD COMPAT: first coordinate's longitude
  // Legacy aliases (for old pages)
  khaNangTiepNhan?: number;     // alias for maxVesselCapacity
  bieuTuongId?: string;         // alias for mapSymbolId
  operationalStatus?: string;   // derived from portStatus
  approvalStatus?: string;      // derived from portStatus
  diaDiemChiTiet?: string;      // alias for detailedLocation
  phanCap?: number;             // alias for portClass
  heQuyChieu?: number;          // alias for coordinateSystem
  quyTacHienThi?: number;       // alias for displayRule
  phamViVungNuoc?: string;      // alias for waterAreaScope
  tongSoBenCang?: number;       // alias for totalBerth
  tongSoKhuNeoDauChuyenTai?: number; // alias for totalAnchorageTransshipment
  tongSoTuyenLuongCongCong?: number; // alias for totalPublicChannel
  tongSoTuyenLuongChuyenDung?: number; // alias for totalDedicatedChannel
  tongChieuDaiLuongCongCong?: number; // alias for totalPublicChannelLength
  tongChieuDaiLuongChuyenDung?: number; // alias for totalDedicatedChannelLength
  tongSoPhaoTieuBaoHieu?: number; // alias for totalBeaconMarker
  tongSoDeKe?: number;          // alias for totalDikeRevetment
  tongChieuDaiDeKe?: number;    // alias for totalDikeRevetmentLength
  tongSoDenBienDangTieu?: number; // alias for totalLighthouseBeacon
  quantityBenPhao?: number;     // alias for buoyBerthCount
  quantityKhuNeoDau?: number;   // alias for anchorageCount
  quantityKhuChuyenTai?: number; // alias for transshipmentCount
  cacKhuNuocKhac?: string;      // alias for otherWaterAreas
  // NEW fields
  notes: string | null;
  portCoordinates: PortCoordinate[];
  portInfrastructures: PortInfrastructure[];
  attachments: Attachment[];
}

// ── CreateCangBienRequest (matches new POST body) ─
// portCode is auto-generated, NOT in the payload

export interface CreateCangBienRequest {
  portName: string;
  province?: string | null;
  area: number;
  maxVesselCapacity?: number | null;
  action: 'draft' | 'submit';          // required: "draft" or "submit"
  orgUnitId?: string | null;
  managingUnitId?: string | null;       // NEW
  portGroup?: number | null;
  mapSymbolId?: string | null;
  spatialId?: string | null;
  // Extended fields
  detailedLocation?: string | null;
  portClass?: number | null;
  coordinateSystem?: number | null;
  displayRule?: number | null;
  waterAreaScope?: string | null;
  // 14 composite indicator fields
  totalBerth?: number | null;
  totalAnchorageTransshipment?: number | null;
  totalPublicChannel?: number | null;
  totalDedicatedChannel?: number | null;
  totalPublicChannelLength?: number | null;
  totalDedicatedChannelLength?: number | null;
  totalBeaconMarker?: number | null;
  totalDikeRevetment?: number | null;
  totalDikeRevetmentLength?: number | null;
  totalLighthouseBeacon?: number | null;
  buoyBerthCount?: number | null;
  anchorageCount?: number | null;
  transshipmentCount?: number | null;
  otherWaterAreas?: string | null;
  remarks?: string | null;
  loaiHinhHoc?: string;
  toaDo?: string;
  notes?: string | null;
  // Composite sub-resources
  portCoordinates?: PortCoordinate[];
  portInfrastructures?: PortInfrastructure[];
}

// ── UpdateCangBienRequest ─

export interface UpdateCangBienRequest {
  id: string;
  portName?: string | null;
  province?: string | null;
  area?: number | null;
  maxVesselCapacity?: number | null;
  orgUnitId?: string | null;
  managingUnitId?: string | null;
  portGroup?: number | null;
  mapSymbolId?: string | null;
  spatialId?: string | null;
  // Extended fields
  detailedLocation?: string | null;
  portClass?: number | null;
  coordinateSystem?: number | null;
  displayRule?: number | null;
  waterAreaScope?: string | null;
  // 14 composite indicator fields
  totalBerth?: number | null;
  totalAnchorageTransshipment?: number | null;
  totalPublicChannel?: number | null;
  totalDedicatedChannel?: number | null;
  totalPublicChannelLength?: number | null;
  totalDedicatedChannelLength?: number | null;
  totalBeaconMarker?: number | null;
  totalDikeRevetment?: number | null;
  totalDikeRevetmentLength?: number | null;
  totalLighthouseBeacon?: number | null;
  buoyBerthCount?: number | null;
  anchorageCount?: number | null;
  transshipmentCount?: number | null;
  otherWaterAreas?: string | null;
  remarks?: string | null;
  loaiHinhHoc?: string;
  toaDo?: string;
  notes?: string | null;
  portCoordinates?: PortCoordinate[];
  portInfrastructures?: PortInfrastructure[];
}

// ── Children summary (from GET /:id/children) ─

export interface PortChildrenSummary {
  berths: number;
  waterZones: number;
}

// ── ChangeHistory record ─

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

// ── ApiResponse envelope ─

export interface ApiResponseEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── Approval result ─

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
