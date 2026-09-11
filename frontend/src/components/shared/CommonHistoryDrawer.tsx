import React, { useState, useMemo, useEffect } from 'react';
import { Input, DatePicker, Button, Typography, Space, Skeleton } from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
  FileOutlined,
  UserOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { AppDrawer } from './AppDrawer';
import dayjs from 'dayjs';
import { symbolService, type SymbolOption } from '../../services/symbolService';
import { getProvinceNameById } from '../../types/common';
import { colors, getRangePickerProps } from '../../themetokenchk';
import {
  actionPrimary,
  statusOperational,
  statusAttention,
  statusCritical,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  radiusSm,
  radiusPill,
  spaceXs,
  spaceSm,
  spaceMd,
  spaceLg,
  spaceXl,
  fontSizeSm,
  fontSizeMd,
  fontSizeLg,
  fontWeightMedium,
  fontWeightBold,
  inputStyle,
  primaryButtonStyle,
  statusBadgeStyle,
  getConditionStatusColor,
  historyGroupGridStyle,
  historyTimeStyle,
  historyMetaRowStyle,
  historyInfoCardStyle,
  historyAccentBarStyle,
  historyChangeRowStyle,
  historyCreateRowStyle,
  historyFieldLabelStyle,
  historyOldValueStyle,
  historyNewValueStyle,
  historyArrowStyle,
} from '../../themetokenchk';
import {
  deduplicateAttachmentHistoryChanges,
  isAttachmentField,
  parseAttachmentValues,
  normalizeAttachmentName,
} from '../../utils/historyAttachmentDedup';

export interface HistoryChangeItem {
  field: string;
  oldValue?: any;
  newValue?: any;
}

export interface CommonHistoryEntry {
  id?: string;
  action?: string;
  changedBy?: string;
  changedByName?: string;
  actor?: string;
  changedAt?: string;
  createdAt?: string;
  timestamp?: string;
  orgUnitName?: string;
  unitName?: string;
  note?: string;
  description?: string;
  changes?: HistoryChangeItem[];
  [key: string]: any;
}

export interface CommonHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  entityName?: string;
  /** Fallback tương thích ngược khi truyền entityTitle */
  entityTitle?: string;
  records: CommonHistoryEntry[];
  loading?: boolean;
  fieldLabelMap?: Record<string, string>;
  formatValue?: (fieldName: string, value: any) => string;
  width?: string | number;
  size?: 'default' | 'large' | '50%' | string;
  variant?: 'default' | 'berth';
  /**
   * Bật chế độ lọc ở server. Khi bật, drawer KHÔNG tự lọc `records` theo từ khóa
   * và khoảng ngày nữa mà báo điều kiện ra ngoài qua `onFilterChange` — bắt buộc
   * nếu màn có phân trang, vì lọc phía client chỉ soi được phần đã tải.
   */
  serverFiltered?: boolean;
  onFilterChange?: (filters: { keyword: string; fromDate: string; toDate: string }) => void;
  /** Gọi khi người dùng cuộn tới đáy để tải thêm một trang nhật ký. */
  onLoadMore?: () => void;
  loadingMore?: boolean;
}

