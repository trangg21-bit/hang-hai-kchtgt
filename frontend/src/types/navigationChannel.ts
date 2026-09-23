// NavigationChannel (Luồng hàng hải) — F-038..F-043
// Target model theo Excel 71 trường — design/00-design-plan.md mục 4 (F-038).
// #1-#46 editable (create/update), #47-#71 read-only do hệ thống ghi.

// ── #8 Tình trạng (ConditionStatus, ordinal SMALLINT trong DB) ────────────
export type ConditionStatus =
  | 'OPERATIONAL'
  | 'NOT_YET_OPERATIONAL'
  | 'SUSPENDED';

export const CONDITION_STATUS_OPTIONS: { value: ConditionStatus; label: string }[] = [
  { value: 'OPERATIONAL', label: 'Đang khai thác/vận hành' },
  { value: 'NOT_YET_OPERATIONAL', label: 'Chưa khai thác/vận hành' },
  { value: 'SUSPENDED', label: 'Dừng khai thác/vận hành' },
];

export const CONDITION_STATUS_MAP: Record<string, string> = {
  OPERATIONAL: 'Đang khai thác/vận hành',
  NOT_YET_OPERATIONAL: 'Chưa khai thác/vận hành',
  SUSPENDED: 'Dừng khai thác/vận hành',
};

// ── #47 Trạng thái phê duyệt (ApprovalStatus — hệ thống ghi) ─────────────
export type ApprovalStatus =
  | 'DRAFT'
  | 'PROPOSED'
  | 'PENDING_APPROVAL'
  | 'APPROVED_LEVEL1'
  | 'APPROVED_LEVEL2'
  | 'APPROVED'
  | 'REJECTED'
  | 'REJECTED_LEVEL1'
  | 'REJECTED_LEVEL2'
  | 'ARCHIVED';

export const APPROVAL_STATUS_OPTIONS: { value: ApprovalStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'PENDING_APPROVAL', label: 'Chờ phê duyệt' },
  { value: 'APPROVED_LEVEL1', label: 'Đã duyệt cấp Cảng vụ/Chi cục' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED_LEVEL1', label: 'Trả về cấp Cảng vụ/Chi cục' },
  { value: 'REJECTED_LEVEL2', label: 'Trả về cấp Cục' },
  { value: 'REJECTED', label: 'Từ chối' },
];

// ── #41 Loại đối tượng (GisGeometryType) ─────────────────────────────────
export type GisGeometryType = 'POINT' | 'LINE' | 'POLYGON';

export const GIS_GEOMETRY_TYPE_OPTIONS: { value: GisGeometryType; label: string }[] = [
  { value: 'POINT', label: 'Điểm' },
  { value: 'LINE', label: 'Đường' },
  { value: 'POLYGON', label: 'Vùng' },
];

// ── #22-#38 Bảng con tuyến luồng (channel_route_detail) ──────────────────
export interface ChannelRouteDetailResponse {
  id?: string;
  navigationChannelId?: string;
  sequenceNo?: number;
  routeClassification?: string; // #22
  routeCode?: string; // #23 — tự sinh, disabled
  routeName?: string; // #24
  routeType?: number; // #25 (1 = Công cộng, 2 = Chuyên dùng)
  turningBasinLocation?: string; // #26
  turningBasinRadiusMeters?: number; // #27
  verticalClearanceMeters?: number; // #28
  channelLengthKilometers?: number; // #29
  maximumDesignWidthMeters?: number; // #30
  minimumDesignWidthMeters?: number; // #31
  designDepthMeters?: number; // #32
  currentDepthMeters?: number; // #33
  designSlope?: number; // #34
  minimumCurveRadiusMeters?: number; // #35
  routeLatestDredgingVolumeCubicMeters?: number; // #36
  routeLatestMaintenanceYear?: number; // #37
  routeGrade?: number; // #38
  // Tab Thông tin vị trí (chuẩn /vts-operation-center)
  geometryType?: GisGeometryType | string;
  mapIconId?: string;
  symbolId?: string;
  coordinateReferenceSystem?: string | number;
  coordinateSystem?: number;
  displayRule?: string;
  coordinates?: string;
}

