import React from 'react';
import { Typography } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  actionPrimary,
  textTertiary,
  fontSizeSm,
  fontSizeMd,
  fontWeightMedium,
  radiusPill,
  spaceXs,
  spaceSm,
  spaceMd,
  spaceXl,
  historyGroupGridStyle,
  historyTimeStyle,
  historyMetaRowStyle,
  historyInfoCardStyle,
  historyAccentBarStyle,
  historyInfoTitleStyle,
  historyChangeRowStyle,
  historyFieldLabelStyle,
  historyOldValueStyle,
  historyNewValueStyle,
  historyArrowStyle,
} from '../themetokenchk';
import { VIETNAM_PROVINCES } from '../types/common';
import { formatHistoryNumber } from './numFmt';

export const isBlankOrDash = (v: unknown): boolean => {
  if (v === null || v === undefined) return true;
  const s = String(v).trim();
  return (
    s === '' ||
    s === '—' ||
    s === '-' ||
    s === '–' ||
    s === '(null)' ||
    s === 'null' ||
    s === 'undefined' ||
    s.toLowerCase() === 'chưa có'
  );
};

export function normalizeHistoryKey(key: string): string {
  return (key || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export const GLOBAL_KCHT_FIELD_LABELS: Record<string, string> = {
  // Common identity
  code: 'Mã',
  name: 'Tên',
  type: 'Loại',
  status: 'Trạng thái',
  approvalStatus: 'Trạng thái',
  operationalStatus: 'Tình trạng',
  portStatus: 'Tình trạng',
  condition: 'Tình trạng',
  conditionStatus: 'Tình trạng',
  isActive: 'Hoạt động',

  // Organizations & relations
  orgUnitId: 'Đơn vị quản lý',
  unitId: 'Đơn vị quản lý',
  operatingOrgId: 'Đơn vị khai thác',
  operatingUnit: 'Đơn vị khai thác',
  portId: 'Thuộc cảng biển',
  berthId: 'Thuộc bến cảng',
  pierId: 'Thuộc cầu cảng',
  waterwayId: 'Thuộc luồng hàng hải',
  navigationChannelId: 'Thuộc luồng hàng hải',
  waterwayRouteId: 'Tuyến luồng',
  buoyStationId: 'Thuộc nhà trạm phao tiêu',

  // Location & GIS
  province: 'Địa điểm (Tỉnh/Thành phố)',
  provinceId: 'Địa điểm (Tỉnh/Thành phố)',
  address: 'Địa chỉ',
  locationDetail: 'Địa điểm chi tiết',
  detailedLocation: 'Địa điểm chi tiết',
  region: 'Khu vực',
  transportCorridor: 'Hành lang vận tải',
  mapSymbolId: 'Biểu tượng',
  coordinateSystem: 'Hệ quy chiếu',
  displayRule: 'Quy tắc hiển thị',
  displayFormat: 'Quy tắc hiển thị',
  geometryType: 'Loại đối tượng',
  coordinates: 'Tọa độ GPS',
  latitude: 'Vĩ độ',
  longitude: 'Kinh độ',
  'Tọa độ GIS': 'Tọa độ GPS',
  'Tọa độ GPS': 'Tọa độ GPS',
  'Loại đối tượng GIS': 'Loại đối tượng',
  'Loại đối tượng': 'Loại đối tượng',
  'File đính kèm': 'File đính kèm',
  'Tài liệu đính kèm': 'File đính kèm',
  attachments: 'File đính kèm',
  wharfAreas: 'Khu bến',
  'Khu bến': 'Khu bến',
  'Danh sách khu bến': 'Khu bến',
  wharfCode: 'Mã khu bến',
  wharfName: 'Tên khu bến',
  infrastructureList: 'Công trình KCHT trực thuộc',
  'Công trình KCHT trực thuộc': 'Công trình KCHT trực thuộc',
  'Danh sách hạ tầng': 'Công trình KCHT trực thuộc',

  // Technical & dimensions
  length: 'Chiều dài (m)',
  width: 'Chiều rộng (m)',
  designLoad: 'Tải trọng thiết kế',
  structureType: 'Loại kết cấu',
  constructionGrade: 'Phân cấp công trình',
  constructionDate: 'Thời điểm xây dựng',
  constructionYear: 'Năm xây dựng',
  area: 'Diện tích (m²)',
  totalArea: 'Tổng diện tích (m²)',
  usableArea: 'Diện tích sử dụng (m²)',
  warehouseArea: 'Diện tích kho (m²)',
  yardArea: 'Diện tích bãi (m²)',
  workshopArea: 'Diện tích nhà xưởng (m²)',
  staffCount: 'Số lượng nhân viên',
  currentWaterDepth: 'Độ sâu hiện tại (m)',
  waterDepth: 'Độ sâu khu nước (m)',
  designBedElevation: 'Cao độ đáy thiết kế (m)',
  mudElevation: 'Cao độ đáy bùn (m)',
  bottomNature: 'Đặc tính đáy',
  bottomType: 'Loại đáy',
  waveRegime: 'Chế độ sóng',
  tidalRegime: 'Chế độ thủy triều',
  windRegime: 'Chế độ gió',
  publishedVesselDWT: 'Trọng tải tàu công bố (DWT)',
  maximumVesselDwt: 'Trọng tải tàu lớn nhất (DWT)',
  maximumVesselLength: 'Chiều dài tàu lớn nhất (m)',
  maximumVesselDraft: 'Mớn nước tàu lớn nhất (m)',
  receivesLargeVessel: 'Nhận tàu lớn',
  vesselType: 'Loại tàu',
  vesselDwt: 'Cỡ tàu',
  businessType: 'Loại hình doanh nghiệp',
  activity: 'Hoạt động',
  slipwayCount: 'Số lượng triền đà',
  technicalStandard: 'Quy chuẩn kỹ thuật',
  teuCapacity: 'Công suất khai thác (TEU)',
  cargoThroughput: 'Sản lượng hàng hóa',
  connectionMode: 'Phương thức kết nối giao thông',
  operationalFunction: 'Công năng khai thác',
  usageFunction: 'Công năng sử dụng',
  waterAreaNeutralScope: 'Phạm vi vùng nước',

  // Buoy / Beacon specific
  classification: 'Phân loại',
  classificationBuoy: 'Phân loại phao',
  classificationMark: 'Phân loại tiêu',
  color: 'Màu sắc',
  shape: 'Hình dạng',
  structure: 'Kết cấu',
  bodyHeight: 'Chiều cao thân (m)',
  diameter: 'Đường kính (m)',
  beaconLight: 'Đèn hiệu',
  towerHeight: 'Chiều cao tháp (m)',
  lightHeight: 'Chiều cao tâm sáng (m)',
  lightModel: 'Mẫu đèn',
  towerColor: 'Màu tháp',
  powerSupply: 'Nguồn cấp',
  range: 'Tầm xa (Hải lý)',
  lightCharacteristic: 'Đặc tính ánh sáng',
  lightColor: 'Màu ánh sáng',
  flashType: 'Kiểu chớp',
  period: 'Chu kỳ (giây)',
  commissionedDate: 'Ngày đưa vào khai thác',
  lastRepairDate: 'Ngày sửa chữa gần nhất',
  lastMaintenanceYear: 'Năm bảo trì gần nhất',
  lastInspectionDate: 'Ngày kiểm tra gần nhất',
  nextInspectionDate: 'Ngày kiểm tra kế tiếp',
  safetyAssessmentDate: 'Ngày đánh giá an toàn',
  maintenanceApprovalDate: 'Ngày duyệt bảo trì',

  // Module-specific identities & codes
  pierCode: 'Mã cầu cảng',
  pierName: 'Tên cầu cảng',
  pierType: 'Loại cầu cảng',
  berthCode: 'Mã bến cảng',
  berthName: 'Tên bến cảng',
  dryPortCode: 'Mã cảng cạn',
  dryPortName: 'Tên cảng cạn',
  shipRepairYardCode: 'Mã cơ sở sửa chữa, đóng tàu',
  shipRepairYardName: 'Tên cơ sở sửa chữa, đóng tàu',
  anchorageCode: 'Mã khu neo đậu',
  anchorageName: 'Tên khu neo đậu',
  transferAreaCode: 'Mã khu chuyển tải',
  transferAreaName: 'Tên khu chuyển tải',
  stormShelterCode: 'Mã khu neo đậu tránh bão',
  stormShelterName: 'Tên khu neo đậu tránh bão',
  shelterCapacity: 'Sức chứa khu tránh bão',
  buoyBerthCode: 'Mã bến phao',
  buoyBerthName: 'Tên bến phao',
  coastalStationCode: 'Mã đài TTDH',
  coastalStationName: 'Tên đài TTDH',
  stationType: 'Loại đài',
  frequency: 'Tần số',
  coverage: 'Vùng phủ sóng',
  operator: 'Đơn vị khai thác',
  securityLevel: 'Cấp bảo mật',
  operatingPierCount: 'Số cầu đang khai thác',
  publishedPierCount: 'Số cầu công bố',
  investmentAgreementPierCount: 'Số cầu thỏa thuận đầu tư',
  announcedAnchorageCount: 'Số khu neo đã công bố',
  investmentAgreementAnchorageCount: 'Số khu neo thỏa thuận ĐTXD',
  operatingAnchorageCount: 'Số khu neo đang khai thác',
  operatingPositionCount: 'Số vị trí đang khai thác',
  publishedPositionCount: 'Số vị trí công bố',
  investmentAgreementPositionCount: 'Số vị trí thỏa thuận đầu tư',
  announcedBuoyBerthCount: 'Số lượng bến phao công bố',
  investmentAgreementBuoyBerthCount: 'Số bến phao thỏa thuận ĐTXD',
  operatingBuoyBerthCount: 'Số bến phao đang khai thác',
  waterAreaMooringScope: 'Phạm vi khu nước neo buộc tàu',
  operationalFunctions: 'Công năng khai thác',
  designThroughput: 'Năng lực thông qua thiết kế',
  currentThroughput: 'Năng lực thông qua hiện trạng',
  plannedThroughput: 'Quy hoạch năng lực thông qua',
  maxVesselSize: 'Cỡ tàu tiếp nhận lớn nhất (DWT)',
  latestCargoVolume: 'Sản lượng thực tế năm gần nhất',
  investmentAgreement: 'Văn bản thỏa thuận',
  activityStartDate: 'Thời gian hoạt động từ',
  buoys: 'Danh sách phao tiêu thuộc trạm',

  // Navigation channel specific
  seaportId: 'Thuộc cảng biển',
  operatingUnitId: 'Đơn vị vận hành',
  channelCode: 'Mã luồng hàng hải',
  channelName: 'Tên luồng hàng hải',
  managementStation: 'Trạm quản lý luồng',
  stationCount: 'Số lượng trạm',
  stationStaffCount: 'Số lượng nhân sự tại trạm',
  stationAreaSquareMeters: 'Diện tích trạm (m²)',
  latestStationRepairMonth: 'Sửa chữa trạm gần nhất',
  latestDredgingVolumeCubicMeters: 'KL nạo vét (m³)',
  buoyCount: 'Số lượng phao',
  beaconCount: 'Số lượng tiêu',
  protectionScopeMeters: 'Phạm vi bảo vệ luồng (m)',
  protectionNotes: 'Ghi chú phạm vi bảo vệ',
  mapIconId: 'Biểu tượng',
  coordinateReferenceSystem: 'Hệ quy chiếu',

  // Equipment / Devices (CCTV, SCADA, Transmission, VHF, VTS)
  deviceCode: 'Mã thiết bị',
  deviceName: 'Tên thiết bị',
  manufacturer: 'Hãng sản xuất',
  model: 'Model',
  quantity: 'Số lượng',
  provinceName: 'Địa điểm (Tỉnh/TP)',
  attachedInfrastructureType: 'Loại hạ tầng',
  attachedInfrastructureId: 'Thuộc hạ tầng',
  unitOfMeasure: 'Đơn vị tính',
  yearOfUse: 'Năm đưa vào sử dụng',
  specifications: 'Thông số kỹ thuật',
  maintenanceInformation: 'Thông tin bảo trì',

  // Legal / Decisions
  documentNumber: 'Số văn bản',
  documentDate: 'Ngày văn bản',
  openingAnnouncementDate: 'Ngày công bố mở',
  openingDecision: 'Quyết định mở',
  investmentAgreementDoc: 'Thỏa thuận đầu tư',
  announcementTime: 'Thời điểm công bố mở',
  announcementDecisionNumber: 'Quyết định công bố số',
  announcementDecisionDate: 'Ngày ra quyết định công bố',
  announcementOrg: 'Đơn vị ra quyết định công bố',
  remarks: 'Ghi chú',
  note: 'Ghi chú',
  description: 'Mô tả',

  // Approval audit
  submittedForApprovalAt: 'Ngày gửi phê duyệt',
  submittedForApprovalBy: 'Người gửi phê duyệt',
  level1ApprovedBy: 'Người duyệt Cảng vụ/Chi cục',
  level1ApprovedDate: 'Ngày duyệt Cảng vụ/Chi cục',
  level2ApprovedBy: 'Người duyệt Cục',
  level2ApprovedDate: 'Ngày duyệt Cục',
  level1ApprovalContent: 'Nội dung phê duyệt Cảng vụ/Chi cục',
  level2ApprovalContent: 'Nội dung phê duyệt Cục',
  portAuthorityApprovedAt: 'Ngày duyệt Cảng vụ/Chi cục',
  portAuthorityApprovedBy: 'Người duyệt Cảng vụ/Chi cục',
  portAuthorityApprovalContent: 'Nội dung phê duyệt Cảng vụ/Chi cục',
  departmentApprovedAt: 'Ngày duyệt Cục',
  departmentApprovedBy: 'Người duyệt Cục',
  departmentApprovalContent: 'Nội dung phê duyệt Cục',
  rejectionReason: 'Lý do từ chối',
};

export function autoFormatHistoryValue(fn: string, raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (isBlankOrDash(s)) return null;

  const normKey = normalizeHistoryKey(fn);

  // 1. Booleans
  if (s.toLowerCase() === 'true' || (s === '1' && (normKey === 'isactive' || normKey === 'hoatdong' || normKey === 'receiveslargevessel' || normKey === 'nhantaulon'))) {
    if (normKey === 'isactive' || normKey === 'hoatdong') return 'Hoạt động';
    return 'Có';
  }
  if (s.toLowerCase() === 'false' || (s === '0' && (normKey === 'isactive' || normKey === 'hoatdong' || normKey === 'receiveslargevessel' || normKey === 'nhantaulon'))) {
    if (normKey === 'isactive' || normKey === 'hoatdong') return 'Ngừng';
    return 'Không';
  }

  // 2. Approval Status
  const approvalMap: Record<string, string> = {
    DRAFT: 'Lưu tạm',
    NHAP: 'Lưu tạm',
    '0': 'Lưu tạm',
    PENDING_APPROVAL: 'Chờ Cảng vụ duyệt',
    CHO_PHE_DUYET: 'Chờ Cảng vụ duyệt',
    CHO_PD_CAP_CUC: 'Chờ Cục duyệt',
    PROPOSED: 'Chờ Cảng vụ duyệt',
    APPROVED_LEVEL1: 'Chờ Cục duyệt',
    APPROVED_L1: 'Chờ Cục duyệt',
    SUBMITTED_PORT_AUTHORITY: 'Chờ Cảng vụ duyệt',
    CHO_DUYET_CAP_1: 'Chờ Cảng vụ duyệt',
    SUBMITTED_DEPARTMENT: 'Chờ Cục duyệt',
    CHO_DUYET_CAP_2: 'Chờ Cục duyệt',
    APPROVED_LEVEL2: 'Đã duyệt',
    APPROVED_L2: 'Đã duyệt',
    APPROVED: 'Đã duyệt',
    DA_PHE_DUYET: 'Đã duyệt',
    DA_DUYET: 'Đã duyệt',
    PUBLISHED: 'Đã duyệt',
    REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ',
    REJECTED_L1: 'Từ chối cấp Cảng vụ',
    REJECTED_LEVEL2: 'Từ chối cấp Cục',
    REJECTED_L2: 'Từ chối cấp Cục',
    REJECTED: 'Từ chối',
    TU_CHOI: 'Từ chối',
  };
  if (approvalMap[s.toUpperCase()]) {
    return approvalMap[s.toUpperCase()];
  }

  // 3. Operational / Condition Status
  const conditionMap: Record<string, string> = {
    OPERATIONAL: 'Đang khai thác/vận hành',
    DANG_HOAT_DONG: 'Đang khai thác/vận hành',
    DANG_KHAI_THAC: 'Đang khai thác/vận hành',
    NOT_YET_OPERATIONAL: 'Chưa khai thác/vận hành',
    CHUA_HOAT_DONG: 'Chưa khai thác/vận hành',
    CHUA_KHAI_THAC: 'Chưa khai thác/vận hành',
    SUSPENDED: 'Dừng khai thác/vận hành',
    TAM_DUNG: 'Dừng khai thác/vận hành',
    DUNG_KHAI_THAC: 'Dừng khai thác/vận hành',
    MAINTENANCE: 'Bảo trì',
    BAO_TRI: 'Bảo trì',
    ABANDONED: 'Không sử dụng',
    GOOD: 'Tốt',
    TOT: 'Tốt',
    FAIR: 'Trung bình',
    TRUNG_BINH: 'Trung bình',
    POOR: 'Kém',
    KEM: 'Kém',
    DAMAGED: 'Hư hỏng',
    HU_HONG: 'Hư hỏng',
  };
  if (conditionMap[s.toUpperCase()]) {
    return conditionMap[s.toUpperCase()];
  }

  // 4. Structure Type (Pier/Berth/StormShelter)
  if (normKey.includes('structuretype') || normKey.includes('loaiketcau')) {
    const structureMap: Record<string, string> = {
      '1': 'Kết cấu bệ cọc cao',
      '2': 'Kết cấu cường từ',
      '3': 'Kết cấu trọng lực',
      '4': 'Kết cấu khác',
    };
    if (structureMap[s]) return structureMap[s];
  }

  // 5. Construction Grade
  if (normKey.includes('constructiongrade') || normKey.includes('capcongtrinh') || normKey.includes('phancapcongtrinh')) {
    const gradeMap: Record<string, string> = {
      '1': 'Cấp đặc biệt',
      '2': 'Cấp 1',
      '3': 'Cấp 2',
      '4': 'Cấp 3',
      '5': 'Cấp 4',
    };
    if (gradeMap[s]) return gradeMap[s];
  }

  // 6. Buoy Classification
  if (normKey === 'classificationbuoy' || normKey === 'phanloaiphao') {
    const buoyClassMap: Record<string, string> = {
      '1': 'Báo hiệu luồng bên trái',
      '2': 'Báo hiệu luồng bên phải',
      '3': 'Báo hiệu chướng ngại biệt lập',
      '4': 'Báo hiệu vùng nước an toàn',
      '5': 'Báo hiệu chuyên dùng',
      '6': 'Báo hiệu chướng ngại mới phát hiện',
      TRAI: 'Báo hiệu luồng bên trái',
      PHAI: 'Báo hiệu luồng bên phải',
      BIET_LAP: 'Báo hiệu chướng ngại biệt lập',
      AN_TOAN: 'Báo hiệu vùng nước an toàn',
      CHUYEN_DUNG: 'Báo hiệu chuyên dùng',
      DAC_BIET: 'Báo hiệu chuyên dùng',
      NGUY_HIEM_MOI: 'Báo hiệu chướng ngại mới phát hiện',
    };
    if (buoyClassMap[s.toUpperCase()]) return buoyClassMap[s.toUpperCase()];
  }

  // 7. Light Color / Color
  if (normKey.includes('color') || normKey.includes('mausac') || normKey.includes('lightcolor')) {
    const colorMap: Record<string, string> = {
      RED: 'Đỏ',
      DO: 'Đỏ',
      GREEN: 'Xanh lục',
      XANH_LUC: 'Xanh lục',
      WHITE: 'Trắng',
      TRANG: 'Trắng',
      YELLOW: 'Vàng',
      VANG: 'Vàng',
      BLACK: 'Đen',
      DEN: 'Đen',
      YELLOW_BLACK: 'Vàng - Đen',
      RED_WHITE: 'Đỏ - Trắng',
    };
    if (colorMap[s.toUpperCase()]) return colorMap[s.toUpperCase()];
  }

  // 8. Power supply
  if (normKey.includes('powersupply') || normKey.includes('nguoncap')) {
    const powerMap: Record<string, string> = {
      SOLAR: 'Năng lượng mặt trời',
      GRID: 'Điện lưới',
      BATTERY: 'Ắc quy / Pin',
    };
    if (powerMap[s.toUpperCase()]) return powerMap[s.toUpperCase()];
  }

  // 9. Coordinate System & Geometry
  if (normKey.includes('coordinatesystem') || normKey.includes('hequychieu')) {
    if (s === '1' || s.toUpperCase() === 'WGS84' || s.toUpperCase() === 'WGS_84') return 'WGS-84';
    if (s === '2' || s.toUpperCase() === 'VN2000' || s.toUpperCase() === 'VN_2000') return 'VN-2000';
  }
  if (normKey.includes('geometrytype') || normKey.includes('loaidoituong')) {
    const geoMap: Record<string, string> = {
      POINT: 'Điểm',
      LINE: 'Đường',
      LINESTRING: 'Đường',
      POLYGON: 'Vùng',
      MULTIPOINT: 'Đa điểm',
      MULTILINESTRING: 'Đa đường',
      MULTIPOLYGON: 'Đa vùng',
    };
    if (geoMap[s.toUpperCase()]) return geoMap[s.toUpperCase()];
  }

  // 10. Province (province / provinceId)
  if (normKey === 'province' || normKey === 'provinceid' || normKey === 'tinhthanhpho' || normKey === 'diadiemtinhthanhpho') {
    const pIdx = parseInt(s, 10);
    if (!isNaN(pIdx) && pIdx >= 1 && pIdx <= VIETNAM_PROVINCES.length) {
      return VIETNAM_PROVINCES[pIdx - 1];
    }
  }

  // 11. ISO Date formatting (e.g. 2026-08-15T10:20:30 or 2026-08-15)
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(s)) {
    const d = dayjs(s);
    if (d.isValid()) {
      if (s.includes('T')) {
        return d.format('DD/MM/YYYY HH:mm');
      }
      return d.format('DD/MM/YYYY');
    }
  }

  // 12. Pure numbers with thousand separators
  return formatHistoryNumber(s);
}

export interface ParsedWharfAreaHistoryItem {
  name: string;
  code?: string;
  func?: string;
  scope?: string;
  doc?: string;
  notes?: string;
}

export function parseWharfAreaHistory(rawV: unknown): ParsedWharfAreaHistoryItem[] {
  if (isBlankOrDash(rawV)) return [];
  const text = String(rawV).trim();

  // Tách từng khu bến: ưu tiên phân cách xuống dòng '\n' hoặc dấu ';'
  let segments: string[] = [];
  if (text.includes('\n')) {
    segments = text.split(/\r?\n/).map((s) => s.replace(/;$/, '').trim()).filter(Boolean);
  } else if (text.includes(';')) {
    segments = text.split(/;\s*/).map((s) => s.trim()).filter(Boolean);
  } else if (text.includes(' | ')) {
    segments = [text];
  } else {
    // Định dạng cũ ngăn cách dấu phẩy: "Khu A (Mã A), Khu B (Mã B)"
    segments = text.split(/\s*,\s*(?=[^()]*(?:\(|$))/).map((s) => s.trim()).filter(Boolean);
  }

  const items: ParsedWharfAreaHistoryItem[] = [];
  for (const seg of segments) {
    if (!seg || isBlankOrDash(seg)) continue;

    if (seg.includes(' | ') || seg.startsWith('Tên:')) {
      const parts = seg.split(/\s*\|\s*/);
      const parsed: ParsedWharfAreaHistoryItem = { name: '' };
      for (const p of parts) {
        const idx = p.indexOf(':');
        if (idx > 0) {
          const key = p.slice(0, idx).trim().toLowerCase();
          const val = p.slice(idx + 1).trim();
          if (!val || isBlankOrDash(val)) continue;

          if (key === 'tên' || key.includes('tên')) {
            parsed.name = val;
          } else if (key === 'mã' || key.includes('mã')) {
            parsed.code = val;
          } else if (key.includes('chức năng')) {
            parsed.func = val;
          } else if (key.includes('phạm vi') || key.includes('địa bàn')) {
            parsed.scope = val;
          } else if (key.includes('văn bản') || key.includes('quy định')) {
            parsed.doc = val;
          } else if (key.includes('ghi chú')) {
            parsed.notes = val;
          }
        } else if (!parsed.name) {
          parsed.name = p.trim();
        }
      }
      if (parsed.name || parsed.code) {
        items.push(parsed);
      }
    } else {
      // Định dạng cũ: "Tên khu bến (Mã khu bến)"
      const m = seg.match(/^(.*?)\s*\(\s*([^)]+)\s*\)\s*$/);
      if (m) {
        const name = m[1].trim();
        const code = m[2].trim();
        if (name && !isBlankOrDash(name)) {
          items.push({ name, code });
        }
      } else {
        if (!isBlankOrDash(seg)) {
          items.push({ name: seg });
        }
      }
    }
  }

  return items;
}

export function renderWharfAreaHistory(rawV: unknown): React.ReactNode {
  const items = parseWharfAreaHistory(rawV);
  if (items.length === 0) return '';

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2, lineHeight: '20px' }}>
      {items.map((x, i) => {
        const parts: string[] = [];
        if (x.name) parts.push(`Tên: ${x.name}`);
        if (x.code) parts.push(`Mã: ${x.code}`);
        if (x.func) parts.push(`Chức năng: ${x.func}`);
        if (x.scope) parts.push(`Phạm vi: ${x.scope}`);
        if (x.doc) parts.push(`Văn bản: ${x.doc}`);
        if (x.notes) parts.push(`Ghi chú: ${x.notes}`);
        return (
          <span key={i}>
            {parts.join(', ')}
          </span>
        );
      })}
    </span>
  );
}