const DEFAULT_ACTION_MAP: Record<string, { label: string; color: string; bg: string }> = {
  CREATE: { label: 'Tạo mới', color: statusOperational, bg: `${statusOperational}15` },
  CREATED: { label: 'Tạo mới', color: statusOperational, bg: `${statusOperational}15` },
  ADD: { label: 'Thêm mới', color: statusOperational, bg: `${statusOperational}15` },
  INSERT: { label: 'Thêm mới', color: statusOperational, bg: `${statusOperational}15` },

  UPDATE: { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}15` },
  UPDATED: { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}15` },
  EDIT: { label: 'Chỉnh sửa', color: actionPrimary, bg: `${actionPrimary}15` },
  DRAFT_SAVED: { label: 'Lưu tạm', color: '#64748b', bg: '#64748b15' },
  STATUS_CHANGED: { label: 'Đổi trạng thái', color: '#8b5cf6', bg: '#8b5cf615' },
  EXPIRED: { label: 'Hết hiệu lực', color: '#ef4444', bg: '#ef444415' },

  DELETE: { label: 'Xóa', color: '#64748b', bg: '#64748b15' },
  DELETED: { label: 'Xóa', color: '#64748b', bg: '#64748b15' },
  SOFT_DELETE: { label: 'Xóa mềm', color: '#64748b', bg: '#64748b15' },

  ATTACH_FILE: { label: 'Tải lên tệp', color: '#0284c7', bg: '#0284c715' },
  UPLOAD_ATTACHMENT: { label: 'Tải lên tệp', color: '#0284c7', bg: '#0284c715' },
  ATTACHMENT_UPLOADED: { label: 'Tải lên tệp', color: '#0284c7', bg: '#0284c715' },
  REMOVE_FILE: { label: 'Xóa tệp', color: '#ea580c', bg: '#ea580c15' },
  DELETE_ATTACHMENT: { label: 'Xóa tệp', color: '#ea580c', bg: '#ea580c15' },
  ATTACHMENT_DELETED: { label: 'Xóa tệp', color: '#ea580c', bg: '#ea580c15' },

  APPROVE: { label: 'Phê duyệt C2', color: statusOperational, bg: `${statusOperational}15` },
  APPROVED: { label: 'Phê duyệt C2', color: statusOperational, bg: `${statusOperational}15` },
  APPROVE_L1: { label: 'Phê duyệt C1', color: statusAttention, bg: `${statusAttention}15` },
  APPROVE_L2: { label: 'Phê duyệt C2', color: statusOperational, bg: `${statusOperational}15` },
  APPROVED_LEVEL1: { label: 'Phê duyệt C1', color: '#0284C7', bg: '#0284C715' },
  APPROVED_LEVEL2: { label: 'Phê duyệt C2', color: statusOperational, bg: `${statusOperational}15` },
  SUBMIT: { label: 'Gửi duyệt', color: '#EDA100', bg: '#EDA10015' },
  SUBMITTED: { label: 'Gửi duyệt', color: '#EDA100', bg: '#EDA10015' },
  PROPOSED: { label: 'Gửi duyệt', color: '#EDA100', bg: '#EDA10015' },

  // Numeric InfrastructureHistoryStatus (0 - 11)
  '0': { label: 'Tạo mới', color: statusOperational, bg: `${statusOperational}15` },
  '1': { label: 'Gửi duyệt', color: '#EDA100', bg: '#EDA10015' },
  '2': { label: 'Đang xem xét', color: '#0284C7', bg: '#0284C715' },
  '3': { label: 'Phê duyệt', color: statusOperational, bg: `${statusOperational}15` },
  '4': { label: 'Từ chối', color: '#EF4444', bg: '#EF444415' },
  '5': { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}15` },
  '6': { label: 'Xóa', color: '#64748b', bg: '#64748b15' },
  '7': { label: 'Tải lên tệp', color: '#0284c7', bg: '#0284c715' },
  '8': { label: 'Xóa tệp', color: '#ea580c', bg: '#ea580c15' },
  '9': { label: 'Lưu tạm', color: '#64748b', bg: '#64748b15' },
  '10': { label: 'Hết hiệu lực', color: '#ef4444', bg: '#ef444415' },
  '11': { label: 'Đổi trạng thái', color: '#8b5cf6', bg: '#8b5cf615' },
  UNDER_REVIEW: { label: 'Phê duyệt C1', color: '#0284C7', bg: '#0284C715' },

  REJECT: { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}15` },
  REJECTED: { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}15` },
  REJECTED_LEVEL1: { label: 'Từ chối C1', color: statusCritical, bg: `${statusCritical}15` },
  REJECTED_LEVEL2: { label: 'Từ chối C2', color: statusCritical, bg: `${statusCritical}15` },

  INVALIDATE: { label: 'Vô hiệu hóa', color: '#7c3aed', bg: '#7c3aed15' },
  LOCK: { label: 'Khóa tài khoản', color: '#d97706', bg: '#d9770615' },
  UNLOCK: { label: 'Mở khóa', color: statusOperational, bg: `${statusOperational}15` },
  EXTEND: { label: 'Gia hạn', color: '#2563eb', bg: '#2563eb15' },
};

export function formatFallbackFieldLabel(field: string, combinedMap: Record<string, string> = {}): string {
  if (!field) return '—';
  if (field.includes(',')) {
    return field.split(',').map((f) => {
      const trimmed = f.trim();
      return combinedMap[trimmed] || formatSingleField(trimmed);
    }).join(', ');
  }
  return formatSingleField(field);
}

function formatSingleField(field: string): string {
  const spaced = field.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const DEFAULT_FIELD_MAP: Record<string, string> = {
  // Văn bản & Định danh
  documentName: 'Tên văn bản',
  documentNumber: 'Số hiệu văn bản',
  documentType: 'Loại văn bản',
  issuingAuthority: 'Cơ quan ban hành',
  signer: 'Người ký',
  issueDate: 'Ngày ban hành',
  effectiveDate: 'Ngày có hiệu lực',
  expirationDate: 'Ngày hết hiệu lực',
  applicationArea: 'Phạm vi áp dụng',
  scopeOfApplication: 'Phạm vi áp dụng',
  validityStatus: 'Trạng thái hiệu lực',
  description: 'Mô tả',
  code: 'Mã',
  name: 'Tên',
  systemName: 'Tên hệ thống',
  location: 'Vị trí',
  conditionStatus: 'Tình trạng',
  condition: 'Tình trạng',
  operationalStatus: 'Trạng thái hoạt động',
  approvalStatus: 'Trạng thái phê duyệt',
  status: 'Trạng thái',
  portStatus: 'Tình trạng cảng',
  province: 'Địa điểm (Tỉnh/TP)',
  provinceId: 'Địa điểm (Tỉnh/TP)',
  provinceName: 'Địa điểm (Tỉnh/TP)',
  operatingOrgId: 'Đơn vị khai thác',
  operatingOrgName: 'Đơn vị khai thác',
  operatingUnitId: 'Đơn vị vận hành/khai thác',
  operatingUnitName: 'Đơn vị vận hành/khai thác',
  operatingUnit: 'Đơn vị vận hành/khai thác',
  owningOrgId: 'Đơn vị chủ quản',
  owningOrgName: 'Đơn vị chủ quản',
  managementUnitId: 'Đơn vị quản lý',
  managementUnitName: 'Đơn vị quản lý',
  unitId: 'Đơn vị',
  unitName: 'Tên đơn vị',
  operator: 'Đơn vị vận hành',
  portId: 'Thuộc cảng biển',
  portName: 'Tên cảng biển',
  portCode: 'Mã cảng biển',
  portClass: 'Loại cảng biển',
  portGroup: 'Nhóm cảng biển',
  seaportId: 'Thuộc cảng biển',
  vtsSystemId: 'Thuộc hệ thống VTS',
  vtsSystemName: 'Thuộc hệ thống VTS',
  vtsOperationCenterId: 'Thuộc TTDH VTS',
  vtsOperationCenterName: 'Thuộc TTDH VTS',
  radarStationId: 'Thuộc Trạm Radar',
  radarStationName: 'Thuộc Trạm Radar',
  navigationChannelId: 'Thuộc luồng hàng hải',
  buoyStationId: 'Thuộc trạm phao tiêu',
  waterwayId: 'Tuyến luồng hàng hải',
  waterwayRouteId: 'Tuyến luồng hàng hải',
  attachedInfrastructureId: 'Hạ tầng đính kèm',
  attachedInfrastructureType: 'Loại hạ tầng đính kèm',
  infrastructureList: 'Công trình KCHT trực thuộc',
  coverage: 'Phạm vi phủ sóng',
  coverageArea: 'Vùng phủ sóng',
  coverageZone: 'Vùng phủ sóng',
  coverageRange: 'Tầm phủ sóng/radar',
  detailedLocation: 'Địa điểm chi tiết',
  locationDetail: 'Địa điểm chi tiết',
  locationAddress: 'Địa chỉ chi tiết',
  unitOfMeasure: 'Đơn vị tính',
  quantity: 'Số lượng',
  commissioningYear: 'Năm đưa vào sử dụng',
  yearOfUse: 'Năm đưa vào sử dụng',
  specifications: 'Thông số kỹ thuật',
  manufacturer: 'Hãng sản xuất',
  maintenanceInfo: 'Thông tin bảo trì',
  maintenanceApprovalDate: 'Ngày duyệt bảo trì',
  note: 'Ghi chú',
  notes: 'Ghi chú',
  remarks: 'Ghi chú',
  orgUnitId: 'Đơn vị quản lý',
  orgUnitName: 'Tên đơn vị quản lý',
  facilityName: 'Tên cơ sở',
  facilityType: 'Loại cơ sở',
  stationName: 'Tên trạm',
  channelCode: 'Mã luồng',
  channelName: 'Tên luồng',
  pierName: 'Tên cầu cảng',
  berthName: 'Tên bến cảng',
  berthCode: 'Mã bến cảng',
  berthId: 'Thuộc bến cảng',
  dryPortName: 'Tên cảng cạn',
  dryPortCode: 'Mã cảng cạn',
  beaconName: 'Tên báo hiệu',
  beaconCode: 'Mã báo hiệu',
  stormShelterName: 'Tên khu neo tránh bão',
  stormShelterCode: 'Mã khu neo tránh bão',
  anchorageName: 'Tên khu neo đậu',
  anchorageCode: 'Mã khu neo đậu',
  dikeRevetmentName: 'Tên đê kè',
  dikeRevetmentType: 'Loại kết cấu đê kè',
  attachments: 'Tài liệu đính kèm',
  attachmentList: 'Tài liệu đính kèm',
  'Tài liệu đính kèm': 'Tài liệu đính kèm',
  vtsZones: 'Vùng VTS',
  zones: 'Vùng VTS',
  zoneList: 'Vùng VTS',
  'Vùng VTS': 'Vùng VTS',
  fileName: 'Tên tệp tin',
  fileSize: 'Kích thước tệp',
  coordinates: 'Tọa độ GIS',
  geometryType: 'Loại đối tượng GIS',
  objectType: 'Loại đối tượng GIS',
  symbol: 'Biểu tượng bản đồ',
  symbolId: 'Biểu tượng bản đồ',
  mapSymbolId: 'Biểu tượng bản đồ',
  mapIcon: 'Biểu tượng bản đồ',
  coordinateSystem: 'Hệ quy chiếu',
  displayRule: 'Quy tắc hiển thị',
  displayFormat: 'Định dạng hiển thị',
  spatialId: 'Mã không gian (GIS)',
  latitude: 'Vĩ độ',
  longitude: 'Kinh độ',

  // Thông số kỹ thuật & Diện tích
  area: 'Diện tích (m²)',
  totalArea: 'Tổng diện tích (m²)',
  usableArea: 'Diện tích sử dụng (m²)',
  warehouseArea: 'Diện tích kho (m²)',
  yardArea: 'Diện tích bãi (m²)',
  waterAreaScope: 'Phạm vi vùng nước',
  waterAreaNeutralScope: 'Phạm vi vùng nước cách ly',
  otherWaterAreas: 'Vùng nước khác',
  length: 'Chiều dài (m)',
  width: 'Chiều rộng (m)',
  height: 'Chiều cao (m)',
  towerHeight: 'Chiều cao tháp (m)',
  lightHeight: 'Chiều cao tâm sáng (m)',
  antennaHeight: 'Chiều cao anten (m)',
  powerOutput: 'Công suất phát (W)',
  transmitPower: 'Công suất phát (W)',
  currentWaterDepth: 'Độ sâu luồng hiện tại (m)',
  designWaterDepth: 'Độ sâu thiết kế (m)',
  designBedElevation: 'Cao trình đáy thiết kế (m)',
  bottomElevationDesign: 'Cao trình đáy thiết kế (m)',
  crestElevation: 'Cao trình đỉnh (m)',
  surfaceMaterial: 'Vật liệu bề mặt',
  structureType: 'Kết cấu công trình',
  constructionGrade: 'Cấp công trình xây dựng',
  operationalFunction: 'Công năng sử dụng',
  classification: 'Phân loại',
  classificationBuoy: 'Phân loại phao',
  classificationMark: 'Phân loại báo hiệu',
  connectionMode: 'Phương thức kết nối',
  transportCorridor: 'Hành lang vận tải',
  region: 'Vùng hàng hải',
  teuCapacity: 'Công suất (TEU)',
  cargoThroughput: 'Sản lượng hàng hóa (tấn)',
  currentThroughput: 'Sản lượng thông qua hiện tại (tấn)',
  designThroughput: 'Công suất thiết kế (tấn)',
  plannedThroughput: 'Sản lượng quy hoạch (tấn)',
  latestCargoVolume: 'Khối lượng hàng hóa gần nhất (tấn)',
  maxVesselSize: 'Cỡ tàu lớn nhất',
  maxVesselDWT: 'Trọng tải tàu lớn nhất (DWT)',
  publishedVesselDWT: 'Trọng tải tàu công bố (DWT)',
  receivesLargeVessel: 'Tiếp nhận tàu trọng tải lớn',

  // Số lượng & Thống kê
  totalBerths: 'Tổng số bến cảng',
  totalDikes: 'Tổng số đê kè',
  totalDikeLength: 'Tổng chiều dài đê kè (m)',
  totalPublicChannels: 'Tổng số tuyến luồng công cộng',
  totalPublicChannelLength: 'Tổng chiều dài luồng công cộng (km)',
  totalDedicatedChannels: 'Tổng số luồng chuyên dùng',
  totalDedicatedChannelLength: 'Tổng chiều dài luồng chuyên dùng (km)',
  totalBuoysBeacons: 'Tổng số phao tiêu báo hiệu',
  totalLighthouses: 'Tổng số đèn biển',
  totalAnchoragesTransshipment: 'Tổng số khu chuyển tải',
  transshipmentCount: 'Số khu chuyển tải',
  anchorageCount: 'Số khu neo đậu',
  activeAnchorageCount: 'Số khu neo đậu hoạt động',
  publishedAnchorageCount: 'Số khu neo đậu công bố',
  underInvestmentAnchorageCount: 'Số khu neo đậu đang đầu tư',
  publishedPierCount: 'Số cầu cảng công bố',
  operatingPierCount: 'Số cầu cảng đang khai thác',
  investmentAgreementPierCount: 'Số cầu cảng thỏa thuận đầu tư',
  buoyBerthCount: 'Số phao neo',
  activeStormShelterCount: 'Số khu neo tránh bão hoạt động',
  staffCount: 'Số lượng nhân sự',

  // Quyết định & Pháp lý
  announcementDecisionDate: 'Ngày quyết định công bố',
  announcementDecisionNumber: 'Số quyết định công bố',
  announcementOrg: 'Cơ quan công bố',
  announcementTime: 'Thời gian công bố',
  openingAnnouncementDate: 'Ngày công bố mở',
  openingDecision: 'Quyết định mở',
  publicDecision: 'Quyết định công bố',
  investmentAgreement: 'Thỏa thuận đầu tư',
  investmentAgreementDoc: 'Văn bản thỏa thuận đầu tư',
  noticeToMariners: 'Thông báo hàng hải',
  documentDate: 'Ngày văn bản',
  safetyAssessmentDate: 'Ngày đánh giá an toàn',
  commencementDate: 'Thời gian bắt đầu hoạt động',
  constructionDate: 'Ngày xây dựng',
  lastInspectionDate: 'Ngày kiểm định gần nhất',
  nextInspectionDate: 'Ngày kiểm định tiếp theo',
  operationalLicense: 'Giấy phép hoạt động',
  licenseExpiry: 'Hạn giấy phép',

  // Thiết bị & Đài duyên hải
  terminalId: 'Mã Terminal',
  imoNumber: 'Số IMO',
  reportingInterval: 'Chu kỳ báo cáo (giây)',
  antennaType: 'Loại anten',
  dataFormat: 'Định dạng dữ liệu',
  communicationChannel: 'Kênh liên lạc',
  communicationFrequency: 'Tần số liên lạc',
  frequencyBand: 'Băng tần',
  frequency: 'Tần số',
  equipmentType: 'Loại thiết bị',
  servicesProvided: 'Dịch vụ cung cấp',
  services: 'Dịch vụ cung cấp',
  contactPerson: 'Người liên hệ',
  contactPhone: 'Số điện thoại liên hệ',
  inspectorName: 'Cán bộ kiểm định',
  inspectorPhone: 'SĐT cán bộ kiểm định',
  district: 'Quận/Huyện',
  ward: 'Phường/Xã',
  address: 'Địa chỉ',
  phone: 'Số điện thoại',
  email: 'Email',
  capacity: 'Công suất',
  authority: 'Cơ quan thẩm quyền',
  deviceName: 'Tên thiết bị',
  deviceCode: 'Mã thiết bị',
  model: 'Model',
  range: 'Tầm hiệu lực / Phạm vi',
  shapeDescription: 'Mô tả hình dạng',
  routeDetails: 'Chi tiết tuyến luồng',
  coordinateList: 'Danh sách tọa độ',
  managementStation: 'Trạm quản lý',
  deletedAt: 'Thời điểm xóa',
  deletedBy: 'Người thực hiện xóa',
  isActive: 'Kích hoạt',

  // Các tổ hợp trường phổ biến
  'coordinates, latitude, longitude': 'Tọa độ GIS (Kinh độ, Vĩ độ)',
  'seaportId, coordinates, latitude': 'Cảng biển, Tọa độ GIS',
  'name, mapSymbolId': 'Tên, Biểu tượng bản đồ',
  'geometryType, coordinates': 'Loại đối tượng, Tọa độ GIS',
  'geometryType, mapSymbolId, coordinateSystem, coordinates, latitude, longitude': 'Thông tin không gian GIS',
  'vtsZones, attachments': 'Vùng VTS, Tài liệu đính kèm',
  'conditionStatus, commencementDate': 'Tình trạng, Thời gian hoạt động',
  'noticeToMariners, scopeOfApplication': 'Thông báo hàng hải, Phạm vi áp dụng',
  'orgUnitId, operatingUnitId, detailedLocation': 'Đơn vị quản lý, Đơn vị vận hành, Địa điểm chi tiết',
  'provinceId, noticeToMariners, vtsZones, attachments': 'Địa điểm, Thông báo hàng hải, Vùng VTS, Tài liệu đính kèm',
};

function formatCoordPointDms(xStr: string, yStr?: string): string {
  const x = Number(xStr);
  const y = yStr !== undefined && yStr !== '' ? Number(yStr) : NaN;

  const toDmsString = (val: number, isLat: boolean) => {
    if (isNaN(val)) return '';
    const abs = Math.abs(val);
    const d = Math.floor(abs);
    const minFloat = (abs - d) * 60;
    const m = Math.floor(minFloat);
    const s = Math.round((minFloat - m) * 60 * 10) / 10;
    const dir = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
    return `${d}° ${m}' ${s.toFixed(1)}" ${dir}`;
  };

  if (!isNaN(x) && !isNaN(y)) {
    let lat = y;
    let lng = x;
    if (x < 35 && y > 50) {
      lat = x;
      lng = y;
    }
    const latDms = toDmsString(lat, true);
    const lngDms = toDmsString(lng, false);
    return `${latDms}, ${lngDms}`;
  }

  if (!isNaN(x)) {
    const isLat = x <= 35 && x >= -35;
    return toDmsString(x, isLat);
  }

  return xStr;
}