export interface ChannelRouteDetailRequest extends ChannelRouteDetailResponse {}

// ── #45 Bảng con tọa độ (navigation_channel_coordinate) ──────────────────
export interface NavigationChannelCoordinateResponse {
  id?: string;
  navigationChannelId?: string;
  sequenceNo?: number;
  longitude?: number; // Kinh độ
  latitude?: number; // Vĩ độ
}

export interface NavigationChannelCoordinateRequest extends NavigationChannelCoordinateResponse {}

export interface NavigationChannelAttachment {
  id?: string;
  fileName: string;
  fileUrl?: string;
  filePath?: string;
  contentType?: string;
  fileType?: string;
  fileSize?: number;
  uploadedBy?: string;
  uploadedByName?: string;
  uploadedDate?: string;
  uploadedAt?: string;
  createdAt?: string;
}

// ── Response (71 trường: #1-#46 + #47-#71 read-only) ─────────────────────
export interface NavigationChannelResponse {
  id: string;
  // #1-#8
  orgUnitId?: string;
  orgUnitName?: string;
  seaportId?: string;
  seaportName?: string;
  operatingUnitId?: string;
  channelCode?: string; // #4 tự sinh LHH
  channelName: string; // #5
  provinceId?: number; // #6
  detailedLocation?: string; // #7
  conditionStatus?: ConditionStatus; // #8
  // #9-#21
  managementStation?: string; // #9
  stationCount?: number; // #10
  stationStaffCount?: number; // #11
  stationAreaSquareMeters?: number; // #12
  latestStationRepairMonth?: string; // #13 (DATE, FE hiển thị tháng/năm)
  latestMaintenanceYear?: number; // #14
  latestDredgingVolumeCubicMeters?: number; // #15
  buoyCount?: number; // #16
  beaconCount?: number; // #17
  notes?: string; // #18
  announcementDecisionNumber?: string; // #19
  announcementDecisionDate?: string; // #20
  announcementDecisionIssuer?: string; // #21
  // #39-#44
  protectionScopeMeters?: number; // #39
  protectionNotes?: string; // #40
  geometryType?: GisGeometryType; // #41
  mapIconId?: string; // #42
  coordinateReferenceSystem?: string; // #43
  displayRule?: string; // #44
  // Bảng con
  routeDetails?: ChannelRouteDetailResponse[];
  coordinates?: NavigationChannelCoordinateResponse[];
  attachments?: NavigationChannelAttachment[];
  // GIS
  spatialId?: string;
  // #47-#57 — read-only, hệ thống ghi theo workflow
  approvalStatus: ApprovalStatus;
  submittedAt?: string; // #50
  submittedBy?: string; // #51
  level1ApprovedAt?: string; // #52
  level1ApprovedBy?: string; // #53
  level1ApprovalContent?: string; // #54
  level2ApprovedAt?: string; // #55
  level2ApprovedBy?: string; // #56
  level2ApprovalContent?: string; // #57
  approverLevel1?: string;
  approverLevel2?: string;
  approvedDateLevel1?: string;
  approvedDateLevel2?: string;
  rejectionReason?: string;
  // Audit
  createdAt?: string;
  updatedAt?: string; // #48
  createdBy?: string;
  updatedBy?: string; // #49
  deletedAt?: string;
  deletedBy?: string;
  // #58-#71 — read-only, lấy từ module liên quan (không nhập trong F-038)
  relatedInfrastructureName?: string; // #58
  relatedInfrastructureType?: string; // #59
  operationPlanCode?: string; // #60
  operationPlanName?: string; // #61
  operationStartDate?: string; // #62
  operationEndDate?: string; // #63
  maintenancePlanCode?: string; // #64
  maintenancePlanName?: string; // #65
  maintenanceStartTime?: string; // #66
  maintenanceEndTime?: string; // #67
  incidentCode?: string; // #68
  incidentType?: string; // #69
  incidentLocation?: string; // #70
  incidentTime?: string; // #71
}

