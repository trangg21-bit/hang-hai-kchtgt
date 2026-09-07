import { useState, useCallback, useEffect, useMemo, Fragment } from 'react';
import {
  Button,
  Modal,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
  Form,
  DatePicker,
  Row,
  Col,
  Tabs,
  Drawer,
} from 'antd';
import toast from '../../components/ToastNotification';
import {
  PlusOutlined,
  HistoryOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import type { UploadFile } from 'antd';
import {
  radarStationCRUD,
  radarStationApproval,
  radarStationAttachment,
} from '../../services/radarStationService';
import type {
  RadarStationResponse,
  RadarStationStatus,
  HistoryEntry,
  CreateRadarStationRequest,
} from '../../types/radarStation';
import {
  CONDITION_STATUS_OPTIONS,
  UNIT_OF_MEASURE_OPTIONS,
} from '../../types/radarStation';
import { organizationService } from '../../services/organizationService';
import { userService } from '../../services/userService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { ScreenHeader, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { OrgUnitTreeSelect, type OrgUnitTreeOption } from '../../components/org-unit';
import { symbolService } from '../../services/symbolService';
import { usePermissionStore, type PermissionState } from '../../store/permissionStore';
import { useAuthStore } from '../../store/authStore';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import { canEditApprovalRecord } from '../../utils/approvalEditPolicy';
import { formLabelProps as labelProps } from '../../components/shared/formLabel';
import { AppDrawer } from '../../components/shared/AppDrawer';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { ddToDms, parseWktToCoordinates, serializeCoordinatesToWkt, adjustCoordinateListForGeometry } from '../../utils/gisGeometry';
import { deduplicateAttachmentHistoryChanges } from '../../utils/historyAttachmentDedup';
import {
  statusOperational,
  statusAttention,
  statusCritical,
  statusDraft,
  actionPrimary,
  textPrimary,
  textSecondary,
  textTertiary,
  fontSizeSm,
  fontSizeMd,
  fontSizeLg,
  fontWeightBold,
  fontWeightMedium,
  radiusSm,
  radiusPill,
  surfaceCard,
  surfacePage,
  borderDefault,
  colors,
  spaceXs,
  spaceSm,
  spaceMd,
  spaceLg,
  spaceXl,
  spaceFormField,
  inputStyle,
  selectStyle,
  textAreaStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  dangerButtonStyle,
  rejectReasonStyle,
  formFieldStyle,
  formRowGutter,
  drawerTitleStyle,
  drawerCloseBtnStyle,
  requiredMarkStyle,
  filterLabelStyle,
  confirmModalBodyStyle,
  statusInfo,
  statusBadgeStyle,
  getRangePickerProps,
  drawerGisControlBoxStyle,
  readonlyInputStyle,
  drawerFormScrollStyle,
  drawerTabBarStyle,
  DRAWER_TABLE_SCROLL_Y,
} from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import ApprovalModal from '../../components/shared/ApprovalModal';

// ── Constants ────────────────────────────────────────────────────────

// Status tabs 7 tab chuẩn (Tất cả + 6 trạng thái phê duyệt đầy đủ)
const STATUS_TAB_LIST = [
  { key: '', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: 'Lưu tạm', color: statusDraft },
  { key: 'PENDING_APPROVAL', label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: statusAttention },
  { key: 'APPROVED_LEVEL1', label: 'Chờ phê duyệt cấp Cục', color: statusInfo },
  { key: 'APPROVED', label: 'Đã phê duyệt', color: statusOperational },
  { key: 'REJECTED_LEVEL1', label: 'Từ chối cấp Cảng vụ/Chi cục', color: statusCritical },
  { key: 'REJECTED_LEVEL2', label: 'Từ chối cấp Cục', color: statusCritical },
];

const TAB_QUERY_MAP: Record<string, RadarStationStatus | undefined> = {
  '': undefined,
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED_LEVEL1: 'APPROVED_LEVEL1',
  APPROVED: 'APPROVED',
  REJECTED_LEVEL1: 'REJECTED_LEVEL1',
  REJECTED_LEVEL2: 'REJECTED_LEVEL2',
};

// Status badge — semantic tokens (AGENTS.md: không hardcode màu)
const RADAR_STATION_STATUS_STYLE_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  PROPOSED: { color: statusAttention, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PENDING: { color: statusAttention, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PENDING_APPROVAL: { color: statusAttention, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  APPROVED_LEVEL1: { color: statusInfo, label: 'Chờ phê duyệt cấp Cục' },
  APPROVED_LEVEL2: { color: statusOperational, label: 'Đã phê duyệt' },
  APPROVED: { color: statusOperational, label: 'Đã phê duyệt' },
  REJECTED: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL1: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL2: { color: statusCritical, label: 'Từ chối cấp Cục' },
};

// Tình trạng hoạt động — semantic tokens (khớp CONDITION_STATUS_OPTIONS '0'/'1'/'2')
const CONDITION_STATUS_STYLE_MAP: Record<string, { color: string; label: string }> = {
  '0': { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  '1': { color: statusOperational, label: 'Đang khai thác/vận hành' },
  '2': { color: statusCritical, label: 'Dừng khai thác/vận hành' },
};

// Biểu tượng GIS mặc định (copy từ VtsOperationCenterForm L50-59) — fallback khi chưa tải được từ API.
const DEFAULT_GIS_SYMBOLS = [
  { id: '1', code: 'SYM-VTS', name: 'Trung tâm điều hành VTS', image: '' },
  { id: '2', code: 'SYM-INMARSAT', name: 'Đài thông tin vệ tinh Inmarsat', image: '' },
  { id: '3', code: 'SYM-COASTAL', name: 'Đài thông tin duyên hải', image: '' },
  { id: '4', code: 'SYM-AIS', name: 'Trạm bờ AIS', image: '' },
  { id: '5', code: 'SYM-RADAR', name: 'Trạm Radar hàng hải', image: '' },
  { id: '6', code: 'SYM-BUOY', name: 'Phao báo hiệu hàng hải', image: '' },
  { id: '7', code: 'SYM-BEACON', name: 'Trạm đèn biển (Hải đăng)', image: '' },
  { id: '8', code: 'SYM-PORT', name: 'Cảng biển / Bến cảng', image: '' },
  { id: '9', code: 'SYM-ANCHORAGE', name: 'Khu neo đậu / Đón trả hoa tiêu', image: '' },
];

type OperationRow = {
  id?: string;
  code?: string;
  name?: string;
  type?: string;
  address?: string;
  time?: string;
  planCode?: string;
  planName?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  incidentCode?: string;
  incidentType?: string;
  location?: string;
  incidentTime?: string;
};

// Radar chưa có API con/backend — nguồn để trống như chuẩn VOC.
const radarChildrenList: Array<{ id?: string; type?: string; typeLabel?: string; name?: string; code?: string }> = [];
// Các module con (vận hành khai thác, bảo trì, sự cố) chưa có API backend chốt
// hợp đồng — nguồn để trống như chuẩn VOC cho tới khi endpoint tương ứng tồn tại.
const operationPlanList: OperationRow[] = [];
const maintenancePlanList: OperationRow[] = [];
const incidentList: OperationRow[] = [];

const getProvinceLabel = (provinceId?: string): string =>
  provinceId
    ? VIETNAM_PROVINCE_OPTIONS.find((o) => o.value === String(provinceId))?.label || provinceId
    : '—';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try { return dayjs(dateStr).format('DD/MM/YYYY HH:mm'); } catch { return dateStr; }
}

const rangeValue = (from: string, to: string): [Dayjs | null, Dayjs | null] | null =>
  from || to ? [from ? dayjs(from) : null, to ? dayjs(to) : null] : null;

// Tabs bar style — giữ sticky khi cuộn form dài (khớp pattern BeaconList)
const tabBarStyle: React.CSSProperties = {
  marginBottom: 0,
  paddingTop: 0,
  position: 'sticky',
  top: 0,
  zIndex: 1,
  background: surfaceCard,
};

// ── History helpers (chuẩn /vts-operation-center) ───────────────────

/** Số bản ghi nhật ký mỗi lần cuộn tải thêm trong drawer lịch sử. */
const HISTORY_PAGE_SIZE = 20;

/** Thứ tự hiển thị các trường thay đổi trong một nhóm lịch sử (khớp thứ tự form radar). */
const HISTORY_FIELD_ORDER = [
  'Tên trạm radar', 'Mã trạm radar', 'Loại trạm',
  'Đơn vị quản lý', 'Thuộc cảng biển', 'Hệ thống VTS', 'Trung tâm điều hành VTS', 'Đơn vị khai thác',
  'Địa điểm (Tỉnh/TP)', 'Địa điểm chi tiết', 'Vùng phủ sóng',
  'Đơn vị tính', 'Số lượng', 'Tình trạng',
  'Chiều cao tháp', 'Chiều cao tháp radar (m)', 'Tầm phủ radar', 'Tầm hiệu lực radar',
  'Ghi chú', 'Loại đối tượng GIS', 'Biểu tượng', 'Tọa độ', 'Tọa độ GIS', 'Tọa độ GPS',
  'Tài liệu đính kèm', 'Trạng thái phê duyệt', 'Lý do từ chối',
];

function historyFieldName(fn: string): string {
  const map: Record<string, string> = {
    // Nhãn tiếng Việt do backend ghi trực tiếp vào InfrastructureHistory.changedField
    'Tên trạm radar': 'Tên trạm radar',
    'Mã trạm radar': 'Mã trạm radar',
    'Loại trạm': 'Loại trạm',
    'Đơn vị quản lý': 'Đơn vị quản lý',
    'Thuộc cảng biển': 'Thuộc cảng biển',
    'Hệ thống VTS': 'Hệ thống VTS',
    'Trung tâm điều hành VTS': 'Trung tâm điều hành VTS',
    'Đơn vị khai thác': 'Đơn vị khai thác',
    'Địa điểm (Tỉnh/TP)': 'Địa điểm (Tỉnh/TP)',
    'Địa điểm chi tiết': 'Địa điểm chi tiết',
    'Vùng phủ sóng': 'Vùng phủ sóng',
    'Đơn vị tính': 'Đơn vị tính',
    'Số lượng': 'Số lượng',
    'Tình trạng': 'Tình trạng',
    'Chiều cao tháp': 'Chiều cao tháp radar (m)',
    'Chiều cao tháp radar (m)': 'Chiều cao tháp radar (m)',
    'Tầm phủ radar': 'Tầm hiệu lực radar',
    'Tầm hiệu lực radar': 'Tầm hiệu lực radar',
    'Ghi chú': 'Ghi chú',
    'Loại đối tượng GIS': 'Loại đối tượng GIS',
    'Biểu tượng': 'Biểu tượng',
    'Tọa độ': 'Tọa độ GIS',
    'Tọa độ GIS': 'Tọa độ GIS',
    'Tọa độ GPS': 'Tọa độ GIS',
    'Tài liệu đính kèm': 'Tài liệu đính kèm',
    'Trạng thái phê duyệt': 'Trạng thái phê duyệt',
    'Lý do từ chối': 'Lý do từ chối',
    // Tên trường tiếng Anh (đề phòng payload khác) — khớp nhãn form radar
    stationName: 'Tên trạm radar',
    code: 'Mã trạm radar',
    orgUnitId: 'Đơn vị quản lý',
    orgUnitName: 'Đơn vị quản lý',
    seaportId: 'Thuộc cảng biển',
    seaportName: 'Thuộc cảng biển',
    vtsSystemId: 'Hệ thống VTS',
    vtsSystemName: 'Hệ thống VTS',
    vtsOperationCenterId: 'Trung tâm điều hành VTS',
    vtsOperationCenterName: 'Trung tâm điều hành VTS',
    operatingUnitId: 'Đơn vị khai thác',
    operatingUnitName: 'Đơn vị khai thác',
    provinceId: 'Địa điểm (Tỉnh/TP)',
    province: 'Địa điểm (Tỉnh/TP)',
    location: 'Địa điểm chi tiết',
    detailedLocation: 'Địa điểm chi tiết',
    unitOfMeasure: 'Đơn vị tính',
    quantity: 'Số lượng',
    conditionStatus: 'Tình trạng',
    towerHeight: 'Chiều cao tháp radar (m)',
    radarRange: 'Tầm hiệu lực radar',
    coverage: 'Vùng phủ sóng',
    note: 'Ghi chú',
    geometryType: 'Loại đối tượng GIS',
    mapIcon: 'Biểu tượng',
    coordinates: 'Tọa độ GIS',
    gisLocation: 'Tọa độ GIS',
    attachments: 'Tài liệu đính kèm',
    approvalStatus: 'Trạng thái phê duyệt',
    status: 'Trạng thái phê duyệt',
    rejectionReason: 'Lý do từ chối',
  };
  return map[fn] || fn;
}

function normalizeHistoryKey(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
}

function isProvinceHistoryField(field: string): boolean {
  const normalized = normalizeHistoryKey(field);
  return normalized === 'provinceid'
    || normalized === 'province'
    || normalized === 'tinh/thanh pho'
    || normalized === 'dia diem (tinh/tp)';
}

function isConditionHistoryField(field: string): boolean {
  const normalized = normalizeHistoryKey(field);
  return normalized === 'conditionstatus' || normalized === 'tinh trang';
}

function isMapIconHistoryField(field: string): boolean {
  const normalized = normalizeHistoryKey(field);
  return normalized === 'mapicon'
    || normalized === 'symbolid'
    || normalized === 'bieu tuong'
    || normalized === 'bieu tuong ban do';
}

function isCoordinatesHistoryField(field: string): boolean {
  const normalized = normalizeHistoryKey(field);
  return normalized === 'coordinates'
    || normalized === 'gislocation'
    || normalized === 'toa do'
    || normalized === 'toa do gis'
    || normalized === 'toa do gps';
}

function isApprovalHistoryField(field: string): boolean {
  const normalized = normalizeHistoryKey(field);
  return normalized === 'approvalstatus'
    || normalized === 'status'
    || normalized === 'submittedforapproval'
    || normalized === 'trang thai phe duyet';
}

function historyTimestamp(item: HistoryEntry): string {
  return item.approvedDate || item.changedAt || item.createdAt || item.performedDate || '';
}

function historyField(item: HistoryEntry): string {
  return item.changedField || item.fieldName || '';
}

function historyOldValue(item: HistoryEntry): string | null {
  return item.previousValue ?? item.oldValue ?? null;
}

function historyNewValue(item: HistoryEntry): string | null {
  return item.newValue ?? null;
}

function historyActor(item: HistoryEntry): string {
  const raw = item?.approvedByName || item?.changedByName || item?.performedByName || item?.userName || item?.actorName || item?.approvedBy || item?.changedBy || item?.performedBy || '';
  return raw || '—';
}

function normalizedHistoryFields(value: string): string[] {
  const fields = value.split(/[,;]+/).map((field: string) => field.trim()).filter(Boolean);
  const hasApprovalStatus = fields.some((field) => {
    const key = normalizeHistoryKey(field);
    return key === 'approvalstatus' || key === 'trang thai phe duyet';
  });
  if (hasApprovalStatus) {
    return fields.filter((field) => {
      const key = normalizeHistoryKey(field);
      return key !== 'approvedlevel1'
        && key !== 'approvedlevel2'
        && key !== 'rejectedlevel1'
        && key !== 'rejectedlevel2'
        && key !== 'approvalreasonlevel1'
        && key !== 'approvalreasonlevel2';
    });
  }
  return fields;
}

function historyChangeRows(item: HistoryEntry): Array<{ field: string; oldValue: string | null; newValue: string | null }> {
  const fields = normalizedHistoryFields(historyField(item));
  const oldVal = historyOldValue(item);
  const newVal = historyNewValue(item);
  if (fields.length <= 1) {
    return [{ field: fields[0] || '', oldValue: oldVal, newValue: newVal }];
  }
  const oldMap = new Map<string, string>();
  if (oldVal) {
    oldVal.split(';').forEach((part) => {
      const idx = part.indexOf('=');
      if (idx >= 0) oldMap.set(part.slice(0, idx).trim(), part.slice(idx + 1).trim());
    });
  }
  const newMap = new Map<string, string>();
  if (newVal) {
    newVal.split(';').forEach((part) => {
      const idx = part.indexOf('=');
      if (idx >= 0) newMap.set(part.slice(0, idx).trim(), part.slice(idx + 1).trim());
    });
  }
  return fields.map((fn) => ({
    field: fn,
    oldValue: oldMap.get(fn) ?? (fields.length === 1 ? oldVal : null),
    newValue: newMap.get(fn) ?? (fields.length === 1 ? newVal : null),
  })).filter((r) => {
    if (r.oldValue === null && r.newValue === null) return false;
    return r.oldValue !== r.newValue;
  });
}

function isListDeltaField(fn: string): boolean {
  const norm = normalizeHistoryKey(fn);
  return norm.includes('dinh kem') || norm.includes('attachment');
}

function parseListDelta(oldVal: string | null, newVal: string | null) {
  const removed: string[] = [];
  const added: string[] = [];
  const modifiedOld: string[] = [];
  const modifiedNew: string[] = [];

  const splitParts = (val: string | null) => {
    if (!val || val === '—' || val === '(null)' || val === '(trống)' || val === 'Chưa có' || val === 'null' || val === 'undefined') return [];
    return val.split(',').map((s) => s.trim()).filter((s) => s && s !== '—' && s !== '(null)' && s !== '(trống)' && s !== 'Chưa có' && s !== 'null' && s !== 'undefined');
  };

  const oldParts = splitParts(oldVal);
  const newParts = splitParts(newVal);

  const normalizeListItem = (value: string) => normalizeHistoryKey(value).replace(/\s+/g, ' ');
  const oldPlain = oldParts.filter((part) => !part.startsWith('Xóa ') && !part.startsWith('Cũ: '));
  const newPlain = newParts.filter((part) => !part.startsWith('Thêm ') && !part.startsWith('Mới: '));
  const oldPlainKeys = new Set(oldPlain.map(normalizeListItem));
  const newPlainKeys = new Set(newPlain.map(normalizeListItem));

  oldParts.forEach((part) => {
    if (part.startsWith('Xóa ')) {
      removed.push(part.replace('Xóa ', '').trim());
    } else if (part.startsWith('Cũ: ')) {
      modifiedOld.push(part.replace('Cũ: ', '').trim());
    } else if (part !== '—' && !newPlainKeys.has(normalizeListItem(part))) {
      removed.push(part);
    }
  });

  newParts.forEach((part) => {
    if (part.startsWith('Thêm ')) {
      added.push(part.replace('Thêm ', '').trim());
    } else if (part.startsWith('Mới: ')) {
      modifiedNew.push(part.replace('Mới: ', '').trim());
    } else if (part !== '—' && !oldPlainKeys.has(normalizeListItem(part))) {
      added.push(part);
    }
  });

  const modifiedPairs: Array<{ oldV: string; newV: string }> = [];
  const maxMod = Math.max(modifiedOld.length, modifiedNew.length);
  for (let i = 0; i < maxMod; i++) {
    modifiedPairs.push({
      oldV: modifiedOld[i] || '—',
      newV: modifiedNew[i] || '—',
    });
  }

  return { removed, added, modifiedPairs };
}

function resolveHistoryActionMeta(item: HistoryEntry): { label: string; color: string; bg: string } {
  const rawStatus = String(item?.status ?? item?.action ?? '').toUpperCase();
  const rawReason = String(item?.reason ?? '').toLowerCase();
  const rawLevel = String(item?.approvalLevel ?? item?.level ?? '').toUpperCase();
  let label: string;
  let color: string;
  if (rawStatus === 'CREATED' || rawStatus === 'CREATE' || rawReason.includes('tạo mới') || rawReason.includes('thêm mới') || rawReason.includes('tao moi')) {
    label = 'Thêm mới';
    color = statusOperational;
  } else {
    const isLevel1 = rawStatus.includes('LEVEL1') || rawStatus.includes('_L1') || rawLevel.includes('LEVEL1') || rawLevel === 'C1' || rawLevel === 'LEVEL_1' || rawLevel === '1';
    const isLevel2 = rawStatus.includes('LEVEL2') || rawStatus.includes('_L2') || rawLevel.includes('LEVEL2') || rawLevel === 'C2' || rawLevel === 'LEVEL_2' || rawLevel === '2';
    if (rawStatus === 'REJECTED_LEVEL1' || rawStatus === 'REJECTED_L1' || (rawStatus === 'REJECTED' && isLevel1)
      || rawReason.includes('từ chối cấp cảng vụ') || rawReason.includes('tu choi cap cang vu')) {
      label = 'Từ chối cấp Cảng vụ/Chi cục';
      color = statusCritical;
    } else if (rawStatus === 'REJECTED_LEVEL2' || rawStatus === 'REJECTED_L2' || (rawStatus === 'REJECTED' && isLevel2)
      || rawReason.includes('từ chối cấp Cục') || rawReason.includes('tu choi cap cuc')) {
      label = 'Từ chối cấp Cục';
      color = statusCritical;
    } else if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi')) {
      label = 'Từ chối';
      color = statusCritical;
    } else if (rawStatus === 'APPROVED' || rawStatus === 'APPROVED_LEVEL2' || rawStatus === 'APPROVED_LEVEL1' || rawReason.includes('phê duyệt') || rawReason.includes('phe duyet')) {
      if (isLevel2) { label = 'Phê duyệt cấp Cục'; color = statusOperational; }
      else if (isLevel1) { label = 'Phê duyệt cấp Cảng vụ/Chi cục'; color = statusOperational; }
      else { label = 'Phê duyệt'; color = statusOperational; }
    } else if (rawStatus === 'PROPOSED' || rawStatus === 'PENDING_APPROVAL' || rawReason.includes('gửi phê duyệt') || rawReason.includes('gui phe duyet')) {
      label = 'Gửi phê duyệt';
      color = statusAttention;
    } else if (rawStatus === 'DELETED' || rawStatus === 'SOFT_DELETE') {
      label = 'Xóa mềm';
      color = statusCritical;
    } else {
      label = 'Chỉnh sửa';
      color = actionPrimary;
    }
  }
  return { label, color, bg: `${color}18` };
}

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
    return <span style={{ color: textTertiary }}>{val === 'Chưa có' ? 'Chưa có' : '—'}</span>;
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
        <div key={pt.index} style={{ fontSize: fontSizeSm, color: textPrimary, lineHeight: 1.5 }}>
          {points.length > 1 && <span style={{ color: textSecondary, marginRight: spaceXs }}>#{pt.index}:</span>}
          <span>{formatCoordPointDms(pt.x, pt.y)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────

export default function RadarStationList() {
  const hasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);
  const isInIframe = window.self !== window.top;

  // ── Filter state ─────────────────────────────────────────────────
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  const [filterSeaportId, setFilterSeaportId] = useState<string | undefined>();
  const [filterVtsSystemId, setFilterVtsSystemId] = useState<string | undefined>();
  const [filterVtsOperationCenterId, setFilterVtsOperationCenterId] = useState<string | undefined>();
  const [filterProvinceId, setFilterProvinceId] = useState<string | undefined>();
  const [filterConditionStatus, setFilterConditionStatus] = useState<string | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState('');
  const [filterUpdatedTo, setFilterUpdatedTo] = useState('');
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('');

  // ── Pagination ──────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Data ─────────────────────────────────────────────────────────
  const [dataSource, setDataSource] = useState<RadarStationResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // ── Dropdown data (đơn vị / cảng biển / VTS / cán bộ) ────────────
  const [orgOptions, setOrgOptions] = useState<OrgUnitTreeOption[]>([]);
  const [seaportOptions, setSeaportOptions] = useState<{ id: string; portCode?: string; portName?: string }[]>([]);
  const [vtsOptions, setVtsOptions] = useState<{ id: string; code?: string; systemName?: string }[]>([]);
  const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([]);

  // ── Drawer state (create / edit / detail) ────────────────────────
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RadarStationResponse | null>(null);
  const [detailRecord, setDetailRecord] = useState<RadarStationResponse | null>(null);
  const [isDetailMode, setIsDetailMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createForm] = Form.useForm();
  const [activeTabKey, setActiveTabKey] = useState('general');
  const [gisFormModalOpen, setGisFormModalOpen] = useState(false);
  const [detailMapOpen, setDetailMapOpen] = useState(false);
  const [geometryTypeState, setGeometryTypeState] = useState<string>('POINT');
  const [coordinateList, setCoordinateList] = useState<{ latitude: number | null; longitude: number | null }[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);
  const [previewCode, setPreviewCode] = useState('');

  // ── Delete state ─────────────────────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<RadarStationResponse | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // ── Approval state (submit / approve / reject) ───────────────────
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<RadarStationResponse | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<RadarStationResponse | null>(null);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState<RadarStationResponse | null>(null);
  const [rejectLevel, setRejectLevel] = useState<'c1' | 'c2'>('c1');

  // ── History state ────────────────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<RadarStationResponse | null>(null);
  const [historyRecords, setHistoryRecords] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyReloadToken, setHistoryReloadToken] = useState(0);
  const [symbolOptions, setSymbolOptions] = useState<{ value: string; label: string }[]>([]);
  const [symbols, setSymbols] = useState<{ id: string; name: string; code?: string; image: string }[]>([]);

  // Trạng thái cho phép gửi duyệt lại / gửi tiếp sau lưu (áp cho nút phụ trong drawer Cập nhật)
  const editingCanResubmit = !!editingRecord && !isDetailMode
    && ['DRAFT', 'PROPOSED', 'REJECTED', 'REJECTED_LEVEL1', 'REJECTED_LEVEL2']
      .includes((editingRecord.status || editingRecord.approvalStatus || ''));

  useEffect(() => {
    symbolService.list({ pageSize: 200 })
      .then((res: any) => {
        const items = Array.isArray(res) ? res : (res as any)?.items || [];
        setSymbolOptions(items.map((s: any) => ({ value: s.id || s.code || '', label: s.name || s.code || s.id || '' })));
      })
      .catch(() => { /* Không tải được danh sách biểu tượng — để trống */ });
  }, []);

  // Tải đối tượng biểu tượng đầy đủ (id/code/name/image) cho tab chi tiết GIS — chuẩn VOC.
  useEffect(() => {
    symbolService.getOptions()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setSymbols(res);
        } else {
          symbolService.list({ pageSize: 1000 }).then((listRes) => {
            const items = listRes?.data || (Array.isArray(listRes) ? listRes : []);
            setSymbols(items.length > 0 ? items : DEFAULT_GIS_SYMBOLS);
          }).catch(() => setSymbols(DEFAULT_GIS_SYMBOLS));
        }
      })
      .catch(() => {
        symbolService.list({ pageSize: 1000 }).then((res) => {
          const items = res?.data || (Array.isArray(res) ? res : []);
          setSymbols(items.length > 0 ? items : DEFAULT_GIS_SYMBOLS);
        }).catch(() => setSymbols(DEFAULT_GIS_SYMBOLS));
      });
  }, []);

  // ── Load dropdown data ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const orgs = await organizationService.getTree();
        setOrgOptions(orgs || []);
      } catch (err) {
        console.error('Không tải được cây đơn vị quản lý', err);
      }
      try {
        const ports = await vtsSystemCRUD.getScopedPortOptions();
        setSeaportOptions(ports || []);
      } catch (err) {
        console.error('Không tải được danh sách cảng biển', err);
      }
      try {
        const vts = await vtsSystemCRUD.getOptions();
        setVtsOptions(
          (vts || []).map((item) => ({
            id: item.id,
            code: item.code,
            systemName: item.name,
          })),
        );
      } catch (err) {
        console.error('Không tải được danh sách hệ thống VTS', err);
      }
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users = resp.data || (resp as any).content || [];
        setUserOptions(users.map((u: any) => ({ value: u.id, label: u.fullName || u.username || u.id })));
      } catch (err) {
        console.error('Không tải được danh sách cán bộ', err);
      }
    })();
  }, []);

  // ── Fetch tab counts (mỗi tab = một search riêng) ────────────────
  const fetchCounts = useCallback(async () => {
    try {
      const results = await Promise.allSettled(
        STATUS_TAB_LIST.map((tab) =>
          radarStationCRUD.searchPaged({
            approvalStatus: TAB_QUERY_MAP[tab.key],
            page: 1,
            size: 1,
          }),
        ),
      );
      const counts: Record<string, number> = {};
      results.forEach((result, idx) => {
        const tabKey = STATUS_TAB_LIST[idx]?.key || '';
        counts[tabKey] = result.status === 'fulfilled' ? result.value.total : 0;
      });
      setTabCounts(counts);
    } catch { /* silent */ }
  }, []);

  // ── Fetch main data ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await radarStationCRUD.searchPaged({
        keyword: filterKeyword.trim() || undefined,
        code: filterCode.trim() || undefined,
        orgUnitId: filterOrgUnitId,
        seaportId: filterSeaportId,
        vtsSystemId: filterVtsSystemId,
        vtsOperationCenterId: filterVtsOperationCenterId,
        provinceId: filterProvinceId,
        conditionStatus: filterConditionStatus,
        updatedFrom: filterUpdatedFrom || undefined,
        updatedTo: filterUpdatedTo || undefined,
        approvalStatus: TAB_QUERY_MAP[activeTab],
        page,
        size: pageSize,
      });
      setDataSource(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      console.error('Không thể tải danh sách trạm radar', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    filterKeyword, filterCode, filterOrgUnitId, filterSeaportId,
    filterVtsSystemId, filterVtsOperationCenterId,
    filterProvinceId, filterConditionStatus, filterUpdatedFrom, filterUpdatedTo,
    activeTab, page, pageSize,
  ]);

  useEffect(() => { void fetchData(); }, [fetchData]);
  useEffect(() => { void fetchCounts(); }, [fetchCounts]);

  // ── Filter handlers ─────────────────────────────────────────────
  const handleFilterApply = useCallback(() => { setPage(1); }, []);
  const handleFilterReset = useCallback(() => {
    setFilterKeyword('');
    setFilterCode('');
    setFilterOrgUnitId(undefined);
    setFilterSeaportId(undefined);
    setFilterVtsSystemId(undefined);
    setFilterVtsOperationCenterId(undefined);
    setFilterProvinceId(undefined);
    setFilterConditionStatus(undefined);
    setFilterUpdatedFrom('');
    setFilterUpdatedTo('');
    setActiveTab('');
    setPage(1);
  }, []);
  const handleTabChange = useCallback((key: string) => { setActiveTab(key); setPage(1); }, []);

  // ── Drawer handlers ─────────────────────────────────────────────
  const openCreateDrawer = useCallback(() => {
    setEditingRecord(null);
    setIsDetailMode(false);
    setDetailRecord(null);
    createForm.resetFields();
    createForm.setFieldsValue({
      conditionStatus: '1',
      geometryType: 'POINT',
    });
    setGeometryTypeState('POINT');
    setCoordinateList([{ latitude: null, longitude: null }]);
    setActiveTabKey('general');
    setUploadedFiles([]);
    setPreviewCode('');
    radarStationCRUD.generateCode()
      .then((r) => setPreviewCode(r.code || ''))
      .catch(() => setPreviewCode(''));
    setDrawerVisible(true);
  }, [createForm]);

  const openEditDrawer = useCallback((record: RadarStationResponse) => {
    setEditingRecord(record);
    setIsDetailMode(false);
    setDetailRecord(null);
    setActiveTabKey('general');
    {
      const pts = parseWktToCoordinates(record.coordinates);
      const geom = record.geometryType || 'POINT';
      setGeometryTypeState(geom);
      setCoordinateList(adjustCoordinateListForGeometry(pts, geom));
    }
    createForm.setFieldsValue({
      stationName: record.stationName,
      location: record.location,
      orgUnitId: record.orgUnitId,
      seaportId: record.seaportId,
      vtsSystemId: record.vtsSystemId,
      vtsOperationCenterId: record.vtsOperationCenterId,
      operatingUnitId: record.operatingUnitId,
      provinceId: record.provinceId ? String(record.provinceId) : undefined,
      unitOfMeasure: record.unitOfMeasure,
      quantity: record.quantity,
      conditionStatus: record.conditionStatus,
      towerHeight: record.towerHeight,
      radarRange: record.radarRange,
      note: record.note,
      geometryType: record.geometryType,
      mapIcon: record.mapIcon,
    });
    setUploadedFiles([]);
    radarStationAttachment.list(record.id)
      .then((files) => setUploadedFiles(files.map((a: any) => ({
        uid: a.id,
        name: a.fileName || a.name,
        size: a.fileSize,
        status: 'done' as const,
        uploadedBy: a.uploadedBy,
        uploadedAt: a.uploadedAt || a.uploadedDate,
      }))))
      .catch(() => setUploadedFiles([]));
    setDrawerVisible(true);
  }, [createForm]);

  const openDetailDrawer = useCallback(async (record: RadarStationResponse) => {
    setDetailRecord(record);
    setEditingRecord(record);
    setIsDetailMode(true);
    setActiveTabKey('general');
    setDrawerVisible(true);
    setDetailFiles([]);
    try {
      const cached = (window.parent as any)?.kchtDetailCache?.[record.id];
      const res = (cached || await radarStationCRUD.getById(record.id)) as RadarStationResponse;
      setDetailRecord(res);
    } catch {
      toast.error('Không thể tải thông tin chi tiết');
    }
    try {
      const files = await radarStationAttachment.list(record.id);
      setDetailFiles(files || []);
    } catch {
      setDetailFiles([]);
    }
    setHistoryLoading(true);
    setHistoryRecords([]);
    try {
      const hist = await radarStationApproval.getHistory(record.id);
      setHistoryRecords(hist || []);
    } catch {
      /* ignore */
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerVisible(false);
    setEditingRecord(null);
    setDetailRecord(null);
    setIsDetailMode(false);
    createForm.resetFields();
    setUploadedFiles([]);
    setDetailFiles([]);
    if (isInIframe) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
    }
  }, [createForm, isInIframe]);

  // ── File đính kèm (InfrastructureAttachmentTab — chuẩn /vts-operation-center) ──
  const handleAddAttachmentFile = useCallback((file: File) => {
    if (uploadedFiles.length >= 10) { toast.error('Tối đa 10 file'); return false; }
    setUploadedFiles((p) => [...p, { uid: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: file.name, size: file.size, status: 'done' as const, originFileObj: file as any }]);
    return false;
  }, [uploadedFiles.length]);

  const removeUploadedFile = useCallback(async (uid: string) => {
    const target = uploadedFiles.find((f) => f.uid === uid);
    setUploadedFiles((p) => p.filter((f) => f.uid !== uid));
    if (target && !target.originFileObj && editingRecord) {
      try { await radarStationAttachment.remove(editingRecord.id, uid); } catch { /* ignore */ }
    }
  }, [uploadedFiles, editingRecord]);

  const handleDownloadAttachment = useCallback(async (attId: string, fileName?: string) => {
    const local = uploadedFiles.find((f) => f.uid === attId && f.originFileObj);
    if (local) {
      const url = URL.createObjectURL(local.originFileObj as File);
      const a = document.createElement('a');
      a.href = url;
      a.download = local.name || fileName || 'attachment';
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const targetId = editingRecord?.id || detailRecord?.id;
    if (!targetId) return;
    try {
      await radarStationAttachment.download(targetId, attId, fileName);
    } catch {
      toast.error('Không thể tải xuống tệp đính kèm');
    }
  }, [uploadedFiles, editingRecord, detailRecord]);

  // ── History ─────────────────────────────────────────────────────
  const openHistory = useCallback(async (r: RadarStationResponse) => {
    setHistoryTarget(r);
    setHistoryOpen(true);
    setHistorySearch('');
    setHistoryDateFrom('');
    setHistoryDateTo('');
    setHistoryLoading(false);
    setHistoryRecords([]);
    setLoadingMoreHistory(false);
    setHasMoreHistory(true);
    setHistoryPage(0);
  }, []);

  // ── Delete handlers ─────────────────────────────────────────────
  const openDeleteConfirm = useCallback((record: RadarStationResponse) => {
    setDeletingRecord(record);
    setDeleteConfirmText('');
    setDeleteModalOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    const expectedText = (deletingRecord.stationName || 'XÓA').trim().toLowerCase();
    const input = deleteConfirmText.trim().toLowerCase();
    if (input !== expectedText && input !== 'xóa') {
      toast.error('Vui lòng nhập đúng tên trạm radar hoặc gõ "XÓA" để xác nhận');
      return;
    }
    try {
      await radarStationCRUD.delete(deletingRecord.id);
      toast.success('Đã xóa trạm radar');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      setDeleteConfirmText('');
      void fetchData();
      void fetchCounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  }, [deletingRecord, deleteConfirmText, fetchData, fetchCounts]);

  // ── Submit approval (modal xác nhận) ────────────────────────────
  const openSubmitModal = useCallback((record: RadarStationResponse) => {
    setSubmittingRecord(record);
    setSubmitModalOpen(true);
  }, []);

  const confirmSubmit = useCallback(async () => {
    if (!submittingRecord) return;
    try {
      await radarStationApproval.submitForApproval(submittingRecord.id);
      toast.success('Đã gửi duyệt trạm radar');
      setSubmitModalOpen(false);
      setSubmittingRecord(null);
      void fetchData();
      void fetchCounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
    }
  }, [submittingRecord, fetchData, fetchCounts]);

  // ── Approve L1 (modal xác nhận) ─────────────────────────────────
  const openApproveModal = useCallback((record: RadarStationResponse, level: 'c1' | 'c2' = 'c1') => {
    setApprovingRecord(record);
    setApproveLevel(level);
    setApproveModalOpen(true);
  }, []);

  const closeApproveModal = useCallback(() => {
    setApproveModalOpen(false);
    setApprovingRecord(null);
  }, []);

  const confirmApprove = useCallback(async () => {
    if (!approvingRecord) return;
    try {
      if (approveLevel === 'c2') {
        await radarStationApproval.approveLevel2(approvingRecord.id);
        toast.success('Đã phê duyệt cấp Cục');
      } else {
        await radarStationApproval.approveLevel1(approvingRecord.id);
        toast.success('Đã phê duyệt');
      }
      setApproveModalOpen(false);
      setApprovingRecord(null);
      void fetchData();
      void fetchCounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    }
  }, [approvingRecord, approveLevel, fetchData, fetchCounts]);

  // ── Reject (modal nhập lý do) ───────────────────────────────────
  const openRejectModal = useCallback((record: RadarStationResponse, level: 'c1' | 'c2' = 'c1') => {
    setRejectTarget(record);
    setRejectLevel(level);
    setRejectReason('');
    setRejectModalVisible(true);
  }, []);

  const confirmReject = useCallback(async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (reason.length < 10) {
      toast.error('Lý do từ chối phải có ít nhất 10 ký tự');
      return;
    }
    try {
      if (rejectLevel === 'c2') {
        await radarStationApproval.rejectLevel2(rejectTarget.id, reason);
        toast.success('Đã từ chối phê duyệt cấp Cục');
      } else {
        await radarStationApproval.rejectLevel1(rejectTarget.id, reason);
        toast.success('Đã từ chối phê duyệt');
      }
      setRejectModalVisible(false);
      setRejectTarget(null);
      setRejectReason('');
      void fetchData();
      void fetchCounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  }, [rejectTarget, rejectReason, rejectLevel, fetchData, fetchCounts]);

  // ── GIS form helpers (chuẩn /vts-operation-center) ─────────────
  const updateGpsPoint = (i: number, field: 'lat' | 'lng', dVal: number | null, mVal: number | null, sVal: number | null) => {
    const d = dVal ?? 0;
    const m = mVal ?? 0;
    const s = sVal ?? 0;
    const dMax = field === 'lat' ? 90 : 180;
    const dClamped = Math.min(dMax, Math.max(0, d));
    const mClamped = Math.min(59, Math.max(0, m));
    const sClamped = Math.min(59.9999, Math.max(0, s));
    const decimal = dClamped + mClamped / 60 + sClamped / 3600;
    setCoordinateList((prev) => {
      const next = [...prev];
      next[i] = {
        ...next[i],
        [field === 'lat' ? 'latitude' : 'longitude']: decimal,
      };
      return next;
    });
  };

  const renderDms = (i: number, field: 'lat' | 'lng', r: { latitude: number | null; longitude: number | null }) => {
    const v = field === 'lat' ? (r.latitude ?? 0) : (r.longitude ?? 0);
    const dms = ddToDms(v);
    const maxD = field === 'lat' ? 90 : 180;
    return (
      <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
        <InputNumber value={dms.d ?? 0} min={0} max={maxD} precision={0} placeholder="Độ" controls={false} onFocus={(e) => e.currentTarget.select()} onChange={(x) => updateGpsPoint(i, field, x, dms.m, dms.s)} style={{ flex: 1, minWidth: 0, textAlign: 'center' }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: colors.bodyBg, border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary, whiteSpace: 'nowrap' }}>°</span>
        <InputNumber value={dms.m ?? 0} min={0} max={59} precision={0} placeholder="Phút" controls={false} onFocus={(e) => e.currentTarget.select()} onChange={(x) => updateGpsPoint(i, field, dms.d, x, dms.s)} style={{ flex: 1, minWidth: 0, textAlign: 'center' }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: colors.bodyBg, border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary, whiteSpace: 'nowrap' }}>'</span>
        <InputNumber value={dms.s ?? 0} min={0} max={59.9999} step={0.01} placeholder="Giây" controls={false} onFocus={(e) => e.currentTarget.select()} onChange={(x) => updateGpsPoint(i, field, dms.d, dms.m, x)} style={{ flex: 1.2, minWidth: 0, textAlign: 'center' }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: colors.bodyBg, border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary, whiteSpace: 'nowrap' }}>"</span>
      </Space.Compact>
    );
  };

  // ── Submit form (create / update) ───────────────────────────────
  const handleSubmit = useCallback(async (mode: 'save' | 'submit' | 'approve' = 'save') => {
    setSubmitting(true);
    try {
      const values = await createForm.validateFields();

      // Tọa độ GIS: serialize danh sách tọa độ (coordinateList) → WKT (chuẩn VOC).
      const geom = values.geometryType || geometryTypeState || 'POINT';
      const coordinates = serializeCoordinatesToWkt(coordinateList, geom);
      let longitude: number | undefined;
      let latitude: number | undefined;
      if (geom === 'POINT') {
        const first = coordinateList.find((c) => c.latitude != null && c.longitude != null);
        if (first) {
          longitude = first.longitude ?? undefined;
          latitude = first.latitude ?? undefined;
        }
      }

      const payload: CreateRadarStationRequest = {
        stationName: values.stationName?.trim(),
        location: values.location?.trim(),
        orgUnitId: values.orgUnitId || undefined,
        seaportId: values.seaportId || undefined,
        vtsSystemId: values.vtsSystemId || undefined,
        vtsOperationCenterId: values.vtsOperationCenterId || undefined,
        operatingUnitId: values.operatingUnitId || undefined,
        provinceId: values.provinceId ? String(values.provinceId) : undefined,
        unitOfMeasure: values.unitOfMeasure || undefined,
        quantity: values.quantity,
        conditionStatus: values.conditionStatus || '1',
        towerHeight: values.towerHeight,
        radarRange: values.radarRange,
        note: values.note?.trim() || undefined,
        longitude,
        latitude,
        geometryType: geom,
        coordinates: coordinates || undefined,
        mapIcon: values.mapIcon || undefined,
      };
      let savedId: string | null = null;
      if (editingRecord) {
        const updated = await radarStationCRUD.update(editingRecord.id, payload);
        savedId = updated.id || editingRecord.id;
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[editingRecord.id] = updated;
        }
        const newFiles = uploadedFiles.filter((f) => f.originFileObj).map((f) => f.originFileObj as File);
        for (const file of newFiles) {
          try { await radarStationAttachment.upload(editingRecord.id, file); } catch { /* ignore */ }
        }
        if (mode !== 'save' && savedId) {
          const submitted = await radarStationApproval.submitForApproval(savedId);
          if (mode === 'approve' && (submitted.status === 'APPROVED_LEVEL1' || submitted.approvalStatus === 'APPROVED_LEVEL1')) {
            await radarStationApproval.approveLevel2(savedId);
            toast.success('Đã cập nhật và phê duyệt trạm radar');
          } else if (mode === 'approve') {
            toast.info('Đã lưu và gửi phê duyệt — hồ sơ đang chờ Cảng vụ/Chi cục duyệt');
          } else {
            toast.success('Đã cập nhật và gửi phê duyệt trạm radar');
          }
        } else {
          toast.success('Đã cập nhật trạm radar');
        }
      } else {
        const created = await radarStationCRUD.create(payload);
        savedId = created.id || null;
        if (created.id && window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[created.id] = created;
        }
        const newFiles = uploadedFiles.filter((f) => f.originFileObj).map((f) => f.originFileObj as File);
        if (created.id && newFiles.length > 0) {
          for (const file of newFiles) {
            try { await radarStationAttachment.upload(created.id, file); } catch { /* ignore */ }
          }
        }
        if (mode !== 'save' && savedId) {
          const submitted = await radarStationApproval.submitForApproval(savedId);
          if (mode === 'approve' && (submitted.status === 'APPROVED_LEVEL1' || submitted.approvalStatus === 'APPROVED_LEVEL1')) {
            await radarStationApproval.approveLevel2(savedId);
            toast.success('Đã tạo mới và phê duyệt trạm radar');
          } else if (mode === 'approve') {
            toast.info('Đã tạo mới và gửi phê duyệt — hồ sơ đang chờ Cảng vụ/Chi cục duyệt');
          } else {
            toast.success('Đã tạo mới và gửi phê duyệt trạm radar');
          }
        } else {
          toast.success('Đã tạo mới trạm radar');
        }
      }
      setDrawerVisible(false);
      setEditingRecord(null);
      setDetailRecord(null);
      setIsDetailMode(false);
      createForm.resetFields();
      void fetchData();
      void fetchCounts();
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
      // validation error → antd shows field messages
    } finally {
      setSubmitting(false);
    }
  }, [editingRecord, createForm, fetchData, fetchCounts, uploadedFiles, coordinateList, geometryTypeState]);

  // ── Row actions (chuẩn: Xem chi tiết → Chỉnh sửa → Lịch sử → Gửi duyệt → Phê duyệt/Từ chối theo cấp → Xóa; icon theo themetokenchk) ──
  const rowActions = useCallback((record: RadarStationResponse) => {
    const actions: any[] = [];
    const st = record.approvalStatus;
    if (hasPerm('radarstation:read')) {
      actions.push({ key: 'view', label: 'Xem chi tiết', icon: themeTokenChk.icons.view, onClick: () => openDetailDrawer(record) });
    }
    // Quy tắc 12 (approval-2-level-spec.md mục 3.9)
    if (canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'radarstation' })) {
      actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: themeTokenChk.icons.edit, onClick: () => openEditDrawer(record) });
    }
    actions.push({ key: 'history', label: 'Lịch sử', icon: themeTokenChk.icons.history, onClick: () => openHistory(record) });
    const currentUserId = useAuthStore.getState().user?.userId;
    if (['DRAFT', 'PROPOSED', 'REJECTED', 'REJECTED_LEVEL1', 'REJECTED_LEVEL2'].includes(st) && hasPerm('radarstation:update')) {
      actions.push({ key: 'submit', label: 'Gửi duyệt', icon: themeTokenChk.icons.submit, onClick: () => openSubmitModal(record) });
    }
    // Quy tắc 8/9: chống tự duyệt (4-eyes) — người tạo không tự duyệt cấp Cảng vụ
    if (hasPerm('radarstation:approvec1') && st === 'PENDING_APPROVAL' && currentUserId !== record.createdBy) {
      actions.push({ key: 'approveC1', label: 'Phê duyệt cấp Cảng vụ/Chi cục', icon: themeTokenChk.icons.approve, onClick: () => openApproveModal(record, 'c1') });
      actions.push({ key: 'rejectC1', label: 'Từ chối cấp Cảng vụ/Chi cục', icon: themeTokenChk.icons.reject, danger: true, onClick: () => openRejectModal(record, 'c1') });
    }
    // Cấp Cục: người duyệt C1 không tự duyệt C2
    if (hasPerm('radarstation:approvec2') && st === 'APPROVED_LEVEL1' && currentUserId !== record.approverLevel1) {
      actions.push({ key: 'approveC2', label: 'Phê duyệt cấp Cục', icon: themeTokenChk.icons.approve, onClick: () => openApproveModal(record, 'c2') });
      actions.push({ key: 'rejectC2', label: 'Từ chối cấp Cục', icon: themeTokenChk.icons.reject, danger: true, onClick: () => openRejectModal(record, 'c2') });
    }
    // T13: chỉ hồ sơ Lưu tạm (DRAFT) mới được xóa — luôn ở cuối menu
    if (st === 'DRAFT' && hasPerm('radarstation:delete')) {
      actions.push({ key: 'delete', label: 'Xóa', icon: themeTokenChk.icons.delete, danger: true, onClick: () => openDeleteConfirm(record) });
    }
    return actions;
  }, [hasPerm, openDetailDrawer, openEditDrawer, openSubmitModal, openApproveModal, openRejectModal, openHistory, openDeleteConfirm]);

  // ── Label helper (tên đơn vị / cảng / VTS theo id) ──────────────
  const orgNameById = useCallback((orgUnitId?: string): string => {
    if (!orgUnitId) return '—';
    const org = orgOptions.find((o) => o.id === orgUnitId);
    return org ? (org.code ? `${org.code} - ${org.name}` : org.name) : orgUnitId;
  }, [orgOptions]);

  const seaportLabelById = useCallback((seaportId?: string): string => {
    if (!seaportId) return '—';
    const port = seaportOptions.find((p) => p.id === seaportId);
    return port ? (port.portCode ? `${port.portCode} - ${port.portName || ''}` : port.portName || seaportId) : seaportId;
  }, [seaportOptions]);

  const vtsLabelById = useCallback((vtsId?: string): string => {
    if (!vtsId) return '—';
    const vts = vtsOptions.find((v) => v.id === vtsId);
    return vts ? (vts.code ? `${vts.code} - ${vts.systemName || ''}` : vts.systemName || vtsId) : vtsId;
  }, [vtsOptions]);

  // ── Table columns ───────────────────────────────────────────────
  const columns: any[] = useMemo(() => [
    {
      key: 'sequenceNo', label: 'STT', width: 60, fixed: 'left' as const, align: 'center' as const,
      render: (_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + i + 1}</span>,
    },
    {
      key: 'stationName', label: 'Tên / Mã trạm radar', dataIndex: 'stationName', width: 300, fixed: 'left' as const,
      render: (name: string | undefined, record: RadarStationResponse) => (
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Button
            type="link"
            title={name}
            onClick={() => openDetailDrawer(record)}
            style={{
              ...themeTokenChk.cellTitleStyle,
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              padding: 0,
              height: 'auto',
              textAlign: 'left',
              lineHeight: 'inherit',
            }}
          >
            {name || '—'}
          </Button>
          <span style={{ ...themeTokenChk.cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {record.code || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'orgUnitName', label: 'Đơn vị quản lý', dataIndex: 'orgUnitName', width: 240,
      render: (v: string | undefined, record: RadarStationResponse) => (
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v || orgNameById(record.orgUnitId)}>
          <span style={{ fontWeight: fontWeightBold }}>{v || orgNameById(record.orgUnitId)}</span>
        </div>
      ),
    },
    {
      key: 'seaportName', label: 'Thuộc cảng biển', dataIndex: 'seaportName', width: 220, ellipsis: true,
      render: (v: string | undefined, record: RadarStationResponse) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || seaportLabelById(record.seaportId)}</span>,
    },
    {
      key: 'vtsSystemName', label: 'Hệ thống VTS', dataIndex: 'vtsSystemName', width: 230, ellipsis: true,
      render: (v: string | undefined, record: RadarStationResponse) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || vtsLabelById(record.vtsSystemId)}</span>,
    },
    {
      key: 'vtsOperationCenterName', label: 'Trung tâm điều hành VTS', dataIndex: 'vtsOperationCenterName', width: 330, ellipsis: true,
      render: (v: string | undefined, record: RadarStationResponse) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || vtsLabelById(record.vtsOperationCenterId)}</span>,
    },
    {
      key: 'operatingUnitId', label: 'Đơn vị khai thác', dataIndex: 'operatingUnitId', width: 180, ellipsis: true,
      render: (v: string | undefined) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v ? orgNameById(v) : '—'}</span>,
    },
    {
      key: 'provinceId', label: 'Địa điểm (Tỉnh/TP)', dataIndex: 'provinceId', width: 220,
      render: (v: string | undefined) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{getProvinceLabel(v)}</span>,
    },
    {
      key: 'unitOfMeasure', label: 'Đơn vị tính', dataIndex: 'unitOfMeasure', width: 170,
      render: (v: string | undefined) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>,
    },
    {
      key: 'quantity', label: 'Số lượng', dataIndex: 'quantity', width: 130,
      render: (v: number | null | undefined) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v != null ? String(v) : '—'}</span>,
    },
    {
      key: 'conditionStatus', label: 'Tình trạng', dataIndex: 'conditionStatus', width: 210,
      render: (v: string) => {
        const s = CONDITION_STATUS_STYLE_MAP[v];
        return s
          ? <span style={statusBadgeStyle(s.color)}>{s.label}</span>
          : <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>;
      },
    },
    {
      key: 'updatedBy', label: 'Cán bộ cập nhật', dataIndex: 'updatedBy', width: 240, ellipsis: true,
      render: (_v: string | undefined, record: RadarStationResponse) => {
        const name = record.updatedByName || record.createdByName || '—';
        const date = record.updatedDate || record.updatedAt;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.4 }}>
            <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{name}</span>
            <span style={{ fontSize: fontSizeMd, color: textTertiary }}>{date ? formatDate(date) : ''}</span>
          </div>
        );
      },
    },
    {
      key: 'submittedForApprovalBy', label: 'Cán bộ gửi phê duyệt', dataIndex: 'submittedForApprovalBy', width: 300, ellipsis: true,
      render: (_v: string | undefined, record: RadarStationResponse) => {
        const name = record.submittedByName || record.createdByName || '—';
        const date = record.submittedForApprovalAt;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.4 }}>
            <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{name}</span>
            <span style={{ fontSize: fontSizeMd, color: textTertiary }}>{date ? formatDate(date) : ''}</span>
          </div>
        );
      },
    },
    {
      key: 'approverLevel1', label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', dataIndex: 'approverLevel1', width: 430, ellipsis: true,
      render: (_v: string | undefined, record: RadarStationResponse) => {
        const name = record.approverLevel1Name || record.approverLevel1 || '—';
        const date = record.approvedDateLevel1;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.4 }}>
            <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{name}</span>
            <span style={{ fontSize: fontSizeMd, color: textTertiary }}>{date ? formatDate(date) : ''}</span>
          </div>
        );
      },
    },
    {
      key: 'approverLevel2', label: 'Cán bộ phê duyệt cấp Cục', dataIndex: 'approverLevel2', width: 330, ellipsis: true,
      render: (_v: string | undefined, record: RadarStationResponse) => {
        const name = record.approverLevel2Name || record.approverLevel2 || '—';
        const date = record.approvedDateLevel2;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.4 }}>
            <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{name}</span>
            <span style={{ fontSize: fontSizeMd, color: textTertiary }}>{date ? formatDate(date) : ''}</span>
          </div>
        );
      },
    },
    {
      key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 350,
      render: (status: string) => {
        const s = RADAR_STATION_STATUS_STYLE_MAP[status];
        return s
          ? <span style={statusBadgeStyle(s.color)}>{s.label}</span>
          : <span style={{ fontSize: fontSizeMd, color: textTertiary }}>{status || '—'}</span>;
      },
    },
  ], [page, pageSize, openDetailDrawer, orgNameById, seaportLabelById, vtsLabelById]);

  const tableData = useMemo(
    () => dataSource.map((item, idx) => ({ ...item, _rowIndex: (page - 1) * pageSize + idx + 1 })),
    [dataSource, page, pageSize],
  );

  // ── Filter panel content ────────────────────────────────────────
  const filterContent = (
    <>
      {/* ── Bộ lọc mặc định (luôn hiển thị) ── */}
      <div style={{ marginBottom: spaceFormField, marginTop: spaceMd }}>
        <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Đơn vị quản lý</div>
        <OrgUnitTreeSelect
          organizations={orgOptions}
          placeholder="Tất cả"
          allowClear
          showSearch
          value={filterOrgUnitId}
          onChange={(v) => { setFilterOrgUnitId(v || undefined); setPage(1); }}
          style={{ ...selectStyle, width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Thuộc cảng biển</div>
        <Select placeholder="Tất cả cảng biển" allowClear value={filterSeaportId}
          onChange={(v) => { setFilterSeaportId(v); setPage(1); }}
          showSearch optionFilterProp="label"
          options={seaportOptions.map((p) => ({ value: p.id, label: p.portCode ? `${p.portCode} - ${p.portName || ''}` : p.portName || p.id }))}
          style={{ ...selectStyle, width: '100%' }} />
      </div>
      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Tên trạm radar</div>
        <Input placeholder="Nhập tên trạm radar" allowClear value={filterKeyword}
          onChange={(e) => { setFilterKeyword(e.target.value); setPage(1); }}
          onPressEnter={handleFilterApply} style={{ ...inputStyle, width: '100%' }} />
      </div>

      {/* ── Bộ lọc nâng cao (ẩn, hiện khi bấm nút Filter) ── */}
      {filterCollapsed && (
        <>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Mã radar</div>
            <Input placeholder="Nhập mã radar" allowClear value={filterCode}
              onChange={(e) => { setFilterCode(e.target.value); setPage(1); }}
              onPressEnter={handleFilterApply} style={{ ...inputStyle, width: '100%' }} />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Hệ thống VTS</div>
            <Select placeholder="Tất cả" allowClear value={filterVtsSystemId}
              onChange={(v) => { setFilterVtsSystemId(v); setPage(1); }}
              showSearch optionFilterProp="label"
              options={vtsOptions.map((vts) => ({ value: vts.id, label: vts.code ? `${vts.code} - ${vts.systemName || ''}` : vts.systemName || vts.id }))}
              style={{ ...selectStyle, width: '100%' }} />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Trung tâm điều hành VTS</div>
            <Select placeholder="Tất cả" allowClear value={filterVtsOperationCenterId}
              onChange={(v) => { setFilterVtsOperationCenterId(v); setPage(1); }}
              showSearch optionFilterProp="label"
              options={vtsOptions.map((vts) => ({ value: vts.id, label: vts.code ? `${vts.code} - ${vts.systemName || ''}` : vts.systemName || vts.id }))}
              style={{ ...selectStyle, width: '100%' }} />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Địa điểm (Tỉnh/TP)</div>
            <Select placeholder="Tất cả" allowClear value={filterProvinceId}
              onChange={(v) => { setFilterProvinceId(v); setPage(1); }}
              showSearch optionFilterProp="label"
              options={VIETNAM_PROVINCE_OPTIONS} style={{ ...selectStyle, width: '100%' }} />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Tình trạng</div>
            <Select placeholder="Tất cả" allowClear value={filterConditionStatus}
              onChange={(v) => { setFilterConditionStatus(v); setPage(1); }}
              options={CONDITION_STATUS_OPTIONS} style={{ ...selectStyle, width: '100%' }} />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Ngày cập nhật</div>
            <DatePicker.RangePicker
              {...getRangePickerProps({
                value: rangeValue(filterUpdatedFrom, filterUpdatedTo),
                onChange: (range: any) => {
                  setFilterUpdatedFrom(range && range[0] ? range[0].format('YYYY-MM-DD') : '');
                  setFilterUpdatedTo(range && range[1] ? range[1].format('YYYY-MM-DD') : '');
                  setPage(1);
                },
              })}
            />
          </div>
        </>
      )}
    </>
  );

  // ── Status tabs config (FilterTableLayout renders StatusTabs itself) ──
  const statusTabs = STATUS_TAB_LIST.map((tab) => ({
    key: tab.key, label: tab.label, count: tabCounts[tab.key] ?? 0,
    color: tab.color, active: activeTab === tab.key,
  }));

  const headerActions = useMemo(
    () =>
      hasPerm('radarstation:create')
        ? [{ key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: <PlusOutlined />, onClick: openCreateDrawer }]
        : [],
    [hasPerm, openCreateDrawer],
  );

  // ── Detail rows (chuẩn CHK: chk-detail-grid / chk-detail-row) ──
  type DetailRow = { label: string; value: React.ReactNode; fullWidth?: boolean };

  const renderDetailGrid = (rows: DetailRow[]) => (
    <div className="chk-detail-grid">
      {rows.map((row) => (
        <div key={row.label} className={row.fullWidth ? 'chk-detail-row chk-detail-row--full' : 'chk-detail-row'}>
          <span className="chk-detail-label">{row.label}</span>
          <span className="chk-detail-value">{row.value}</span>
        </div>
      ))}
    </div>
  );

  const detailBasicRows: DetailRow[] = detailRecord
    ? [
        { label: 'Mã radar', value: detailRecord.code || '—' },
        { label: 'Tên trạm radar', value: detailRecord.stationName || '—' },
        { label: 'Đơn vị quản lý', value: detailRecord.orgUnitName || orgNameById(detailRecord.orgUnitId) },
        { label: 'Thuộc cảng biển', value: detailRecord.seaportName || seaportLabelById(detailRecord.seaportId) },
        { label: 'Hệ thống VTS', value: detailRecord.vtsSystemName || vtsLabelById(detailRecord.vtsSystemId) },
        { label: 'Trung tâm điều hành VTS', value: detailRecord.vtsOperationCenterName || vtsLabelById(detailRecord.vtsOperationCenterId) },
        { label: 'Đơn vị khai thác', value: orgNameById(detailRecord.operatingUnitId) },
        { label: 'Địa điểm (Tỉnh/TP)', value: getProvinceLabel(detailRecord.provinceId) },
        { label: 'Địa điểm chi tiết', value: detailRecord.location || '—' },
        { label: 'Đơn vị tính', value: detailRecord.unitOfMeasure || '—' },
        { label: 'Số lượng', value: detailRecord.quantity != null ? String(detailRecord.quantity) : '—' },
        {
          label: 'Tình trạng',
          value: (() => {
            const s = CONDITION_STATUS_STYLE_MAP[detailRecord.conditionStatus || ''];
            return s
              ? <span style={statusBadgeStyle(s.color)}>{s.label}</span>
              : '—';
          })(),
        },
      ]
    : [];

  const detailTechnicalRows: DetailRow[] = detailRecord
    ? [
        { label: 'Chiều cao tháp radar (m)', value: detailRecord.towerHeight != null ? Number(detailRecord.towerHeight).toLocaleString('vi-VN') : '—' },
        { label: 'Tầm hiệu lực radar', value: detailRecord.radarRange != null ? String(detailRecord.radarRange) : '—' },
        { label: 'Ghi chú', value: detailRecord.note || '—', fullWidth: true },
      ]
    : [];

  // Tọa độ GPS: đọc từ WKT coordinates (nhiều điểm), fallback latitude/longitude khi thiếu (chuẩn VOC).
  const detailCoordRows: { latitude: number | null; longitude: number | null }[] = (() => {
    if (!detailRecord) return [];
    const wktPoints = parseWktToCoordinates(detailRecord.coordinates);
    const adjusted = adjustCoordinateListForGeometry(wktPoints, detailRecord.geometryType || 'POINT');
    const filled = adjusted.filter((c) => c.latitude != null && c.longitude != null);
    if (filled.length > 0) return filled;
    if (detailRecord.latitude != null || detailRecord.longitude != null) {
      return [{ latitude: detailRecord.latitude ?? null, longitude: detailRecord.longitude ?? null }];
    }
    return [];
  })();

  const detailTabItems = [
    {
      key: 'general',
      label: 'Thông tin chung',
      children: (
        <div style={{ paddingTop: 3 }}>
          {renderDetailGrid(detailBasicRows)}
          <div style={{ marginTop: 20, marginBottom: 12, borderTop: `1px solid ${borderDefault}`, paddingTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 4, height: 16, borderRadius: 2, backgroundColor: actionPrimary }} />
            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Thông tin kỹ thuật
            </span>
          </div>
          {renderDetailGrid(detailTechnicalRows)}
        </div>
      ),
    },
    {
      key: 'gis',
      label: 'Thông tin vị trí',
      children: (
        <DetailTable
          scrollY={DRAWER_TABLE_SCROLL_Y.detailGis}
          dataSource={detailCoordRows}
          emptyText="Chưa có tọa độ GPS nào"
          headerNode={
            <>
              <div className="chk-detail-grid" style={{ marginBottom: 12 }}>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">Loại đối tượng</span>
                  <span className="chk-detail-value">
                    {detailRecord?.geometryType === 'LINE' ? 'Đối tượng đường'
                      : detailRecord?.geometryType === 'POLYGON' ? 'Đối tượng vùng'
                      : 'Đối tượng điểm'}
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">Biểu tượng bản đồ</span>
                  <span className="chk-detail-value">
                    {(() => {
                      const symId = detailRecord?.mapIcon;
                      const sym = symbols.find((s) => s.id === symId || s.code === symId || (symId && String(s.id) === String(symId)));
                      if (sym) {
                        const imgSrc = sym.image
                          ? (sym.image.startsWith('data:') || sym.image.startsWith('http') || sym.image.startsWith('/')
                              ? sym.image
                              : `data:image/png;base64,${sym.image}`)
                          : undefined;
                        return (
                          <Space size={8} align="center" style={{ display: 'inline-flex', alignItems: 'center' }}>
                            {imgSrc ? (
                              <img
                                src={imgSrc}
                                alt={sym.name || ''}
                                style={{ width: 20, height: 20, objectFit: 'contain', verticalAlign: 'middle', display: 'inline-block' }}
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            ) : (
                              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: actionPrimary }} />
                            )}
                            <span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span>
                          </Space>
                        );
                      }
                      return (
                        <Space size={8} align="center" style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: actionPrimary }} />
                          <span>{detailRecord?.mapIcon || '—'}</span>
                        </Space>
                      );
                    })()}
                  </span>
                </div>
                <div className="chk-detail-row"><span className="chk-detail-label">Hệ quy chiếu</span><span className="chk-detail-value">WGS 84 / VN-2000</span></div>
                <div className="chk-detail-row"><span className="chk-detail-label">Quy tắc hiển thị</span><span className="chk-detail-value">Độ, phút, giây (DMS)</span></div>
              </div>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px' }}>
                  Tọa độ GPS
                </span>
                <Button
                  type="primary"
                  icon={<EnvironmentOutlined />}
                  onClick={() => setDetailMapOpen(true)}
                  style={{
                    ...primaryButtonStyle,
                    height: 32,
                    fontSize: fontSizeSm,
                    padding: '0 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  Xem vị trí trên bản đồ
                </Button>
              </div>
            </>
          }
          columns={[
            { title: 'STT', width: 60, align: 'center' },
            {
              title: 'Vĩ độ (Latitude - N)',
              key: 'lat',
              render: (_value: unknown, record: { latitude?: number | null; longitude?: number | null }) => {
                const d = ddToDms(record.latitude);
                return d.d != null ? <span style={{ color: textPrimary }}>{`${d.d}° ${d.m}' ${d.s}" N`}</span> : '—';
              },
            },
            {
              title: 'Kinh độ (Longitude - E)',
              key: 'lng',
              render: (_value: unknown, record: { latitude?: number | null; longitude?: number | null }) => {
                const d = ddToDms(record.longitude);
                return d.d != null ? <span style={{ color: textPrimary }}>{`${d.d}° ${d.m}' ${d.s}" E`}</span> : '—';
              },
            },
          ]}
        />
      ),
    },
    {
      key: 'files',
      label: 'File đính kèm',
      children: (
        <div style={{ paddingTop: 3 }}>
          <InfrastructureAttachmentTab
            attachments={detailFiles.map((f) => ({
              ...f,
              uploadedByName:
                userOptions.find((u) => u.value === (f?.uploadedBy || f?.uploaderId))?.label || f?.uploadedByName,
            }))}
            readonly
            onDownload={handleDownloadAttachment}
          />
        </div>
      ),
    },
    {
      key: 'children',
      label: 'Kết cấu hạ tầng thuộc trạm radar',
      children: (
        <div>
          <DetailTable
            scrollY="calc(100vh - 378px)"
            dataSource={radarChildrenList}
            emptyText="Chưa có kết cấu hạ tầng thuộc trạm radar"
            rowKey={(r) => r.id || `${r.type}-${r.code || r.name}`}
            columns={[
              { title: 'STT', width: 60, align: 'center' },
              {
                title: 'Loại đối tượng',
                dataIndex: 'typeLabel',
                key: 'typeLabel',
                width: 240,
                render: (v: string | undefined) => (
                  <span style={{ fontWeight: fontWeightMedium, color: textPrimary }}>
                    {v || '—'}
                  </span>
                ),
              },
              {
                title: 'Tên kết cấu hạ tầng',
                dataIndex: 'name',
                key: 'name',
                render: (v: string | undefined) => (
                  <span
                    style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textPrimary }}
                    title={v}
                  >
                    {v || '—'}
                  </span>
                ),
              },
            ]}
          />
        </div>
      ),
    },
    {
      key: 'operations',
      label: 'Vận hành & bảo trì',
      children: (
        <Tabs
          defaultActiveKey="operation"
          tabBarStyle={{ ...drawerTabBarStyle, marginTop: 0, marginBottom: 12 }}
          animated={false}
          items={[
            {
              key: 'operation',
              label: 'Thông tin vận hành khai thác',
              children: (
                <DetailTable
                  scrollY="calc(100vh - 378px)"
                  dataSource={operationPlanList}
                  emptyText="Chưa có dữ liệu"
                  rowKey={(r: OperationRow) => (r.id || r.planCode || r.code || Math.random().toString())}
                  columns={[
                    { title: 'STT', width: 60, align: 'center' },
                    {
                      title: 'Mã kế hoạch',
                      dataIndex: 'planCode',
                      key: 'planCode',
                      width: 240,
                      render: (v: string | undefined, r: OperationRow) => <span style={{ color: textPrimary }}>{v || r.code || '—'}</span>,
                    },
                    {
                      title: 'Tên kế hoạch',
                      dataIndex: 'planName',
                      key: 'planName',
                      width: 260,
                      render: (v: string | undefined, r: OperationRow) => (
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textPrimary }} title={v || r.name}>
                          {v || r.name || '—'}
                        </span>
                      ),
                    },
                    {
                      title: 'Ngày bắt đầu',
                      dataIndex: 'startDate',
                      key: 'startDate',
                      width: 260,
                      render: (v: string | undefined, r: OperationRow) => (
                        <span style={{ color: textPrimary }}>
                          {v ? dayjs(v).format('DD/MM/YYYY') : (r.startTime ? dayjs(r.startTime).format('DD/MM/YYYY') : '—')}
                        </span>
                      ),
                    },
                    {
                      title: 'Ngày kết thúc',
                      dataIndex: 'endDate',
                      key: 'endDate',
                      width: 260,
                      render: (v: string | undefined, r: OperationRow) => (
                        <span style={{ color: textPrimary }}>
                          {v ? dayjs(v).format('DD/MM/YYYY') : (r.endTime ? dayjs(r.endTime).format('DD/MM/YYYY') : '—')}
                        </span>
                      ),
                    },
                  ]}
                />
              ),
            },
            {
              key: 'maintenance',
              label: 'Thông tin bảo trì',
              children: (
                <DetailTable
                  scrollY="calc(100vh - 378px)"
                  dataSource={maintenancePlanList}
                  emptyText="Chưa có dữ liệu"
                  rowKey={(r: OperationRow) => (r.id || r.planCode || r.code || Math.random().toString())}
                  columns={[
                    { title: 'STT', width: 60, align: 'center' },
                    {
                      title: 'Mã kế hoạch',
                      dataIndex: 'planCode',
                      key: 'planCode',
                      width: 240,
                      render: (v: string | undefined, r: OperationRow) => <span style={{ color: textPrimary }}>{v || r.code || '—'}</span>,
                    },
                    {
                      title: 'Tên kế hoạch',
                      dataIndex: 'planName',
                      key: 'planName',
                      width: 260,
                      render: (v: string | undefined, r: OperationRow) => (
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textPrimary }} title={v || r.name}>
                          {v || r.name || '—'}
                        </span>
                      ),
                    },
                    {
                      title: 'Thời gian bắt đầu',
                      dataIndex: 'startTime',
                      key: 'startTime',
                      width: 240,
                      render: (v: string | undefined, r: OperationRow) => (
                        <span style={{ color: textPrimary }}>
                          {v ? dayjs(v).format('DD/MM/YYYY') : (r.startDate ? dayjs(r.startDate).format('DD/MM/YYYY') : '—')}
                        </span>
                      ),
                    },
                    {
                      title: 'Thời gian kết thúc',
                      dataIndex: 'endTime',
                      key: 'endTime',
                      width: 240,
                      render: (v: string | undefined, r: OperationRow) => (
                        <span style={{ color: textPrimary }}>
                          {v ? dayjs(v).format('DD/MM/YYYY') : (r.endDate ? dayjs(r.endDate).format('DD/MM/YYYY') : '—')}
                        </span>
                      ),
                    },
                  ]}
                />
              ),
            },
            {
              key: 'incident',
              label: 'Thông tin sự cố',
              children: (
                <DetailTable
                  scrollY="calc(100vh - 378px)"
                  dataSource={incidentList}
                  emptyText="Chưa có dữ liệu"
                  rowKey={(r: OperationRow) => (r.id || r.incidentCode || r.code || Math.random().toString())}
                  columns={[
                    { title: 'STT', width: 60, align: 'center' },
                    {
                      title: 'Mã sự cố',
                      dataIndex: 'incidentCode',
                      key: 'incidentCode',
                      width: 200,
                      render: (v: string | undefined, r: OperationRow) => <span style={{ color: textPrimary }}>{v || r.code || '—'}</span>,
                    },
                    {
                      title: 'Loại sự cố',
                      dataIndex: 'incidentType',
                      key: 'incidentType',
                      width: 220,
                      render: (v: string | undefined, r: OperationRow) => <span style={{ color: textPrimary }}>{v || r.type || '—'}</span>,
                    },
                    {
                      title: 'Địa điểm',
                      dataIndex: 'location',
                      key: 'location',
                      width: 260,
                      render: (v: string | undefined, r: OperationRow) => (
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textPrimary }} title={v || r.address}>
                          {v || r.address || '—'}
                        </span>
                      ),
                    },
                    {
                      title: 'Thời gian',
                      dataIndex: 'incidentTime',
                      key: 'incidentTime',
                      width: 200,
                      render: (v: string | undefined, r: OperationRow) => (
                        <span style={{ color: textPrimary }}>
                          {v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : (r.time ? dayjs(r.time).format('DD/MM/YYYY HH:mm:ss') : '—')}
                        </span>
                      ),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      ),
    },
    {
      key: 'handlingAndTracking',
      label: 'Xử lý & theo dõi',
      children: (
        <div style={{ paddingTop: 3 }}>
          <div className="chk-detail-grid">
            {[
              { key: 'updatedDate', label: 'Ngày cập nhật', value: formatDate(detailRecord?.updatedDate || detailRecord?.updatedAt) },
              { key: 'updatedByUser', label: 'Cán bộ cập nhật', value: detailRecord?.updatedByName || detailRecord?.createdByName || '—' },
              { key: 'submittedDate', label: 'Ngày gửi phê duyệt', value: formatDate(detailRecord?.submittedForApprovalAt) },
              { key: 'submittedByUser', label: 'Cán bộ gửi phê duyệt', value: detailRecord?.submittedByName || detailRecord?.createdByName || '—' },
              { key: 'approvalContentLevel1', label: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục', value: detailRecord?.level1ApprovalContent || '—', fullWidth: true },
              { key: 'approvedDateLevel1', label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục', value: detailRecord?.approvedDateLevel1 ? formatDate(detailRecord?.approvedDateLevel1) : '—' },
              { key: 'approvedByLevel1', label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', value: detailRecord?.approverLevel1Name || detailRecord?.approverLevel1 || '—' },
              { key: 'approvalContentLevel2', label: 'Nội dung phê duyệt cấp Cục', value: detailRecord?.level2ApprovalContent || '—', fullWidth: true },
              { key: 'approvedDateLevel2', label: 'Ngày phê duyệt cấp Cục', value: detailRecord?.approvedDateLevel2 ? formatDate(detailRecord?.approvedDateLevel2) : '—' },
              { key: 'approvedByLevel2', label: 'Cán bộ phê duyệt cấp Cục', value: detailRecord?.approverLevel2Name || detailRecord?.approverLevel2 || '—' },
              { key: 'approvalContentExtra', label: 'Lý do từ chối', value: detailRecord?.rejectionReason || '—', fullWidth: true },
              {
                key: 'status',
                label: 'Trạng thái',
                fullWidth: true,
                value: (() => {
                  const s = RADAR_STATION_STATUS_STYLE_MAP[detailRecord?.status || ''] || { color: textTertiary, label: detailRecord?.status || '—' };
                  return <span style={statusBadgeStyle(s.color)}>{s.label}</span>;
                })(),
              },
            ].map((row) => (
              <div key={row.key} className={row.fullWidth ? 'chk-detail-row chk-detail-row--full' : 'chk-detail-row'}>
                <span className="chk-detail-label">{row.label}</span>
                <span className="chk-detail-value">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  // ── History timeline render (chuẩn /vts-operation-center) ──────────

  const fmtTime = (ts: string) => {
    const d = dayjs(ts);
    return `${d.format('HH:mm')} ${d.format('DD/MM/YYYY')}`;
  };

  const historyFieldValue = (fn: string, val: string | null): string => {
    if (!val || val === '(null)' || val === 'null' || val === '') return '(trống)';
    const displayValue = val.split(';').map((part) => {
      const separator = part.indexOf('=');
      return separator >= 0 ? part.slice(separator + 1).trim() : part.trim();
    }).filter(Boolean).join('; ');
    if (isApprovalHistoryField(fn)) {
      const statusMap: Record<string, string> = {
        DRAFT: 'Lưu tạm',
        PROPOSED: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
        PENDING: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
        PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
        APPROVED_LEVEL1: 'Chờ phê duyệt cấp Cục',
        APPROVED_LEVEL2: 'Đã phê duyệt',
        APPROVED: 'Đã phê duyệt',
        REJECTED: 'Từ chối cấp Cảng vụ/Chi cục',
        REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục',
        REJECTED_LEVEL2: 'Từ chối cấp Cục',
      };
      return displayValue.split(';').map((value) => {
        const normalizedValue = String(value || '').trim();
        const fromEnum = statusMap[normalizedValue] || statusMap[normalizedValue.toUpperCase()];
        return fromEnum || normalizedValue;
      }).join('; ');
    }
    if (isProvinceHistoryField(fn)) {
      return getProvinceLabel(displayValue);
    }
    if (isConditionHistoryField(fn)) {
      const style = CONDITION_STATUS_STYLE_MAP[displayValue.trim()] || CONDITION_STATUS_STYLE_MAP[String(displayValue).trim().toUpperCase()];
      return style ? style.label : displayValue;
    }
    const key = normalizeHistoryKey(fn);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(displayValue.trim());
    if (!isUuid) return displayValue;
    if (key === 'orgunitid' || key === 'don vi quan ly' || key === 'operatingunitid' || key === 'don vi khai thac') return orgNameById(displayValue.trim());
    if (key === 'seaportid' || key === 'thuoc cang bien') return seaportLabelById(displayValue.trim());
    if (key === 'vtssystemid' || key === 'he thong vts' || key === 'vtsoperationcenterid' || key === 'trung tam dieu hanh vts') return vtsLabelById(displayValue.trim());
    return displayValue;
  };

  const renderHistoryValueTag = (field: string, val: string | null) => {
    if (val === null || val === undefined || val === '—' || val === '' || val === 'Chưa có') {
      return <span style={{ color: textTertiary }}>{val === 'Chưa có' ? 'Chưa có' : '—'}</span>;
    }
    const displayValue = historyFieldValue(field, val);
    const rawUpper = String(val).trim().toUpperCase();
    if (isCoordinatesHistoryField(field) || rawUpper.startsWith('POINT') || rawUpper.startsWith('LINESTRING') || rawUpper.startsWith('POLYGON')) {
      return renderCoordinatesDisplay(val);
    }
    if (isMapIconHistoryField(field)) {
      const sym = symbolOptions.find((s) => s.value === displayValue || s.label === displayValue || s.value === val || s.label === val);
      return <span style={{ fontWeight: fontWeightMedium, color: textPrimary }}>{sym?.label || displayValue}</span>;
    }
    if (isApprovalHistoryField(field)) {
      const style = RADAR_STATION_STATUS_STYLE_MAP[String(val).trim().toUpperCase()];
      if (style) return <span style={statusBadgeStyle(style.color)}>{style.label}</span>;
      return <span style={statusBadgeStyle(statusDraft)}>{displayValue}</span>;
    }
    if (isConditionHistoryField(field)) {
      const style = CONDITION_STATUS_STYLE_MAP[String(val).trim()] || CONDITION_STATUS_STYLE_MAP[String(val).trim().toUpperCase()];
      if (style) return <span style={statusBadgeStyle(style.color)}>{style.label}</span>;
      return <span style={statusBadgeStyle(statusDraft)}>{displayValue}</span>;
    }
    return (
      <span title={displayValue} style={{ minWidth: 0, color: textPrimary, fontWeight: fontWeightMedium, overflowWrap: 'anywhere' }}>
        {displayValue}
      </span>
    );
  };

  useEffect(() => {
    if (!historyOpen || !historyTarget) return;
    // historyReloadToken: nút "Tìm kiếm" làm token đổi → effect chạy lại để tải lại lịch sử theo bộ lọc
    void historyReloadToken;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setHistoryLoading(true);
      setLoadingMoreHistory(false);
      setHasMoreHistory(true);
      setHistoryRecords([]);
      setHistoryPage(0);
      try {
        const hist = await radarStationApproval.getHistory(historyTarget.id, 0, HISTORY_PAGE_SIZE, {
          keyword: historySearch,
          fromDate: historyDateFrom,
          toDate: historyDateTo,
        });
        if (cancelled) return;
        const items = hist || [];
        setHistoryRecords(items);
        setHasMoreHistory(items.length === HISTORY_PAGE_SIZE);
      } catch { if (!cancelled) toast.error('Không thể tải lịch sử'); } finally { if (!cancelled) setHistoryLoading(false); }
    }, historySearch.trim() ? 300 : 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [historyOpen, historyTarget, historySearch, historyDateFrom, historyDateTo, historyReloadToken]);

  const loadMoreHistory = async () => {
    if (!historyTarget || historyLoading || loadingMoreHistory || !hasMoreHistory) return;
    setLoadingMoreHistory(true);
    try {
      const nextPage = historyPage + 1;
      const hist = await radarStationApproval.getHistory(historyTarget.id, nextPage, HISTORY_PAGE_SIZE, {
        keyword: historySearch,
        fromDate: historyDateFrom,
        toDate: historyDateTo,
      });
      if (hist && hist.length > 0) setHistoryRecords((prev) => [...prev, ...hist]);
      setHistoryPage(nextPage);
      setHasMoreHistory((hist || []).length === HISTORY_PAGE_SIZE);
    } catch { /* ignore */ } finally { setLoadingMoreHistory(false); }
  };

  const handleHistoryScroll = (e: any) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) loadMoreHistory();
  };

  const renderHistoryTimeline = (records: HistoryEntry[]) => {
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...records].sort((a, b) => new Date(historyTimestamp(b) || 0).getTime() - new Date(historyTimestamp(a) || 0).getTime());
    const q = historySearch.toLowerCase().trim();

    const isUpdateAction = (status: string | undefined, reason?: string | undefined) => {
      const s = String(status || '').toUpperCase();
      const r = String(reason || '').toLowerCase();
      return s === 'UPDATED' || s === 'UPDATE' || s === 'EDIT' || s === 'ATTACHMENT_UPLOADED' || s === 'ATTACHMENT_DELETED'
        || r.includes('cập nhật') || r.includes('chỉnh sửa') || r.includes('tải lên') || r.includes('xóa tệp') || r.includes('xóa tài liệu');
    };

    const groups: Array<{ tsSec: number; ts: string; actor: string; status?: string; approvalLevel?: string; items: HistoryEntry[] }> = [];
    for (const r of sorted) {
      const ts = historyTimestamp(r);
      const sec = ts ? toSec(ts) : 0;
      const prev = groups[groups.length - 1];
      const actor = historyActor(r);
      const isBothUpdate = prev && isUpdateAction(prev.status, prev.items[0]?.reason) && isUpdateAction(r.status, r.reason);
      const isSameGroup = prev && prev.tsSec === sec && prev.actor === actor && (prev.status === r.status || isBothUpdate);
      if (isSameGroup) {
        prev.items.push(r);
      } else {
        groups.push({ tsSec: sec, ts, actor, status: r.status, approvalLevel: r.approvalLevel, items: [r] });
      }
    }

    if (groups.length === 0) return (
      <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
        <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
        <div style={{ color: textTertiary, fontSize: fontSizeMd }}>{q || historyDateFrom || historyDateTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div>
      </div>
    );

    return (
      <div>{groups.map((g, gi) => {
        const changes = deduplicateAttachmentHistoryChanges(g.items.flatMap((item) => historyChangeRows(item))).sort((a, b) => {
          const ia = HISTORY_FIELD_ORDER.indexOf(a.field);
          const ib = HISTORY_FIELD_ORDER.indexOf(b.field);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        });
        const rawUnit = g.items[0]?.orgUnitName;
        const unitName = rawUnit && rawUnit !== '—' ? rawUnit : '—';
        const informationTitle = 'Thông tin thay đổi:';
        const formatHistoryValue = (fn: string, raw: string | null) => {
          if (raw === null || raw === '(null)' || raw === '') return null;
          const t = raw.trim();
          if (t.startsWith('[') && t.endsWith(']')) {
            if (t === '[]') return 'Không có';
            const parts = t.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
            return `${parts.length} mục`;
          }
          return historyFieldValue(fn, raw);
        };
        if (changes.length === 0) return null;
        const actionMeta = resolveHistoryActionMeta(g.items[0]);
        return (
          <div
            key={gi}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(310px, 0.38fr) minmax(0, 1fr)',
              gap: spaceLg,
              alignItems: 'start',
              marginBottom: gi < groups.length - 1 ? spaceMd : 0,
            }}
          >
            <div style={{ minWidth: 0, paddingTop: spaceXs }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: spaceSm, marginBottom: spaceXs }}>
                <Typography.Text style={{ display: 'block', fontSize: fontSizeLg - 1, color: textPrimary, fontWeight: fontWeightBold, lineHeight: 1.5, whiteSpace: 'nowrap' }}>
                  {g.ts ? fmtTime(g.ts) : '—'}
                </Typography.Text>
                <span style={{ flexShrink: 0 }}>
                  <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: actionMeta.bg, color: actionMeta.color, whiteSpace: 'nowrap' }}>
                    {actionMeta.label}
                  </span>
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: spaceXs }}>
                <Typography.Text style={{ display: 'block', fontSize: fontSizeSm + 1, color: textSecondary, fontWeight: fontWeightMedium, lineHeight: 1.4 }}>
                  Người cập nhật: <span style={{ color: textPrimary, fontWeight: fontWeightBold }}>{g.actor || '—'}</span>
                </Typography.Text>
                <Typography.Text style={{ display: 'block', fontSize: fontSizeSm + 1, color: textSecondary, fontWeight: fontWeightMedium, lineHeight: 1.4 }}>
                  Đơn vị: <span style={{ color: textPrimary }}>{unitName}</span>
                </Typography.Text>
              </div>
            </div>

            <div style={{ position: 'relative', minWidth: 0, background: surfacePage, borderRadius: radiusSm, padding: `${spaceMd}px ${spaceLg}px`, paddingLeft: spaceLg, overflow: 'hidden', border: `1px solid ${borderDefault}` }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: spaceXs, background: `linear-gradient(180deg, ${actionMeta.color} 0%, ${actionMeta.color}40 100%)` }} />
              <Typography.Text style={{ display: 'block', color: colors.sidebarBg, fontSize: fontSizeMd, fontWeight: fontWeightBold, marginBottom: spaceSm }}>
                {informationTitle}
              </Typography.Text>

              {(() => {
                const isCoordField = (f: string, v: string | null | undefined): boolean => {
                  const nk = normalizeHistoryKey(f);
                  if (isCoordinatesHistoryField(f) || nk.includes('toa do') || nk.includes('coordinates')) return true;
                  if (!v) return false;
                  const sv = String(v).trim().toUpperCase();
                  return sv.startsWith('POINT') || sv.startsWith('LINESTRING') || sv.startsWith('POLYGON');
                };

                const renderHistoryContent = (field: string, val: string | null) => {
                  if (val === null || val === undefined || val === '—' || val === '') {
                    return <span style={{ color: textTertiary }}>—</span>;
                  }
                  if (isCoordField(field, val)) {
                    return renderCoordinatesDisplay(val);
                  }
                  const str = String(val).trim();
                  if (str.includes(',') && str.length > 25) {
                    const items = str.split(',').map((s) => s.trim()).filter(Boolean);
                    if (items.length > 1) {
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                          {items.map((item, idx) => (
                            <div key={idx} style={{ color: textPrimary, fontWeight: fontWeightMedium, lineHeight: '20px', wordBreak: 'break-word' }}>
                              {item}
                            </div>
                          ))}
                        </div>
                      );
                    }
                  }
                  return renderHistoryValueTag(field, val);
                };

                const listFields = new Set<string>();
                changes.forEach((c) => {
                  if (isListDeltaField(c.field)) {
                    const ov = typeof c.oldValue === 'string' ? c.oldValue.trim() : '';
                    const nv = typeof c.newValue === 'string' ? c.newValue.trim() : '';
                    if (ov.startsWith('[') || nv.startsWith('[')) {
                      listFields.add(normalizeHistoryKey(c.field || ''));
                    }
                  }
                });

                const dedupedChanges = changes.filter((c) => {
                  if (isListDeltaField(c.field)) {
                    const normKey = normalizeHistoryKey(c.field || '');
                    if (listFields.has(normKey)) {
                      const ov = typeof c.oldValue === 'string' ? c.oldValue.trim() : '';
                      const nv = typeof c.newValue === 'string' ? c.newValue.trim() : '';
                      if (!ov.startsWith('[') && !nv.startsWith('[')) {
                        return false;
                      }
                    }
                  }
                  return true;
                });

                const uniqueChangesMap = new Map<string, { field: string; oldValue: string | null; newValue: string | null }>();
                dedupedChanges.forEach((c) => {
                  const key = `${c.field}::${c.oldValue}::${c.newValue}`;
                  if (!uniqueChangesMap.has(key)) {
                    uniqueChangesMap.set(key, c);
                  }
                });

                const validChanges = Array.from(uniqueChangesMap.values()).filter((c) => {
                  if (!c.field && !c.oldValue && !c.newValue) return false;
                  const ov = formatHistoryValue(c.field, c.oldValue);
                  const nv = formatHistoryValue(c.field, c.newValue);
                  if (ov == null && nv == null) return false;
                  if (ov !== null && nv !== null && String(ov).trim() === String(nv).trim()) return false;
                  return true;
                });
                const reasons = g.items.map((i) => i.reason || i.note).filter(Boolean);

                if (validChanges.length > 0) {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spaceSm }}>
                      {validChanges.map((change, ri: number) => {
                        const fn = change.field;
                        const ov = formatHistoryValue(fn, change.oldValue);
                        const nv = formatHistoryValue(fn, change.newValue);

                        if (isListDeltaField(fn)) {
                          const delta = parseListDelta(ov, nv);
                          const rows: Array<{ label: string; oldVal: React.ReactNode; arrow: boolean; newVal: React.ReactNode }> = [];

                          delta.modifiedPairs.forEach((p, idx) => {
                            rows.push({
                              label: idx === 0 && rows.length === 0 ? (fn ? `${historyFieldName(fn)}:` : '—') : '',
                              oldVal: p.oldV,
                              arrow: true,
                              newVal: p.newV,
                            });
                          });

                          delta.removed.forEach((r) => {
                            rows.push({
                              label: rows.length === 0 ? (fn ? `${historyFieldName(fn)}:` : '—') : '',
                              oldVal: r,
                              arrow: true,
                              newVal: <span style={{ color: textTertiary }}>—</span>,
                            });
                          });

                          delta.added.forEach((a) => {
                            rows.push({
                              label: rows.length === 0 ? (fn ? `${historyFieldName(fn)}:` : '—') : '',
                              oldVal: <span style={{ color: textTertiary }}>—</span>,
                              arrow: true,
                              newVal: a,
                            });
                          });

                          if (rows.length === 0) {
                            rows.push({
                              label: fn ? `${historyFieldName(fn)}:` : '—',
                              oldVal: ov || '—',
                              arrow: true,
                              newVal: nv || '—',
                            });
                          }

                          return (
                            <Fragment key={`${fn}-${ri}`}>
                              {rows.map((row, rIdx) => (
                                <div key={rIdx} style={{ display: 'grid', gridTemplateColumns: '170px minmax(100px, 1fr) 24px minmax(100px, 1fr)', alignItems: 'flex-start', gap: spaceSm, fontSize: fontSizeMd, lineHeight: 1.6, padding: '3px 0' }}>
                                  <div style={{ fontWeight: fontWeightMedium, color: textSecondary, overflowWrap: 'break-word' }}>{row.label}</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflowWrap: 'break-word', color: textPrimary }}>
                                    {row.oldVal}
                                  </div>
                                  <div style={{ color: textTertiary, textAlign: 'center', fontWeight: fontWeightBold, userSelect: 'none', paddingTop: 2 }}>
                                    {row.arrow ? '→' : ''}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflowWrap: 'break-word', color: textPrimary }}>
                                    {row.newVal}
                                  </div>
                                </div>
                              ))}
                            </Fragment>
                          );
                        }

                        return (
                          <div key={`${fn}-${ri}`} style={{ display: 'grid', gridTemplateColumns: '170px minmax(100px, 1fr) 24px minmax(100px, 1fr)', alignItems: 'flex-start', gap: spaceSm, fontSize: fontSizeMd, lineHeight: 1.6, padding: '3px 0' }}>
                            <div style={{ fontWeight: fontWeightMedium, color: textSecondary, overflowWrap: 'break-word' }}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflowWrap: 'break-word' }}>
                              {renderHistoryContent(fn, ov)}
                            </div>
                            <div style={{ color: textTertiary, textAlign: 'center', fontWeight: fontWeightBold, userSelect: 'none', paddingTop: 2 }}>→</div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflowWrap: 'break-word' }}>
                              {renderHistoryContent(fn, nv)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                if (reasons.length > 0) {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
                      {reasons.map((r: string, ri: number) => (
                        <div key={ri} style={{ fontSize: fontSizeMd, color: textPrimary }}>
                          {r}
                        </div>
                      ))}
                    </div>
                  );
                }

                return <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd }}>Không có thông tin chi tiết</Typography.Text>;
              })()}
            </div>
          </div>
        );
      })}</div>
    );
  };

  // ── JSX ─────────────────────────────────────────────────────────
  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader
        breadcrumb={[{ label: 'KCHT hàng hải' }, { label: 'Quản lý trạm radar' }]}
        actions={headerActions}
      />

      <FilterTableLayout
        filterContent={filterContent}
        statusTabs={statusTabs}
        onStatusTabChange={handleTabChange}
        onFilterApply={handleFilterApply}
        onFilterReset={handleFilterReset}
        filterCollapsed={filterCollapsed}
        onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
        loading={isLoading}
        error={isError}
        onRetry={() => void fetchData()}
      >
        <DataTable
          columns={columns}
          dataSource={tableData}
          rowKey="id"
          rowActions={rowActions}
          scroll={{ x: 'max-content' }}
        />
        <Pagination
          total={total}
          current={page}
          pageSize={pageSize}
          onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
        />
      </FilterTableLayout>

      {/* ── Create / Edit / Detail Drawer ─────────────────────────── */}
      <AppDrawer
        title={
          <span style={drawerTitleStyle}>
            {isDetailMode
              ? `Chi tiết trạm radar${detailRecord ? ` — ${detailRecord.stationName}` : ''}`
              : editingRecord
                ? `Chỉnh sửa — ${editingRecord.stationName || editingRecord.code}`
                : 'Thêm mới trạm radar'}
          </span>
        }
        open={drawerVisible}
        destroyOnHidden
        onClose={closeDrawer}
        footer={
          isDetailMode ? null : editingRecord ? (
            <>
              <Button type="primary" onClick={() => handleSubmit('save')} loading={submitting} style={primaryButtonStyle}>
                Cập nhật
              </Button>
              {editingCanResubmit && (
                <>
                  <Button onClick={() => handleSubmit('submit')} loading={submitting} style={outlineButtonStyle}>
                    Lưu và gửi phê duyệt
                  </Button>
                  {hasPerm('radarstation:approvec2') && (
                    <Button type="primary" onClick={() => handleSubmit('approve')} loading={submitting} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>
                      Lưu và phê duyệt
                    </Button>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <Button onClick={() => handleSubmit('save')} loading={submitting} style={outlineButtonStyle}>
                Lưu tạm
              </Button>
              <Button type="primary" onClick={() => handleSubmit('submit')} loading={submitting} style={primaryButtonStyle}>
                Lưu và gửi phê duyệt
              </Button>
              {hasPerm('radarstation:approvec2') && (
                <Button type="primary" onClick={() => handleSubmit('approve')} loading={submitting} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>
                  Lưu và phê duyệt
                </Button>
              )}
            </>
          )
        }
      >
        {isDetailMode && detailRecord ? (
          <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={tabBarStyle} items={detailTabItems} />
        ) : (
          <>
            <style>{requiredMarkStyle}</style>
            <Form form={createForm} layout="vertical" initialValues={{ conditionStatus: '1' }}>
              <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={tabBarStyle}
                items={[
                  {
                    key: 'general',
                    label: 'Thông tin chung',
                    children: (
                      <div style={drawerFormScrollStyle}>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item {...labelProps('Mã radar')} style={formFieldStyle}>
                              <Input disabled value={editingRecord ? (editingRecord.code || '') : previewCode}
                                placeholder="Mã tự sinh tự động" style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="stationName" {...labelProps('Tên trạm radar')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng nhập tên trạm radar' }]}>
                              <Input placeholder="VD: Trạm radar Hòn Dấu" maxLength={255} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} style={formFieldStyle}>
                              <OrgUnitTreeSelect
                                organizations={orgOptions}
                                placeholder="Chọn đơn vị..."
                                disabled={!!editingRecord}
                                allowClear
                                showSearch
                                style={selectStyle}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="seaportId" {...labelProps('Thuộc cảng biển')} style={formFieldStyle}>
                              <Select placeholder="Chọn cảng biển..." allowClear showSearch optionFilterProp="label"
                                options={seaportOptions.map((p) => ({ value: p.id, label: p.portCode ? `${p.portCode} - ${p.portName || ''}` : p.portName || p.id }))}
                                style={selectStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="vtsSystemId" {...labelProps('Hệ thống VTS')} style={formFieldStyle}>
                              <Select placeholder="Chọn hệ thống VTS" allowClear showSearch optionFilterProp="label"
                                onChange={() => createForm.setFieldValue('vtsOperationCenterId', undefined)}
                                options={vtsOptions.map((vts) => ({ value: vts.id, label: vts.code ? `${vts.code} - ${vts.systemName || ''}` : vts.systemName || vts.id }))}
                                style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="vtsOperationCenterId" {...labelProps('Trung tâm điều hành VTS')} style={formFieldStyle}>
                              <Select placeholder="Chọn trung tâm điều hành VTS" allowClear showSearch optionFilterProp="label"
                                options={vtsOptions.map((vts) => ({ value: vts.id, label: vts.code ? `${vts.code} - ${vts.systemName || ''}` : vts.systemName || vts.id }))}
                                style={selectStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="operatingUnitId" {...labelProps('Đơn vị khai thác')} style={formFieldStyle}>
                              <OrgUnitTreeSelect
                                organizations={orgOptions}
                                placeholder="Chọn đơn vị khai thác"
                                allowClear
                                showSearch
                                style={selectStyle}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="provinceId" {...labelProps('Địa điểm (Tỉnh/TP)')} style={formFieldStyle}>
                              <Select placeholder="Chọn tỉnh/thành phố..." allowClear showSearch optionFilterProp="label"
                                options={VIETNAM_PROVINCE_OPTIONS} style={selectStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="location" {...labelProps('Địa điểm chi tiết')} style={formFieldStyle}
                              rules={[{ max: 500, message: 'Địa điểm chi tiết tối đa 500 ký tự' }]}>
                              <Input placeholder="Nhập địa điểm chi tiết..." maxLength={500} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="unitOfMeasure" {...labelProps('Đơn vị tính')} style={formFieldStyle}>
                              <Select placeholder="Chọn đơn vị tính" allowClear options={UNIT_OF_MEASURE_OPTIONS} style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="quantity" {...labelProps('Số lượng')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}>
                              <InputNumber min={0} max={99999} step={1} placeholder="Nhập số lượng" style={{ ...selectStyle, width: '100%' }} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="conditionStatus" {...labelProps('Tình trạng')} required style={formFieldStyle}
                              rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}>
                              <Select placeholder="Chọn tình trạng" options={CONDITION_STATUS_OPTIONS} style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="towerHeight" {...labelProps('Chiều cao tháp radar (m)')} style={formFieldStyle}>
                              <InputNumber min={0} step={0.1} placeholder="Nhập chiều cao tháp" style={{ ...selectStyle, width: '100%' }} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={12}>
                            <Form.Item name="radarRange" {...labelProps('Tầm hiệu lực radar')} style={formFieldStyle}>
                              <Input placeholder="Nhập tầm hiệu lực (tối đa 20 ký tự)" maxLength={20} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={formRowGutter}>
                          <Col span={24}>
                            <Form.Item name="note" {...labelProps('Ghi chú')} style={formFieldStyle}>
                              <Input.TextArea rows={3} maxLength={2000} placeholder="Nhập ghi chú (tối đa 2000 ký tự)" showCount style={textAreaStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    ),
                  },
                  {
                    key: 'location',
                    label: 'Thông tin vị trí',
                    children: (
                      <div style={{ paddingTop: 16 }}>
                        <div style={drawerGisControlBoxStyle}>
                          <Row gutter={[24, 0]} style={{ height: 68, marginBottom: 8 }}>
                            <Col span={12}>
                              <Form.Item
                                label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '18px' }}>Loại đối tượng</span>}
                                name="geometryType"
                                style={{ marginBottom: 0 }}
                              >
                                <Select
                                  placeholder="Chọn loại đối tượng"
                                  allowClear
                                  options={[{ value: 'POINT', label: 'Đối tượng điểm' }, { value: 'LINE', label: 'Đối tượng đường' }, { value: 'POLYGON', label: 'Đối tượng vùng' }]}
                                  style={{ ...selectStyle, height: 38 }}
                                  onChange={(val) => {
                                    createForm.setFieldValue('geometryType', val);
                                    setGeometryTypeState(val || 'POINT');
                                    if (val) {
                                      setCoordinateList((prev) => adjustCoordinateListForGeometry(prev, val));
                                    } else {
                                      createForm.setFieldValue('mapIcon', undefined);
                                      setCoordinateList([{ latitude: null, longitude: null }]);
                                    }
                                  }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '18px' }}>Biểu tượng</span>}
                                name="mapIcon"
                                style={{ marginBottom: 0 }}
                              >
                                <Select
                                  placeholder="Chọn biểu tượng bản đồ"
                                  allowClear
                                  showSearch
                                  optionFilterProp="label"
                                  disabled={!geometryTypeState}
                                  style={{ ...selectStyle, height: 38 }}
                                >
                                  {symbols.map((sym) => (
                                    <Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}>
                                      <Space size={6} style={{ display: 'inline-flex', alignItems: 'center' }}>
                                        {sym.image ? (
                                          <img
                                            src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`}
                                            alt={sym.name}
                                            style={{ width: 16, height: 16, objectFit: 'contain', verticalAlign: 'middle' }}
                                          />
                                        ) : (
                                          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: actionPrimary }} />
                                        )}
                                        <span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span>
                                      </Space>
                                    </Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={[24, 0]} style={{ height: 68, marginBottom: 8 }}>
                            <Col span={12}>
                              <Form.Item
                                label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '18px' }}>Hệ quy chiếu</span>}
                                style={{ marginBottom: 0 }}
                              >
                                <Input value="WGS 84 / VN-2000" disabled style={{ ...readonlyInputStyle, borderRadius: radiusPill, height: 38 }} />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '18px' }}>Quy tắc hiển thị</span>}
                                style={{ marginBottom: 0 }}
                              >
                                <Input value="Độ, phút, giây (DMS)" disabled style={{ ...readonlyInputStyle, borderRadius: radiusPill, height: 38 }} />
                              </Form.Item>
                            </Col>
                          </Row>
                          <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32, boxSizing: 'border-box' }}>
                            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tọa độ</span>
                            <Space>
                              <Button
                                icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
                                onClick={() => setGisFormModalOpen(true)}
                                style={{ borderRadius: radiusPill, height: 32, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 6, borderColor: actionPrimary, color: actionPrimary }}
                              >
                                Chọn vị trí trên bản đồ
                              </Button>
                              {geometryTypeState !== 'POINT' && coordinateList.length > 0 && (
                                <Button
                                  type="primary"
                                  icon={<PlusOutlined />}
                                  onClick={() => setCoordinateList((p) => [...p, { latitude: null, longitude: null }])}
                                  style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 32 }}
                                >
                                  Thêm tọa độ
                                </Button>
                              )}
                            </Space>
                          </div>
                        </div>
                        <DetailTable
                          scrollY={DRAWER_TABLE_SCROLL_Y.withGisForm}
                          dataSource={(geometryTypeState === 'POINT' ? coordinateList.slice(0, 1) : coordinateList).map((c, i) => ({ ...c, _idx: i }))}
                          emptyText="Chưa có tọa độ nào"
                          rowKey="_idx"
                          columns={[
                            { title: 'STT', key: 'stt', width: 60, align: 'center', render: (_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span> },
                            { title: 'Vĩ độ (N)', key: 'lat', render: (_: any, r: any) => renderDms(r._idx, 'lat', r) },
                            { title: 'Kinh độ (E)', key: 'lng', render: (_: any, r: any) => renderDms(r._idx, 'lng', r) },
                            {
                              title: '',
                              key: 'actions',
                              width: 50,
                              align: 'center' as const,
                              render: (_: any, r: any) => {
                                const geom = (geometryTypeState || 'POINT').toUpperCase();
                                if (geom === 'POINT') return null;
                                const minCount = geom.includes('LINE') ? 2 : (geom.includes('POLYGON') ? 3 : 1);
                                const canDelete = coordinateList.length > minCount;
                                if (!canDelete) return null;
                                return (
                                  <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                                    style={{ width: 32, height: 32, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => setCoordinateList((p) => p.filter((_, idx) => idx !== r._idx))}
                                    title="Xóa tọa độ"
                                  />
                                );
                              },
                            },
                          ]}
                        />
                      </div>
                    ),
                  },
                  {
                    key: 'files',
                    label: 'File đính kèm',
                    children: (
                      <InfrastructureAttachmentTab
                        attachments={uploadedFiles.map((f: UploadFile & { uploadedBy?: string; uploadedAt?: string }) => ({
                          id: f.uid,
                          fileName: f.name,
                          fileSize: f.size,
                          uploadedByName: userOptions.find((u) => u.value === f.uploadedBy)?.label,
                          uploadedDate: f.uploadedAt,
                        }))}
                        onUpload={handleAddAttachmentFile}
                        onDelete={removeUploadedFile}
                        onDownload={handleDownloadAttachment}
                      />
                    ),
                  },
                ]}
              />
            </Form>
          </>
        )}
      </AppDrawer>

      {/* ── GIS Picker Modal (chuẩn /vts-operation-center: chọn tọa độ trên bản đồ chuyên dụng) ── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeMd }}>
              Chọn vị trí & tọa độ trên bản đồ chuyên dụng
            </span>
          </div>
        }
        open={gisFormModalOpen}
        onCancel={() => setGisFormModalOpen(false)}
        destroyOnHidden
        width="90vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={[
          <Button
            key="ok"
            type="primary"
            onClick={() => {
              setGisFormModalOpen(false);
              toast.success('Đã xác nhận vị trí từ bản đồ');
            }}
            style={{ ...primaryButtonStyle, height: 36, borderRadius: radiusPill }}
          >
            Xác nhận tọa độ
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <GisLocationSelector
            inline
            height={560}
            value={{
              geometryType: geometryTypeState || 'POINT',
              coordinates: serializeCoordinatesToWkt(coordinateList, geometryTypeState || 'POINT'),
              symbolId: createForm.getFieldValue('mapIcon') || undefined,
            }}
            defaultGeometryType="POINT"
            onChange={(val) => {
              if (!val) return;
              const pts = parseWktToCoordinates(val.coordinates);
              const geom = val.geometryType || 'POINT';
              setGeometryTypeState(geom);
              setCoordinateList(adjustCoordinateListForGeometry(pts, geom));
              createForm.setFieldsValue({
                geometryType: geom,
                mapIcon: val.symbolId || createForm.getFieldValue('mapIcon'),
              });
            }}
          />
        </div>
      </Modal>

      {/* ── Detail GIS Modal (Xem vị trí trên bản đồ — readonly, chuẩn CHK) ── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeMd }}>
              Xem vị trí trên bản đồ chuyên dụng
            </span>
          </div>
        }
        open={detailMapOpen}
        onCancel={() => setDetailMapOpen(false)}
        destroyOnHidden
        width="90vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={null}
      >
        {detailRecord && (
          <div style={{ padding: '8px 0' }}>
            <GisLocationSelector
              inline
              height={560}
              disabled
              value={{
                geometryType: detailRecord.geometryType || 'POINT',
                coordinates: serializeCoordinatesToWkt(detailCoordRows, detailRecord.geometryType || 'POINT'),
              }}
              defaultGeometryType="POINT"
            />
          </div>
        )}
      </Modal>

      {/* ── Delete Confirmation Modal ────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Xác nhận xóa trạm radar</span>}
        open={deleteModalOpen}
        onCancel={() => { setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText(''); }}
            style={outlineButtonStyle}>Hủy</Button>,
          <Button key="delete" type="primary" danger onClick={confirmDelete} style={dangerButtonStyle}>Xác nhận xóa</Button>,
        ]}
        width={480}
      >
        <div style={confirmModalBodyStyle}>
          <p style={{ marginBottom: spaceFormField }}>
            Vui lòng nhập <strong>tên trạm radar</strong> hoặc gõ <strong>"XÓA"</strong> để xác nhận xóa.
          </p>
          {deletingRecord && (
            <p style={{ marginBottom: spaceFormField }}>
              Trạm radar: <strong style={{ color: textPrimary }}>{deletingRecord.stationName || deletingRecord.code}</strong>
            </p>
          )}
          <Input placeholder="Nhập tên trạm radar hoặc XÓA" value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)} onPressEnter={confirmDelete}
            style={inputStyle} autoFocus />
        </div>
      </Modal>

      {/* ── Submit Approval Modal ────────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Gửi duyệt trạm radar</span>}
        open={submitModalOpen}
        onCancel={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
            style={outlineButtonStyle}>Hủy</Button>,
          <Button key="submit" type="primary" onClick={confirmSubmit} style={primaryButtonStyle}>Gửi duyệt</Button>,
        ]}
        width={480}
      >
        <div style={confirmModalBodyStyle}>
          <p>
            Xác nhận gửi <strong>{submittingRecord?.stationName || submittingRecord?.code || ''}</strong> để phê duyệt?
          </p>
        </div>
      </Modal>

      {/* ── Reject Modal ─────────────────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Từ chối phê duyệt</span>}
        open={rejectModalVisible}
        onCancel={() => { setRejectModalVisible(false); setRejectTarget(null); setRejectReason(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setRejectModalVisible(false); setRejectTarget(null); setRejectReason(''); }}
            style={outlineButtonStyle}>Hủy</Button>,
          <Button key="reject" type="primary" danger onClick={confirmReject} style={dangerButtonStyle}>Xác nhận từ chối</Button>,
        ]}
        width={480}
      >
        <div style={confirmModalBodyStyle}>
          <p style={{ marginBottom: spaceFormField }}>
            Vui lòng nhập lý do từ chối cho <strong>{rejectTarget?.stationName || rejectTarget?.code || ''}</strong>:
          </p>
          <Input.TextArea placeholder="Nhập lý do từ chối (tối thiểu 10, tối đa 500 ký tự)..." value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)} rows={3} maxLength={500} showCount
            style={rejectReasonStyle} />
        </div>
      </Modal>

      {/* ── History Drawer (chuẩn /vts-operation-center) ─────────── */}
      <Drawer
        size={960}
        placement="right"
        open={historyOpen}
        onClose={() => { setHistoryOpen(false); setHistoryTarget(null); setHistoryRecords([]); }}
        closable={false}
        extra={<Button type="text" aria-label="Đóng lịch sử thay đổi" onClick={() => { setHistoryOpen(false); setHistoryTarget(null); setHistoryRecords([]); }} style={drawerCloseBtnStyle}>✕</Button>}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '12px 24px 12px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
        }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm} style={{ alignItems: 'center' }}>
              <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
              <span style={drawerTitleStyle}>
                {historyTarget ? `Lịch sử thay đổi — ${historyTarget.stationName || historyTarget.code || ''}` : 'Lịch sử thay đổi'}
              </span>
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: radiusSm, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>
                {`Đã tải ${historyRecords.length}`}
              </span>
            </Space>
          </div>
        }
      >
        <style>{`.history-dt-popup .ant-picker-now-btn { color: ${actionPrimary} !important; }`}</style>
        <div style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
            <Input
              placeholder="Tìm kiếm nội dung thay đổi..."
              allowClear
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              onPressEnter={() => setHistoryReloadToken((t) => t + 1)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <DatePicker.RangePicker
              {...getRangePickerProps({
                value: rangeValue(historyDateFrom, historyDateTo),
                onChange: (dates: [Dayjs | null, Dayjs | null] | null) => {
                  if (!dates || (!dates[0] && !dates[1])) {
                    setHistoryDateFrom('');
                    setHistoryDateTo('');
                  } else {
                    setHistoryDateFrom(dates[0] ? dates[0].startOf('day').format('YYYY-MM-DDTHH:mm:ss') : '');
                    setHistoryDateTo(dates[1] ? dates[1].endOf('day').format('YYYY-MM-DDTHH:mm:ss') : '');
                  }
                },
                style: { ...inputStyle, width: 280 },
              })}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              loading={historyLoading}
              onClick={() => setHistoryReloadToken((t) => t + 1)}
              style={primaryButtonStyle}
            >
              Tìm kiếm
            </Button>
          </div>
        </div>
        {/* Cuộn tới đáy thì tải thêm một trang nhật ký. Không lọc lại ở client:
            từ khóa và khoảng ngày đã được áp ở server nên lọc lần nữa chỉ làm
            rơi mất bản ghi của các trang chưa tải. */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} onScroll={handleHistoryScroll}>
          {historyLoading && historyRecords.length === 0 ? (
            <LoadingSkeleton rows={5} />
          ) : (
            <>
              {renderHistoryTimeline(historyRecords)}
              {loadingMoreHistory && (
                <div style={{ padding: spaceMd, textAlign: 'center', color: textTertiary, fontSize: fontSizeMd }}>
                  Đang tải thêm…
                </div>
              )}
            </>
          )}
        </div>
      </Drawer>

      {/* ── Approval Modal (CHK standard) ─────────────────────── */}
      <ApprovalModal
        open={approveModalOpen}
        level={approveLevel}
        loading={submitting}
        onConfirm={confirmApprove}
        onCancel={closeApproveModal}
      />
    </div>
    </ThemeTokenProvider>
  );
}