function parseCoordinatesPoints(raw: string | null): { typeName?: string; points: Array<{ x: string; y: string; index: number }> } | null {
  if (!raw || raw === '—' || raw === 'Chưa có' || raw === '(null)' || raw === '(trống)') return null;
  const str = raw.trim();

  if (/^(Đường|Vùng|Điểm)\s+bản\s+đồ\s*\(\d+\s+điểm/i.test(str)) {
    return { typeName: str, points: [] };
  }

  let typeName = '';
  let inner = str;

  if (/^POINT\s*\(/i.test(str)) {
    typeName = 'Điểm';
    inner = str.replace(/^POINT\s*\(/i, '').replace(/\)\s*$/, '');
  } else if (/^LINESTRING\s*\(/i.test(str)) {
    typeName = 'Đường';
    inner = str.replace(/^LINESTRING\s*\(/i, '').replace(/\)\s*$/, '');
  } else if (/^LINE\s*\(/i.test(str)) {
    typeName = 'Đường';
    inner = str.replace(/^LINE\s*\(/i, '').replace(/\)\s*$/, '');
  } else if (/^POLYGON\s*\(\(/i.test(str)) {
    typeName = 'Vùng';
    inner = str.replace(/^POLYGON\s*\(\(/i, '').replace(/\)\)\s*$/, '');
  } else if (/^MULTIPOINT\s*\(/i.test(str)) {
    typeName = 'Tập hợp điểm';
    inner = str.replace(/^MULTIPOINT\s*\(/i, '').replace(/\)\s*$/, '');
  } else if (str.startsWith('(') && str.endsWith(')')) {
    inner = str.slice(1, -1);
  }

  const pointStrings = inner.split(',').map((s) => s.trim()).filter(Boolean);
  if (pointStrings.length === 0) return null;

  const points = pointStrings.map((ps, idx) => {
    const clean = ps.replace(/[()]/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return { x: parts[0], y: parts[1], index: idx + 1 };
    }
    return { x: clean, y: '', index: idx + 1 };
  });

  return { typeName, points };
}

function renderCoordinatesDisplay(val: string | null) {
  if (!val || val === '—' || val === 'Chưa có' || val === '(null)' || val === '(trống)') {
    return val === 'Chưa có' ? <span style={{ color: textTertiary }}>Chưa có</span> : null;
  }
  const parsed = parseCoordinatesPoints(val);
  if (!parsed || parsed.points.length === 0) {
    return <span style={{ color: textPrimary }}>{parsed?.typeName || val}</span>;
  }
  const { typeName, points } = parsed;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs, width: '100%' }}>
      {typeName && (
        <span style={{ fontSize: fontSizeSm, fontWeight: fontWeightBold, color: actionPrimary }}>
          {typeName} ({points.length} điểm)
        </span>
      )}
      {points.map((pt) => (
        <div key={pt.index} style={{ fontSize: fontSizeSm, color: textPrimary, lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
          {points.length > 1 && <span style={{ color: textSecondary, marginRight: spaceXs }}>#{pt.index}:</span>}
          <span>{formatCoordPointDms(pt.x, pt.y)}</span>
        </div>
      ))}
    </div>
  );
}

export function renderCommonHistoryValueTag(field: string, val: string, isOld: boolean = false) {
  if (!val || val === '—' || val === '-' || val === 'null' || val === '(null)' || val === '[]') {
    return <span style={{ color: textTertiary }}>—</span>;
  }
  const normKey = field.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
  
  // Chuẩn hóa hiển thị tiếng Việt cho các mã enum
  let displayVal = val;
  const rawUpper = val.trim().toUpperCase();
  if (normKey.includes('approvalstatus') || normKey.includes('trang thai phe duyet')) {
    if (rawUpper === 'APPROVED' || rawUpper === 'APPROVED_LEVEL2') displayVal = 'Đã duyệt';
    else if (rawUpper === 'APPROVED_LEVEL1') displayVal = 'Chờ Cục phê duyệt';
    else if (rawUpper === 'SUBMITTED') displayVal = 'Chờ phê duyệt';
    else if (rawUpper === 'DRAFT') displayVal = 'Bản nháp';
    else if (rawUpper === 'REJECTED' || rawUpper === 'REJECTED_LEVEL1' || rawUpper === 'REJECTED_LEVEL2') displayVal = 'Từ chối';
    else if (rawUpper === 'ARCHIVED') displayVal = 'Đã lưu trữ';
  } else if (normKey.includes('conditionstatus') || normKey.includes('tinh trang')) {
    if (rawUpper === 'OPERATIONAL') displayVal = 'Đang hoạt động';
    else if (rawUpper === 'STOPPED') displayVal = 'Dừng hoạt động';
    else if (rawUpper === 'MAINTENANCE') displayVal = 'Đang bảo trì';
    else if (rawUpper === 'UNDER_CONSTRUCTION') displayVal = 'Đang xây dựng';
  } else if (val.trim() === 'true' || val.trim() === 'TRUE') {
    displayVal = 'Có';
  } else if (val.trim() === 'false' || val.trim() === 'FALSE') {
    displayVal = 'Không';
  }

  const normVal = displayVal.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');

  // 1. Tình trạng hoạt động (ConditionStatus)
  if (normKey === 'conditionstatus' || normKey === 'tinh trang' || normKey.includes('tinh trang')) {
    const color = getConditionStatusColor(displayVal);
    if (color && color !== textSecondary) {
      return (
        <span style={statusBadgeStyle(color)}>
          {displayVal}
        </span>
      );
    }
  }

  // 2. Trạng thái phê duyệt (ApprovalStatus) & Trạng thái chung
  if (normKey.includes('trang thai') || normKey.includes('status') || normKey.includes('hieu luc')) {
    // Các giá trị PHỦ ĐỊNH phải xét TRƯỚC: "dừng hoạt động" cũng chứa "hoạt động"
    if (normVal.includes('dung hoat dong') || normVal.includes('ngung hoat dong')
        || normVal.includes('tam dung') || normVal.includes('khong hoat dong')
        || normVal === 'stopped' || normVal === 'not_operational') {
      return (
        <span style={statusBadgeStyle(statusCritical)}>
          {displayVal}
        </span>
      );
    }
    if (normVal.includes('bao tri') || normVal.includes('bao duong') || normVal.includes('sua chua') || normVal.includes('maintenance')) {
      return (
        <span style={statusBadgeStyle(statusAttention)}>
          {displayVal}
        </span>
      );
    }
    if (normVal.includes('xay dung') || normVal.includes('construction') || normVal.includes('under_construction')) {
      return (
        <span style={statusBadgeStyle(actionPrimary)}>
          {displayVal}
        </span>
      );
    }
    if (normVal.includes('da phe duyet') || normVal.includes('da duyet') || normVal.includes('con hieu luc') || normVal.includes('hoat dong') || normVal.includes('active') || normVal.includes('approved') || normVal.includes('valid')) {
      return (
        <span style={statusBadgeStyle(statusOperational)}>
          {displayVal}
        </span>
      );
    }
    if (normVal.includes('tu choi') || normVal.includes('het hieu luc') || normVal.includes('hong') || normVal.includes('inactive') || normVal.includes('rejected') || normVal.includes('expired')) {
      return (
        <span style={statusBadgeStyle(statusCritical)}>
          {displayVal}
        </span>
      );
    }
    if (normVal.includes('dang xem xet') || normVal.includes('chua co hieu luc') || normVal.includes('review') || normVal.includes('under_review') || normVal.includes('da phe duyet cap 1') || normVal.includes('cap 1') || normVal.includes('approved_level1') || normVal.includes('cho cuc phe duyet')) {
      return (
        <span style={statusBadgeStyle(actionPrimary)}>
          {displayVal}
        </span>
      );
    }
    if (normVal.includes('cho phe duyet') || normVal.includes('can bao duong') || normVal.includes('pending') || normVal.includes('draft') || normVal.includes('warning') || normVal.includes('proposed') || normVal.includes('cho') || normVal.includes('ban nhap')) {
      return (
        <span style={statusBadgeStyle(statusAttention)}>
          {displayVal}
        </span>
      );
    }
  }

  return (
    <span
      title={typeof displayVal === 'string' ? displayVal : undefined}
      style={{
        color: isOld ? textSecondary : textPrimary,
        fontWeight: isOld ? 400 : fontWeightMedium,
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        whiteSpace: 'normal',
        lineHeight: 1.5,
      }}
    >
      {displayVal}
    </span>
  );
}

const drawerTitleStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeLg,
};

export function isZoneField(f: string): boolean {
  const norm = (f || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
  return norm.includes('vung vts') || norm.includes('zone');
}

function stripPrefixByField(val: string, fName: string): string {
  if (!val) return val;
  let res = val.trim();
  const escaped = fName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^${escaped}\\s*[:=]\\s*`, 'i');
  if (pattern.test(res)) {
    res = res.replace(pattern, '').trim();
  }
  const norm = res.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
  if (norm.startsWith('vung vts=') || norm.startsWith('vung vts:') || norm.startsWith('vung vts =') || norm.startsWith('vung vts :')) {
    const idx = res.search(/[:=]/);
    if (idx >= 0) res = res.substring(idx + 1).trim();
  } else if (norm.startsWith('tai lieu dinh kem=') || norm.startsWith('tai lieu dinh kem:') || norm.startsWith('tai lieu dinh kem =') || norm.startsWith('tai lieu dinh kem :')) {
    const idx = res.search(/[:=]/);
    if (idx >= 0) res = res.substring(idx + 1).trim();
  } else if (norm.startsWith('zones=') || norm.startsWith('zone=') || norm.startsWith('attachments=') || norm.startsWith('attachment=')) {
    const idx = res.search(/[:=]/);
    if (idx >= 0) res = res.substring(idx + 1).trim();
  }
  return res;
}

function splitRespectingParentheses(str: string): string[] {
  if (!str) return [];
  const res: string[] = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '(') depth++;
    else if (char === ')') depth = Math.max(0, depth - 1);

    if ((char === ',' || char === '\n') && depth === 0) {
      if (current.trim()) res.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) res.push(current.trim());
  return res;
}

function parseZoneChanges(field: string, prevRaw: string, newRaw: string): HistoryChangeItem[] {
  const cleanPrev = stripPrefixByField(prevRaw, field);
  const cleanNew = stripPrefixByField(newRaw, field);

  const splitItems = (str: string) => {
    if (!str || str === '—' || str === '-' || str === '(null)' || str === 'null' || str === '(trống)' || str === 'undefined') return [];
    return splitRespectingParentheses(str).map((s) => stripPrefixByField(s.trim(), field)).filter(Boolean);
  };

  const prevItems = splitItems(cleanPrev);
  const newItems = splitItems(cleanNew);

  // Helper bóc tách cấu trúc zone: "Tên (Mã) - Tọa độ: WKT - Loại hình: TYPE"
  const extractZoneDetails = (str: string) => {
    if (!str) return null;
    let text = str.trim();
    let coord: string | null = null;
    let geomType: string | null = null;
    let symbol: string | null = null;

    const coordMatch = text.match(/(?:[-–—\s,;:]|^)Tọa độ:\s*(POINT\s*\([^)]+\)|LINESTRING\s*\([^)]+(?:\)[^)]*)*\)|LINE\s*\([^)]+\)|POLYGON\s*\(\([^)]+\)\)|MULTIPOINT\s*\([^)]+\)|[A-Z]+\s*\([^)]+\))/i);
    if (coordMatch) {
      coord = coordMatch[1].trim();
      text = text.replace(coordMatch[0], '').trim();
    }

    const geomMatch = text.match(/(?:[-–—\s,;:]|^)Loại hình:\s*([A-Za-z0-9_]+|Đối tượng [^–—\n\r,;:]+)/i);
    if (geomMatch) {
      geomType = geomMatch[1].trim();
      text = text.replace(geomMatch[0], '').trim();
    }

    const symbolMatch = text.match(/(?:[-–—\s,;:]|^)Biểu tượng:\s*([^–—\n\r,;:]+)/i);
    if (symbolMatch) {
      symbol = symbolMatch[1].trim();
      text = text.replace(symbolMatch[0], '').trim();
    }

    const mapGeomLabel = (g: string | null) => {
      if (!g) return '';
      const u = g.toUpperCase();
      if (u === 'POINT') return 'Đối tượng điểm';
      if (u === 'LINE' || u === 'LINESTRING') return 'Đối tượng đường';
      if (u === 'POLYGON') return 'Đối tượng vùng';
      return g;
    };

    const cleanZoneName = text
      .replace(/^[-–—\s]+|[-–—\s]+$/g, '')
      .replace(/^(cũ|mới|thêm|xóa):\s*/i, '')
      .trim();

    return {
      name: cleanZoneName,
      coord,
      geomType: mapGeomLabel(geomType),
      symbol,
    };
  };

  // Kiểm tra nếu có chuỗi zone chi tiết chứa Tọa độ / Loại hình
  const prevDetail = extractZoneDetails(cleanPrev);
  const newDetail = extractZoneDetails(cleanNew);

  if ((prevDetail && (prevDetail.coord || prevDetail.geomType)) || (newDetail && (newDetail.coord || newDetail.geomType))) {
    const detailResults: HistoryChangeItem[] = [];

    // 1. Loại đối tượng GIS
    const oldGeom = prevDetail?.geomType || '';
    const newGeom = newDetail?.geomType || '';
    if ((oldGeom || newGeom) && oldGeom !== newGeom) {
      detailResults.push({
        field: 'Loại đối tượng GIS',
        oldValue: oldGeom,
        newValue: newGeom,
      });
    }

    // 2. Tọa độ GIS (kích hoạt renderCoordinatesDisplay chuẩn DMS)
    const oldCoord = prevDetail?.coord || '';
    const newCoord = newDetail?.coord || '';
    if ((oldCoord || newCoord) && oldCoord !== newCoord) {
      detailResults.push({
        field: 'Tọa độ GIS',
        oldValue: oldCoord,
        newValue: newCoord,
      });
    }

    // 3. Biểu tượng bản đồ (nếu có)
    const oldSym = prevDetail?.symbol || '';
    const newSym = newDetail?.symbol || '';
    if ((oldSym || newSym) && oldSym !== newSym) {
      detailResults.push({
        field: 'Biểu tượng bản đồ',
        oldValue: oldSym,
        newValue: newSym,
      });
    }

    // 4. Tên / mã vùng VTS (nếu thay đổi tên)
    const oldName = prevDetail?.name || '';
    const newName = newDetail?.name || '';
    if (oldName && newName && oldName !== newName) {
      detailResults.push({
        field: 'Vùng VTS',
        oldValue: oldName,
        newValue: newName,
      });
    }

    if (detailResults.length > 0) {
      return detailResults;
    }
  }

  const hasKeywords = /(xóa|thêm|cũ:|mới:)/i.test(cleanPrev) || /(xóa|thêm|cũ:|mới:)/i.test(cleanNew);
  if (!hasKeywords) {
    if (prevItems.length > 0 && newItems.length === 0) {
      return prevItems.map((item) => ({ field, oldValue: item, newValue: '' }));
    }
    if (prevItems.length === 0 && newItems.length > 0) {
      return newItems.map((item) => ({ field, oldValue: '', newValue: item }));
    }
    const maxLen = Math.max(prevItems.length, newItems.length);
    if (maxLen > 0) {
      const res: HistoryChangeItem[] = [];
      for (let i = 0; i < maxLen; i++) {
        const p = (prevItems[i] || '').trim();
        const n = (newItems[i] || '').trim();
        if (p !== n && (p || n)) {
          res.push({
            field,
            oldValue: p,
            newValue: n,
          });
        }
      }
      if (res.length > 0) return res;
    }
    return cleanPrev !== cleanNew ? [{ field, oldValue: cleanPrev || '', newValue: cleanNew || '' }] : [];
  }

  const removed: string[] = [];
  const modifiedOld: string[] = [];
  prevItems.forEach((item) => {
    const cItem = stripPrefixByField(item, field);
    if (/^xóa\s+/i.test(cItem)) {
      removed.push(cItem.replace(/^xóa\s+/i, '').trim());
    } else if (/^cũ:\s*/i.test(cItem)) {
      modifiedOld.push(cItem.replace(/^cũ:\s*/i, '').trim());
    } else if (cItem && cItem !== '—' && cItem !== '-') {
      removed.push(cItem);
    }
  });

  const added: string[] = [];
  const modifiedNew: string[] = [];
  newItems.forEach((item) => {
    const cItem = stripPrefixByField(item, field);
    if (/^thêm\s+/i.test(cItem)) {
      added.push(cItem.replace(/^thêm\s+/i, '').trim());
    } else if (/^mới:\s*/i.test(cItem)) {
      modifiedNew.push(cItem.replace(/^mới:\s*/i, '').trim());
    } else if (cItem && cItem !== '—' && cItem !== '-') {
      added.push(cItem);
    }
  });

  const results: HistoryChangeItem[] = [];

  // 1. Xóa vùng: giá trị cũ là tên vùng, giá trị mới là '' (như tài liệu đính kèm)
  removed.forEach((name) => {
    results.push({ field, oldValue: name, newValue: '' });
  });

  // 2. Chỉnh sửa vùng: giá trị cũ là tên cũ, giá trị mới là tên mới
  const modCount = Math.max(modifiedOld.length, modifiedNew.length);
  for (let i = 0; i < modCount; i++) {
    const o = (modifiedOld[i] || '').trim();
    const n = (modifiedNew[i] || '').trim();
    if (o !== n && (o || n)) {
      results.push({
        field,
        oldValue: o,
        newValue: n,
      });
    }
  }

  // 3. Thêm mới vùng: giá trị cũ là '', giá trị mới là tên vùng
  added.forEach((name) => {
    results.push({ field, oldValue: '', newValue: name });
  });

  if (results.length > 0) return results;
  const stripKw = (s: string) => s.replace(/^(cũ|mới|thêm|xóa):\s*/i, '').trim();
  return stripKw(cleanPrev) !== stripKw(cleanNew) ? [{ field, oldValue: cleanPrev || '', newValue: cleanNew || '' }] : [];
}

function parseAttachmentChanges(field: string, prevRaw: string, newRaw: string): HistoryChangeItem[] {
  const cleanPrev = stripPrefixByField(prevRaw, field);
  const cleanNew = stripPrefixByField(newRaw, field);

  const splitItems = (str: string) => {
    if (!str || str === '—' || str === '-' || str === '(null)' || str === 'null' || str === '(trống)' || str === 'undefined') return [];
    return str.split(/[,\n]/).map((s) => stripPrefixByField(s.trim(), field)).filter(Boolean);
  };

  const prevItems = splitItems(cleanPrev);
  const newItems = splitItems(cleanNew);

  const hasKeywords = /(xóa|thêm)/i.test(cleanPrev) || /(xóa|thêm)/i.test(cleanNew);
  if (!hasKeywords) {
    const prevFiles = parseAttachmentValues(cleanPrev).map(normalizeAttachmentName).filter(Boolean);
    const newFiles = parseAttachmentValues(cleanNew).map(normalizeAttachmentName).filter(Boolean);
    if (prevFiles.length > 0 && newFiles.length === 0) {
      return prevFiles.map((f) => ({ field, oldValue: f, newValue: '' }));
    }
    if (prevFiles.length === 0 && newFiles.length > 0) {
      return newFiles.map((f) => ({ field, oldValue: '', newValue: f }));
    }
    return [{
      field,
      oldValue: cleanPrev !== '' ? cleanPrev : '',
      newValue: cleanNew !== '' ? cleanNew : '',
    }];
  }

  const removed: string[] = [];
  prevItems.forEach((item) => {
    const c = stripPrefixByField(item, field);
    const cleaned = c.replace(/^xóa\s+/i, '').trim();
    if (cleaned && cleaned !== '—' && cleaned !== '-') removed.push(cleaned);
  });

  const added: string[] = [];
  newItems.forEach((item) => {
    const c = stripPrefixByField(item, field);
    const cleaned = c.replace(/^thêm\s+/i, '').trim();
    if (cleaned && cleaned !== '—' && cleaned !== '-') added.push(cleaned);
  });

  const results: HistoryChangeItem[] = [];
  removed.forEach((name) => {
    results.push({ field, oldValue: name, newValue: '' });
  });
  added.forEach((name) => {
    results.push({ field, oldValue: '', newValue: name });
  });

  return results.length > 0 ? results : [{ field, oldValue: cleanPrev || '', newValue: cleanNew || '' }];
}

export function parseHistoryEntryChanges(item: CommonHistoryEntry): HistoryChangeItem[] {
  if (item.changes && Array.isArray(item.changes) && item.changes.length > 0) {
    return item.changes;
  }
  if (!item.changedField) return [];

  const prevRaw = item.previousValue !== null && item.previousValue !== undefined ? String(item.previousValue).trim() : '';
  const newRaw = item.newValue !== null && item.newValue !== undefined ? String(item.newValue).trim() : '';

  // Phân rã chuỗi nhiều trường ngăn cách bằng chấm phẩy (VD: "Tên hệ thống=A; Vùng VTS=B")
  if (prevRaw.includes(';') || newRaw.includes(';')) {
    const parsePairs = (str: string) => {
      const map: Record<string, string> = {};
      let currentKey = '';
      str.split(';').forEach((part) => {
        const eqIdx = part.indexOf('=');
        if (eqIdx > 0) {
          currentKey = part.substring(0, eqIdx).trim();
          const v = part.substring(eqIdx + 1).trim();
          if (currentKey) map[currentKey] = v;
        } else if (currentKey && part.trim()) {
          map[currentKey] = map[currentKey] ? `${map[currentKey]}, ${part.trim()}` : part.trim();
        }
      });
      return map;
    };
    const prevMap = parsePairs(prevRaw);
    const newMap = parsePairs(newRaw);
    const allKeys = Array.from(new Set([...Object.keys(prevMap), ...Object.keys(newMap)]));
    if (allKeys.length > 0) {
      return allKeys.flatMap((k) => {
        const ov = prevMap[k] !== undefined ? prevMap[k] : '';
        const nv = newMap[k] !== undefined ? newMap[k] : '';
        if (isZoneField(k)) {
          return parseZoneChanges(k, ov, nv);
        }
        if (isAttachmentField(k)) {
          return parseAttachmentChanges(k, ov, nv);
        }
        return [{
          field: k,
          oldValue: ov,
          newValue: nv,
        }];
      });
    }
  }

  const fieldName = item.changedField.trim();
  if (isZoneField(fieldName)) {
    return parseZoneChanges(fieldName, prevRaw, newRaw);
  }
  if (isAttachmentField(fieldName)) {
    return parseAttachmentChanges(fieldName, prevRaw, newRaw);
  }

  const cleanOld = stripPrefixByField(prevRaw, fieldName);
  const cleanNew = stripPrefixByField(newRaw, fieldName);

  return [{
    field: fieldName,
    oldValue: cleanOld !== '' ? cleanOld : item.previousValue,
    newValue: cleanNew !== '' ? cleanNew : item.newValue,
  }];
}

export function mergeChangesByField(
  changes: HistoryChangeItem[],
  fieldLabelMap: Record<string, string> = {}
): HistoryChangeItem[] {
  if (changes.length <= 1) return changes;

  const groups = new Map<string, { field: string; items: HistoryChangeItem[] }>();

  changes.forEach((c) => {
    const rawField = c.field || '';
    const label = fieldLabelMap[rawField] || rawField;
    const norm = label.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
    let key = norm;
    if (isAttachmentField(rawField) || norm.includes('dinh kem') || norm.includes('attachment')) {
      key = '__attachments__';
    } else if (isZoneField(rawField) || norm.includes('vung vts') || norm.includes('zone')) {
      key = '__zones__';
    }
    if (!groups.has(key)) {
      groups.set(key, { field: rawField, items: [] });
    }
    groups.get(key)!.items.push(c);
  });

  const result: HistoryChangeItem[] = [];
  groups.forEach(({ field, items }, key) => {
    if (key === '__attachments__') {
      const oldValList: string[] = [];
      const newValList: string[] = [];
      items.forEach((item) => {
        parseAttachmentValues(item.oldValue).forEach((f) => {
          const trimmed = f.trim();
          if (trimmed && trimmed !== '—' && !oldValList.includes(trimmed)) oldValList.push(trimmed);
        });
        parseAttachmentValues(item.newValue).forEach((f) => {
          const trimmed = f.trim();
          if (trimmed && trimmed !== '—' && !newValList.includes(trimmed)) newValList.push(trimmed);
        });
      });
      const mergedOld = oldValList.length > 0 ? oldValList.join(', ') : '';
      const mergedNew = newValList.length > 0 ? newValList.join(', ') : '';
      if (mergedOld !== '' && mergedNew !== '' && mergedOld === mergedNew) {
        return;
      }
      result.push({
        field,
        oldValue: mergedOld,
        newValue: mergedNew,
      });
    } else if (key === '__zones__') {
      const oldValList: string[] = [];
      const newValList: string[] = [];
      items.forEach((item) => {
        const ov = String(item.oldValue ?? '').trim();
        if (ov && ov !== '—' && ov !== '-' && ov !== '(null)' && ov !== 'null' && !oldValList.includes(ov)) {
          oldValList.push(ov);
        }
        const nv = String(item.newValue ?? '').trim();
        if (nv && nv !== '—' && nv !== '-' && nv !== '(null)' && nv !== 'null' && !newValList.includes(nv)) {
          newValList.push(nv);
        }
      });
      const mergedOld = oldValList.length > 0 ? oldValList.join(', ') : '';
      const mergedNew = newValList.length > 0 ? newValList.join(', ') : '';
      if (mergedOld !== '' && mergedNew !== '' && mergedOld === mergedNew) {
        return;
      }
      result.push({
        field,
        oldValue: mergedOld,
        newValue: mergedNew,
      });
    } else {
      // Trường thông thường: Tuyệt đối không nối chuỗi các giá trị khác nhau
      result.push(items[0]);
    }
  });

  return result;
}

export const CommonHistoryDrawer: React.FC<CommonHistoryDrawerProps> = ({
  open,
  onClose,
  title = 'Lịch sử thay đổi',
  entityName,
  entityTitle,
  records,
  loading = false,
  fieldLabelMap = {},
  formatValue,
  width,
  variant = 'default',
  serverFiltered = false,
  onFilterChange,
  onLoadMore,
  loadingMore = false,
}) => {
  const effectiveEntityName = entityName || entityTitle;
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Ở chế độ lọc phía server, mỗi lần điều kiện đổi thì đẩy ra ngoài để màn cha
  // nạp lại từ trang đầu.
  useEffect(() => {
    if (!serverFiltered || !onFilterChange) return;
    onFilterChange({ keyword, fromDate: dateFrom, toDate: dateTo });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverFiltered, keyword, dateFrom, dateTo]);

  const handleBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!onLoadMore) return;
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) {
      onLoadMore();
    }
  };
  const [symbols, setSymbols] = useState<SymbolOption[]>([]);

  useEffect(() => {
    symbolService.getOptions().then((opts) => {
      setSymbols(opts || []);
    }).catch(() => setSymbols([]));
  }, []);

  const { symbolByCode, symbolById, symbolByName } = useMemo(() => {
    const byCode = new Map<string, SymbolOption>();
    const byId = new Map<string, SymbolOption>();
    const byName = new Map<string, SymbolOption>();

    (symbols || []).forEach((sym) => {
      if (sym.code) {
        byCode.set(sym.code.trim().toUpperCase(), sym);
        byCode.set(sym.code.trim().toLowerCase(), sym);
      }
      if (sym.id) {
        byId.set(String(sym.id).trim().toLowerCase(), sym);
      }
      if (sym.name) {
        byName.set(sym.name.trim().toLowerCase(), sym);
        const norm = sym.name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
        byName.set(norm, sym);
      }
    });

    return { symbolByCode: byCode, symbolById: byId, symbolByName: byName };
  }, [symbols]);

  const renderSymbolValue = (val: string) => {
    if (!val || val === '—' || val === '-' || val === 'null' || val === '(null)' || val === '(trống)' || val === '— (Trống)' || val === 'Chưa có') {
      return '';
    }
    const trimmed = String(val).trim();
    const upper = trimmed.toUpperCase();
    const lower = trimmed.toLowerCase();
    const norm = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');

    const sym = symbolByCode.get(upper) || symbolByCode.get(lower) || symbolById.get(lower) || symbolByName.get(lower) || symbolByName.get(norm);

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: textPrimary,
          fontWeight: fontWeightMedium,
          fontSize: fontSizeMd,
          lineHeight: 1.5,
        }}
      >
        {sym?.image && (
          <img
            src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`}
            alt=""
            style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4, flexShrink: 0 }}
          />
        )}
        <span>{sym?.name || trimmed}</span>
      </span>
    );
  };

  useEffect(() => {
    if (!open) {
      setSearchInput('');
      setKeyword('');
      setDateFrom('');
      setDateTo('');
    }
  }, [open]);

  const combinedFieldMap = useMemo(() => ({
    ...DEFAULT_FIELD_MAP,
    ...fieldLabelMap,
  }), [fieldLabelMap]);

  const resolveAction = (act?: string) => {
    if (!act) return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}15` };
    const upper = act.toUpperCase();
    if (DEFAULT_ACTION_MAP[upper]) return DEFAULT_ACTION_MAP[upper];
    return { label: act, color: actionPrimary, bg: `${actionPrimary}15` };
  };

  const getRecordTimestamp = (r: CommonHistoryEntry): string => {
    return r.changedAt || r.createdAt || r.timestamp || r.approvedDate || '';
  };

  const getRecordActor = (r: CommonHistoryEntry): string => {
    return r.changedByName || r.actor || r.approvedByName || r.changedBy || r.approvedBy || '';
  };

  const getRecordAction = (r: CommonHistoryEntry): string => {
    return (r.action || r.status || r.actionType || '').toUpperCase();
  };

  const formatTimestamp = (ts: string) => {
    if (!ts) return '';
    const d = dayjs(ts);
    if (!d.isValid()) return ts;
    return `${d.format('HH:mm:ss')} ${d.format('DD/MM/YYYY')}`;
  };

  const resolveFieldValue = (field: string, val: any): string => {
    if (val === null || val === undefined || val === '') return '';
    if (formatValue) {
      const custom = formatValue(field, val);
      if (custom !== undefined) return custom;
    }
    const fLower = (field || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
    if (fLower.includes('tinh') || fLower.includes('province') || fLower.includes('thanh pho') || fLower === 'provinceid') {
      const provName = getProvinceNameById(val);
      if (provName) return provName;
    }
    if (typeof val === 'boolean') return val ? 'Có' : 'Không';
    if (typeof val === 'object') return JSON.stringify(val);
    const s = String(val).trim();
    if (s === '(null)' || s === 'null' || s === '(trống)' || s === '— (Trống)' || s === 'Chưa có' || s === '-') return '';
    return s;
  };

  // Filter and group records
  const { filteredGroups, totalCount } = useMemo(() => {
    // Ở chế độ lọc phía server, từ khóa và khoảng ngày đã được áp ở CSDL — lọc
    // lại tại đây sẽ cắt mất bản ghi của các trang chưa tải về.
    const q = serverFiltered ? '' : keyword.toLowerCase().trim();
    const clientDateFrom = serverFiltered ? '' : dateFrom;
    const clientDateTo = serverFiltered ? '' : dateTo;

    const filtered = (records || []).filter((r) => {
      const act = getRecordAction(r);
      const note = (r.note || r.description || '').toLowerCase();
      // Nghiệp vụ: Lịch sử thay đổi chỉ hiển thị cập nhật trên hồ sơ đã duyệt, không hiển thị log Tạo mới / Lưu tạm
      if (act === 'CREATED' || act === 'CREATE' || act === 'DRAFT' || act === 'PROPOSED' || note.startsWith('tạo mới')) {
        return false;
      }

      const ts = getRecordTimestamp(r);
      const actor = getRecordActor(r).toLowerCase();
      const actLabel = resolveAction(act).label.toLowerCase();

      // Keyword search
      if (q) {
        let match = actor.includes(q) || note.includes(q) || act.includes(q) || actLabel.includes(q);
        if (!match && r.changes && Array.isArray(r.changes)) {
          match = r.changes.some((c) => {
            const fName = (combinedFieldMap[c.field] || c.field).toLowerCase();
            const ov = String(c.oldValue || '').toLowerCase();
            const nv = String(c.newValue || '').toLowerCase();
            return fName.includes(q) || ov.includes(q) || nv.includes(q);
          });
        } else if (!match && r.changedField) {
          const fName = (combinedFieldMap[r.changedField] || r.changedField).toLowerCase();
          const ov = String(r.previousValue || '').toLowerCase();
          const nv = String(r.newValue || '').toLowerCase();
          match = fName.includes(q) || ov.includes(q) || nv.includes(q);
        }
        if (!match) return false;
      }

      // Date range filter
      if (clientDateFrom && ts) {
        if (dayjs(ts).isBefore(dayjs(clientDateFrom))) return false;
      }
      if (clientDateTo && ts) {
        if (dayjs(ts).isAfter(dayjs(clientDateTo))) return false;
      }

      return true;
    });

    // Sort newest first
    const sorted = [...filtered].sort((a, b) => {
      const timeA = new Date(getRecordTimestamp(a) || 0).getTime();
      const timeB = new Date(getRecordTimestamp(b) || 0).getTime();
      return timeB - timeA;
    });

    // Trích xuất các trường dữ liệu bị thay đổi trong một bản ghi lịch sử
    const getRecordFields = (entry: CommonHistoryEntry): string[] => {
      if (entry.changes && Array.isArray(entry.changes) && entry.changes.length > 0) {
        return entry.changes.map((c) => c.field).filter(Boolean);
      }
      if (entry.changedField) {
        return [entry.changedField];
      }
      return [];
    };

    const normalizeFieldName = (f: string): string => {
      const mapped = combinedFieldMap[f] || f;
      return mapped.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
    };

    // Group items: Chỉ gom các bản ghi thuộc CÙNG 1 LẦN THAO TÁC (cùng request backend)
    // Điều kiện:
    // 1. Phải cùng người thực hiện
    // 2. Phải cùng loại hành động (không gộp UPDATE với UPLOAD_ATTACHMENT, APPROVE...)
    // 3. Phải có timestamp hợp lệ ở cả 2 bản ghi và chênh lệch thời gian cực ngắn (<= 150ms do cùng 1 transaction lưu nhiều field)
    // 4. Không trùng trường dữ liệu thông thường (ngoại trừ tài liệu đính kèm)
    interface HistoryGroup {
      tsSec: number;
      ts: string;
      actor: string;
      action: string;
      unitName: string;
      items: CommonHistoryEntry[];
      fields: Set<string>;
    }

    const groups: HistoryGroup[] = [];
    for (const r of sorted) {
      const ts = getRecordTimestamp(r);
      const tsMs = ts ? new Date(ts).getTime() : 0;
      const tsSec = Math.floor(tsMs / 1000);
      const actor = getRecordActor(r);
      const action = getRecordAction(r);
      const unitName = r.orgUnitName || r.unitName || '';
      const prev = groups[groups.length - 1];

      const rFields = getRecordFields(r);
      // Kiểm tra xem nhóm trước đã chứa bất kỳ trường nào của bản ghi này chưa (trừ attachment)
      const hasDuplicateField = prev ? rFields.some((f) => {
        const norm = normalizeFieldName(f);
        if (isAttachmentField(f) || norm.includes('dinh kem') || norm.includes('attachment')) return false;
        return prev.fields.has(norm);
      }) : false;

      const prevMs = prev && prev.ts ? new Date(prev.ts).getTime() : 0;
      const timeDiffMs = (prevMs > 0 && tsMs > 0) ? Math.abs(prevMs - tsMs) : Number.MAX_SAFE_INTEGER;

      const isSameGroup = Boolean(
        prev &&
        prev.actor === actor &&
        prev.action === action &&
        prevMs > 0 &&
        tsMs > 0 &&
        timeDiffMs <= 150 &&
        !hasDuplicateField
      );

      if (isSameGroup) {
        prev.items.push(r);
        rFields.forEach((f) => prev.fields.add(normalizeFieldName(f)));
      } else {
        groups.push({
          tsSec,
          ts,
          actor,
          action,
          unitName,
          items: [r],
          fields: new Set(rFields.map(normalizeFieldName)),
        });
      }
    }

    return { filteredGroups: groups, totalCount: filtered.length };
  }, [records, keyword, dateFrom, dateTo, combinedFieldMap, serverFiltered]);

  return (
    <AppDrawer
      rootClassName={variant === 'berth' ? 'berth-drawer-scope' : 'vtssystemchk-theme-scope'}
      className={variant === 'berth' ? 'berth-drawer-scope' : 'vtssystemchk-theme-scope'}
      width={width || (variant === 'berth' ? 'min(880px, 96vw)' : undefined)}
      mask
      open={open}
      onClose={onClose}
      footer={null}
      styles={{
        header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
        body: { padding: '16px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
      }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Space size={spaceSm} style={{ alignItems: 'center' }}>
            <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
            <span style={drawerTitleStyle}>
              {effectiveEntityName ? `${title} — ${effectiveEntityName}` : title}
            </span>
            <span
              style={{
                display: 'inline-flex',
                padding: '2px 10px',
                borderRadius: 999,
                fontSize: fontSizeLg - 1,
                fontWeight: fontWeightBold,
                background: `${colors.sidebarBg}15`,
                color: colors.sidebarBg,
                lineHeight: '20px',
              }}
            >
              Tổng cộng {totalCount}
            </span>
          </Space>
        </div>
      }
    >
      <style>{`.history-dt-popup .ant-picker-now-btn { color: ${actionPrimary} !important; }`}</style>
      {/* ── Search & Filter Bar ────────────────────────────── */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
          <Input
            placeholder="Tìm kiếm nội dung thay đổi..."
            allowClear
            value={searchInput}
            onChange={(e) => {
              const val = e.target.value;
              setSearchInput(val);
              if (!val) setKeyword('');
            }}
            onPressEnter={() => setKeyword(searchInput.trim())}
            style={variant === 'berth' ? { flex: 1, borderRadius: radiusPill, height: 40 } : { ...inputStyle, borderRadius: radiusPill, height: 40, flex: 1 }}
          />
          {variant === 'berth' ? (
            <>
              <DatePicker
                placeholder="Từ ngày"
                classNames={{ popup: { root: 'history-dt-popup' } }}
                value={dateFrom ? dayjs(dateFrom) : null}
                onChange={(d) => setDateFrom(d ? d.startOf('day').format('YYYY-MM-DDTHH:mm:ss') : '')}
                style={{ width: 140, borderRadius: radiusPill, height: 40 }}
                format="DD/MM/YYYY"
              />
              <DatePicker
                placeholder="Đến ngày"
                classNames={{ popup: { root: 'history-dt-popup' } }}
                value={dateTo ? dayjs(dateTo) : null}
                onChange={(d) => setDateTo(d ? d.endOf('day').format('YYYY-MM-DDTHH:mm:ss') : '')}
                style={{ width: 140, borderRadius: radiusPill, height: 40 }}
                format="DD/MM/YYYY"
              />
            </>
          ) : (
            <DatePicker.RangePicker
              {...getRangePickerProps({
                value: (dateFrom && dateTo)
                  ? [dayjs(dateFrom), dayjs(dateTo)]
                  : (dateFrom ? [dayjs(dateFrom), null] : (dateTo ? [null, dayjs(dateTo)] : null)),
                onChange: (dates: any) => {
                  if (!dates || dates.length === 0 || (!dates[0] && !dates[1])) {
                    setDateFrom('');
                    setDateTo('');
                  } else {
                    setDateFrom(dates[0] ? dates[0].startOf('day').format('YYYY-MM-DDTHH:mm:ss') : '');
                    setDateTo(dates[1] ? dates[1].endOf('day').format('YYYY-MM-DDTHH:mm:ss') : '');
                  }
                },
                style: { ...inputStyle, borderRadius: radiusPill, height: 40, width: 280 },
              })}
            />
          )}
          <Button
            type="primary"
            icon={<SearchOutlined />}
            loading={loading}
            onClick={() => setKeyword(searchInput.trim())}
            style={variant === 'berth' ? { borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary } : { ...primaryButtonStyle, borderRadius: radiusPill, height: 40, background: actionPrimary, borderColor: actionPrimary }}
          >
            Tìm kiếm
          </Button>
        </div>
      </div>

      {/* ── Timeline Body ─────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: variant === 'berth' ? 0 : 4 }} onScroll={handleBodyScroll}>
        {loading ? (
          <div style={{ padding: spaceMd }}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: `${spaceXl * 2}px 0` }}>
            <HistoryOutlined style={{ fontSize: 48, color: textTertiary, marginBottom: spaceMd }} />
            <div style={{ color: textTertiary, fontSize: fontSizeMd }}>
              {keyword || dateFrom || dateTo
                ? 'Không tìm thấy kết quả phù hợp'
                : 'Chưa có thay đổi nào được ghi nhận'}
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: variant === 'berth' ? 0 : 8 }}>
            {/* Trục Timeline dọc kết nối các mốc */}
            {variant !== 'berth' && filteredGroups.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  left: 13,
                  top: 20,
                  bottom: 24,
                  width: 2,
                  background: '#E2E8F0',
                  zIndex: 0,
                }}
              />
            )}
            {filteredGroups.map((group, gIdx) => {
              // Extract all changes from items in the group
              const groupChanges: HistoryChangeItem[] = [];
              const groupNotes: string[] = [];
              let primaryAction = group.items[0]?.action || group.items[0]?.status || 'UPDATE';

              group.items.forEach((item) => {
                if (item.action) primaryAction = item.action;
                else if (item.status) primaryAction = item.status;
                if (item.note) groupNotes.push(item.note);
                if (item.description && !groupNotes.includes(item.description)) groupNotes.push(item.description);
                if (item.changes && Array.isArray(item.changes) && item.changes.length > 0) {
                  groupChanges.push(...item.changes);
                } else if (item.changedField) {
                  groupChanges.push(...parseHistoryEntryChanges(item));
                }
              });

              const actionMeta = resolveAction(primaryAction);
              const isCreate = primaryAction.toUpperCase().includes('CREATE') || primaryAction.toUpperCase().includes('ADD');
              const rawUnit = group.unitName;
              const unitName = rawUnit && rawUnit !== '—' ? rawUnit : 'Cục Hàng hải Việt Nam';

              const validChanges = deduplicateAttachmentHistoryChanges(groupChanges).filter((change) => {
                const ov = resolveFieldValue(change.field, change.oldValue);
                const nv = resolveFieldValue(change.field, change.newValue);
                if (ov !== '—' && nv !== '—' && String(ov).trim() === String(nv).trim()) {
                  return false;
                }
                return true;
              });

              const orderedChanges = mergeChangesByField(validChanges, combinedFieldMap);

              return (
                <div
                  key={gIdx}
                  style={variant === 'berth' ? {
                    ...historyGroupGridStyle,
                    marginBottom: gIdx < filteredGroups.length - 1 ? spaceSm : 0,
                  } : {
                    display: 'grid',
                    gridTemplateColumns: '240px minmax(0, 1fr)',
                    gap: spaceLg,
                    alignItems: 'start',
                    marginBottom: gIdx < filteredGroups.length - 1 ? spaceLg : 0,
                    position: 'relative',
                  }}
                >
                  {/* Left Column: Metadata */}
                  {variant === 'berth' ? (
                    <div style={{ minWidth: 0, paddingTop: spaceXs, alignSelf: 'start' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spaceSm }}>
                        <Typography.Text style={historyTimeStyle}>
                          {group.ts ? formatTimestamp(group.ts) : ''}
                        </Typography.Text>
                        <span style={{ flexShrink: 0 }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              padding: '2px 10px',
                              borderRadius: radiusPill,
                              fontSize: fontSizeSm + 1,
                              fontWeight: fontWeightMedium,
                              background: actionMeta.bg,
                              color: actionMeta.color,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {actionMeta.label}
                          </span>
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 0 }}>
                        <Typography.Text style={historyMetaRowStyle}>
                          Người cập nhật: {group.actor || ''}
                        </Typography.Text>
                        <Typography.Text style={historyMetaRowStyle}>
                          Đơn vị: {unitName}
                        </Typography.Text>
                      </div>
                    </div>
                  ) : (
                    <div style={{ minWidth: 0, paddingTop: spaceXs, display: 'flex', gap: spaceSm, alignItems: 'flex-start' }}>
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: actionMeta.color,
                          boxShadow: `0 0 0 3px ${actionMeta.bg}`,
                          marginTop: 5,
                          flexShrink: 0,
                          zIndex: 1,
                        }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: spaceSm, marginBottom: spaceXs }}>
                          <Typography.Text
                            style={{
                              display: 'block',
                              fontSize: fontSizeMd,
                              color: textPrimary,
                              fontWeight: fontWeightBold,
                              lineHeight: 1.5,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {group.ts ? formatTimestamp(group.ts) : ''}
                          </Typography.Text>
                          <span style={{ flexShrink: 0 }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                padding: '1px 8px',
                                borderRadius: 999,
                                fontSize: fontSizeSm,
                                fontWeight: fontWeightMedium,
                                background: actionMeta.bg,
                                color: actionMeta.color,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {actionMeta.label}
                            </span>
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: fontSizeSm, color: textSecondary }}>
                            <UserOutlined style={{ fontSize: 12, color: textTertiary, flexShrink: 0 }} />
                            <span style={{ color: textPrimary, fontWeight: fontWeightMedium, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={group.actor || ''}>
                              {group.actor || ''}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: fontSizeSm, color: textSecondary }}>
                            <ApartmentOutlined style={{ fontSize: 12, color: textTertiary, flexShrink: 0 }} />
                            <span style={{ color: textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={unitName}>
                              {unitName}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Right Card: Changes & Notes */}
                  <div
                    style={variant === 'berth' ? { ...historyInfoCardStyle, alignSelf: 'stretch', height: '100%', boxSizing: 'border-box' } : {
                      position: 'relative',
                      minWidth: 0,
                      background: '#ffffff',
                      borderRadius: 8,
                      padding: '14px 18px 12px 18px',
                      paddingLeft: 18,
                      overflow: 'hidden',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                    }}
                  >
                    {/* Left Accent Bar */}
                    <div
                      style={variant === 'berth' ? historyAccentBarStyle(actionMeta.color) : {
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        borderRadius: 2,
                        background: actionMeta.color,
                      }}
                    />

                    {/* Change list */}
                    {orderedChanges.length > 0 ? (
                      <div>
                        {orderedChanges.map((change, cIdx) => {
                          const label = combinedFieldMap[change.field] || formatFallbackFieldLabel(change.field, combinedFieldMap);
                          const prevChange = cIdx > 0 ? orderedChanges[cIdx - 1] : null;
                          const prevLabel = prevChange ? (combinedFieldMap[prevChange.field] || formatFallbackFieldLabel(prevChange.field, combinedFieldMap)) : null;
                          const isFirstInGroup = cIdx === 0 || label !== prevLabel;

                          const ov = resolveFieldValue(change.field, change.oldValue);
                          const nv = resolveFieldValue(change.field, change.newValue);

                          const renderFormattedContent = (content: string, isOld: boolean = false) => {
                            if (!content || content === '—' || content === '-' || content === 'null' || content === '(null)' || content === '(trống)' || content === '— (Trống)' || content === 'Chưa có') {
                              return '';
                            }
                            const str = String(content).trim();
                            const normLabel = (label || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
                            const normField = (change.field || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
                            const isSymbolField = normLabel.includes('bieu tuong') || normLabel.includes('symbol') || normLabel.includes('icon')
                              || normField.includes('bieu tuong') || normField === 'symbol' || normField === 'mapsymbolid' || normField === 'symbolid' || normField === 'mapsymbol' || normField === 'icon';

                            if (isSymbolField) {
                              return renderSymbolValue(str);
                            }

                            const isCoordField = normLabel.includes('toa do') || normLabel.includes('coordinate')
                              || normField.includes('toa do') || normField.includes('coordinate')
                              || /^POINT\s*\(/i.test(str) || /^LINESTRING\s*\(/i.test(str) || /^LINE\s*\(/i.test(str) || /^POLYGON\s*\(\(/i.test(str) || /^MULTIPOINT\s*\(/i.test(str);

                            if (isCoordField) {
                              return renderCoordinatesDisplay(str);
                            }

                            const isMultiItemField = isAttachmentField(change.field) || isZoneField(change.field)
                              || normLabel.includes('dinh kem') || normLabel.includes('vung') || normLabel.includes('danh sach')
                              || normLabel.includes('list') || normField.includes('attachments') || normField.includes('zones');

                            if (str.includes(',') && (isMultiItemField || str.length > 25)) {
                              const items = str.split(',').map((s) => s.trim()).filter(Boolean);
                              if (items.length > 1) {
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                                    {items.map((item, idx) => (
                                      <div key={idx} style={{ color: isOld ? textSecondary : textPrimary, fontWeight: isOld ? 400 : fontWeightMedium, lineHeight: '20px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                        {item}
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                            }
                            return renderCommonHistoryValueTag(label, content, isOld);
                          };

                          if (isCreate) {
                            return (
                              <div
                                key={cIdx}
                                style={variant === 'berth' ? {
                                  ...historyCreateRowStyle,
                                  paddingTop: cIdx > 0 ? spaceXs : 0,
                                } : {
                                  display: 'grid',
                                  gridTemplateColumns: '150px minmax(0, 1fr)',
                                  alignItems: 'flex-start',
                                  gap: spaceSm,
                                  fontSize: fontSizeMd,
                                  lineHeight: 1.6,
                                  padding: '4px 0',
                                  marginTop: isFirstInGroup && cIdx > 0 ? 6 : 0,
                                }}
                              >
                                <div style={variant === 'berth' ? historyFieldLabelStyle : { minWidth: 0, fontWeight: fontWeightMedium, color: textSecondary, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                                  {label ? `${label}:` : ''}
                                </div>
                                <span title={nv ?? ''} style={variant === 'berth' ? historyNewValueStyle : { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, width: '100%', overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: 1.5, color: textPrimary }}>
                                  {renderFormattedContent(nv, false) ?? (nv ?? '')}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={cIdx}
                              style={variant === 'berth' ? {
                                ...historyChangeRowStyle,
                                paddingTop: cIdx > 0 ? spaceXs : 0,
                              } : {
                                display: 'grid',
                                gridTemplateColumns: '150px minmax(0, 1fr) 24px minmax(0, 1fr)',
                                alignItems: 'flex-start',
                                gap: spaceSm,
                                fontSize: fontSizeMd,
                                lineHeight: 1.6,
                                padding: '4px 0',
                                marginTop: isFirstInGroup && cIdx > 0 ? 6 : 0,
                              }}
                            >
                              <div style={variant === 'berth' ? historyFieldLabelStyle : { minWidth: 0, fontWeight: fontWeightMedium, color: textSecondary, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                                {label ? `${label}:` : ''}
                              </div>
                              <span title={ov ?? ''} style={variant === 'berth' ? historyOldValueStyle : { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, width: '100%', overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: 1.5, color: textSecondary }}>
                                {renderFormattedContent(ov, true) ?? (ov ?? '')}
                              </span>
                              <span style={variant === 'berth' ? historyArrowStyle : { color: textTertiary, textAlign: 'center', fontWeight: fontWeightBold, userSelect: 'none', paddingTop: 2 }}>
                                →
                              </span>
                              <span title={nv ?? ''} style={variant === 'berth' ? historyNewValueStyle : { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, width: '100%', overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: 1.5 }}>
                                {renderFormattedContent(nv, false) ?? (nv ?? '')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : groupNotes.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Typography.Text
                          style={{
                            fontSize: fontSizeMd,
                            fontWeight: fontWeightMedium,
                            color: textSecondary,
                            marginBottom: 4,
                          }}
                        >
                          Chi tiết thao tác:
                        </Typography.Text>
                        {groupNotes.map((note, nIdx) => (
                          <div key={nIdx} style={{ display: 'flex', alignItems: 'center', gap: spaceSm, fontSize: fontSizeMd, color: textPrimary }}>
                            {note.includes('tệp') || note.includes('file') ? (
                              <FileOutlined style={{ color: actionPrimary, flexShrink: 0 }} />
                            ) : null}
                            <span>{note}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd, fontStyle: 'italic' }}>
                        Không có thông tin chi tiết thay đổi
                      </Typography.Text>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {loadingMore && (
          <div style={{ padding: spaceMd, textAlign: 'center', color: textTertiary, fontSize: fontSizeMd }}>
            Đang tải thêm…
          </div>
        )}
      </div>
    </AppDrawer>
  );
};

export default CommonHistoryDrawer;