export interface ChangeHistoryRendererOptions {
  records: any[];
  fieldLabels?: Record<string, string> | ((field: string) => string);
  groupOrder?: string[];
  formatValue?: (field: string, rawVal: string | null) => React.ReactNode | string | undefined;
  resolveUnitName?: (record: any) => string;
  resolveActorName?: (actor: string, record: any) => string;
  ignoredFields?: Set<string>;
  emptyMessage?: string;
}

const DEFAULT_IGNORED_FIELDS = new Set([
  'id',
  'spatialId',
  'infrastructureList_raw',
  'approvalStatus',
  'approverLevel1',
  'approvedDateLevel1',
  'approverLevel2',
  'approvedDateLevel2',
  'rejectionReason',
  'Lý do từ chối',
  'Trạng thái phê duyệt',
  'deletedAt',
  'deletedBy',
]);

export function renderStandardHistoryCards(options: ChangeHistoryRendererOptions): React.ReactNode {
  const {
    records,
    fieldLabels = {},
    groupOrder = [],
    formatValue,
    resolveUnitName,
    resolveActorName,
    ignoredFields = DEFAULT_IGNORED_FIELDS,
    emptyMessage = 'Chưa có thay đổi nào được ghi nhận',
  } = options;

  const norm = (v: string | null | undefined): string | null => {
    if (isBlankOrDash(v)) return null;
    return String(v).trim();
  };

  const fieldLabel = (fn: string): string => {
    if (typeof fieldLabels === 'function') {
      const res = fieldLabels(fn);
      if (res && res !== fn) return res;
    } else if (fieldLabels && fieldLabels[fn]) {
      return fieldLabels[fn];
    }
    if (GLOBAL_KCHT_FIELD_LABELS[fn]) {
      return GLOBAL_KCHT_FIELD_LABELS[fn];
    }
    const target = normalizeHistoryKey(fn);
    if (typeof fieldLabels === 'object' && fieldLabels) {
      for (const [k, v] of Object.entries(fieldLabels)) {
        if (normalizeHistoryKey(k) === target || normalizeHistoryKey(v) === target) return v;
      }
    }
    for (const [k, v] of Object.entries(GLOBAL_KCHT_FIELD_LABELS)) {
      if (normalizeHistoryKey(k) === target || normalizeHistoryKey(v) === target) return v;
    }
    return fn;
  };

  const sorted = [...(records || [])].sort((a, b) => {
    const at = a.changedAt || a.createdAt || a.approvedDate || '';
    const bt = b.changedAt || b.createdAt || b.approvedDate || '';
    return String(bt) < String(at) ? -1 : String(bt) > String(at) ? 1 : 0;
  });

  // Gom nhóm trong khoảng 10 giây (chuẩn Cảng biển)
  const groups: { tsMs: number; ts: string; actor: string; items: any[] }[] = [];
  for (const r of sorted) {
    const ts = r.changedAt || r.createdAt || r.approvedDate || '';
    const timeMs = ts ? new Date(ts).getTime() || 0 : 0;
    const actor = String(r.changedBy ?? r.createdBy ?? r.approvedBy ?? r.actorName ?? '');
    const g = groups[groups.length - 1];
    if (g && g.actor === actor && Math.abs(g.tsMs - timeMs) <= 10000) {
      g.items.push(r);
    } else {
      groups.push({ tsMs: timeMs, ts, actor, items: [r] });
    }
  }

  const cards = groups.map((g, gi) => {
    const attachmentItems: any[] = [];
    const nonAttachmentItems: any[] = [];

    for (const it of g.items) {
      const rawFn = (it.changedField ?? it.fieldName ?? '').trim();
      if (ignoredFields.has(rawFn)) continue;

      if (rawFn === 'attachments' || rawFn === 'Tài liệu đính kèm' || rawFn === 'File đính kèm') {
        attachmentItems.push(it);
      } else {
        nonAttachmentItems.push(it);
      }
    }

    const fieldMap = new Map<string, { rowId: string; field: string; oldValue: string | null; newValue: string | null }>();
    for (const it of nonAttachmentItems) {
      let fn = (it.changedField ?? it.fieldName ?? '').trim();
      if (fn === 'Danh sách hạ tầng' || fn === 'infrastructureList') {
        fn = 'Công trình KCHT trực thuộc';
      } else if (fn === 'wharfAreas' || fn === 'Danh sách khu bến') {
        fn = 'Khu bến';
      } else if (fn === 'Tọa độ GIS' || fn === 'coordinates') {
        fn = 'coordinates';
      } else if (fn === 'Loại đối tượng GIS') {
        fn = 'geometryType';
      }

      const oldV = norm(it.oldValue ?? it.previousValue);
      const newV = norm(it.newValue ?? it.value);

      if (!fieldMap.has(fn)) {
        fieldMap.set(fn, {
          rowId: String(it.id ?? `${g.tsMs}-${fn}`),
          field: fn,
          oldValue: oldV,
          newValue: newV,
        });
      } else {
        const existing = fieldMap.get(fn)!;
        if (oldV !== null && oldV !== undefined) {
          existing.oldValue = oldV;
        }
      }
    }

    // Xử lý tệp đính kèm dạng snapshot bảng (chuẩn Cảng biển):
    if (attachmentItems.length > 0) {
      const deletedFileNames = new Set<string>();
      const addedFileNames = new Set<string>();

      for (const it of attachmentItems) {
        const reason = String(it.reason || '');
        const mDel = reason.match(/xóa.*đính kèm:\s*(.*)/i);
        if (mDel && mDel[1]?.trim()) {
          mDel[1].split(',').map((s: string) => s.trim()).filter(Boolean).forEach((f: string) => deletedFileNames.add(f));
        }
        const mUp = reason.match(/tải lên.*đính kèm:\s*(.*)/i);
        if (mUp && mUp[1]?.trim()) {
          mUp[1].split(',').map((s: string) => s.trim()).filter(Boolean).forEach((f: string) => addedFileNames.add(f));
        }
        const st = it.status;
        if (st === 8 || st === 'ATTACHMENT_DELETED') {
          const raw = it.previousValue ?? it.oldValue;
          if (raw && isBlankOrDash(it.newValue ?? it.value)) {
            String(raw).split(',').map((s: string) => s.trim()).filter(Boolean).forEach((f: string) => deletedFileNames.add(f));
          }
        }
        if (st === 7 || st === 'ATTACHMENT_UPLOADED') {
          const raw = it.newValue ?? it.value;
          if (raw && isBlankOrDash(it.previousValue ?? it.oldValue)) {
            String(raw).split(',').map((s: string) => s.trim()).filter(Boolean).forEach((f: string) => addedFileNames.add(f));
          }
        }
      }

      // oldValue: Danh sách file ban đầu trước khi thực hiện thao tác sửa
      const oldFilesList: string[] = [];
      const oldestAtt = attachmentItems[attachmentItems.length - 1];
      const oldestOldV = norm(oldestAtt?.oldValue ?? oldestAtt?.previousValue);
      if (oldestOldV) {
        oldestOldV.split(',').map((s) => s.trim()).filter(Boolean).forEach((f) => {
          if (!oldFilesList.includes(f)) oldFilesList.push(f);
        });
      }
      for (let i = attachmentItems.length - 1; i >= 0; i--) {
        const it = attachmentItems[i];
        const oldV = norm(it.oldValue ?? it.previousValue);
        if (oldV) {
          oldV.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((f) => {
            if (!oldFilesList.includes(f)) oldFilesList.push(f);
          });
        }
      }
      // Đảm bảo 100% mọi file đã bị xóa bằng thùng rác đều có mặt đầy đủ trong oldFilesList
      for (const f of deletedFileNames) {
        if (!oldFilesList.includes(f)) {
          oldFilesList.push(f);
        }
      }

      const initialOldSet = new Set(oldestOldV ? oldestOldV.split(',').map((s) => s.trim()).filter(Boolean) : []);
      const finalOldFilesList = oldFilesList.filter((f) => {
        if (addedFileNames.has(f) && !initialOldSet.has(f) && !deletedFileNames.has(f)) {
          return false;
        }
        return true;
      });

      // newValue: Danh sách file sau cùng sau khi hoàn tất thao tác sửa
      const newFilesList: string[] = [];
      const newestAtt = attachmentItems[0];
      const newestNewV = norm(newestAtt?.newValue ?? newestAtt?.value);
      if (newestNewV) {
        newestNewV.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((f: string) => {
          if (!newFilesList.includes(f) && !deletedFileNames.has(f)) {
            newFilesList.push(f);
          }
        });
      }
      for (const f of addedFileNames) {
        if (!newFilesList.includes(f) && !deletedFileNames.has(f)) {
          newFilesList.push(f);
        }
      }
      // Giữ lại các file cũ không bị xóa (retained files)
      for (const f of finalOldFilesList) {
        if (!deletedFileNames.has(f) && !newFilesList.includes(f)) {
          newFilesList.push(f);
        }
      }

      const finalOld = finalOldFilesList.length > 0 ? finalOldFilesList.join(', ') : null;
      const finalNew = newFilesList.length > 0 ? newFilesList.join(', ') : null;

      if (finalOld !== finalNew) {
        fieldMap.set('File đính kèm', {
          rowId: `att-${g.tsMs}`,
          field: 'File đính kèm',
          oldValue: finalOld,
          newValue: finalNew,
        });
      }
    }

    const rows = Array.from(fieldMap.values()).filter((r) => {
      const o = r.oldValue?.trim() || '';
      const n = r.newValue?.trim() || '';
      return o !== n;
    });

    const ordered = [...rows].sort((a, b) => {
      const ia = groupOrder.indexOf(a.field);
      const ib = groupOrder.indexOf(b.field);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

    if (ordered.length === 0) return null;

    const meta = g.items?.[0] || {};
    const barColor = actionPrimary;
    const accent = historyAccentBarStyle(barColor);

    const paintValue = (fn: string, rawV: string | null) => {
      if (isBlankOrDash(rawV)) return '';
      if (fn === 'attachments' || fn === 'Tài liệu đính kèm' || fn === 'File đính kèm') {
        const files = String(rawV)
          .split(/\s*,\s*/)
          .map((f) => f.trim())
          .filter((f) => !isBlankOrDash(f));
        if (files.length > 0) {
          return (
            <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2, lineHeight: '20px' }}>
              {files.map((file, idx) => (
                <span key={idx} style={{ wordBreak: 'break-all' }}>
                  {file}
                </span>
              ))}
            </span>
          );
        }
      }

      if ((fn === 'Công trình KCHT trực thuộc' || fn === 'Danh sách hạ tầng' || fn === 'infrastructureList') && rawV) {
        const lines = String(rawV)
          .split(/\s*,\s*/)
          .map((seg) => seg.trim())
          .filter(Boolean)
          .map((seg) => {
            const m = seg.match(/^(.*?)\s*\(\s*([\d.]+)\s*\)\s*$/);
            if (m) return { label: m[1].trim() || seg, qty: m[2] };
            return { label: seg, qty: '' };
          })
          .filter((x) => x.label && !isBlankOrDash(x.label));
        if (lines.length > 0) {
          return (
            <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2, lineHeight: '20px' }}>
              {lines.map((x, i) => (
                <span key={i}>
                  Tên: {x.label}{x.qty && !isBlankOrDash(x.qty) ? `, Số lượng: ${autoFormatHistoryValue('qty', x.qty)}` : ''}
                </span>
              ))}
            </span>
          );
        }
      }

      if ((fn === 'Khu bến' || fn === 'wharfAreas' || fn === 'Danh sách khu bến') && rawV) {
        return renderWharfAreaHistory(rawV);
      }

      if (formatValue) {
        const custom = formatValue(fn, rawV);
        if (custom !== undefined && custom !== rawV) {
          if (typeof custom === 'string' && isBlankOrDash(custom)) return '';
          return custom;
        }
      }

      const formatted = autoFormatHistoryValue(fn, rawV);
      return isBlankOrDash(formatted) ? '' : formatted;
    };

    const unit = resolveUnitName ? resolveUnitName(g.items[0]) : (meta.orgUnitName || meta.unitName || '');

    return (
      <div
        key={g.tsMs !== 0 && g.tsMs ? `g-${g.tsMs}-${g.actor}` : `gi-${gi}`}
        style={{ ...historyGroupGridStyle, marginBottom: gi < groups.length - 1 ? spaceSm : 0 }}
      >
        <div style={{ minWidth: 0, paddingTop: spaceXs }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spaceSm }}>
            <Typography.Text style={historyTimeStyle}>
              {g.ts ? dayjs(g.ts).format('HH:mm DD/MM/YYYY') : ''}
            </Typography.Text>
            <span style={{ flexShrink: 0 }}>
              <span
                style={{
                  display: 'inline-flex',
                  padding: '2px 10px',
                  borderRadius: radiusPill,
                  fontSize: fontSizeSm + 1,
                  fontWeight: fontWeightMedium,
                  background: `${actionPrimary}18`,
                  color: actionPrimary,
                  border: `1px solid ${actionPrimary}40`,
                  whiteSpace: 'nowrap',
                }}
              >
                Cập nhật
              </span>
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 0 }}>
            <Typography.Text style={historyMetaRowStyle}>
              Người cập nhật: {(() => {
                const rawActor = meta.changedBy ? String(meta.changedBy) : meta.createdBy ? String(meta.createdBy) : g.actor ? g.actor : '';
                return resolveActorName ? resolveActorName(rawActor, g.items[0]) : rawActor;
              })()}
            </Typography.Text>
            <Typography.Text style={historyMetaRowStyle}>
              Đơn vị: {unit}
            </Typography.Text>
          </div>
        </div>
        <div style={historyInfoCardStyle}>
          <div style={accent} />
          <Typography.Text style={historyInfoTitleStyle}>
            Thông tin thay đổi:
          </Typography.Text>
          {ordered.map((x, ri) => {
            const label = `${fieldLabel(x.field)}:`;
            const ov = paintValue(x.field, x.oldValue);
            const nv = paintValue(x.field, x.newValue);
            return (
              <div key={x.rowId} style={{ ...historyChangeRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                <Typography.Text style={historyFieldLabelStyle}>{label}</Typography.Text>
                <span style={historyOldValueStyle} title={typeof ov === 'string' && ov ? ov : undefined}>
                  {ov}
                </span>
                <Typography.Text style={historyArrowStyle}>→</Typography.Text>
                <span style={historyNewValueStyle} title={typeof nv === 'string' && nv ? nv : undefined}>
                  {nv}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }).filter(Boolean);

  if (cards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
        <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
        <div style={{ color: textTertiary, fontSize: fontSizeMd }}>{emptyMessage}</div>
      </div>
    );
  }
  return cards;
}