// ── Create — 46 trường nhập (#1-#46), chỉ bắt buộc #1/#5/#8 ──────────────
export interface CreateNavigationChannelRequest {
  orgUnitId: string; // #1 bắt buộc
  seaportId?: string | null; // #2
  operatingUnitId?: string | null; // #3
  channelCode?: string | null; // #4 tự sinh LHH
  channelName: string; // #5 bắt buộc
  provinceId?: number | null; // #6
  detailedLocation?: string | null; // #7
  conditionStatus: ConditionStatus; // #8 bắt buộc
  managementStation?: string | null; // #9
  stationCount?: number | null; // #10
  stationStaffCount?: number | null; // #11
  stationAreaSquareMeters?: number | null; // #12
  latestStationRepairMonth?: string | null; // #13
  latestMaintenanceYear?: number | null; // #14
  latestDredgingVolumeCubicMeters?: number | null; // #15
  buoyCount?: number | null; // #16
  beaconCount?: number | null; // #17
  notes?: string | null; // #18
  announcementDecisionNumber?: string | null; // #19
  announcementDecisionDate?: string | null; // #20
  announcementDecisionIssuer?: string | null; // #21
  protectionScopeMeters?: number | null; // #39
  protectionNotes?: string | null; // #40
  geometryType?: GisGeometryType | null; // #41
  mapIconId?: string | null; // #42
  coordinateReferenceSystem?: string | null; // #43
  displayRule?: string | null; // #44
  routeDetails?: ChannelRouteDetailRequest[]; // #22-#38
  coordinates?: string | null; // #88 GIS WKT chuỗi (LINESTRING / POINT / POLYGON)
  coordinateList?: NavigationChannelCoordinateRequest[] | null; // #45 danh sách bảng con tọa độ
  attachments?: NavigationChannelAttachment[]; // #46
}

export interface UpdateNavigationChannelRequest extends CreateNavigationChannelRequest {
  id: string;
}

// ── Approval ──────────────────────────────────────────────────────────────
export interface ApprovalRequest {
  status: 'APPROVED' | 'REJECTED';
}

export interface ApprovalResponse {
  id: string;
  navigationChannelId?: string;
  status: string;
  approvedBy: string;
  approvedDate: string;
}

export interface HistoryEntry {
  id: string;
  navigationChannelId?: string;
  approvalLevel?: string;
  status: string;
  approvedBy?: string;
  changedBy?: string;
  orgUnitName?: string;
  approvedDate?: string;
  changedAt?: string;
  reason?: string;
  changedField?: string;
  previousValue?: string;
  newValue?: string;
}

/** Nhật ký thay đổi/phê duyệt đầy đủ (chuẩn /beacon-stations) — drawer Lịch sử. */
export interface NavigationChannelHistoryEntry {
  id: string;
  /** LEVEL_1 = lần lưu hồ sơ, LEVEL_2 = lần duyệt/từ chối gắn vào lần lưu đó. */
  approvalLevel?: string;
  status?: string;
  approvedBy?: string;
  orgUnitName?: string;
  approvedDate?: string;
  reason?: string | null;
  changedField?: string;
  previousValue?: string | null;
  newValue?: string | null;
}

// ── List params (DS/Lọc: #1/#2/#4/#5/#6/#8/#47/#48) ──────────────────────
export interface ListParams {
  page?: number;
  size?: number;
  keyword?: string; // #5 tên luồng
  channelCode?: string; // #4
  orgUnitId?: string; // #1
  seaportId?: string; // #2
  provinceId?: number; // #6
  conditionStatus?: ConditionStatus; // #8
  approvalStatus?: ApprovalStatus | string; // #47
  updatedFrom?: string; // #48
  updatedTo?: string; // #48
  updatedBy?: string; // #49
  sortField?: string;
  sortOrder?: string;
  sortBy?: string;
  sortDir?: string;
}

export interface SearchResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  statusCounts?: Record<string, number>;
}
