import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import {
  AuditOutlined,
  BankOutlined,
  DeleteOutlined,
  DownOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  HistoryOutlined,
  PlusOutlined,
  RightOutlined,
  SearchOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Tabs,
  Typography,
} from 'antd';
import InputNumber from '../../components/shared/LocalizedInputNumber';
import EmptyState from '../../components/EmptyState';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { DataTable, FilterTableLayout, ScreenHeader, type DataTableColumn } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import { OrgUnitTreeSelect, FormOrgUnitTreeSelect, normalizeSearchText, resolveDefaultOrgUnitId, resolveOrgSubtreeIds } from '../../components/org-unit';

import { AppDrawer } from '../../components/shared/AppDrawer';
import ApprovalModal from '../../components/shared/ApprovalModal';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import DetailTable from '../../components/shared/DetailTable';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import { PaginatedHistoryList } from '../../components/shared/HistoryPagination';
import { formLabelProps as labelProps } from '../../components/shared/formLabel';
import { useGisEmbeddedAction } from '../../hooks/useGisEmbeddedAction';
import toast, { message } from '../../components/ToastNotification';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import KchtFormFooter from '../../components/kcht/KchtFormFooter';
import { isCucLevelUser } from '../../hooks/useKchtPermissions';
import { DEFAULT_IGNORED_FIELDS } from '../../utils/changeHistoryRenderer';
import { isAttachmentField, mergeAttachmentHistoryChanges } from '../../utils/historyAttachmentDedup';
import * as themeTokenChk from '../../themetokenchk';
import {
  DRAWER_WIDTH,
  actionPrimary,
  borderDefault,
  cellSubtitleStyle,
  cellTitleStyle,
  colors,
  drawerFooterStyle,
  drawerTitleStyle,
  fontSizeLg,
  fontSizeMd,
  fontSizeSm,
  fontWeightBold,
  fontWeightMedium,
  formFieldStyle,
  formRowGutter,
  getDatePickerProps,
  getRangePickerProps,
  getSidebarDatePickerProps,
  historyAccentBarStyle,
  historyArrowStyle,
  historyChangeRowStyle,
  historyCreateRowStyle,
  historyFieldLabelStyle,
  historyGroupGridStyle,
  historyInfoCardStyle,
  historyInfoTitleStyle,
  historyMetaRowStyle,
  historyNewValueStyle,
  historyOldValueStyle,
  historyTimeStyle,
  inputStyle,
  outlineButtonStyle,
  primaryButtonStyle,
  radiusMd,
  radiusPill,
  readonlyInputStyle,
  requiredMarkStyle,
  selectStyle,
  spaceFormField,
  spaceMd,
  spaceSm,
  spaceXl,
  spaceXs,
  statusAttention,
  statusBadgeStyle,
  statusCritical,
  statusDraft,
  statusOperational,
  surfaceCard,
  textPrimary,
  textSecondary,
  textTertiary,
} from '../../themetokenchk';
import api from '../../services/api';
import {
  dikeRevetmentApproval,
  dikeRevetmentCRUD,
} from '../../services/dikeRevetmentService';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import type { Organization } from '../../services/organizationService';
import { organizationService } from '../../services/organizationService';
import { portCRUD } from '../../services/portService';
import type { Symbol as MapSymbol } from '../../services/symbolService';
import { symbolService } from '../../services/symbolService';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import type {
  CreateDikeRevetmentRequest,
  DikeRevetmentResponse,
  DikeRevetmentType,
  UpdateDikeRevetmentRequest,
} from '../../types/dikeRevetment';
import { DIKE_REVETMENT_STATUS_LABELS } from '../../types/dikeRevetment';
import { canDeleteApprovalRecord, canEditApprovalRecord } from '../../utils/approvalEditPolicy';
import {
  dmsToDd,
  parseWktToCoordinates,
  serializeCoordinatesToWkt,
  validateDmsCoordinates,
} from '../../utils/gisGeometry';
import { fmtInputNumber, fmtNum, normalizeSafeNumber } from '../../utils/numFmt';
import { NumberInputWithCount } from '../../components/shared/NumberInputWithCount';
import {
  decimalNumberRule,
  decimalNumberRuleSigned,
  getValueFromEvent20,
  getValueFromEvent20Signed,
  parseNumber20,
  parseNumber20Signed,
  safeDecimal,
  safeDecimalSigned,
} from '../../utils/numberRuleHelper';

const numberInputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };

// ── Field name translation (lịch sử thay đổi) ───────────────────────

const FIELD_LABELS: Record<string, string> = {
  code: 'Mã đê kè',
  dikeRevetmentName: 'Tên đê kè',
  dikeRevetmentType: 'Loại kết cấu công trình',
  orgUnitId: 'Đơn vị quản lý',
  seaportId: 'Cảng biển',
  location: 'Địa điểm (Tỉnh/TP)',
  locationDetail: 'Địa điểm chi tiết',
  operatingUnitId: 'Đơn vị vận hành',
  length: 'Chiều dài',
  height: 'Chiều cao',
  crestElevation: 'Cao trình đỉnh',
  surfaceMaterial: 'Vật liệu bề mặt',
  constructionDate: 'Thời điểm xây dựng',
  commissioningDate: 'Thời điểm đưa vào khai thác',
  lastMaintenanceYear: 'Năm bảo trì gần nhất',
  status: 'Tình trạng',
  coordinates: 'Tọa độ',
  geometryType: 'Loại đối tượng',
  mapSymbolId: 'Biểu tượng bản đồ',
  symbolId: 'Biểu tượng bản đồ',
  note: 'Ghi chú',
  'Tài liệu đính kèm': 'Tài liệu đính kèm',
  'File đính kèm': 'Tài liệu đính kèm',
  attachments: 'Tài liệu đính kèm',
  'Mã đê kè': 'Mã đê kè',
  'Tên đê kè': 'Tên đê kè',
  'Loại kết cấu công trình': 'Loại kết cấu công trình',
  'Loại đê kè': 'Loại kết cấu công trình',
  'Đơn vị quản lý': 'Đơn vị quản lý',
  'Cảng biển': 'Cảng biển',
  'Địa điểm (Tỉnh/TP)': 'Địa điểm (Tỉnh/TP)',
  'Địa điểm chi tiết': 'Địa điểm chi tiết',
  'Đơn vị vận hành': 'Đơn vị vận hành',
  'Đơn vị khai thác': 'Đơn vị vận hành',
  'Chiều dài': 'Chiều dài',
  'Chiều dài (m)': 'Chiều dài',
  'Chiều cao': 'Chiều cao',
  'Chiều cao (m)': 'Chiều cao',
  'Cao trình đỉnh': 'Cao trình đỉnh',
  'Cao trình đỉnh (m)': 'Cao trình đỉnh',
  'Vật liệu bề mặt': 'Vật liệu bề mặt',
  'Thời điểm xây dựng': 'Thời điểm xây dựng',
  'Thời điểm đưa vào khai thác': 'Thời điểm đưa vào khai thác',
  'Thời điểm đưa vào sử dụng': 'Thời điểm đưa vào khai thác',
  'Năm bảo trì gần nhất': 'Năm bảo trì gần nhất',
  'Tình trạng': 'Tình trạng',
  'Tọa độ': 'Tọa độ',
  'Tọa độ GIS': 'Tọa độ',
  'Loại đối tượng': 'Loại đối tượng',
  'Loại đối tượng (GIS)': 'Loại đối tượng',
  'Biểu tượng bản đồ': 'Biểu tượng bản đồ',
  'Biểu tượng': 'Biểu tượng bản đồ',
  'Ghi chú': 'Ghi chú',
};

const DIKE_REVETMENT_HISTORY_FIELD_ORDER = [
  'code',
  'dikeRevetmentName',
  'dikeRevetmentType',
  'orgUnitId',
  'seaportId',
  'location',
  'locationDetail',
  'operatingUnitId',
  'length',
  'height',
  'crestElevation',
  'surfaceMaterial',
  'constructionDate',
  'commissioningDate',
  'lastMaintenanceYear',
  'status',
  'coordinates',
  'geometryType',
  'mapSymbolId',
  'symbolId',
  'note',
  'Tài liệu đính kèm',
];

const historyFieldName = (fn: string): string => FIELD_LABELS[fn] || fn;

// Style cho thẻ phân nhóm (Section Card) đồng bộ với màn /berth
const sectionBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '14px 18px 10px 18px',
  marginBottom: 14,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: '1px solid #f1f5f9',
};

const sectionTitleStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd + 0.5,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

// ── History value rendering (chuẩn /vts-system + /vts-operation-center): WKT/raw → DMS/đẹp ──
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
    if (x < 35 && y > 50) { lat = x; lng = y; }
    return `${toDmsString(lat, true)}, ${toDmsString(lng, false)}`;
  }
  if (!isNaN(x)) return toDmsString(x, x <= 35 && x >= -35);
  return xStr;
}

function parseCoordinatesPoints(raw: string | null): { typeName?: string; points: Array<{ x: string; y: string; index: number }> } | null {
  if (!raw || raw === '—' || raw === 'Chưa có' || raw === '(null)' || raw === '(trống)') return null;
  const str = raw.trim();
  if (/^(Đường|Vùng|Điểm)\s+bản\s+đồ\s*\(\d+\s+điểm/i.test(str)) return { typeName: str, points: [] };
  let typeName = '';
  let inner = str;
  if (/^POINT\s*\(/i.test(str)) { typeName = 'Điểm'; inner = str.replace(/^POINT\s*\(/i, '').replace(/\)\s*$/, ''); }
  else if (/^LINESTRING\s*\(/i.test(str)) { typeName = 'Đường'; inner = str.replace(/^LINESTRING\s*\(/i, '').replace(/\)\s*$/, ''); }
  else if (/^LINE\s*\(/i.test(str)) { typeName = 'Đường'; inner = str.replace(/^LINE\s*\(/i, '').replace(/\)\s*$/, ''); }
  else if (/^POLYGON\s*\(\s*\(/i.test(str)) { typeName = 'Vùng'; inner = str.replace(/^POLYGON\s*\(\s*\(/i, '').replace(/\)\s*\)\s*$/, ''); }
  else if (/^MULTIPOINT\s*\(/i.test(str)) { typeName = 'Tập hợp điểm'; inner = str.replace(/^MULTIPOINT\s*\(/i, '').replace(/\)\s*$/, ''); }
  else if (str.startsWith('(') && str.endsWith(')')) { inner = str.slice(1, -1); }
  else { return null; }
  const pointStrings = inner.split(',').map((s) => s.trim()).filter(Boolean);
  if (pointStrings.length === 0) return null;
  const points = pointStrings.map((ps, idx) => {
    const clean = ps.replace(/[()]/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    return parts.length >= 2 ? { x: parts[0], y: parts[1], index: idx + 1 } : { x: clean, y: '', index: idx + 1 };
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs, width: '100%' }}>
      {parsed.typeName && (
        <span style={{ fontSize: fontSizeSm, fontWeight: fontWeightBold, color: actionPrimary }}>
          {parsed.typeName} ({parsed.points.length} điểm)
        </span>
      )}
      {parsed.points.map((pt) => (
        <div key={pt.index} style={{ fontSize: fontSizeSm, color: textPrimary, lineHeight: 1.5 }}>
          {parsed.points.length > 1 && <span style={{ color: textSecondary, marginRight: spaceXs }}>#{pt.index}:</span>}
          <span>{formatCoordPointDms(pt.x, pt.y)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Constants ────────────────────────────────────────────────────────

// 7 trạng thái chuẩn (approval-2-level-spec.md 3.1/3.10) — nhãn bám ApprovalStatusBadge
// (nguồn duy nhất), KHÔNG dùng mã legacy PROPOSED/REJECTED cho tab hay filter.
const STATUS_TAB_LIST = [
  { key: '', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: DIKE_REVETMENT_STATUS_LABELS.DRAFT, color: statusDraft },
  { key: 'PENDING_APPROVAL', label: DIKE_REVETMENT_STATUS_LABELS.PENDING_APPROVAL, color: actionPrimary },
  { key: 'APPROVED_LEVEL1', label: DIKE_REVETMENT_STATUS_LABELS.APPROVED_LEVEL1, color: statusAttention },
  { key: 'APPROVED', label: DIKE_REVETMENT_STATUS_LABELS.APPROVED, color: statusOperational },
  { key: 'REJECTED_LEVEL1', label: DIKE_REVETMENT_STATUS_LABELS.REJECTED_LEVEL1, color: statusCritical },
  { key: 'REJECTED_LEVEL2', label: DIKE_REVETMENT_STATUS_LABELS.REJECTED_LEVEL2, color: statusCritical },
  { key: 'ARCHIVED', label: 'Đã xóa', color: statusCritical },
];

const TAB_QUERY_MAP: Record<string, string | undefined> = {
  '': undefined,
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED_LEVEL1: 'APPROVED_LEVEL1',
  APPROVED: 'APPROVED',
  REJECTED_LEVEL1: 'REJECTED_LEVEL1',
  REJECTED_LEVEL2: 'REJECTED_LEVEL2',
  ARCHIVED: 'ARCHIVED',
};

export function isDikeRevetmentDeleted(record?: Partial<DikeRevetmentResponse> | null): boolean {
  if (!record) return false;
  return Boolean(
    record.deletedAt ||
    record.deletedBy ||
    record.approvalStatus === 'DELETED' ||
    record.approvalStatus === 'ARCHIVED'
  );
}

// Loại kết cấu công trình — khớp backend enum dike_revetment_type
const DIKE_REVETMENT_TYPE_OPTIONS = [
  { label: 'Đê chắn sóng', value: 'RIVER_DIKE' },
  { label: 'Đê chắn cát', value: 'SAND_DIKE' },
  { label: 'Kè hướng dòng', value: 'FLOW_GUIDE_REVETMENT' },
  { label: 'Kè bảo vệ bờ', value: 'BANK_PROTECTION_REVETMENT' },
  { label: 'Giao thông', value: 'TRAFFIC' },
  { label: 'Kè chắn sóng', value: 'WAVE_BREAK_REVETMENT' },
  { label: 'Kè chắn cát', value: 'SAND_BREAK_REVETMENT' },
];

const DIKE_REVETMENT_TYPE_MAP: Record<string, string> = {
  RIVER_DIKE: 'Đê sông',
  SAND_DIKE: 'Đê chắn cát',
  FLOW_GUIDE_REVETMENT: 'Kè hướng dòng',
  BANK_PROTECTION_REVETMENT: 'Kè bảo vệ bờ',
  TRAFFIC: 'Giao thông',
  WAVE_BREAK_REVETMENT: 'Kè chắn sóng',
  SAND_BREAK_REVETMENT: 'Kè chắn cát',
};

// Tình trạng hoạt động — khớp backend OperationalStatus (integer enum)
const OPERATIONAL_STATUS_OPTIONS = [
  { value: '1', label: 'Chưa khai thác/vận hành' },
  { value: '2', label: 'Đang khai thác/vận hành' },
  { value: '3', label: 'Dừng khai thác/vận hành' },
];

const OPERATIONAL_STATUS_STYLE_MAP: Record<string, { color: string; label: string }> = {
  '1': { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  '2': { color: statusOperational, label: 'Đang khai thác/vận hành' },
  '3': { color: statusCritical, label: 'Dừng khai thác/vận hành' },
};

function formatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try { return dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss'); } catch { return dateStr; }
}

function formatDateOnly(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try { return dayjs(dateStr).format('DD/MM/YYYY'); } catch { return dateStr; }
}

function formatYear(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  if (/^\d{4}$/.test(dateStr)) return dateStr;
  try { return dayjs(dateStr).format('YYYY'); } catch { return dateStr; }
}

// ── WKT helpers (chuẩn GIS /port) ────────────────────────────────
function serializeVerticesToWkt(pts: { lng: number; lat: number }[], geomType: string): string {
  const validPts = pts.filter((p) => p && typeof p.lng === 'number' && typeof p.lat === 'number' && !isNaN(p.lng) && !isNaN(p.lat));
  if (validPts.length === 0) return '';
  const type = (geomType || 'POINT').toUpperCase();
  if (type === 'POINT') {
    if (validPts.length === 1) {
      return `POINT(${validPts[0].lng.toFixed(6)} ${validPts[0].lat.toFixed(6)})`;
    }
    const coords = validPts.map((p) => `(${p.lng.toFixed(6)} ${p.lat.toFixed(6)})`).join(',');
    return `MULTIPOINT(${coords})`;
  } else if (type === 'LINE') {
    const coords = validPts.map((p) => `${p.lng.toFixed(6)} ${p.lat.toFixed(6)}`).join(', ');
    return `LINESTRING(${coords})`;
  } else if (type === 'POLYGON') {
    if (validPts.length < 3) return '';
    const list = [...validPts];
    list.push(validPts[0]);
    const coords = list.map((p) => `${p.lng.toFixed(6)} ${p.lat.toFixed(6)}`).join(', ');
    return `POLYGON((${coords}))`;
  }
  return '';
}

// ── WKT parse — chuẩn /vts-operation-center: chấp nhận tiền tố SRID, khoảng trắng sau keyword,
//    dạng MULTIPOINT/POINT lẫn nhau và lowercase; tránh mất giá trị 'Thông tin vị trí' khi chỉnh sửa ──
function parseWktToVertices(wkt: string, geomType: string): { lng: number; lat: number }[] {
  if (!wkt) return [];
  try {
    const cleaned = String(wkt).trim().replace(/^SRID=\d+\s*;/i, '').trim();
    const upper = cleaned.toUpperCase();
    const isPolygon = upper.startsWith('POLYGON');
    const isLine = upper.startsWith('LINESTRING');
    const isPoint = upper.includes('POINT');
    const type = isPolygon ? 'POLYGON' : isLine ? 'LINE' : isPoint ? 'POINT' : (geomType || '').toUpperCase();
    const pairs = Array.from(cleaned.matchAll(/(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s+(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g));
    if (pairs.length === 0) return [];
    const pts = pairs.map((m) => ({ lng: parseFloat(m[1]), lat: parseFloat(m[2]) }));
    if (type === 'POLYGON') {
      // Bỏ điểm đóng vòng trùng điểm đầu (chuẩn WKT)
      if (pts.length > 1 && pts[0].lng === pts[pts.length - 1].lng && pts[0].lat === pts[pts.length - 1].lat) {
        pts.pop();
      }
      return pts;
    }
    return pts;
  } catch (e) {
    console.warn('Sai định dạng WKT:', wkt, e);
  }
  return [];
}


const tabBarStyle: React.CSSProperties = {
  marginBottom: 0,
  paddingTop: 0,
  position: 'sticky',
  top: 0,
  zIndex: 1,
  background: surfaceCard,
};



// ── Component ────────────────────────────────────────────────────────

function ddToDms(dd: number | null | undefined): { d: number | null; m: number | null; s: number | null } {
  if (dd == null || isNaN(dd)) return { d: null, m: null, s: null };
  const abs = Math.abs(dd);
  let d = Math.floor(abs);
  let mFloat = (abs - d) * 60;
  if (mFloat > 59.999999999) { d += 1; mFloat = 0; }
  let m = Math.floor(mFloat);
  let sFloat = (mFloat - m) * 60;
  if (sFloat > 59.999999999) { m += 1; sFloat = 0; if (m >= 60) { m = 0; d += 1; } }
  let s = Math.round(sFloat * 100) / 100;
  if (s >= 60) { s = 0; m += 1; if (m >= 60) { m = 0; d += 1; } }
  return { d: d === 0 ? null : d, m: m === 0 ? null : m, s: s === 0 ? null : s };
}

const dmsUnitStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, height: 32, fontSize: fontSizeSm, color: textTertiary };
const dmsUnitEndStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, height: 32, borderRadius: '0 999px 999px 0', fontSize: fontSizeSm, color: textTertiary };

const renderDmsGroup = (
  dVal: number | null, mVal: number | null, sVal: number | null,
  maxDeg: number,
  onChange: (d: number | null, m: number | null, s: number | null) => void,
) => {
  const started = dVal != null || mVal != null || sVal != null;
  const inputs = [
    {
      key: 'd', base: 'Độ', value: dVal, max: maxDeg,
      radius: '999px 0 0 999px', unit: '°', unitStyle: dmsUnitStyle, basis: '1 0 108px', width: 108,
      step: 1, formatter: undefined,
      msg: started && dVal == null ? 'Độ bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(v, mVal ?? null, sVal ?? null),
    },
    {
      key: 'm', base: 'Phút', value: mVal, max: 59,
      radius: '0', unit: "'", unitStyle: dmsUnitStyle, basis: '1 0 108px', width: 108,
      step: 1, formatter: undefined,
      msg: started && mVal == null ? 'Phút bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(dVal ?? null, v, sVal ?? null),
    },
    {
      key: 's', base: 'Giây', value: sVal, max: 59.99,
      radius: '0', unit: '"', unitStyle: dmsUnitEndStyle, basis: '1.2 0 130px', width: 130,
      step: 0.01,
      formatter: fmtInputNumber,
      msg: started && sVal == null ? 'Giây bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(dVal ?? null, mVal ?? null, v),
    },
  ] as const;

  const inputRow = (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: 0 }}>
      {inputs.map((inp) => (
        <div key={inp.key} style={{ display: 'flex', flex: inp.basis, minWidth: 0, width: inp.width }}>
          <InputNumber
            value={inp.value}
            min={0}
            max={inp.max}
            step={inp.step}
            placeholder={inp.base}
            formatter={inp.formatter}
            status={inp.msg ? 'error' : undefined}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(raw) => inp.onEdit(raw == null ? null : Number(raw))}
            style={{ flex: 1, minWidth: 0, borderRadius: inp.radius, height: 32 }}
            controls={false}
          />
          <span style={inp.unitStyle}>{inp.unit}</span>
        </div>
      ))}
    </div>
  );

  const hasError = started && inputs.some((inp) => !!inp.msg);

  const messageRow = hasError ? (
    <div aria-live="polite" style={{ display: 'flex', alignItems: 'flex-start', width: '100%', minWidth: 0, marginTop: spaceXs, height: 14, lineHeight: '14px', overflow: 'hidden' }}>
      {inputs.map((inp) => (
        <div key={inp.key} style={{ flex: inp.basis, minWidth: 0, width: inp.width }}>
          {inp.msg && <span role="alert" style={{ color: statusCritical, fontSize: fontSizeSm, whiteSpace: 'nowrap' }}>{inp.msg}</span>}
        </div>
      ))}
    </div>
  ) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', minWidth: 0 }}>
      {inputRow}
      {messageRow}
    </div>
  );
};

export default function DikeRevetmentList() {
  const {
    action: embeddedAction,
    recordId: embeddedRecordId,
    isEmbeddedAction,
    closeEmbeddedAction,
  } = useGisEmbeddedAction();
  const embeddedOpenedRef = useRef<string | null>(null);
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  const currentUser = useAuthStore((s: any) => s.user);
  // Phê duyệt 2 cấp (M-1006): C1 = Cảng vụ/Chi cục, C2 = Cục — quyền theo cấp duyệt.
  const canApproveC1 = hasPerm('dikerevetment:approvec1');
  const canApproveC2 = hasPerm('dikerevetment:approvec2');
  const canSubmitForApproval = hasPerm('dikerevetment:update');
  // Đơn vị cha/Cục (scope_all, admin) được chọn đơn vị con khi thêm mới; tài khoản thường bị khóa theo đơn vị của mình
  const isElevatedOrg = hasPerm('orgunit:scope_all') || hasPerm('*')
    || currentUser?.role === 'ROLE_SYSTEM_ADMIN' || currentUser?.role === 'ROLE_SUPER_ADMIN';

  // ── Filter state ─────────────────────────────────────────────────
  const [inputName, setInputName] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterMa] = useState('');
  const [filterSeaportId, setFilterCangBienId] = useState<string | undefined>();
  const [filterLocation, setFilterLocation] = useState<string | undefined>();
  const [filterType, setFilterType] = useState<DikeRevetmentType | undefined>();
  const [filterStatusVal, setFilterStatusVal] = useState<string | undefined>();
  const [filterUnitId, setFilterUnitId] = useState<string | undefined>();
  const [filterCommissioningYear, setFilterCommissioningYear] = useState<string | undefined>();
  const [filterUpdatedRange, setFilterUpdatedRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('');

  // ── Sorting state (mặc định: Ngày cập nhật giảm dần) ───────────────
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

  const handleSort = useCallback((field: string, order: 'asc' | 'desc' | null) => {
    if (!order) {
      setSortField(undefined);
      setSortOrder(null);
    } else {
      setSortField(field);
      setSortOrder(order);
    }
    setPage(1);
  }, []);

  const sortOrderFor = useCallback(
    (key: string): 'ascend' | 'descend' | null =>
      sortField === key && sortOrder ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
    [sortField, sortOrder]
  );

  // ── Pagination ──────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Data ─────────────────────────────────────────────────────────
  const [dataSource, setDataSource] = useState<DikeRevetmentResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // ── Organizations + Seaports ─────────────────────────────────────
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  // ── Đơn vị quản lý: tự chọn mặc định theo user + DataScope (chuẩn màn /berth) ──
  const defaultOrgUnitId = useRef<string | undefined>(undefined);
  const defaultOrgApplied = useRef(false);
  const [orgUnitReady, setOrgUnitReady] = useState(false);
  const [seaports, setSeaports] = useState<{ id: string; portName?: string; portCode?: string; orgUnitId?: string }[]>([]);

  // ── GIS form state (chuẩn màn /port) ─────────────────────────────
  const [symbols, setSymbols] = useState<MapSymbol[]>([]);
  const [uploadFileList, setUploadFileList] = useState<any[]>([]);
  // File đã lưu bị gỡ khỏi danh sách — chờ xóa thật khi Lưu (chuẩn /vts-operation-center)
  const [pendingDeletedAttachments, setPendingDeletedAttachments] = useState<{ id: string; fileName: string }[]>([]);
  const [gisMapOpen, setGisMapOpen] = useState(false);
  const [gisViewOpen, setGisViewOpen] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);

  const [coordinateList, setCoordinateList] = useState<Array<{ latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }>>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const addGpsPoint = () => {
    setCoordinateList((p) => [...p, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]);
    setGpsError(null);
  };
  const removeGpsPoint = (i: number) => {
    setCoordinateList((p) => p.filter((_, idx) => idx !== i));
    setGpsError(null);
  };
  const updateGpsPoint = (i: number, field: 'lat' | 'lng', dVal: number | null, mVal: number | null, sVal: number | null) => {
    setCoordinateList((p) => {
      const next = [...p];
      next[i] = {
        ...next[i],
        [field === 'lat' ? 'latD' : 'lngD']: dVal,
        [field === 'lat' ? 'latM' : 'lngM']: mVal,
        [field === 'lat' ? 'latS' : 'lngS']: sVal,
      };
      return next;
    });
    setGpsError(null);
  };

  // ── Drawer state ─────────────────────────────────────────────────
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DikeRevetmentResponse | null>(null);
  const [detailRecord, setDetailRecord] = useState<DikeRevetmentResponse | null>(null);
  const [isDetailMode, setIsDetailMode] = useState(false);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve'>('submit');
  const submittingRef = useRef(false);
  const prevGeomTypeRef = useRef<string | undefined>(undefined);
  const [createForm] = Form.useForm();
  const createGeometryType = Form.useWatch('geometryType', createForm);
  const createOrgUnitId = Form.useWatch('orgUnitId', createForm);
  const watchedSeaportId = Form.useWatch('seaportId', createForm);
  const editSeaportIdRef = useRef<string | undefined>(undefined);

  const useMaxReached = (name: string, max: number): boolean => {
    const raw = Form.useWatch(name, createForm) ?? '';
    const len = (typeof raw === 'string' ? raw : String(raw ?? '')).length;
    return len >= max;
  };

  const atMax = {
    dikeRevetmentName: useMaxReached('dikeRevetmentName', 255),
    locationDetail: useMaxReached('locationDetail', 500),
    note: useMaxReached('note', 500),
  };

  const filteredSeaports = useMemo(() => {
    if (!createOrgUnitId) return [];
    const rawSet = resolveOrgSubtreeIds(organizations, String(createOrgUnitId));
    const normalizedSet = new Set<string>();
    rawSet.forEach((oId) => normalizedSet.add(String(oId).toLowerCase()));
    return seaports.filter((p: any) => p.orgUnitId && normalizedSet.has(String(p.orgUnitId).toLowerCase()));
  }, [seaports, organizations, createOrgUnitId]);

  const filteredFilterSeaports = useMemo(() => {
    if (!filterUnitId || filterUnitId === '__all__') return seaports;
    const rawSet = resolveOrgSubtreeIds(organizations, String(filterUnitId));
    const normalizedSet = new Set<string>();
    rawSet.forEach((oId) => normalizedSet.add(String(oId).toLowerCase()));
    return seaports.filter((p: any) => p.orgUnitId && normalizedSet.has(String(p.orgUnitId).toLowerCase()));
  }, [seaports, organizations, filterUnitId]);
  // Chống race khi đóng/mở drawer nhanh trong lúc getById nạp chi tiết (chuẩn /vts-operation-center)
  const editOpenSeqRef = useRef(0);
  const gisCoordSnapshotRef = useRef<{ coords: any[]; symbolId?: string; geometryType?: string }>({ coords: [], symbolId: undefined, geometryType: undefined });
  const latestGisMapValueRef = useRef<any>(null);

  // ── Load danh bạ người dùng → map UUID sang tên hiển thị "Người tải lên" trong tab File đính kèm
  //    (chuẩn /berth & /beacon-stations: dùng userMap id→fullName thay vì để lộ UUID/placeholder) ──
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users = resp.data || (resp as any).content || [];
        if (disposed) return;
        const next = new Map<string, string>();
        users.forEach((u: any) => {
          next.set(u.id, u.fullName || u.username || u.id);
        });
        setUserMap(next);
      } catch {
        /* giữ map rỗng nếu không lấy được danh bạ */
      }
    })();
    return () => { disposed = true; };
  }, []);

  // ── GIS: auto-fill Hệ quy chiếu + Quy tắc hiển thị + đồng bộ số điểm theo Loại đối tượng (chuẩn /berth)
  useEffect(() => {
    if (!drawerVisible || isDetailMode) return;
    if (!createGeometryType) {
      if (prevGeomTypeRef.current) {
        createForm.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined, symbolId: undefined });
        createForm.setFields([{ name: 'symbolId', errors: [] }]);
        setCoordinateList([]);
        setGpsError(null);
      }
      prevGeomTypeRef.current = undefined;
      return;
    }
    prevGeomTypeRef.current = String(createGeometryType);
    createForm.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    setCoordinateList((prev) => {
      const type = String(createGeometryType).toUpperCase();
      const minPoints = type === 'POINT' ? 1 : type === 'LINE' ? 2 : 3;
      if (type === 'POINT') {
        if (prev.length === 0) return [{ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }];
        return [prev[0]];
      }
      if (prev.length < minPoints) {
        const next = [...prev];
        while (next.length < minPoints) {
          next.push({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null });
        }
        return next;
      }
      return prev;
    });
    setGpsError(null);
  }, [createGeometryType, drawerVisible, isDetailMode, createForm]);

  // ── File đính kèm (chuẩn InfrastructureAttachmentTab) ───────────────
  const handlePickAttachment = (file: File) => {
    if (file.size > 20 * 1024 * 1024) { message.error('File vượt quá 20MB'); return false; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) {
      message.error('Định dạng không hỗ trợ'); return false;
    }
    if (uploadFileList.length >= 10) { message.error('Tối đa 10 tệp đính kèm'); return false; }
    const uid = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setUploadFileList((prev) => [...prev, { uid, name: file.name, status: 'done' as const, originFileObj: file }]);
    return false;
  };
  const handleRemoveAttachment = (id: string) => {
    const target = uploadFileList.find((f) => f.uid === id);
    if (!target) return;
    if (target.originFileObj || !target.attachmentId) {
      setUploadFileList((prev) => prev.filter((f) => f.uid !== id));
      return;
    }
    // File đã lưu: chỉ đưa vào hàng chờ — xóa thật khi Lưu qua endpoint entity
    // để backend ghi nhật ký 'Tài liệu đính kèm' (chuẩn /vts-operation-center).
    setPendingDeletedAttachments((prev) => [...prev, { id: target.attachmentId, fileName: target.name }]);
    setUploadFileList((prev) => prev.filter((f) => f.uid !== id));
    toast.success('Đã xóa tệp đính kèm');
  };
  const handleDownloadAttachment = async (id: string, fileName?: string) => {
    const target = uploadFileList.find((f) => f.uid === id);
    if (target?.originFileObj) {
      // File mới chưa lưu: tải blob cục bộ (chuẩn /vts-operation-center)
      const url = URL.createObjectURL(target.originFileObj);
      const a = document.createElement('a');
      a.href = url;
      a.download = target.name;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    // File đã lưu: tải qua endpoint entity — chuẩn /vts-operation-center
    const recordId = editingRecord?.id || detailRecord?.id;
    if (!recordId) return;
    try {
      await dikeRevetmentCRUD.downloadAttachment(recordId, id, fileName || target?.name);
    } catch {
      toast.error('Không thể tải xuống tệp đính kèm');
    }
  };
  const attachmentItems = uploadFileList.map((f) => ({
    id: f.uid,
    fileName: f.name,
    fileSize: f.originFileObj ? f.originFileObj.size : (f.fileSize ?? 0),
    uploadedByName: currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý',
    uploadedDate: f.uploadedDate || new Date().toISOString(),
    filePath: f.filePath,
    file: f.originFileObj,
  }));
  const attachmentsEditable = !editingRecord || canEditApprovalRecord(editingRecord.approvalStatus, { hasPerm, resource: 'dikerevetment' });

  // ── GIS: chọn tọa độ trên bản đồ (chuẩn CHK — GisLocationSelector) ──
  const applyMapSelection = (val: any) => {
    if (!val) return;
    latestGisMapValueRef.current = val;
    const geom = ((val.geometryType || createGeometryType || 'POINT') as string).toUpperCase();
    if (val.geometryType && val.geometryType !== createGeometryType) {
      createForm.setFieldValue('geometryType', val.geometryType);
    }
    if (val.symbolId) {
      createForm.setFieldValue('symbolId', val.symbolId);
    }
    if (val.coordinates) {
      const points = parseWktToCoordinates(val.coordinates);
      if (points.length > 0) {
        const toDms = (p: { latitude: number; longitude: number }) => {
          const lat = ddToDms(p.latitude);
          const lng = ddToDms(p.longitude);
          return { latD: lat.d, latM: lat.m, latS: lat.s, lngD: lng.d, lngM: lng.m, lngS: lng.s };
        };
        const newPoints = points.map(toDms);
        if (geom === 'POINT') {
          setCoordinateList([newPoints[0]]);
        } else {
          setCoordinateList(newPoints);
        }
        setGpsError(null);
      }
    } else if (val.coordinates === '') {
      setCoordinateList([]);
    }
  };
  const [activeTabKey, setActiveTabKey] = useState('general');

  // ── Delete state ─────────────────────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<DikeRevetmentResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Approval state ──────────────────────────────────────────────
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<DikeRevetmentResponse | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<DikeRevetmentResponse | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<DikeRevetmentResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // ── History state ────────────────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<DikeRevetmentResponse | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historyPage, setHistoryPage] = useState(0);

  // ── Đơn vị vận hành: danh mục chung (chuẩn cctv/radar — /common/options/operating-organizations) ──
  const [operatingUnits, setOperatingUnits] = useState<Array<{ id: string; code: string; name: string }>>(DEFAULT_OPERATING_ORGANIZATIONS);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/common/options/operating-organizations');
        const data = res.data?.data;
        if (Array.isArray(data) && data.length > 0 && !cancelled) setOperatingUnits(data);
      } catch {
        // endpoint lỗi → giữ danh sách mặc định
      }
    })();
    return () => { cancelled = true; };
  }, []);
  const operatingUnitOptions = useMemo(() => operatingUnits.map((o) => ({ value: o.id, label: o.name })), [operatingUnits]);
  const operatingUnitNameById = useCallback((id?: string): string | null => {
    if (!id) return null;
    // Không tìm thấy đơn vị trong danh mục → null (trống), KHÔNG trả UUID thô
    return operatingUnits.find((o) => o.id === id)?.name ?? null;
  }, [operatingUnits]);

  // ── Init: organizations (DataScope + auto mặc định theo user) — chuẩn màn /berth ──
  // Đơn vị quản lý bắt buộc: tự chọn mặc định = đơn vị user đang đăng nhập qua resolveDefaultOrgUnitId;
  // nếu tài khoản cấp Cục/admin (không có org khớp hoặc cấp Bộ) thì để “Tất cả” (undefined).
  useEffect(() => {
    const isIframe = window.self !== window.top;
    const parentOrgUnits = isIframe ? (window.parent as any)?.kchtOrgUnits : undefined;
    if (parentOrgUnits && parentOrgUnits.length > 0) {
      setOrganizations(parentOrgUnits);
      if (!defaultOrgApplied.current) {
        defaultOrgApplied.current = true;
        const defaultId = resolveDefaultOrgUnitId(currentUser, parentOrgUnits);
        defaultOrgUnitId.current = defaultId;
        setFilterUnitId(defaultId);
      }
      setOrgUnitReady(true);
    } else {
      (async () => {
        try {
          const resp = await organizationService.list({ pageSize: 1000 });
          const data = resp.data || [];
          setOrganizations(data);
          if (data.length > 0 && !defaultOrgApplied.current) {
            defaultOrgApplied.current = true;
            const defaultId = resolveDefaultOrgUnitId(currentUser, data);
            defaultOrgUnitId.current = defaultId;
            setFilterUnitId(defaultId);
          }
          setOrgUnitReady(true);
        } catch (err) {
          console.error('Failed to load organizations', err);
        }
      })();
    }

  }, [currentUser]);

  useEffect(() => {
    api.get('/common/options/ports').then((res) => {
      const data = res.data?.data;
      if (Array.isArray(data) && data.length > 0) {
        setSeaports(data);
      } else {
        api.get('/v1/ports?size=1000').then((r) => {
          const list = r.data?.data?.content || r.data?.data || [];
          if (Array.isArray(list)) {
            setSeaports(list.map((p: any) => ({
              id: p.id,
              portName: p.portName || p.name || '',
              portCode: p.portCode || p.code,
              orgUnitId: p.orgUnitId,
            })));
          }
        }).catch(() => {});
      }
    }).catch(() => {
      portCRUD.getOptions().then((opts) => setSeaports(opts || [])).catch(() => {});
    });
  }, []);

  // Load symbols for GIS tab (chuẩn /port)
  useEffect(() => {
    (async () => {
      try {
        const res = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
        setSymbols(res.data || []);
      } catch (err) {
        console.error('Failed to load symbols', err);
      }
    })();
  }, []);

  // ── Data fetching ────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await dikeRevetmentCRUD.search({
        page,
        size: pageSize,
        code: filterCode.trim() || undefined,
        dikeRevetmentName: filterName.trim() || undefined,
        seaportId: filterSeaportId,
        location: filterLocation,
        dikeRevetmentType: filterType,
        conditionStatus: filterStatusVal,
        approvalStatus: TAB_QUERY_MAP[activeTab],
        isDeleted: activeTab === 'ARCHIVED' ? true : undefined,
        orgUnitId: filterUnitId && filterUnitId !== '__all__' ? filterUnitId : undefined,
        commissioningYear: filterCommissioningYear,
        updatedFrom: filterUpdatedRange?.[0] ? `${filterUpdatedRange[0].format('YYYY-MM-DD')} 00:00:00.000` : undefined,
        updatedTo: filterUpdatedRange?.[1] ? `${filterUpdatedRange[1].format('YYYY-MM-DD')} 23:59:59.999` : undefined,
        sortBy: sortField,
        sortOrder: sortField && sortOrder ? (sortOrder === 'asc' ? 'ASC' : 'DESC') : 'DESC',
      });
      const items = res.items || [];
      setDataSource(items);
      setTotal(res.total);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterName, filterCode, filterSeaportId, filterLocation, filterType, filterStatusVal, filterUnitId, filterCommissioningYear, filterUpdatedRange, activeTab, sortField, sortOrder]);

  useEffect(() => {
    if (orgUnitReady) void fetchData();
  }, [fetchData, orgUnitReady]);

  // Tab counts — đếm theo từng trạng thái, BẮT BUỘC áp ĐÚNG bộ lọc như danh sách
  // để tổng 6 tab con khớp tổng "Tất cả" (tránh lệch 71 vs 76 khi có filter nghiệp vụ)
  const fetchTabCounts = useCallback(async () => {
    const filterScope = {
      orgUnitId: filterUnitId && filterUnitId !== '__all__' ? filterUnitId : undefined,
      code: filterCode.trim() || undefined,
      dikeRevetmentName: filterName.trim() || undefined,
      seaportId: filterSeaportId,
      location: filterLocation,
      dikeRevetmentType: filterType,
      conditionStatus: filterStatusVal,
      commissioningYear: filterCommissioningYear,
      updatedFrom: filterUpdatedRange?.[0] ? `${filterUpdatedRange[0].format('YYYY-MM-DD')} 00:00:00.000` : undefined,
      updatedTo: filterUpdatedRange?.[1] ? `${filterUpdatedRange[1].format('YYYY-MM-DD')} 23:59:59.999` : undefined,
    };
    const results = await Promise.allSettled(
      STATUS_TAB_LIST.map((tab) =>
        dikeRevetmentCRUD.search({
          page: 1,
          size: 1,
          approvalStatus: TAB_QUERY_MAP[tab.key],
          isDeleted: tab.key === 'ARCHIVED' ? true : undefined,
          ...filterScope,
        })
      )
    );
    const counts: Record<string, number> = {};
    results.forEach((res, i) => {
      if (res.status === 'fulfilled') {
        counts[STATUS_TAB_LIST[i].key] = res.value.total;
      }
    });
    const sumChildCounts = STATUS_TAB_LIST
      .filter((t) => t.key !== '')
      .reduce((acc, t) => acc + (counts[t.key] || 0), 0);
    counts[''] = sumChildCounts;
    setTabCounts(counts);
  }, [filterName, filterCode, filterSeaportId, filterLocation, filterType, filterStatusVal, filterUnitId, filterCommissioningYear, filterUpdatedRange]);

  useEffect(() => {
    if (orgUnitReady) void fetchTabCounts();
  }, [fetchTabCounts, orgUnitReady]);

  // Tab items: đồng bộ số lượng tức thì trên tab active bằng state total
  const statusTabs = useMemo(() => {
    const allChildSum = STATUS_TAB_LIST
      .filter((t) => t.key !== '')
      .reduce((acc, t) => acc + (tabCounts[t.key] ?? 0), 0);

    return STATUS_TAB_LIST.map((tab) => ({
      ...tab,
      count: tab.key === '' ? (tabCounts[''] ?? allChildSum) : (tab.key === activeTab ? total : (tabCounts[tab.key] ?? 0)),
      active: activeTab === tab.key,
    }));
  }, [tabCounts, activeTab, total]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(1);
    // Tự động cuộn nhẹ tab đang chọn vào khung nhìn (theo chuẩn /berth)
    requestAnimationFrame(() => {
      const activeButton = document.querySelector('.dike-revetment-page-wrapper button[aria-pressed="true"]') as HTMLElement | null;
      activeButton?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    });
  };

  const handleFilterApply = (overrides?: { name?: string; code?: string }) => {
    const nextName = (overrides?.name !== undefined ? overrides.name : inputName).trim();
    const nextCode = (overrides?.code !== undefined ? overrides.code : inputCode).trim();
    setInputName(nextName);
    setInputCode(nextCode);
    setFilterName(nextName);
    setFilterMa(nextCode);
    setPage(1);
  };
  const handleFilterReset = () => {
    setInputName('');
    setInputCode('');
    setFilterName('');
    setFilterMa('');
    setFilterCangBienId(undefined);
    setFilterLocation(undefined);
    setFilterType(undefined);
    setFilterStatusVal(undefined);
    // Reset về đơn vị quản lý mặc định của user (chuẩn màn /berth), không về "Tất cả"
    const defaultOrg = defaultOrgUnitId.current;
    setFilterUnitId(defaultOrg === '__all__' ? undefined : defaultOrg);
    setFilterCommissioningYear(undefined);
    setFilterUpdatedRange(null);
    setSortField(undefined);
    setSortOrder(null);
    setActiveTab('');
    setPage(1);
  };

  // ── Drawer helpers ───────────────────────────────────────────────
  const openCreateDrawer = useCallback(() => {
    if (!hasPerm?.('dikerevetment:create')) {
      message.warning('Bạn không có quyền thêm mới công trình đê kè');
      return;
    }
    submittingRef.current = false;
    setSubmitting(false);
    editOpenSeqRef.current += 1;
    setEditingRecord(null);
    editSeaportIdRef.current = undefined;
    setDetailRecord(null);
    setIsDetailMode(false);
    createForm.resetFields();
    createForm.setFieldsValue({
      status: '2',
      code: undefined,
    });
    prevGeomTypeRef.current = undefined;
    setCoordinateList([]);
    setGpsError(null);
    setUploadFileList([]);
    setPendingDeletedAttachments([]);
    setActiveTabKey('general');
    setDrawerVisible(true);
    // Mặc định đơn vị quản lý theo tài khoản của người dùng đang tạo bản ghi mới (chuẩn /beacon-stations)
    const currentOrgUnitId = resolveDefaultOrgUnitId(currentUser, organizations)
      || (currentUser?.orgUnitId && currentUser.orgUnitId !== '00000000-0000-0000-0000-000000000017' && currentUser.orgUnitId !== 'G17' ? currentUser.orgUnitId : undefined);
    if (currentOrgUnitId) {
      createForm.setFieldsValue({ orgUnitId: currentOrgUnitId });
    } else if (!currentUser?.orgUnitId) {
      (async () => {
        try {
          const res = await api.get('/users/me');
          const profile = res.data?.data ?? res.data;
          const uOrgId = profile?.orgUnitId;
          if (uOrgId && uOrgId !== '00000000-0000-0000-0000-000000000017' && uOrgId !== 'G17') {
            createForm.setFieldsValue({ orgUnitId: uOrgId });
          }
        } catch {
          // không chặn nếu không lấy được profile
        }
      })();
    }
  }, [createForm, currentUser, organizations]);

  const openEditDrawer = useCallback((record: DikeRevetmentResponse) => {
    if (!canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'dikerevetment' })) {
      message.warning('Bạn không có quyền chỉnh sửa công trình đê kè này');
      return;
    }
    submittingRef.current = false;
    setSubmitting(false);
    editOpenSeqRef.current += 1;
    const seq = editOpenSeqRef.current;
    setEditingRecord(record);
    prevGeomTypeRef.current = record.geometryType ?? undefined;
    editSeaportIdRef.current = record.seaportId ?? undefined;
    setDetailRecord(null);
    setIsDetailMode(false);
    createForm.setFieldsValue({
      dikeRevetmentType: record.dikeRevetmentType,
      location: record.location,
      locationDetail: record.locationDetail,
      dikeRevetmentName: record.dikeRevetmentName,
      seaportId: record.seaportId,
      operatingUnitId: record.operatingUnitId,
      constructionDate: record.constructionDate ? dayjs(record.constructionDate) : null,
      lastMaintenanceYear: record.lastMaintenanceYear ? dayjs(String(record.lastMaintenanceYear)) : null,
      length: normalizeSafeNumber(record.length),
      crestElevation: normalizeSafeNumber(record.crestElevation),
      commissioningDate: record.commissioningDate ? dayjs(record.commissioningDate) : null,
      height: normalizeSafeNumber(record.height),
      status: record.status,
      note: record.note,
      orgUnitId: record.orgUnitId,
      code: record.code,
      geometryType: record.geometryType,
      symbolId: record.symbolId,
      coordinateSystem: (record.geometryType || record.coordinates) ? 1 : undefined,
      displayRule: (record.geometryType || record.coordinates) ? 'Độ, phút, giây (DMS)' : undefined,
    });
    const ec = parseWktToCoordinates(record.coordinates || '');
    setCoordinateList(ec.length > 0 ? ec.map((c) => {
      const latDms = ddToDms(c.latitude);
      const lngDms = ddToDms(c.longitude);
      return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
    }) : []);
    setGpsError(null);
    setPendingDeletedAttachments([]);
    setUploadFileList((record.attachments || []).map((a) => ({
      uid: a.id,
      name: a.fileName,
      status: 'done' as const,
      filePath: a.fileUrl,
      attachmentId: a.id,
      fileSize: a.fileSize,
      uploadedDate: a.uploadedDate,
    })));
    setActiveTabKey('general');
    setDrawerVisible(true);

    // Chuẩn /vts-operation-center: khi mở chỉnh sửa luôn getById để nạp lại đầy đủ GIS + file đính kèm
    (async () => {
      try {
        const detail = await dikeRevetmentCRUD.getById(record.id);
        if (editOpenSeqRef.current !== seq) return; // drawer đã đóng / mở bản ghi khác
        prevGeomTypeRef.current = detail.geometryType ?? record.geometryType ?? undefined;
        createForm.setFieldsValue({
          length: normalizeSafeNumber(detail.length),
          crestElevation: normalizeSafeNumber(detail.crestElevation),
          height: normalizeSafeNumber(detail.height),
          geometryType: detail.geometryType,
          symbolId: detail.symbolId,
          coordinateSystem: (detail.geometryType || detail.coordinates) ? 1 : undefined,
          displayRule: (detail.geometryType || detail.coordinates) ? 'Độ, phút, giây (DMS)' : undefined,
        });
        const detailEc = parseWktToCoordinates(detail.coordinates || '');
        setCoordinateList(detailEc.length > 0 ? detailEc.map((c) => {
          const latDms = ddToDms(c.latitude);
          const lngDms = ddToDms(c.longitude);
          return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
        }) : []);
        setGpsError(null);
        if (detail.attachments && detail.attachments.length > 0) {
          setUploadFileList(detail.attachments.map((a) => ({
            uid: a.id,
            name: a.fileName,
            status: 'done' as const,
            filePath: a.fileUrl,
            attachmentId: a.id,
            fileSize: a.fileSize,
            uploadedDate: a.uploadedDate,
          })));
        }
      } catch {
        // Hàng trong danh sách đã đủ — giữ nguyên giá trị đã nạp
      }
    })();
  }, [createForm]);

  // Tự sinh mã đê kè khi người dùng chọn Thuộc cảng biển (chuẩn /berth, /vhf, /beacon-stations)
  useEffect(() => {
    if (editingRecord && editSeaportIdRef.current === watchedSeaportId) return;
    if (!watchedSeaportId) {
      if (!editingRecord) {
        createForm.setFieldValue('code', undefined);
      }
      return;
    }
    if (editingRecord) return;
    setCodeLoading(true);
    (async () => {
      try {
        const res = await api.get('/v1/dike-revetment/generate-code');
        const code: string | undefined = res.data?.data?.code;
        if (code) {
          createForm.setFieldsValue({ code });
        }
      } catch {
        // không chặn nếu sinh mã lỗi
      } finally {
        setCodeLoading(false);
      }
    })();
  }, [watchedSeaportId, editingRecord, createForm]);

  const openDetailDrawer = useCallback(async (record: DikeRevetmentResponse) => {
    if (!hasPerm?.('dikerevetment:read')) {
      message.warning('Bạn không có quyền xem chi tiết công trình đê kè');
      return;
    }
    editOpenSeqRef.current += 1;
    setDetailRecord(record);
    setEditingRecord(null);
    setIsDetailMode(true);
    setActiveTabKey('general');
    setDrawerVisible(true);
    try {
      const detail = await dikeRevetmentCRUD.getById(record.id);
      setDetailRecord(detail);
    } catch (err) {
      console.error('Failed to load detail', err);
    }
  }, []);

  useEffect(() => {
    if (!isEmbeddedAction || !embeddedAction || !embeddedRecordId) return;
    const requestKey = `${embeddedAction}:${embeddedRecordId}`;
    if (embeddedOpenedRef.current === requestKey) return;
    embeddedOpenedRef.current = requestKey;
    void dikeRevetmentCRUD.getById(embeddedRecordId)
      .then((record) => {
        if (embeddedAction === 'edit') openEditDrawer(record);
        else void openDetailDrawer(record);
      })
      .catch(() => {
        embeddedOpenedRef.current = null;
        toast.error('Không tải được chi tiết công trình đê kè');
      });
  }, [embeddedAction, embeddedRecordId, isEmbeddedAction, openDetailDrawer, openEditDrawer]);

  const closeDrawer = () => {
    editOpenSeqRef.current += 1;
    setDrawerVisible(false);
    setEditingRecord(null);
    setDetailRecord(null);
    setPendingDeletedAttachments([]);
    closeEmbeddedAction();
  };

  // ── Submit ───────────────────────────────────────────────────────
  const handleSubmit = async (action: 'draft' | 'submit' | 'approve') => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    let values: any;
    try {
      values = await createForm.validateFields();
    } catch (e: any) {
      submittingRef.current = false;
      setSubmitting(false);
      const errFields: Array<{ name: Array<string | number>; errors?: string[] }> = e?.errorFields ?? [];
      const firstError = errFields[0]?.errors?.[0] || 'Vui lòng kiểm tra và điền đầy đủ các thông tin bắt buộc (*)';
      toast.error(firstError);
      if (errFields.some((f) => f.name[0] === 'geometryType' || f.name[0] === 'symbolId' || f.name[0] === 'coordinateSystem' || f.name[0] === 'displayRule')) {
        setActiveTabKey('gis');
      } else {
        setActiveTabKey('general');
      }
      return;
    }

    try {
      const geomType = values.geometryType ?? createForm.getFieldValue('geometryType') ?? editingRecord?.geometryType ?? null;
      const symbolId = (values.symbolId !== undefined ? values.symbolId : (createForm.getFieldValue('symbolId') ?? editingRecord?.symbolId)) ?? null;
      const hasGeom = !!geomType;

      let coordinates: string | null = null;
      if (hasGeom) {
        const coordResult = validateDmsCoordinates(coordinateList, geomType);
        if (!coordResult.valid) {
          const errMsg = coordResult.errorMessage || 'Tọa độ GPS không hợp lệ';
          toast.error(errMsg);
          setGpsError(errMsg);
          setActiveTabKey('gis');
          return;
        }
        const validCoords = coordResult.validCoords;
        coordinates = validCoords.length > 0
          ? serializeCoordinatesToWkt(validCoords, geomType || 'LINE')
          : (editingRecord?.coordinates ?? null);
      }
      const trimOrNull = (v: unknown): string | null => {
        if (v == null) return null;
        const s = String(v).trim();
        return s === '' ? null : s;
      };
      const dateOrNull = (v: unknown): string | null => {
        if (!v) return null;
        return dayjs.isDayjs(v) ? v.format('YYYY-MM-DD') : String(v);
      };
      const yearOrNull = (v: unknown): number | null => {
        if (!v) return null;
        if (dayjs.isDayjs(v)) return Number(v.format('YYYY'));
        const n = Number(v);
        return Number.isNaN(n) ? null : n;
      };
      const decimalOrNull = (v: unknown): number | string | null => {
        const dec = safeDecimal(v);
        return dec !== undefined ? dec : null;
      };
      // Cao trình đỉnh cho phép giá trị âm — dùng bản GIỮ dấu '-' khi dựng payload
      const decimalOrNullSigned = (v: unknown): number | string | null => {
        const dec = safeDecimalSigned(v);
        return dec !== undefined ? dec : null;
      };

      const payload: CreateDikeRevetmentRequest = {
        dikeRevetmentType: values.dikeRevetmentType,
        location: trimOrNull(values.location) ?? '',
        locationDetail: trimOrNull(values.locationDetail),
        dikeRevetmentName: trimOrNull(values.dikeRevetmentName) ?? '',
        seaportId: values.seaportId || null,
        operatingUnitId: values.operatingUnitId || null,
        constructionDate: dateOrNull(values.constructionDate),
        lastMaintenanceYear: yearOrNull(values.lastMaintenanceYear),
        length: decimalOrNull(values.length),
        crestElevation: decimalOrNullSigned(values.crestElevation),
        commissioningDate: dateOrNull(values.commissioningDate),
        height: decimalOrNull(values.height),
        status: trimOrNull(values.status),
        orgUnitId: values.orgUnitId || null,
        code: trimOrNull(values.code),
        geometryType: hasGeom ? geomType : null,
        coordinates: hasGeom ? coordinates : null,
        symbolId: hasGeom && symbolId ? symbolId : null,
        note: trimOrNull(values.note),
      };

      const wasApproved = editingRecord && (editingRecord.approvalStatus === 'APPROVED' || editingRecord.approvalStatus === 'APPROVED_LEVEL2');
      if (wasApproved) {
        const isDirty = createForm.isFieldsTouched() || uploadFileList.some((fi: any) => !!fi.originFileObj) || pendingDeletedAttachments.length > 0;
        if (!isDirty) {
          toast.warning('Bắt buộc chỉnh sửa ít nhất 1 trường thông tin trước khi thực hiện thao tác này');
          return;
        }
      }

      const isCuc = isCucLevelUser(currentUser);
      let targetApprovalStatus: string | undefined = undefined;
      if (wasApproved) {
        if (action === 'submit') {
          targetApprovalStatus = 'PENDING_APPROVAL';
        } else if (action === 'approve') {
          targetApprovalStatus = (isCuc && canApproveC2) ? 'APPROVED' : 'APPROVED_LEVEL1';
        }
      } else if (action === 'approve') {
        targetApprovalStatus = (isCuc && canApproveC2) ? 'APPROVED' : 'APPROVED_LEVEL1';
      }
      if (targetApprovalStatus) {
        (payload as any).approvalStatus = targetApprovalStatus;
      }

      // Chuẩn phê duyệt 2 cấp (approval-2-level-spec.md 3.2/3.9 + infrastructure-screen-template §3.6):
      // - draft  : Lưu tạm — tạo / giữ DRAFT.
      // - submit : Lưu và gửi phê duyệt — tạo/sửa xong gửi vào vòng 1 (PENDING_APPROVAL).
      // - approve: Lưu và phê duyệt — chỉ cấp có quyền duyệt; khi sửa hồ sơ Đã duyệt,
      //            backend giữ nguyên APPROVED và ghi bản cũ vào nhật ký (T12).
      let savedId: string | null = null;
      if (editingRecord) {
        await dikeRevetmentCRUD.update(editingRecord.id, payload as UpdateDikeRevetmentRequest);
        savedId = editingRecord.id;
      } else {
        const created = await dikeRevetmentCRUD.create(payload);
        savedId = created.id;
      }

      // ── Xử lý file đính kèm NGAY khi hồ sơ còn ở trạng thái cho phép sửa, TRƯỚC khi gửi/duyệt:
      //    chuẩn /vts-operation-center — sau khi vào vòng duyệt (PENDING_APPROVAL) backend khóa mọi thay đổi. ──
      if (savedId) {
        // Xóa file đã lưu đã đánh dấu — qua endpoint entity để ghi nhật ký 'Tài liệu đính kèm' (ATTACHMENT_DELETED)
        if (pendingDeletedAttachments.length > 0) {
          const deletionResults = await Promise.allSettled(
            pendingDeletedAttachments.map((d) => api.delete(`/v1/dike-revetment/${savedId}/attachments/${d.id}`)),
          );
          if (deletionResults.some((result) => result.status === 'rejected')) {
            toast.warning('Đã lưu thông tin nhưng một số tệp đính kèm chưa được xóa');
          }
        }
        // Tải file mới (chuẩn /port)
        if (uploadFileList.length > 0) {
          let uploaded = 0;
          for (const f of uploadFileList) {
            if (!f.originFileObj) continue; // skip existing attachments
            try {
              const formData = new FormData();
              formData.append('files', f.originFileObj as File);
              await api.post(`/v1/dike-revetment/${savedId}/attachments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
              uploaded++;
            } catch { /* non-blocking */ }
          }
          if (uploaded > 0) toast.success(`Đã tải lên ${uploaded} tệp đính kèm`);
        }
      }

      if (editingRecord && savedId) {
        if (wasApproved) {
          if (action === 'submit') {
            toast.success('Lưu và gửi phê duyệt đê kè thành công');
          } else if (action === 'approve') {
            toast.success(targetApprovalStatus === 'APPROVED' ? 'Lưu và phê duyệt đê kè thành công' : 'Đã duyệt cấp Cảng vụ, chuyển Chờ Cục duyệt');
          } else {
            toast.success('Cập nhật đê kè thành công');
          }
        } else if (action === 'submit') {
          // Sửa hồ sơ DRAFT/REJECTED_LEVEL1/REJECTED_LEVEL2 rồi gửi (lại) duyệt → vòng 1.
          await dikeRevetmentApproval.submitForApproval(savedId);
          toast.success('Lưu và gửi phê duyệt đê kè thành công');
        } else if (action === 'approve') {
          toast.success('Lưu và phê duyệt đê kè thành công');
        } else {
          toast.success('Lưu tạm đê kè thành công');
        }
      } else if (savedId) {
        if (action === 'submit') {
          await dikeRevetmentApproval.submitForApproval(savedId);
          toast.success('Lưu và gửi phê duyệt đê kè thành công');
        } else if (action === 'approve') {
          // Tạo + duyệt thẳng: submit (đơn vị cấp Cục được vào thẳng Chờ Cục duyệt)
          // rồi duyệt cấp Cục để hồ sơ ĐÃ DUYỆT.
          const sent = await dikeRevetmentApproval.submitForApproval(savedId);
          if (sent?.approvalStatus === 'APPROVED_LEVEL1') {
            await dikeRevetmentApproval.approveC2(savedId);
          } else {
            await dikeRevetmentApproval.approveC1(savedId);
            await dikeRevetmentApproval.approveC2(savedId);
          }
          toast.success('Lưu và phê duyệt đê kè thành công');
        } else {
          toast.success('Lưu tạm đê kè thành công');
        }
      }

      setDrawerVisible(false);
      setEditingRecord(null);
      setUploadFileList([]);
      setPendingDeletedAttachments([]);
      setSortField(undefined);
      setSortOrder(null);
      setPage(1);
      fetchData();
      fetchTabCounts();
    } catch (err) {
      if ((err as any)?.errorFields) return; // validation errors handled by Form
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  // ── Delete (chuẩn /berth) ────────────────────────────────────────
  const openDeleteModal = useCallback((record: DikeRevetmentResponse) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  }, []);

  const confirmDelete = async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await dikeRevetmentCRUD.delete(deletingRecord.id);
      toast.success('Xóa đê kè thành công');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      fetchData();
      fetchTabCounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Approval ────────────────────────────────────────────────────
  const openSubmitModal = useCallback((record: DikeRevetmentResponse) => {
    setSubmittingRecord(record);
    setSubmitModalOpen(true);
  }, []);

  const confirmSubmit = async () => {
    if (!submittingRecord) return;
    try {
      await dikeRevetmentApproval.submitForApproval(submittingRecord.id);
      toast.success('Đã gửi phê duyệt đê kè');
      setSubmitModalOpen(false);
      setSubmittingRecord(null);
      fetchData();
      fetchTabCounts();
    } catch {
      // Lỗi đã được api.ts interceptor hiển thị — không toast trùng
      setSubmitModalOpen(false);
      setSubmittingRecord(null);
    }
  };

  const openApproveModal = useCallback((record: DikeRevetmentResponse) => {
    setApprovingRecord(record);
    setApproveModalOpen(true);
  }, []);

  const confirmApprove = async (content?: string) => {
    if (!approvingRecord) return;
    try {
      const note = content?.trim() || undefined;
      // Cấp duyệt theo trạng thái hồ sơ: PENDING_APPROVAL → C1 (Cảng vụ/Chi cục),
      // APPROVED_LEVEL1 → C2 (Cục).
      const isLevel2 = approvingRecord.approvalStatus === 'APPROVED_LEVEL1';
      if (isLevel2) {
        await dikeRevetmentApproval.approveC2(approvingRecord.id, note);
      } else {
        await dikeRevetmentApproval.approveC1(approvingRecord.id, note);
      }
      toast.success(isLevel2 ? 'Phê duyệt cấp Cục thành công' : 'Phê duyệt cấp Cảng vụ/Chi cục thành công');
      setApproveModalOpen(false);
      setApprovingRecord(null);
      fetchData();
      fetchTabCounts();
    } catch {
      // Lỗi đã được api.ts interceptor hiển thị (showUniqueError) — không toast trùng
      setApproveModalOpen(false);
      setApprovingRecord(null);
    }
  };

  const openRejectModal = useCallback((record: DikeRevetmentResponse) => {
    setRejectingRecord(record);
    setRejectReason('');
    setRejectModalOpen(true);
  }, []);

  const confirmReject = async () => {
    if (!rejectingRecord) return;
    const reason = rejectReason.trim() || 'Từ chối phê duyệt';
    try {
      // Cấp từ chối theo trạng thái hồ sơ: vòng 1 → REJECTED_LEVEL1, vòng 2 → REJECTED_LEVEL2.
      const isLevel2 = rejectingRecord.approvalStatus === 'APPROVED_LEVEL1';
      if (isLevel2) {
        await dikeRevetmentApproval.rejectC2(rejectingRecord.id, reason);
      } else {
        await dikeRevetmentApproval.rejectC1(rejectingRecord.id, reason);
      }
      toast.success(isLevel2 ? 'Đã từ chối cấp Cục' : 'Đã từ chối cấp Cảng vụ/Chi cục');
      setRejectModalOpen(false);
      setRejectingRecord(null);
      setRejectReason('');
      fetchData();
      fetchTabCounts();
    } catch {
      // Lỗi đã được api.ts interceptor hiển thị — không toast trùng
      setRejectModalOpen(false);
      setRejectingRecord(null);
      setRejectReason('');
    }
  };

  // ── History ──────────────────────────────────────────────────────
  const openHistoryModal = useCallback(async (record: DikeRevetmentResponse) => {
    if (!hasPerm?.('dikerevetment:history')) {
      message.warning('Bạn không có quyền xem lịch sử công trình đê kè');
      return;
    }
    setHistoryTarget(record);
    setHistoryRecords([]);
    setHistorySearch('');
    setHistoryFrom('');
    setHistoryTo('');
    setHistoryOpen(true);
    setHistoryLoading(false);
    setLoadingMoreHistory(false);
    setHasMoreHistory(record.approvalStatus !== 'DRAFT' && (record as any).status !== 'DRAFT');
    setHistoryPage(0);
  }, [hasPerm]);

  const HISTORY_PAGE_SIZE = 20;

  const orgMap = useMemo(() => new Map(organizations.map((o) => [o.id, o.name])), [organizations]);
  const seaportMap = useMemo(() => new Map(seaports.map((s) => [s.id, s.portName || s.portCode || s.id])), [seaports]);

  const historyTimestamp = (item: any): string => item.approvedDate || item.changedAt || item.createdAt || '';
  const historyField = (item: any): string => item.changedField || item.fieldName || '';
  const historyOldValue = (item: any): string | null => item.previousValue ?? item.oldValue ?? null;
  const historyNewValue = (item: any): string | null => item.newValue ?? null;
  const historyActor = (item: any): string => { const raw = item?.approvedBy || item?.changedBy || ''; return raw || '—'; };

  // Render giá trị thay đổi đẹp như /vts-system: tọa độ → DMS, enum/trạng thái/biểu tượng → tên tiếng Việt
  const renderHistoryValue = useCallback((field: string, raw: string | null): React.ReactNode => {
    if (raw === null || raw === undefined || raw === '' || raw === '—' || raw === '(null)' || raw === '(trống)' || raw === 'null' || raw === 'Chưa có' || raw === 'Chua co') {
      return <span style={{ color: textTertiary }}>—</span>;
    }
    const norm = field.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
    if (norm.includes('toa do') || norm.includes('coordinates')) return renderCoordinatesDisplay(raw);
    if (norm.includes('phe duyet') || norm.includes('approval')) return DIKE_REVETMENT_STATUS_LABELS[raw] || raw;
    if (norm.includes('he toa do') || norm.includes('coordinatesystem') || norm.includes('he quy chieu')) {
      if (raw === '1' || raw === '4326' || raw.toLowerCase().includes('wgs')) return 'WGS 84';
      if (raw === '2' || raw.toLowerCase().includes('vn-2000') || raw.toLowerCase().includes('vn2000')) return 'VN-2000';
      return raw;
    }
    if (norm.includes('tinh trang') || norm === 'status' || norm.includes('conditionstatus')) {
      const st = OPERATIONAL_STATUS_STYLE_MAP[raw];
      return st ? st.label : raw;
    }
    if (norm.includes('loai ket cau') || (norm.includes('dike') && norm.includes('type'))) return (DIKE_REVETMENT_TYPE_MAP as Record<string, string>)[raw] || raw;
    if (norm.includes('geometry') || norm.includes('loai doi tuong')) {
      const m: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' };
      return m[String(raw).toUpperCase()] || raw;
    }
    if (norm.includes('symbol') || norm.includes('bieu tuong')) {
      const sym = symbols.find((s) => s.id === raw || s.code === raw || String(s.id) === String(raw));
      return sym ? (sym.code ? `${sym.name} (${sym.code})` : sym.name) : raw;
    }
    if (norm.includes('operatingunit') || norm.includes('don vi van hanh') || norm.includes('don vi khai thac')) {
      return operatingUnitNameById(raw);
    }
    if (norm === 'orgunitid' || norm.includes('don vi quan ly')) {
      const name = orgMap.get(raw);
      return name ? (name.split(' - ').pop() || name) : raw;
    }
    if (norm === 'seaportid' || norm.includes('cang bien')) {
      return seaportMap.get(raw) || raw;
    }
    if (norm === 'constructiondate' || norm === 'commissioningdate' || norm.endsWith('date') || norm.endsWith('at')) {
      try {
        if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
          return dayjs(raw).format('DD/MM/YYYY');
        }
      } catch {
        return raw;
      }
    }
    const trimmed = raw.trim();
    if (/^-?\d+(\.\d+)?$/.test(trimmed) && !norm.includes('year') && !norm.includes('nam')) {
      return fmtNum(trimmed);
    }
    if (String(raw).toLowerCase() === 'true') return 'Có';
    if (String(raw).toLowerCase() === 'false') return 'Không';
    return raw;
  }, [symbols, orgMap, seaportMap, operatingUnitNameById]);

  const renderHistoryContent = useCallback((field: string, val: string | null): React.ReactNode => {
    if (val === null || val === undefined || val === '' || val === '(null)' || val === '—') {
      return <span style={{ color: textTertiary }}>—</span>;
    }
    const nk = field.toLowerCase();
    if (nk.includes('toa do') || nk.includes('coordinates')) return renderCoordinatesDisplay(val);
    const str = String(val).trim();
    const sv = str.toUpperCase();
    if (sv.startsWith('POINT') || sv.startsWith('LINESTRING') || sv.startsWith('POLYGON') || sv.startsWith('MULTIPOINT')) {
      return renderCoordinatesDisplay(str);
    }
    if (isAttachmentField(field) && str && str !== 'Chưa có' && str !== '(trống)' && str !== '—') {
      const files = str.split(',').map((s) => s.trim()).filter(Boolean);
      if (files.length > 1) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: '20px', width: '100%' }}>
            {files.map((file, idx) => (
              <div key={idx} style={{ color: textPrimary, fontWeight: fontWeightMedium, wordBreak: 'break-all' }}>{file}</div>
            ))}
          </div>
        );
      }
    }
    if (str.includes(',') && str.length > 25) {
      const items = str.split(',').map((s) => s.trim()).filter(Boolean);
      if (items.length > 1) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ color: textPrimary, fontWeight: fontWeightMedium, lineHeight: '20px', wordBreak: 'break-word' }}>{item}</div>
            ))}
          </div>
        );
      }
    }
    return renderHistoryValue(field, val);
  }, [renderHistoryValue]);

  const resolveHistoryActionMeta = (group: any, changes: any[]): { label: string; color: string; bg: string } => {
    const item = group?.items?.[0] || {};
    const rawStatus = String(item?.status ?? item?.action ?? '').toUpperCase();
    const rawReason = String(item?.reason ?? item?.ghiChu ?? item?.note ?? '').toLowerCase();
    const level = Number(item?.approvalLevel || 0);

    if (rawStatus === 'CREATED' || rawStatus === 'CREATE' || rawReason.includes('tạo mới') || rawReason.includes('thêm mới') || rawReason.includes('tao moi') || rawReason.includes('them moi')) {
      return { label: 'Thêm mới', color: statusOperational, bg: `${statusOperational}18` };
    }

    // Nếu có trường dữ liệu thông thường thay đổi, ưu tiên hiển thị [Cập nhật]
    const hasFieldUpdate = changes.some((c: any) => !isAttachmentField(c.field));
    if (hasFieldUpdate) {
      return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
    }

    if (rawStatus === 'ATTACHMENT_UPLOADED' || rawReason.includes('tải lên') || rawReason.includes('tai len')) {
      return { label: 'Tải lên tệp', color: actionPrimary, bg: `${actionPrimary}18` };
    }

    if (rawStatus === 'ATTACHMENT_DELETED' || rawReason.includes('xóa tài liệu') || rawReason.includes('xóa tệp') || rawReason.includes('xoa tep')) {
      return { label: 'Xóa tệp', color: statusAttention, bg: `${statusAttention}18` };
    }

    if (rawStatus === 'UPDATED' || rawStatus === 'UPDATE' || rawStatus === 'EDIT' || rawReason.includes('cập nhật') || rawReason.includes('chỉnh sửa')) {
      return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
    }

    // Ưu tiên lý do ghi sẵn cho hành động duyệt/từ chối (chuẩn VTS CHK)
    if (rawReason.includes('phê duyệt cấp cảng vụ') || rawReason.includes('phe duyet cap cang vu')) {
      return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
    }
    if (rawReason.includes('phê duyệt cấp cục') || rawReason.includes('phe duyet cap cuc')) {
      return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
    }
    if (rawReason.includes('từ chối cấp cảng vụ') || rawReason.includes('tu choi cap cang vu')) {
      return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (rawReason.includes('từ chối cấp cục') || rawReason.includes('tu choi cap cuc')) {
      return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
    }

    const approvalChange = changes.find((c: any) => {
      const k = (c.field || '').toLowerCase();
      return k === 'approvalstatus' || k === 'trang thai phe duyet';
    });

    if (approvalChange) {
      const nv = String(approvalChange.newValue || '').toLowerCase();
      if (nv.includes('rejected_level1') || (nv.includes('tra ve') && nv.includes('cang vu'))) {
        return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
      }
      if (nv.includes('rejected_level2') || (nv.includes('tra ve') && nv.includes('cuc'))) {
        return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
      }
      if (nv.includes('approved_level1') || nv.includes('cuc duyet') || nv === 'cho cuc duyet') {
        return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
      }
      if (nv === 'da duyet' || nv.includes('approved')) {
        return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
      }
      if (nv.includes('tu choi') || nv.includes('rejected')) {
        return { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}18` };
      }
      if (nv.includes('cho cang vu duyet') || nv.includes('pending') || nv.includes('proposed') || nv.includes('luu tam') || nv.includes('nhap')) {
        return { label: 'Trình duyệt', color: statusAttention, bg: `${statusAttention}18` };
      }
    }

    if (level === 1 || String(item?.approvalLevel || '').includes('LEVEL_1')) {
      return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
    }
    if (level === 2 || String(item?.approvalLevel || '').includes('LEVEL_2') || rawStatus === 'APPROVED' || rawStatus === 'APPROVE') {
      return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
    }
    if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi')) {
      return { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (rawStatus === 'PROPOSED' || rawStatus === 'PENDING' || rawStatus === 'PENDING_APPROVAL' || rawReason.includes('trình duyệt') || rawReason.includes('trinh duyet') || rawReason.includes('gửi phê duyệt')) {
      return { label: 'Trình duyệt', color: statusAttention, bg: `${statusAttention}18` };
    }
    if (rawStatus === 'DELETED' || rawStatus === 'DELETE' || rawStatus === 'SOFT_DELETE' || rawReason.includes('xóa') || rawReason.includes('xoa')) {
      return { label: 'Xóa', color: '#64748b', bg: '#64748b18' };
    }

    return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
  };

  useEffect(() => {
    if (!historyOpen || !historyTarget) return;
    if (historyTarget.approvalStatus === 'DRAFT' || (historyTarget as any).status === 'DRAFT') {
      setHistoryRecords([]);
      setHistoryLoading(false);
      setLoadingMoreHistory(false);
      setHasMoreHistory(false);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setHistoryLoading(true);
      setLoadingMoreHistory(false);
      setHasMoreHistory(true);
      setHistoryRecords([]);
      setHistoryPage(0);
      try {
        const hist = await dikeRevetmentApproval.getHistory(historyTarget.id, 0, HISTORY_PAGE_SIZE, {
          keyword: historySearch,
          fromDate: historyFrom,
          toDate: historyTo,
        });
        if (cancelled) return;
        const items = hist || [];
        setHistoryRecords(items);
        setHasMoreHistory(items.length === HISTORY_PAGE_SIZE);
      } catch (err) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : 'Không tải được lịch sử');
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }, historySearch.trim() ? 300 : 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [historyOpen, historyTarget, historySearch, historyFrom, historyTo]);

  const loadMoreHistory = async () => {
    if (!historyTarget || historyLoading || loadingMoreHistory || !hasMoreHistory || historyTarget.approvalStatus === 'DRAFT' || (historyTarget as any).status === 'DRAFT') return;
    setLoadingMoreHistory(true);
    try {
      const nextPage = historyPage + 1;
      const hist = await dikeRevetmentApproval.getHistory(historyTarget.id, nextPage, HISTORY_PAGE_SIZE, {
        keyword: historySearch,
        fromDate: historyFrom,
        toDate: historyTo,
      });
      if (hist && hist.length > 0) setHistoryRecords((prev) => [...prev, ...hist]);
      setHistoryPage(nextPage);
      setHasMoreHistory((hist || []).length === HISTORY_PAGE_SIZE);
    } catch { /* ignore */ } finally { setLoadingMoreHistory(false); }
  };

  useEffect(() => {
    if (!historyOpen || !hasMoreHistory || historyLoading || loadingMoreHistory) return;
    void loadMoreHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyOpen, hasMoreHistory, historyLoading, loadingMoreHistory, historyRecords.length]);

  const validHistoryGroups = useMemo(() => {
    if (!Array.isArray(historyRecords) || historyRecords.length === 0) return [];
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...historyRecords].sort((a: any, b: any) => new Date(historyTimestamp(b) || 0).getTime() - new Date(historyTimestamp(a) || 0).getTime());

    const isUpdateAction = (status: string, reason?: string) => {
      const s = String(status || '').toUpperCase();
      const r = String(reason || '').toLowerCase();
      return s === 'UPDATED' || s === 'UPDATE' || s === 'EDIT' || s === 'ATTACHMENT_UPLOADED' || s === 'ATTACHMENT_DELETED'
        || r.includes('cập nhật') || r.includes('chỉnh sửa') || r.includes('tải lên') || r.includes('xóa tệp') || r.includes('xóa tài liệu');
    };

    // Gộp theo ĐÚNG giây + người thực hiện; các dòng UPDATED cùng lúc được gộp chung 1 nhóm
    const rawGroups: { tsSec: number; ts: string; actor: string; status?: any; approvalLevel?: any; items: any[] }[] = [];
    for (const r of sorted) {
      const ts = historyTimestamp(r);
      const sec = ts ? toSec(ts) : 0;
      const prev = rawGroups[rawGroups.length - 1];
      const actor = historyActor(r);
      const isBothUpdate = prev && isUpdateAction(prev.status, prev.items[0]?.reason) && isUpdateAction(r.status, r.reason);
      const isSameGroup = prev && Math.abs(prev.tsSec - sec) <= 10 && prev.actor === actor && (prev.status === r.status || isBothUpdate);
      if (isSameGroup) {
        prev.items.push(r);
      } else {
        rawGroups.push({ tsSec: sec, ts, actor, status: r.status, approvalLevel: r.approvalLevel, items: [r] });
      }
    }

    const isBlank = (v: any): boolean => {
      if (v == null) return true;
      const s = String(v).trim().toLowerCase();
      return (
        s === '' ||
        s === '—' ||
        s === '-' ||
        s === '–' ||
        s === 'null' ||
        s === '(null)' ||
        s === '(trống)' ||
        s === 'chưa có' ||
        s === 'undefined'
      );
    };

    const isMeaningful = (field: string, rawOld: any, rawNew: any): boolean => {
      const f = (field || '').trim();
      const fLower = f.toLowerCase();
      if (
        DEFAULT_IGNORED_FIELDS.has(f) ||
        DEFAULT_IGNORED_FIELDS.has(fLower) ||
        fLower === 'approvalstatus' ||
        fLower === 'trạng thái phê duyệt' ||
        fLower === 'trang thai phe duyet' ||
        fLower === 'trạng thái' ||
        fLower === 'approvalcontentlevel1' ||
        fLower === 'approvalcontentlevel2' ||
        fLower === 'level1approvalcontent' ||
        fLower === 'level2approvalcontent' ||
        fLower === 'submitteddate' ||
        fLower === 'submittedat' ||
        fLower === 'submittedby' ||
        fLower === 'approverlevel1' ||
        fLower === 'approverlevel2' ||
        fLower === 'approveddatelevel1' ||
        fLower === 'approveddatelevel2' ||
        fLower === 'rejectionreason' ||
        fLower === 'lý do từ chối' ||
        fLower === 'ly do tu choi' ||
        fLower === 'portauthorityapprovedby' ||
        fLower === 'portauthorityapprovedat' ||
        fLower === 'portauthorityapprovalcontent' ||
        fLower === 'departmentapprovedby' ||
        fLower === 'departmentapprovedat' ||
        fLower === 'departmentapprovalcontent' ||
        fLower === 'approvedby' ||
        fLower === 'approvedat' ||
        fLower === 'approvedremarks' ||
        fLower === 'cấp 1 phê duyệt' ||
        fLower === 'cấp 2 phê duyệt' ||
        fLower === 'nội dung phê duyệt' ||
        fLower === 'ngày gửi phê duyệt' ||
        fLower === 'người gửi phê duyệt'
      ) {
        return false;
      }
      if (isBlank(rawOld) && isBlank(rawNew)) return false;
      const ov = rawOld != null ? String(rawOld).trim() : '';
      const nv = rawNew != null ? String(rawNew).trim() : '';
      if (ov !== '' && nv !== '' && ov.toLowerCase() === nv.toLowerCase()) return false;
      // Bỏ qua nếu cả hai đều là số và bằng nhau về mặt giá trị số học (VD: 5555.0000 vs 5555)
      if (ov !== '' && nv !== '' && !isNaN(Number(ov)) && !isNaN(Number(nv)) && Math.abs(Number(ov) - Number(nv)) < 1e-9) {
        return false;
      }
      // Bỏ qua nếu sau khi định dạng hiển thị hai giá trị chuỗi giống hệt nhau
      const ovNode = renderHistoryContent(field, rawOld);
      const nvNode = renderHistoryContent(field, rawNew);
      if (typeof ovNode === 'string' && typeof nvNode === 'string' && ovNode.trim() !== '' && ovNode.trim() === nvNode.trim()) {
        return false;
      }
      return true;
    };

    return rawGroups.map((g) => {
      const attachmentItems = g.items.filter((item: any) => isAttachmentField(historyField(item)));
      const seenLabels = new Set<string>();
      const nonAttachmentChanges: { field: string; oldValue: any; newValue: any }[] = [];
      for (const item of g.items) {
        if (isAttachmentField(historyField(item))) continue;
        const fn = historyField(item);
        if (!fn) continue;
        const ov = historyOldValue(item);
        const nv = historyNewValue(item);
        if (!isMeaningful(fn, ov, nv)) continue;
        const displayLabel = historyFieldName(fn).trim().toLowerCase();
        if (seenLabels.has(displayLabel)) continue;
        seenLabels.add(displayLabel);
        nonAttachmentChanges.push({ field: fn, oldValue: ov, newValue: nv });
      }

      const attachmentChanges = mergeAttachmentHistoryChanges(
        attachmentItems.map((item: any) => ({
          field: historyField(item) || 'Tài liệu đính kèm',
          oldValue: historyOldValue(item),
          newValue: historyNewValue(item),
        })),
      );

      const changes = [
        ...nonAttachmentChanges,
        ...attachmentChanges,
      ];

      if (changes.length === 0) return null;
      const orderedChanges = [...changes].sort((a: any, b: any) => {
        const ia = DIKE_REVETMENT_HISTORY_FIELD_ORDER.indexOf(a.field);
        const ib = DIKE_REVETMENT_HISTORY_FIELD_ORDER.indexOf(b.field);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      }).filter((c: any) => c.field !== 'attachments' && c.field !== 'spatialId');
      if (orderedChanges.length === 0) return null;
      return {
        ...g,
        changes,
        orderedChanges,
      };
    }).filter(Boolean) as Array<{
      tsSec: number;
      ts: string;
      actor: string;
      status?: any;
      approvalLevel?: any;
      items: any[];
      changes: any[];
      orderedChanges: any[];
    }>;
  }, [historyRecords, renderHistoryContent]);

  const historyUpdateCount = validHistoryGroups.length;

  const renderHistoryTimeline = () => {
    if (validHistoryGroups.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
          <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
          <div style={{ color: textTertiary, fontSize: fontSizeMd }}>{historySearch || historyFrom || historyTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div>
        </div>
      );
    }
    const fmtTime = (ts: string) => { const d = new Date(ts); return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`; };
    return (
      <PaginatedHistoryList
        items={validHistoryGroups}
        renderItems={(pageGroups) => (
      <div>
        {pageGroups.map((g, gi) => {
          const rec0 = g.items[0] || {};
          const rawUnit = rec0.orgUnitName || rec0.unitName;
          const orgId = rec0.orgUnitId;
          const orgName = orgId ? orgMap.get(orgId) : undefined;
          const unitName = (rawUnit && rawUnit !== '—' ? rawUnit : (orgName ? (orgName.split(' - ').pop() || orgName) : undefined)) || 'Cục Hàng hải Việt Nam';
          const barColor = actionPrimary;
          const isCreate = g.changes.every((c: any) => c.oldValue === null || c.oldValue === '(null)' || c.oldValue === '');
          const informationTitle = isCreate ? 'Thông tin thêm mới:' : 'Thông tin thay đổi:';
          const orderedChanges = g.orderedChanges;
          const am = resolveHistoryActionMeta(g, g.changes);

          return (
            <div key={`${gi}-${g.ts}-${g.actor}`} style={{ ...historyGroupGridStyle, marginBottom: gi < pageGroups.length - 1 ? spaceSm : 0 }}>
              <div style={{ minWidth: 0, paddingTop: spaceXs }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spaceSm }}>
                  <Typography.Text style={historyTimeStyle}>
                    {g.ts ? fmtTime(g.ts) : '—'}
                  </Typography.Text>
                  <span style={{ flexShrink: 0 }}>
                    <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: am.bg, color: am.color, whiteSpace: 'nowrap' }}>
                      {am.label}
                    </span>
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 0 }}>
                  <Typography.Text style={historyMetaRowStyle}>
                    Người cập nhật: {g.actor || '—'}
                  </Typography.Text>
                  <Typography.Text style={historyMetaRowStyle}>
                    Đơn vị: {unitName}
                  </Typography.Text>
                </div>
              </div>

              <div style={historyInfoCardStyle}>
                <div style={historyAccentBarStyle(barColor)} />
                <Typography.Text style={historyInfoTitleStyle}>
                  {informationTitle}
                </Typography.Text>
                {orderedChanges.length > 0 ? (
                  <div>
                    {orderedChanges.map((change, ri: number) => {
                      const fn = change.field;
                      const renderCell = (rawVal: string | null) => {
                        if (fn === 'mapSymbolId' && rawVal && rawVal !== '(null)') {
                          const sym = symbols.find((s) => s.id === rawVal || s.code === rawVal || String(s.id) === String(rawVal));
                          if (sym) {
                            return (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                {sym.image ? <img src={sym.image} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} /> : null}
                                {sym.code ? `${sym.name} (${sym.code})` : sym.name}
                              </span>
                            );
                          }
                        }
                        return null;
                      };
                      const customCellOld = renderCell(change.oldValue);
                      const customCellNew = renderCell(change.newValue);
                      const ovNode = customCellOld ?? renderHistoryContent(fn, change.oldValue);
                      const nvNode = customCellNew ?? renderHistoryContent(fn, change.newValue);
                      const ovTitle = typeof ovNode === 'string' ? ovNode : undefined;
                      const nvTitle = typeof nvNode === 'string' ? nvNode : undefined;

                      const isOvEmpty = ovNode == null || ovNode === '' || ovNode === '—';
                      const isNvEmpty = nvNode == null || nvNode === '' || nvNode === '—';
                      if (!isCreate && isOvEmpty && isNvEmpty) return null;
                      if (!isCreate && typeof ovNode === 'string' && typeof nvNode === 'string' && ovNode.trim() === nvNode.trim()) return null;

                      return isCreate ? (
                        <div key={`${fn}-${ri}`} style={{ ...historyCreateRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                          <div style={historyFieldLabelStyle}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                          <span title={nvTitle} style={historyNewValueStyle}>{nvNode ?? '—'}</span>
                        </div>
                      ) : (
                        <div key={`${fn}-${ri}`} style={{ ...historyChangeRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                          <div style={historyFieldLabelStyle}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                          <span title={ovTitle} style={historyOldValueStyle}>{ovNode ?? '—'}</span>
                          <span style={historyArrowStyle}>→</span>
                          <span title={nvTitle} style={historyNewValueStyle}>{nvNode ?? '—'}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd }}>Không có thông tin chi tiết</Typography.Text>
                )}
              </div>
            </div>
          );
        })}
      </div>
        )}
      />
    );
  };

  // ── Columns & row actions ────────────────────────────────────────
  // Khớp 100% sheet QL đê kè — cột "Danh sách" = ✓, đúng thứ tự sheet:
  // Mã, Tên, Đơn vị QL, Cảng biển, Địa điểm, Loại kết cấu, Tình trạng,
  // Thời điểm khai thác, Ngày cập nhật, Cán bộ cập nhật, Trạng thái phê duyệt
  const renderCellWithTooltip = (
    text: string | null | undefined,
    isBold?: boolean
  ) => {
    if (!text) return null;
    return (
      <span
        style={{
          fontSize: fontSizeMd,
          color: textPrimary,
          fontWeight: isBold ? fontWeightBold : undefined,
          display: 'inline-block',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          verticalAlign: 'middle',
        }}
        title={text}
      >
        {text}
      </span>
    );
  };

  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'sequenceNo',
      label: 'STT',
      width: 60,
      fixed: 'left' as const,
      align: 'center' as const,
      render: (_: any, __: any, index?: number) => (
        <span style={{ color: textSecondary, fontWeight: fontWeightMedium }}>{(page - 1) * pageSize + (index ?? 0) + 1}</span>
      ),
    },
    {
      key: 'dikeRevetmentName',
      label: <span>Tên/Mã đê kè</span>,
      dataIndex: 'dikeRevetmentName',
      width: 260,
      fixed: 'left' as const,
      sortOrder: sortOrderFor('dikeRevetmentName'),
      cellTitle: (record: DikeRevetmentResponse) => record.dikeRevetmentName || '',
      render: (_: any, record: DikeRevetmentResponse) => (
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {hasPerm?.('dikerevetment:read') ? (
            <a
              title={record.dikeRevetmentName || ''}
              onClick={() => openDetailDrawer(record)}
              style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {record.dikeRevetmentName || null}
            </a>
          ) : (
            <span
              title={record.dikeRevetmentName || ''}
              style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'default' }}
            >
              {record.dikeRevetmentName || null}
            </span>
          )}
          {record.code && (
            <span style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={record.code}>
              {record.code}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'orgUnitName',
      label: 'Đơn vị quản lý',
      dataIndex: 'orgUnitName',
      width: 260,
      sortOrder: sortOrderFor('orgUnitName'),
      cellTitle: (record: DikeRevetmentResponse) => record.orgUnitName || '',
      render: (val: string | undefined) => renderCellWithTooltip(val, true),
    },
    {
      key: 'seaportName',
      label: 'Thuộc cảng biển',
      dataIndex: 'seaportName',
      width: 170,
      sortOrder: sortOrderFor('seaportName'),
      cellTitle: (record: DikeRevetmentResponse) => record.seaportName || '',
      render: (val: string | undefined) => renderCellWithTooltip(val),
    },
    {
      key: 'location',
      label: 'Địa điểm (Tỉnh/TP)',
      dataIndex: 'location',
      width: 190,
      sortable: true,
      sortOrder: sortOrderFor('location'),
      cellTitle: (record: DikeRevetmentResponse) => record.location || '',
      render: (val: string) => renderCellWithTooltip(val),
    },
    {
      key: 'dikeRevetmentType',
      label: 'Loại kết cấu công trình',
      dataIndex: 'dikeRevetmentType',
      width: 220,
      sortOrder: sortOrderFor('dikeRevetmentType'),
      cellTitle: (record: DikeRevetmentResponse) => DIKE_REVETMENT_TYPE_MAP[record.dikeRevetmentType] || record.dikeRevetmentType || '',
      render: (val: string) => renderCellWithTooltip(DIKE_REVETMENT_TYPE_MAP[val] || val || null),
    },
    {
      key: 'status',
      label: 'Tình trạng',
      dataIndex: 'status',
      width: 220,
            render: (val: string) => {
        if (!val) return '';
        const st = OPERATIONAL_STATUS_STYLE_MAP[val];
        return st ? <span style={statusBadgeStyle(st.color)}>{st.label}</span> : val;
      },
    },
    {
      key: 'commissioningDate',
      label: 'Thời điểm đưa vào khai thác',
      dataIndex: 'commissioningDate',
      width: 240,
      align: 'center' as const,
      sortOrder: sortOrderFor('commissioningDate'),
      render: (val: string) => formatYear(val),
    },
    {
      key: 'approvalStatus',
      label: 'Trạng thái phê duyệt',
      dataIndex: 'approvalStatus',
      width: 300,
            render: (status: string, record: DikeRevetmentResponse) => {
        if (isDikeRevetmentDeleted(record)) {
          return (
            <span
              style={{
                ...themeTokenChk.statusBadgeStyle(statusCritical),
                fontSize: 13,
              }}
            >
              Đã xóa
            </span>
          );
        }
        return <ApprovalStatusBadge status={status} labelOverrides={DIKE_REVETMENT_STATUS_LABELS} />;
      },
    },
    {
      key: 'updatedByName',
      label: 'Cán bộ cập nhật',
      dataIndex: 'updatedByName',
      width: 210,
      sortOrder: sortOrderFor('updatedByName'),
      cellTitle: (record: DikeRevetmentResponse) => record.updatedByName || '',
      render: (val: string, record: DikeRevetmentResponse) => (
        <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
          {val ? (
            <span style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
          ) : (
            <span style={{ ...cellTitleStyle, display: 'block' }}>—</span>
          )}
          <span style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatDate(record.updatedAt)}</span>
        </div>
      ),
    },
    {
      key: 'submittedByName',
      label: 'Cán bộ gửi phê duyệt',
      dataIndex: 'submittedByName',
      width: 230,
      sortOrder: sortOrderFor('submittedByName'),
      cellTitle: (record: DikeRevetmentResponse) => record.submittedByName || '',
      render: (val: string, record: DikeRevetmentResponse) => (
        <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
          {val ? (
            <span style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
          ) : (
            <span style={{ ...cellTitleStyle, display: 'block' }}>—</span>
          )}
          <span style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatDate(record.submittedAt)}</span>
        </div>
      ),
    },
    {
      key: 'approvedByNameLevel1',
      label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục',
      dataIndex: 'approvedByNameLevel1',
      width: 260,
      sortOrder: sortOrderFor('approvedByNameLevel1'),
      cellTitle: (record: DikeRevetmentResponse) => record.approvedByNameLevel1 || '',
      render: (v: string, r: DikeRevetmentResponse) => (
        <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
          {v ? (
            <span style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
          ) : (
            <span style={{ ...cellTitleStyle, display: 'block' }}>—</span>
          )}
          <span style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatDate(r.approvedDateLevel1)}</span>
        </div>
      ),
    },
    {
      key: 'approvedByNameLevel2',
      label: 'Cán bộ phê duyệt cấp Cục',
      dataIndex: 'approvedByNameLevel2',
      width: 240,
      sortOrder: sortOrderFor('approvedByNameLevel2'),
      cellTitle: (record: DikeRevetmentResponse) => record.approvedByNameLevel2 || '',
      render: (v: string, r: DikeRevetmentResponse) => (
        <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
          {v ? (
            <span style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
          ) : (
            <span style={{ ...cellTitleStyle, display: 'block' }}>—</span>
          )}
          <span style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatDate(r.approvedDateLevel2)}</span>
        </div>
      ),
    },
  ], [page, pageSize, openDetailDrawer, isElevatedOrg, hasPerm, sortOrderFor]);

  const rowActions = useCallback((record: DikeRevetmentResponse) => {
    const actions: any[] = [];
    const canRead = hasPerm('dikerevetment:read');
    const canUpdate = hasPerm('dikerevetment:update');

    // Bản ghi đã xóa: chỉ còn Xem chi tiết và Xem lịch sử
    if (isDikeRevetmentDeleted(record)) {
      if (canRead) {
        actions.push({
          key: 'detail',
          label: 'Xem chi tiết',
          icon: themeTokenChk.icons.view,
          onClick: () => openDetailDrawer(record),
        });
      }
      if (hasPerm('dikerevetment:history')) {
        actions.push({
          key: 'history',
          label: 'Lịch sử',
          icon: themeTokenChk.icons.history,
          onClick: () => openHistoryModal(record),
        });
      }
      return actions;
    }
    const isDraft = record.approvalStatus === 'DRAFT';
    const isRejectedL1 = record.approvalStatus === 'REJECTED_LEVEL1';
    const isRejectedL2 = record.approvalStatus === 'REJECTED_LEVEL2';
    const isPendingC1 = record.approvalStatus === 'PENDING_APPROVAL';
    const isPendingC2 = record.approvalStatus === 'APPROVED_LEVEL1';

    if (canRead) {
      actions.push({
        key: 'detail',
        label: 'Xem chi tiết',
        icon: themeTokenChk.icons.view,
        onClick: () => openDetailDrawer(record),
      });
    }
    // Quy tắc 12 (approval-2-level-spec.md mục 3.9)
    if (canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'dikerevetment' })) {
      actions.push({
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: themeTokenChk.icons.edit,
        onClick: () => openEditDrawer(record),
      });
    }
    // Lịch sử thay đổi.
    if (hasPerm('dikerevetment:history')) {
      actions.push({
        key: 'history',
        label: 'Lịch sử',
        icon: themeTokenChk.icons.history,
        onClick: () => openHistoryModal(record),
      });
    }
    // Gửi duyệt: từ Lưu tạm hoặc sau khi bị trả về (sửa xong gửi lại vòng 1).
    if (canUpdate && (isDraft || isRejectedL1 || isRejectedL2)) {
      actions.push({
        key: 'submit',
        label: 'Gửi duyệt',
        icon: themeTokenChk.icons.submit,
        onClick: () => openSubmitModal(record),
      });
    }
    // Vòng 1 — Cảng vụ/Chi cục duyệt hồ sơ Chờ Cảng vụ duyệt.
    if (canApproveC1 && isPendingC1) {
      actions.push({
        key: 'approveC1',
        label: 'Phê duyệt cấp Cảng vụ',
        icon: themeTokenChk.icons.approve,
        onClick: () => openApproveModal(record),
      });
      actions.push({
        key: 'rejectC1',
        label: 'Từ chối cấp Cảng vụ',
        icon: themeTokenChk.icons.reject,
        danger: true,
        onClick: () => openRejectModal(record),
      });
    }
    // Vòng 2 — Cục duyệt hồ sơ Chờ Cục duyệt.
    if (canApproveC2 && isPendingC2) {
      const isApprover1SelfApprove = Boolean(currentUser?.userId && record.approverLevel1 === currentUser.userId);
      actions.push({
        key: 'approveC2',
        label: isApprover1SelfApprove ? 'Phê duyệt cấp Cục (không thể tự duyệt)' : 'Phê duyệt cấp Cục',
        icon: themeTokenChk.icons.approve,
        disabled: isApprover1SelfApprove,
        onClick: () => openApproveModal(record),
      });
      actions.push({
        key: 'rejectC2',
        label: isApprover1SelfApprove ? 'Từ chối cấp Cục (không thể tự duyệt)' : 'Từ chối cấp Cục',
        icon: themeTokenChk.icons.reject,
        danger: true,
        disabled: isApprover1SelfApprove,
        onClick: () => openRejectModal(record),
      });
    }
    // Quy tắc 11 (approval-2-level-spec.md 3.6): chỉ xóa được hồ sơ Lưu tạm.
    if (canDeleteApprovalRecord(record.approvalStatus, { hasPerm, resource: 'dikerevetment' })) {
      actions.push({
        key: 'delete',
        label: 'Xóa',
        icon: themeTokenChk.icons.delete,
        danger: true,
        onClick: () => openDeleteModal(record),
      });
    }
    return actions;
  }, [hasPerm, currentUser, canApproveC1, canApproveC2, openDetailDrawer, openEditDrawer, openSubmitModal, openApproveModal, openRejectModal, openDeleteModal, openHistoryModal]);

  // ── Filter panel content (markup div tay chuẩn /beacon-stations) ──
  const filterContent = (
    <>
      <div style={{ marginBottom: 12, marginTop: spaceMd }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Đơn vị quản lý</div>
        <OrgUnitTreeSelect
          organizations={organizations}
          placeholder="Chọn đơn vị..."
          showPath
          allLabel="Tất cả"
          treeDefaultExpandAll={false}
          value={filterUnitId}
          onChange={(val) => { setFilterUnitId(val); setFilterCangBienId(undefined); setPage(1); }}
          allowClear
          style={{ ...selectStyle, width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tên đê kè</div>
        <Input
          placeholder="Nhập tên đê kè"
          allowClear
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          onBlur={() => setInputName((prev) => (prev ? prev.trim() : ''))}
          onPressEnter={(e) => {
            const val = ((e.target as HTMLInputElement)?.value ?? inputName).trim();
            setInputName(val);
            handleFilterApply({ name: val });
          }}
          style={inputStyle}
        />
      </div>

      {/* ── Bộ lọc nâng cao (ẩn, hiện khi bấm nút Filter) ── */}
      {filterCollapsed && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Mã đê kè</div>
            <Input
              placeholder="Nhập mã đê kè"
              allowClear
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              onBlur={() => setInputCode((prev) => (prev ? prev.trim() : ''))}
              onPressEnter={(e) => {
                const val = ((e.target as HTMLInputElement)?.value ?? inputCode).trim();
                setInputCode(val);
                handleFilterApply({ code: val });
              }}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc cảng biển</div>
            <Select
              placeholder="Tất cả cảng biển"
              options={filteredFilterSeaports.map((p) => ({ value: p.id, label: p.portCode ? `${p.portCode} - ${p.portName || ''}` : (p.portName || p.id) }))}
              value={filterSeaportId}
              onChange={(val) => { setFilterCangBienId(val); setPage(1); }}
              allowClear
              showSearch
              filterOption={(input, option) =>
                normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
              }
              style={{ ...selectStyle, width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Địa điểm (Tỉnh/TP)</div>
            <Select
              placeholder="Tất cả tỉnh/thành phố"
              options={VIETNAM_PROVINCE_OPTIONS.map((p) => ({ value: p.label, label: p.label }))}
              value={filterLocation}
              onChange={(val) => { setFilterLocation(val); setPage(1); }}
              allowClear
              showSearch
              filterOption={(input, option) =>
                normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
              }
              style={{ ...selectStyle, width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Loại kết cấu công trình</div>
            <Select
              placeholder="Tất cả loại kết cấu"
              options={DIKE_REVETMENT_TYPE_OPTIONS}
              value={filterType}
              onChange={(val) => { setFilterType(val); setPage(1); }}
              allowClear
              style={{ ...selectStyle, width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tình trạng</div>
            <Select
              placeholder="Tất cả"
              options={OPERATIONAL_STATUS_OPTIONS}
              value={filterStatusVal}
              onChange={(val) => { setFilterStatusVal(val); setPage(1); }}
              allowClear
              style={{ ...selectStyle, width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thời điểm đưa vào khai thác</div>
            <DatePicker
              picker="year"
              {...getSidebarDatePickerProps({
                picker: 'year',
                placeholder: 'Chọn năm',
                format: 'YYYY',
                value: filterCommissioningYear ? dayjs(filterCommissioningYear) : null,
                onChange: (d: any) => { setFilterCommissioningYear(d ? d.format('YYYY') : undefined); setPage(1); },
                allowClear: true,
              })}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Ngày cập nhật</div>
            <DatePicker.RangePicker
              {...getRangePickerProps({
                value: filterUpdatedRange,
                onChange: (range: unknown) => {
                  setFilterUpdatedRange(range as [Dayjs | null, Dayjs | null] | null);
                  setPage(1);
                },
              })}
            />
          </div>
        </>
      )}
    </>
  );

  // ── Detail tabs (format chuẩn màn /beacon-stations) ───────────────
  // DetailRow + renderDetailRows + renderSectionHeader (chuẩn /vts-operation-center)
  type DetailRow = { label: string; value: React.ReactNode; fullWidth?: boolean };

  const renderDetailRows = (rows: DetailRow[], paddingTop = spaceMd) => {
    let colIndex = 0;
    return (
      <div className="chk-detail-grid" style={{ paddingTop }}>
        {rows.map((row) => {
          // Trường fullWidth === true → chiếm trọn 2 cột. Các trường thường chiếm 1 cột và wrap khi nội dung dài
          const isLong = row.fullWidth === true;
          let labelCls: string;
          if (isLong) {
            labelCls = 'sec-full-label';
            colIndex = 0;
          } else {
            labelCls = colIndex % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label';
            colIndex += 1;
          }
          return (
            <div key={row.label} className={isLong ? 'chk-detail-row chk-detail-row--full' : 'chk-detail-row'}>
              <span className={`chk-detail-label ${labelCls}`}>{row.label}</span>
              <span className="chk-detail-value" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'normal' }}>{row.value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const detailBasicRows: DetailRow[] = detailRecord ? [
    { label: 'Mã đê kè', value: detailRecord.code ? <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: themeTokenChk.radiusSm === undefined ? 6 : themeTokenChk.radiusSm, border: `1px solid ${borderDefault}`, background: '#f1f5f9', color: themeTokenChk.textSecondary || '#5E6278', fontWeight: 500, whiteSpace: 'nowrap' }}>{detailRecord.code}</span> : null },
    { label: 'Tên đê kè', value: <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{detailRecord.dikeRevetmentName ?? null}</span> },
    { label: 'Đơn vị quản lý', value: detailRecord.orgUnitName || null },
    { label: 'Thuộc cảng biển', value: detailRecord.seaportName || null },
    { label: 'Đơn vị vận hành', value: operatingUnitNameById(detailRecord.operatingUnitId) },
    { label: 'Địa điểm (Tỉnh/TP)', value: detailRecord.location ?? null },
    { label: 'Địa điểm chi tiết', value: detailRecord.locationDetail ?? null },
    { label: 'Loại kết cấu công trình', value: detailRecord.dikeRevetmentType ? (DIKE_REVETMENT_TYPE_MAP[detailRecord.dikeRevetmentType] || detailRecord.dikeRevetmentType) : null },
    {
      label: 'Tình trạng',
      value: detailRecord.status
        ? (() => {
            const st = OPERATIONAL_STATUS_STYLE_MAP[detailRecord.status];
            return st ? <span style={statusBadgeStyle(st.color)}>{st.label}</span> : detailRecord.status;
          })()
        : null,
    },
    { label: 'Ghi chú', value: detailRecord.note ?? null },
  ] : [];

  const detailTechRows: DetailRow[] = detailRecord ? [
    { label: 'Chiều dài (m)', value: detailRecord.length != null ? fmtNum(detailRecord.length) : null },
    { label: 'Chiều cao (m)', value: detailRecord.height != null ? fmtNum(detailRecord.height) : null },
    { label: 'Cao trình đỉnh (m)', value: detailRecord.crestElevation != null ? fmtNum(detailRecord.crestElevation) : null },
  ] : [];

  const detailTimeRows: DetailRow[] = detailRecord ? [
    { label: 'Thời điểm xây dựng', value: formatDateOnly(detailRecord.constructionDate) },
    { label: 'Thời điểm đưa vào khai thác', value: formatYear(detailRecord.commissioningDate) },
    { label: 'Năm bảo trì gần nhất', value: detailRecord.lastMaintenanceYear ?? null },
  ] : [];





  const detailOperationRows: { key: string; code: string; name: string; startDate: string; endDate: string }[] = detailRecord
    ? (detailRecord.operationPlanCode || detailRecord.operationPlanName || detailRecord.operationStartDate || detailRecord.operationEndDate)
      ? [{
          key: 'operation',
          code: detailRecord.operationPlanCode ?? '',
          name: detailRecord.operationPlanName ?? '',
          startDate: detailRecord.operationStartDate ?? '',
          endDate: detailRecord.operationEndDate ?? '',
        }]
      : []
    : [];

  const detailMaintenanceRows: { key: string; code: string; name: string; startDate: string; endDate: string }[] = detailRecord
    ? (detailRecord.maintenancePlanCode || detailRecord.maintenancePlanName || detailRecord.maintenanceStartDate || detailRecord.maintenanceEndDate)
      ? [{
          key: 'maintenance',
          code: detailRecord.maintenancePlanCode ?? '',
          name: detailRecord.maintenancePlanName ?? '',
          startDate: detailRecord.maintenanceStartDate ?? '',
          endDate: detailRecord.maintenanceEndDate ?? '',
        }]
      : []
    : [];

  const detailIncidentRows: { key: string; code: string; name: string; type: string; location: string; time: string }[] = detailRecord
    ? (detailRecord.incidentCode || detailRecord.incidentType || detailRecord.incidentLocation || detailRecord.incidentTime)
      ? [{
          key: 'incident',
          code: detailRecord.incidentCode ?? '',
          name: detailRecord.incidentName ?? '',
          type: detailRecord.incidentType ?? '',
          location: detailRecord.incidentLocation ?? '',
          time: detailRecord.incidentTime ?? '',
        }]
      : []
    : [];

  // Khung cuộn chuẩn CHK từng tab-pane Xem chi tiết (điều vàng 2 — copy từ màn DetailContent:
  // paddingTop/sectionBox giống /berth. Để nội dung tab 'Thông tin chung' cao bằng màn /berth,
  // dùng maxHeight 'calc(100vh - 190px)' + minHeight 350 giống BerthDetailContent.tsx (không phải 290px).)
  const detailPaneScrollStyle: React.CSSProperties = {
    paddingTop: 6,
    paddingRight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    maxHeight: 'calc(100vh - 190px)',
    minHeight: 350,
  };


  // Card Thông tin phê duyệt (mặc định mở chuẩn /berth) — nguồn từ lược bỏ tab "Xử lý & theo dõi".
  const [techOpen, setTechOpen] = useState(true);
  const [timeOpen, setTimeOpen] = useState(true);
  const [approvalOpen, setApprovalOpen] = useState(true);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);

  // Render một nhóm dữ liệu kiểu "Card thông tin" (avatar icon + tiêu đề + chevron mở/đóng). Nội dung row dùng lại renderDetailRows.
  const sectionCardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '12px 18px 8px 18px',
    marginBottom: 14,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
  };
  const sectionCardHeadStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: '1px solid #f1f5f9',
  };
  const sectionCardTitleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: colors.sidebarBg,
    fontWeight: fontWeightBold,
    fontSize: 14,
  };

  // Card Thông tin phê duyệt — đồng bộ chuẩn màn /cctv & /beacon-stations:
  // Dòng 1: Trạng thái (fullWidth)
  // Dòng 2: Cán bộ cập nhật + Ngày cập nhật (cột 1 & 2)
  // Dòng 3: Cán bộ gửi phê duyệt + Ngày gửi phê duyệt
  // Dòng 4: Cán bộ phê duyệt cấp Cảng vụ/Chi cục + Ngày phê duyệt cấp Cảng vụ/Chi cục
  // Dòng 5: Nội dung phê duyệt cấp Cảng vụ/Chi cục (fullWidth)
  // Dòng 6: Cán bộ phê duyệt cấp Cục + Ngày phê duyệt cấp Cục
  // Dòng 7: Nội dung phê duyệt cấp Cục (fullWidth)
  // Dòng 8: Lý do từ chối (fullWidth, khi bị từ chối)
  const detailApprovalRows: DetailRow[] = detailRecord ? [
    {
      label: 'Trạng thái',
      fullWidth: true,
      value: isDikeRevetmentDeleted(detailRecord) ? (
        <span style={{ ...themeTokenChk.statusBadgeStyle(statusCritical), fontSize: 13 }}>
          Đã xóa
        </span>
      ) : (
        <ApprovalStatusBadge status={detailRecord.approvalStatus} labelOverrides={DIKE_REVETMENT_STATUS_LABELS} />
      ),
    },
    { label: 'Cán bộ cập nhật', value: <span style={{ fontWeight: fontWeightBold }}>{detailRecord.updatedByName || detailRecord.updatedBy || '—'}</span> },
    { label: 'Ngày cập nhật', value: (detailRecord.updatedAt || (detailRecord as any).updatedDate || detailRecord.createdAt) ? formatDate(detailRecord.updatedAt || (detailRecord as any).updatedDate || detailRecord.createdAt) : '—' },
    { label: 'Cán bộ gửi phê duyệt', value: <span style={{ fontWeight: fontWeightBold }}>{detailRecord.submittedByName || '—'}</span> },
    { label: 'Ngày gửi phê duyệt', value: detailRecord.submittedAt ? formatDate(detailRecord.submittedAt) : '—' },
    { label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', value: <span style={{ fontWeight: fontWeightBold }}>{detailRecord.approvedByNameLevel1 || '—'}</span> },
    { label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục', value: detailRecord.approvedDateLevel1 ? <span style={{ whiteSpace: 'nowrap' }}>{formatDate(detailRecord.approvedDateLevel1)}</span> : '—' },
    { label: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục', value: detailRecord.approvalContentLevel1 || '—', fullWidth: true },
    { label: 'Cán bộ phê duyệt cấp Cục', value: <span style={{ fontWeight: fontWeightBold }}>{detailRecord.approvedByNameLevel2 || '—'}</span> },
    { label: 'Ngày phê duyệt cấp Cục', value: detailRecord.approvedDateLevel2 ? <span style={{ whiteSpace: 'nowrap' }}>{formatDate(detailRecord.approvedDateLevel2)}</span> : '—' },
    { label: 'Nội dung phê duyệt cấp Cục', value: detailRecord.approvalContentLevel2 || '—', fullWidth: true },
    ...(detailRecord.rejectionReason && (detailRecord.approvalStatus === 'REJECTED_LEVEL1' || detailRecord.approvalStatus === 'REJECTED_LEVEL2' || String(detailRecord.approvalStatus).toUpperCase().includes('REJECT'))
      ? [{ label: 'Lý do từ chối', value: detailRecord.rejectionReason, fullWidth: true } as DetailRow]
      : []),
  ] : [];

  const detailTabItems = detailRecord
    ? [
        {
          key: 'general',
          label: 'Thông tin chung',
          children: (
            <div style={detailPaneScrollStyle}>
              {/* Divider giữa các dòng nhạt như chuẩn /berth & /beacon-stations (chỉ trong Drawer chi tiết) */}
              <style>{`
                .dike-revetment-drawer-scope .chk-detail-grid .chk-detail-row,
                .dike-revetment-drawer-scope .chk-detail-grid .chk-detail-row--full {
                  border-bottom: 1px solid #f1f5f9 !important;
                }
                .dike-revetment-drawer-scope .chk-detail-grid .chk-detail-row:last-child,
                .dike-revetment-drawer-scope .chk-detail-grid .chk-detail-row--full:last-child {
                  border-bottom: none !important;
                }
                .dike-revetment-drawer-scope .sec-col1-label {
                  width: 215px !important;
                  min-width: 215px !important;
                  max-width: 215px !important;
                  flex-shrink: 0 !important;
                }
                .dike-revetment-drawer-scope .sec-col2-label {
                  width: auto !important;
                  min-width: 170px !important;
                  max-width: 250px !important;
                  flex-shrink: 0 !important;
                }
                .dike-revetment-drawer-scope .sec-full-label {
                  width: 215px !important;
                  min-width: 215px !important;
                  max-width: 215px !important;
                  flex-shrink: 0 !important;
                }
              `}</style>
              {/* Card 1 — Thông tin cơ bản & Quản lý vận hành (tĩnh, chuẩn /beacon-stations) */}
              <div style={sectionCardStyle}>
                <div style={{ ...sectionCardHeadStyle, cursor: 'default' }}>
                  <div style={sectionCardTitleStyle}>
                    <BankOutlined style={{ color: actionPrimary }} />
                    <span>Thông tin cơ bản & Quản lý vận hành</span>
                  </div>
                </div>
                {renderDetailRows(detailBasicRows, 0)}
              </div>

              {/* Card 2 — Thông tin kỹ thuật */}
              <div style={{ ...sectionCardStyle, padding: techOpen ? '12px 18px 8px 18px' : '10px 18px' }}>
                <button
                  type="button"
                  aria-expanded={techOpen}
                  onClick={() => setTechOpen((v) => !v)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: 'none', borderTop: 'none', borderRight: 'none', borderLeft: 'none', padding: 0, width: '100%', textAlign: 'left', font: 'inherit', cursor: 'pointer', marginBottom: techOpen ? 8 : 0, paddingBottom: techOpen ? 8 : 0, borderBottom: techOpen ? '1px solid #f1f5f9' : 'none' }}
                >
                  <div style={sectionCardTitleStyle}>
                    <SlidersOutlined style={{ color: actionPrimary }} />
                    <span>Thông tin kỹ thuật</span>
                  </div>
                  {techOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                </button>
                {techOpen && renderDetailRows(detailTechRows, 0)}
              </div>

              {/* Card 3 — Thông tin thời gian */}
              <div style={{ ...sectionCardStyle, padding: timeOpen ? '12px 18px 8px 18px' : '10px 18px' }}>
                <button
                  type="button"
                  aria-expanded={timeOpen}
                  onClick={() => setTimeOpen((v) => !v)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: 'none', borderTop: 'none', borderRight: 'none', borderLeft: 'none', padding: 0, width: '100%', textAlign: 'left', font: 'inherit', cursor: 'pointer', marginBottom: timeOpen ? 8 : 0, paddingBottom: timeOpen ? 8 : 0, borderBottom: timeOpen ? '1px solid #f1f5f9' : 'none' }}
                >
                  <div style={sectionCardTitleStyle}>
                    <FileTextOutlined style={{ color: actionPrimary }} />
                    <span>Thông tin thời gian</span>
                  </div>
                  {timeOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                </button>
                {timeOpen && renderDetailRows(detailTimeRows, 0)}
              </div>

              {/* Card 4 — Thông tin phê duyệt */}
              <div style={{ ...sectionCardStyle, padding: approvalOpen ? '12px 18px 8px 18px' : '10px 18px' }}>
                <button
                  type="button"
                  aria-expanded={approvalOpen}
                  onClick={() => setApprovalOpen((v) => !v)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: 'none', borderTop: 'none', borderRight: 'none', borderLeft: 'none', padding: 0, width: '100%', textAlign: 'left', font: 'inherit', cursor: 'pointer', marginBottom: approvalOpen ? 8 : 0, paddingBottom: approvalOpen ? 8 : 0, borderBottom: approvalOpen ? '1px solid #f1f5f9' : 'none' }}
                >
                  <div style={sectionCardTitleStyle}>
                    <AuditOutlined style={{ color: actionPrimary }} />
                    <span>Thông tin phê duyệt</span>
                  </div>
                  {approvalOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                </button>
                {approvalOpen && renderDetailRows(detailApprovalRows, 0)}
              </div>
            </div>
          ),
        },
        {
          key: 'gis',
          label: `Thông tin vị trí (${detailRecord.coordinates ? parseWktToVertices(detailRecord.coordinates, detailRecord.geometryType || '').length : 0})`,
          children: (
            <div style={{ ...detailPaneScrollStyle, paddingRight: 0 }}>
              <div style={sectionCardStyle}>
              <style>{`
                .gis-meta-detail .chk-detail-row { display: flex !important; align-items: flex-start !important; min-height: 36px !important; padding: 7px 0 !important; border-bottom: 1px solid #f1f5f9 !important; line-height: 1.5 !important; gap: 10px !important; }
                .gis-meta-detail .chk-detail-row:last-child { border-bottom: none !important; }
                .gis-meta-detail .chk-detail-label { width: 215px !important; min-width: 215px !important; max-width: 215px !important; flex-shrink: 0 !important; color: ${colors.sidebarBg} !important; font-weight: 600 !important; font-size: 13.5px !important; text-align: left !important; line-height: 1.5 !important; }
                .gis-meta-detail .chk-detail-label::after { content: ':' !important; margin-left: 1px !important; margin-right: 4px !important; }
                .gis-meta-detail .sec-col2-label { width: 250px !important; min-width: 250px !important; max-width: 250px !important; flex-shrink: 0 !important; }
                .gis-meta-detail .chk-detail-value { color: #1e293b !important; font-size: 13.5px !important; flex: 1 !important; min-width: 0 !important; text-align: left !important; line-height: 1.5 !important; word-break: break-word !important; }
              `}</style>
              <div className="chk-detail-grid gis-meta-detail">
                <div className="chk-detail-row">
                  <span className="chk-detail-label">Loại đối tượng</span>
                  <span className="chk-detail-value">{detailRecord.geometryType === 'LINE' ? 'Đối tượng đường' : detailRecord.geometryType === 'POLYGON' ? 'Đối tượng vùng' : detailRecord.geometryType === 'POINT' ? 'Đối tượng điểm' : ''}</span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label sec-col2-label">Biểu tượng</span>
                  <span className="chk-detail-value">
                    {(() => {
                      const symId = detailRecord.symbolId;
                      const sym = symbols.find((s) => s.id === symId || (symId && String(s.id) === String(symId)));
                      if (sym) {
                        const imgSrc = sym.image
                          ? (sym.image.startsWith('data:') || sym.image.startsWith('http') || sym.image.startsWith('/')
                              ? sym.image
                              : `data:image/png;base64,${sym.image}`)
                          : undefined;
                        return (
                          <Space size={8} align="center" style={{ display: 'inline-flex', alignItems: 'center' }}>
                            {imgSrc
                              ? <img src={imgSrc} alt={sym.name || ''} style={{ width: 20, height: 20, objectFit: 'contain', verticalAlign: 'middle', display: 'inline-block' }} />
                              : <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: actionPrimary }} />}
                            <span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span>
                          </Space>
                        );
                      }
                      if (!symId) return null;
                      return (
                        <Space size={8} align="center" style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: actionPrimary }} />
                          <span>Biểu tượng ({symId})</span>
                        </Space>
                      );
                    })()}
                  </span>
                </div>
                <div className="chk-detail-row"><span className="chk-detail-label">Hệ quy chiếu</span><span className="chk-detail-value">{(() => { const value = detailRecord.coordinateSystem; if (value === 1 || value === '1') return 'WGS-84'; if (value === 2 || value === '2') return 'VN-2000'; return value ? String(value) : ''; })()}</span></div>
                <div className="chk-detail-row"><span className="chk-detail-label sec-col2-label">Quy tắc hiển thị</span><span className="chk-detail-value">{detailRecord.geometryType || detailRecord.coordinates ? 'Độ, phút, giây (DMS)' : ''}</span></div>
              </div>
              </div>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 13.5, lineHeight: '32px' }}>Tọa độ GPS ({detailRecord.coordinates ? parseWktToVertices(detailRecord.coordinates, detailRecord.geometryType || '').length : 0})</span>
                <Button icon={<EnvironmentOutlined style={{ color: actionPrimary }} />} onClick={() => setGisViewOpen(true)}
                  style={{ ...outlineButtonStyle, height: 32, fontSize: 13.5, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  Xem vị trí trên bản đồ
                </Button>
              </div>
              <DetailTable
                dataSource={(detailRecord.coordinates ? parseWktToVertices(detailRecord.coordinates, detailRecord.geometryType || '') : []).map((p, i) => ({ key: i, latitude: p.lat, longitude: p.lng }))}
                emptyText="Chưa có tọa độ GPS nào"
                rowKey={(row) => String(row.key)}
                scrollY={themeTokenChk.DRAWER_TABLE_SCROLL_Y.detailGis}
                emptyHeightAuto
                columns={[
                  { title: 'STT', width: 50, align: 'center', render: (_value, _record, rowIndex) => rowIndex + 1 },
                  { title: 'Vĩ độ (Latitude - N)', key: 'lat', render: (_v, r) => { const dms = ddToDms(r.latitude); return `${dms.d}° ${dms.m}' ${dms.s}" N`; } },
                  { title: 'Kinh độ (Longitude - E)', key: 'lng', render: (_v, r) => { const dms = ddToDms(r.longitude); return `${dms.d}° ${dms.m}' ${dms.s}" E`; } },
                ]}
              />
            </div>
          ),
        },
        {
          key: 'files',
          label: `File đính kèm (${((detailRecord as any)?.attachments || []).length})`,
          children: (
            <div style={{ paddingTop: 6 }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 13.5 }}>File đính kèm</span>
              </div>
              <InfrastructureAttachmentTab
                attachments={(detailRecord.attachments || []).map((a) => ({
                  id: a.id,
                  fileName: a.fileName,
                  filePath: a.filePath || a.fileUrl,
                  fileSize: a.fileSize,
                  uploadedBy: a.uploadedBy,
                  uploadedDate: a.uploadedDate || a.uploadDate,
                }))}
                readonly
                readonlyBerthLayout
                userMap={userMap}
                loadReadonlyPreviewImage={(attachmentId) => {
                  const recordId = detailRecord?.id;
                  if (!recordId) return Promise.reject(new Error('Chưa xác định được bản ghi đê kè để tải ảnh'));
                  return api.get(`/v1/dike-revetment/${recordId}/attachments/${attachmentId}/download`, { responseType: 'blob' })
                    .then((res: any) => new Blob([res.data]));
                }}
                onDownload={handleDownloadAttachment}
              />
            </div>
          ),
        },
        {
          key: 'operation',
          label: 'Vận hành & bảo trì',
          children: (
            <div style={detailPaneScrollStyle}>
              {/* ── Card Vận hành khai thác (y hệt module /berth) ── */}
              <div style={{ ...sectionCardStyle, padding: operationOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                <button
                  type="button"
                  aria-expanded={operationOpen}
                  onClick={() => setOperationOpen((v) => !v)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%', textAlign: 'left', font: 'inherit', cursor: 'pointer', userSelect: 'none', background: 'none', border: 'none', marginBottom: operationOpen ? 12 : 0, paddingBottom: operationOpen ? 8 : 0, borderBottom: operationOpen ? '1px solid #f1f5f9' : 'none', marginLeft: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0, paddingTop: 0 }}
                >
                  <div style={sectionCardTitleStyle}>
                    <SlidersOutlined style={{ color: actionPrimary }} />
                    <span>Thông tin vận hành khai thác</span>
                  </div>
                  <span style={{ color: actionPrimary, fontSize: 12 }}>
                    {operationOpen ? <DownOutlined /> : <RightOutlined />}
                  </span>
                </button>
                {operationOpen && (
                  <DetailTable
                    dataSource={detailOperationRows}
                    emptyText="Chưa có dữ liệu"
                    rowKey="key"
                    scrollY={160}
                    columns={[
                      { title: 'STT', width: 50 },
                      { title: 'Mã kế hoạch', dataIndex: 'code' },
                      { title: 'Tên kế hoạch', dataIndex: 'name' },
                      { title: 'Ngày bắt đầu', dataIndex: 'startDate', width: 150, align: 'center' as const },
                      { title: 'Ngày kết thúc', dataIndex: 'endDate', width: 150, align: 'center' as const },
                    ]}
                  />
                )}
              </div>

              {/* ── Card Bảo trì (y hệt module /berth) ── */}
              <div style={{ ...sectionCardStyle, padding: maintenanceOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                <button
                  type="button"
                  aria-expanded={maintenanceOpen}
                  onClick={() => setMaintenanceOpen((v) => !v)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%', textAlign: 'left', font: 'inherit', cursor: 'pointer', userSelect: 'none', background: 'none', border: 'none', marginBottom: maintenanceOpen ? 12 : 0, paddingBottom: maintenanceOpen ? 8 : 0, borderBottom: maintenanceOpen ? '1px solid #f1f5f9' : 'none', marginLeft: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0, paddingTop: 0 }}
                >
                  <div style={sectionCardTitleStyle}>
                    <SlidersOutlined style={{ color: actionPrimary }} />
                    <span>Thông tin bảo trì</span>
                  </div>
                  <span style={{ color: actionPrimary, fontSize: 12 }}>
                    {maintenanceOpen ? <DownOutlined /> : <RightOutlined />}
                  </span>
                </button>
                {maintenanceOpen && (
                  <DetailTable
                    dataSource={detailMaintenanceRows}
                    emptyText="Chưa có dữ liệu"
                    rowKey="key"
                    scrollY={160}
                    columns={[
                      { title: 'STT', width: 50 },
                      { title: 'Mã kế hoạch', dataIndex: 'code' },
                      { title: 'Tên kế hoạch', dataIndex: 'name' },
                      { title: 'Thời gian bắt đầu', dataIndex: 'startTime', width: 150, align: 'center' as const },
                      { title: 'Thời gian kết thúc', dataIndex: 'endTime', width: 150, align: 'center' as const },
                    ]}
                  />
                )}
              </div>

              {/* ── Card Sự cố (y hệt module /berth) ── */}
              <div style={{ ...sectionCardStyle, padding: incidentOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                <button
                  type="button"
                  aria-expanded={incidentOpen}
                  onClick={() => setIncidentOpen((v) => !v)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%', textAlign: 'left', font: 'inherit', cursor: 'pointer', userSelect: 'none', background: 'none', border: 'none', marginBottom: incidentOpen ? 12 : 0, paddingBottom: incidentOpen ? 8 : 0, borderBottom: incidentOpen ? '1px solid #f1f5f9' : 'none', marginLeft: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0, paddingTop: 0 }}
                >
                  <div style={sectionCardTitleStyle}>
                    <SlidersOutlined style={{ color: actionPrimary }} />
                    <span>Thông tin sự cố</span>
                  </div>
                  <span style={{ color: actionPrimary, fontSize: 12 }}>
                    {incidentOpen ? <DownOutlined /> : <RightOutlined />}
                  </span>
                </button>
                {incidentOpen && (
                  <DetailTable
                    dataSource={detailIncidentRows}
                    emptyText="Chưa có dữ liệu"
                    rowKey="key"
                    scrollY={160}
                    columns={[
                      { title: 'STT', width: 50 },
                      { title: 'Mã sự cố', dataIndex: 'code' },
                      { title: 'Loại sự cố', dataIndex: 'type' },
                      { title: 'Địa điểm', dataIndex: 'location' },
                      { title: 'Thời gian', dataIndex: 'time', width: 150, align: 'center' as const },
                    ]}
                  />
                )}
              </div>
            </div>
          ),
        },
      ]
    : [];

  const CHK_FILTER_LABEL = { ...themeTokenChk.filterLabelStyle, fontSize: 13.5 };

  // ── JSX ─────────────────────────────────────────────────────────
  return (
    <ThemeTokenProvider tokens={{ ...themeTokenChk, fontSizeMd: 13.5, filterLabelStyle: CHK_FILTER_LABEL }}>
    <div className="dike-revetment-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <style>{`
        .dike-revetment-page-wrapper,
        .dike-revetment-page-wrapper .ant-table,
        .dike-revetment-page-wrapper .ant-table-cell,
        .dike-revetment-page-wrapper .ant-table-thead > tr > th,
        .dike-revetment-page-wrapper .ant-table-tbody > tr > td,
        .dike-revetment-page-wrapper .ant-input,
        .dike-revetment-page-wrapper .ant-select,
        .dike-revetment-page-wrapper .ant-select-selection-item,
        .dike-revetment-page-wrapper .ant-select-item-option-content,
        .dike-revetment-page-wrapper .ant-picker,
        .dike-revetment-page-wrapper .ant-picker-input > input,
        .dike-revetment-page-wrapper .ant-pagination,
        .dike-revetment-page-wrapper .ant-pagination-item,
        .dike-revetment-page-wrapper .ant-pagination-total-text,
        .dike-revetment-page-wrapper .ant-breadcrumb,
        .dike-revetment-page-wrapper .ant-btn,
        .dike-revetment-page-wrapper .ant-form-item-label > label,
        .dike-revetment-page-wrapper .ant-radio-wrapper,
        .dike-revetment-page-wrapper .ant-checkbox-wrapper {
          font-size: 13.5px !important;
        }
        /* Popup/drawer con (portal ngoài .dike-revetment-page-wrapper) — chuẩn /berth */
        .dike-revetment-drawer-scope,
        .dike-revetment-drawer-scope .ant-drawer-content,
        .dike-revetment-drawer-scope .ant-drawer-title,
        .dike-revetment-drawer-scope .ant-tabs-tab,
        .dike-revetment-drawer-scope .chk-detail-label,
        .dike-revetment-drawer-scope .chk-detail-value,
        .dike-revetment-drawer-scope .ant-table,
        .dike-revetment-drawer-scope .ant-table-cell,
        .dike-revetment-drawer-scope .ant-table-thead > tr > th,
        .dike-revetment-drawer-scope .ant-table-tbody > tr > td,
        .dike-revetment-drawer-scope .ant-input,
        .dike-revetment-drawer-scope .ant-select,
        .dike-revetment-drawer-scope .ant-select-selector,
        .dike-revetment-drawer-scope .ant-select-selection-item,
        .dike-revetment-drawer-scope .ant-picker,
        .dike-revetment-drawer-scope .ant-btn,
        .dike-revetment-drawer-scope .ant-form-item-label > label,
        .dike-revetment-drawer-scope .ant-input-number-input,
        .dike-revetment-modal-scope,
        .dike-revetment-modal-scope .ant-modal-content,
        .dike-revetment-modal-scope .ant-modal-title,
        .dike-revetment-modal-scope .ant-input,
        .dike-revetment-modal-scope .ant-select,
        .dike-revetment-modal-scope .ant-select-selection-item,
        .dike-revetment-modal-scope .ant-picker,
        .dike-revetment-modal-scope .ant-btn,
        .dike-revetment-modal-scope .ant-table,
        .dike-revetment-modal-scope .ant-table-cell,
        .dike-revetment-modal-scope .ant-table-thead > tr > th,
        .dike-revetment-modal-scope .ant-table-tbody > tr > td {
          font-size: 13.5px !important;
        }

        /* Responsive StatusTabs (chuẩn /berth): căn giữa khi đủ chỗ, cuộn ngang khi tràn */
        .dike-revetment-page-wrapper div:has(> button[aria-pressed]) {
          display: flex !important;
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          justify-content: safe center !important;
          align-items: center !important;
          scrollbar-width: thin !important;
          scrollbar-color: #cbd5e1 #f8fafc !important;
          scroll-behavior: smooth !important;
          -webkit-overflow-scrolling: touch !important;
          padding: 2px 8px 4px 8px !important;
          gap: clamp(6px, 1vw, 14px) !important;
        }
        .dike-revetment-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
          height: 4px !important;
          display: block !important;
        }
        .dike-revetment-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
          background: #cbd5e1 !important;
          border-radius: 999px !important;
        }
        .dike-revetment-page-wrapper div:has(> button[aria-pressed]) > button {
          white-space: nowrap !important;
          flex-shrink: 0 !important;
          cursor: pointer !important;
          padding: 4px 2px !important;
        }

      `}</style>

      <ScreenHeader
        breadcrumb={[{ label: 'Quản lý KCHTGT' }, { label: 'Đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ' }]}
        actions={[
          hasPerm?.('dikerevetment:create')
            ? { key: 'create', label: 'Thêm mới', icon: <PlusOutlined />, variant: 'primary' as const, onClick: openCreateDrawer }
            : null,
        ].filter(Boolean) as Array<{ key: string; label: string; icon?: React.ReactNode; variant?: 'primary' | 'outline' | 'subtle' | 'default'; onClick: () => void }>}
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
          dataSource={dataSource}
          rowKey="id"
          rowActions={rowActions}
          scroll={{ x: 'max-content' }}
          loading={false}
          onSort={handleSort}
          emptyState={<EmptyState description="Không có dữ liệu đê/kè nào phù hợp với bộ lọc" />}
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
        className="dike-revetment-drawer-scope"
        rootClassName="dike-revetment-drawer-scope"
        width={DRAWER_WIDTH}
        title={
          <span style={isDetailMode || editingRecord ? drawerTitleStyle : { ...drawerTitleStyle, fontSize: 16 }}>
            {isDetailMode
              ? `Chi tiết đê kè${detailRecord?.dikeRevetmentName ? ` — ${detailRecord.dikeRevetmentName}` : ''}`
              : editingRecord
                ? `Chỉnh sửa — ${editingRecord.dikeRevetmentName || ''}`
                : 'Thêm mới đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ'}
          </span>
        }
        open={drawerVisible}
        destroyOnHidden
        onClose={closeDrawer}
        footer={
          isDetailMode ? null : (
            <KchtFormFooter
              mode={editingRecord ? 'edit' : 'create'}
              resource="dikerevetment"
              record={editingRecord ? { approvalStatus: editingRecord.approvalStatus } : undefined}
              loading={submitting}
              activeAction={actionType as any}
              onCancel={closeDrawer}
              onSubmit={(action) => {
                setActionType(action as any);
                handleSubmit(action === 'approve' ? 'approve' : action === 'draft' ? 'draft' : 'submit');
              }}
            />
          )
        }
      >
        {isDetailMode && detailRecord ? (
          <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={tabBarStyle} items={detailTabItems} />
        ) : (
          <>
            <style>{requiredMarkStyle}</style>
            <Form form={createForm} layout="vertical" preserve={true} initialValues={{ status: '2' }}>
              <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={tabBarStyle}
                items={[
                  {
                    key: 'general',
                    label: 'Thông tin chung',
                    children: (
                      <div style={{ ...themeTokenChk.drawerFormScrollStyle, paddingTop: spaceMd }}>
                        {/* ── Section 1: Thông tin cơ bản & Quản lý vận hành ── */}
                        <div style={sectionBoxStyle}>
                          <div style={sectionHeaderStyle}>
                            <div style={sectionTitleStyle}>
                              <BankOutlined style={{ color: actionPrimary }} />
                              <span>Thông tin cơ bản & Quản lý vận hành</span>
                            </div>
                          </div>
                          <Row gutter={formRowGutter}>
                            <Col span={12}>
                              <Form.Item
                                name="orgUnitId"
                                {...labelProps('Đơn vị quản lý')}
                                required
                                style={formFieldStyle}
                                rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}
                              >
                                <FormOrgUnitTreeSelect
                                  organizations={organizations}
                                  placeholder="Chọn đơn vị quản lý..."
                                  disabled={!!editingRecord && !isElevatedOrg}
                                  style={selectStyle}
                                  onChange={(val) => {
                                    createForm.setFieldValue('orgUnitId', val);
                                    const currentSeaportId = createForm.getFieldValue('seaportId');
                                    if (!val) {
                                      createForm.setFieldValue('seaportId', undefined);
                                      if (!editingRecord) {
                                        createForm.setFieldValue('code', undefined);
                                      }
                                    } else if (currentSeaportId) {
                                      const rawSet = resolveOrgSubtreeIds(organizations, String(val));
                                      const normalizedSet = new Set<string>();
                                      rawSet.forEach((oId) => normalizedSet.add(String(oId).toLowerCase()));
                                      const isValid = seaports.some(
                                        (p) => p.id === currentSeaportId && !!p.orgUnitId && normalizedSet.has(String(p.orgUnitId).toLowerCase())
                                      );
                                      if (!isValid) {
                                        createForm.setFieldValue('seaportId', undefined);
                                        if (!editingRecord) {
                                          createForm.setFieldValue('code', undefined);
                                        }
                                      }
                                    }
                                  }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name="seaportId"
                                {...labelProps('Thuộc cảng biển')}
                                required
                                style={formFieldStyle}
                                rules={[{ required: true, message: 'Thuộc cảng biển là bắt buộc' }]}
                              >
                                <Select
                                  placeholder={!createOrgUnitId ? 'Vui lòng chọn đơn vị quản lý trước' : 'Chọn cảng biển'}
                                  disabled={!createOrgUnitId}
                                  allowClear
                                  showSearch
                                  optionFilterProp="label"
                                  options={filteredSeaports.map((p) => ({
                                    value: p.id,
                                    label: p.portCode ? `${p.portCode} - ${p.portName || p.id}` : (p.portName || p.id),
                                  }))}
                                  style={selectStyle}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={formRowGutter}>
                            <Col span={12}>
                              <Form.Item
                                name="code"
                                {...labelProps('Mã đê kè')}
                                style={formFieldStyle}
                                tooltip="Mã đê kè được sinh tự động"
                              >
                                <Input
                                  disabled
                                  placeholder={codeLoading ? 'Đang sinh mã...' : watchedSeaportId ? 'Mã tự động' : 'Chọn Cảng biển để sinh mã'}
                                  maxLength={50}
                                  style={{ ...inputStyle, ...readonlyInputStyle, cursor: 'not-allowed' }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name="dikeRevetmentName"
                                {...labelProps('Tên đê kè')}
                                required
                                style={formFieldStyle}
                                rules={[{ required: true, message: 'Vui lòng nhập tên đê kè' }]}
                                validateStatus={atMax.dikeRevetmentName ? 'error' : undefined}
                                help={atMax.dikeRevetmentName ? 'Đã đạt tối đa 255 ký tự' : undefined}
                              >
                                <Input placeholder="Nhập tên đê kè..." maxLength={255} showCount style={inputStyle} />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={formRowGutter}>
                            <Col span={12}>
                              <Form.Item name="operatingUnitId" {...labelProps('Đơn vị vận hành')} style={formFieldStyle}>
                                <Select
                                  placeholder="Chọn đơn vị vận hành"
                                  allowClear
                                  showSearch
                                  optionFilterProp="label"
                                  options={operatingUnitOptions}
                                  style={selectStyle}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name="status"
                                {...labelProps('Tình trạng')}
                                required
                                style={formFieldStyle}
                                rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}
                              >
                                <Select placeholder="Chọn tình trạng..." options={OPERATIONAL_STATUS_OPTIONS} style={selectStyle} />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={formRowGutter}>
                            <Col span={12}>
                              <Form.Item
                                name="location"
                                {...labelProps('Địa điểm (Tỉnh/TP)')}
                                required
                                style={formFieldStyle}
                                rules={[{ required: true, message: 'Vui lòng chọn địa điểm (Tỉnh/TP)' }]}
                              >
                                <Select
                                  placeholder="Chọn địa điểm (Tỉnh/TP)..."
                                  allowClear
                                  showSearch
                                  optionFilterProp="label"
                                  options={VIETNAM_PROVINCE_OPTIONS.map((p) => ({ value: p.label, label: p.label }))}
                                  style={selectStyle}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name="locationDetail"
                                {...labelProps('Địa điểm chi tiết')}
                                style={formFieldStyle}
                                validateStatus={atMax.locationDetail ? 'error' : undefined}
                                help={atMax.locationDetail ? 'Đã đạt tối đa 500 ký tự' : undefined}
                              >
                                <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={inputStyle} />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={formRowGutter}>
                            <Col span={12}>
                              <Form.Item
                                name="dikeRevetmentType"
                                {...labelProps('Loại kết cấu công trình')}
                                required
                                style={formFieldStyle}
                                rules={[{ required: true, message: 'Vui lòng chọn loại kết cấu công trình' }]}
                              >
                                <Select placeholder="Chọn loại kết cấu công trình..." options={DIKE_REVETMENT_TYPE_OPTIONS} style={selectStyle} />
                              </Form.Item>
                            </Col>
                          </Row>
                        </div>

                        {/* ── Section 2: Thông số kỹ thuật ── */}
                        <div style={sectionBoxStyle}>
                          <div style={sectionHeaderStyle}>
                            <div style={sectionTitleStyle}>
                              <SlidersOutlined style={{ color: actionPrimary }} />
                              <span>Thông số kỹ thuật</span>
                            </div>
                          </div>
                          <Row gutter={formRowGutter}>
                            <Col span={12}>
                              <Form.Item
                                name="length"
                                {...labelProps('Chiều dài (m)')}
                                required
                                style={formFieldStyle}
                                getValueFromEvent={getValueFromEvent20}
                                rules={[
                                  { required: true, message: 'Vui lòng nhập chiều dài' },
                                  decimalNumberRule,
                                ]}
                              >
                                <NumberInputWithCount
                                  allowDecimal
                                  min={0}
                                  step={0.01}
                                  placeholder="0"
                                  style={numberInputStyle}
                                  maxLength={20}
                                  parser={parseNumber20}
                                  formatter={fmtInputNumber}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name="height"
                                {...labelProps('Chiều cao (m)')}
                                style={formFieldStyle}
                                getValueFromEvent={getValueFromEvent20}
                                rules={[decimalNumberRule]}
                              >
                                <NumberInputWithCount
                                  allowDecimal
                                  min={0}
                                  step={0.01}
                                  placeholder="0"
                                  style={numberInputStyle}
                                  maxLength={20}
                                  parser={parseNumber20}
                                  formatter={fmtInputNumber}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={formRowGutter}>
                            <Col span={12}>
                              <Form.Item
                                name="crestElevation"
                                {...labelProps('Cao trình đỉnh (m)')}
                                style={formFieldStyle}
                                getValueFromEvent={getValueFromEvent20Signed}
                                rules={[decimalNumberRuleSigned]}
                              >
                                <NumberInputWithCount
                                  allowDecimal
                                  allowNegative
                                  step={0.01}
                                  placeholder="0"
                                  style={numberInputStyle}
                                  maxLength={20}
                                  parser={parseNumber20Signed}
                                  formatter={fmtInputNumber}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name="note"
                                {...labelProps('Ghi chú')}
                                style={formFieldStyle}
                                validateStatus={atMax.note ? 'error' : undefined}
                                help={atMax.note ? 'Đã đạt tối đa 500 ký tự' : undefined}
                              >
                                <Input placeholder="Nhập ghi chú" maxLength={500} showCount style={inputStyle} />
                              </Form.Item>
                            </Col>
                          </Row>
                        </div>

                        {/* ── Section 3: Thông tin xây dựng, đưa vào khai thác ── */}
                        <div style={sectionBoxStyle}>
                          <div style={sectionHeaderStyle}>
                            <div style={sectionTitleStyle}>
                              <FileTextOutlined style={{ color: actionPrimary }} />
                              <span>Thông tin xây dựng, đưa vào khai thác</span>
                            </div>
                          </div>
                          <Row gutter={formRowGutter}>
                            <Col span={12}>
                              <Form.Item name="constructionDate" {...labelProps('Thời điểm xây dựng')} style={formFieldStyle}>
                                <DatePicker {...getDatePickerProps({ placeholder: 'Chọn ngày...', format: 'DD/MM/YYYY' })} />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name="commissioningDate" {...labelProps('Thời điểm đưa vào khai thác')} style={formFieldStyle} rules={[{ required: true, message: 'Vui lòng chọn thời điểm đưa vào khai thác' }]}>
                                <DatePicker picker="year" {...getDatePickerProps({ picker: 'year', placeholder: 'Chọn năm', format: 'YYYY' })} />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={formRowGutter}>
                            <Col span={12}>
                              <Form.Item name="lastMaintenanceYear" {...labelProps('Năm bảo trì gần nhất')} style={formFieldStyle}>
                                <DatePicker picker="year" {...getDatePickerProps({ picker: 'year', placeholder: 'Chọn năm', format: 'YYYY' })} />
                              </Form.Item>
                            </Col>
                          </Row>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'gis',
                    forceRender: true,
                    label: `Thông tin vị trí (${coordinateList.length})`,
                    children: (
                      <div style={{ ...themeTokenChk.drawerFormScrollStyle, paddingTop: spaceMd }}>
                        {/* ── Section Card: Thông số đối tượng bản đồ ── */}
                        <div style={sectionBoxStyle}>
                          <div style={sectionHeaderStyle}>
                            <div style={sectionTitleStyle}>
                              <EnvironmentOutlined style={{ color: actionPrimary }} />
                              <span>Thông số đối tượng bản đồ</span>
                            </div>
                          </div>
                          <Row gutter={formRowGutter}>
                            <Col span={12}>
                              <Form.Item name="geometryType" {...labelProps('Loại đối tượng')} style={formFieldStyle}>
                                <Select
                                  placeholder="Chọn loại đối tượng"
                                  allowClear
                                  options={[
                                    { value: 'POINT', label: 'Đối tượng điểm' },
                                    { value: 'LINE', label: 'Đối tượng đường' },
                                    { value: 'POLYGON', label: 'Đối tượng vùng' },
                                  ]}
                                  style={selectStyle}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name="symbolId"
                                {...labelProps('Biểu tượng')}
                                required={!!createGeometryType}
                                rules={
                                  createGeometryType
                                    ? [{ required: true, message: 'Vui lòng chọn biểu tượng' }]
                                    : []
                                }
                                style={formFieldStyle}
                              >
                                <Select
                                  placeholder="Chọn biểu tượng bản đồ"
                                  allowClear
                                  showSearch
                                  optionFilterProp="label"
                                  disabled={!createGeometryType}
                                  style={selectStyle}
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
                          <Row gutter={formRowGutter}>
                            <Col span={12}>
                              <Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={formFieldStyle}>
                                <Select
                                  disabled
                                  placeholder="Chọn hệ quy chiếu"
                                  options={[
                                    { value: 1, label: 'WGS-84' },
                                    { value: 2, label: 'VN-2000' },
                                  ]}
                                  style={selectStyle}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={formFieldStyle}>
                                <Input disabled placeholder="Chọn quy tắc hiển thị" maxLength={255} style={{ ...themeTokenChk.readonlyInputStyle, borderRadius: radiusPill, height: 40 }} />
                              </Form.Item>
                            </Col>
                          </Row>
                        </div>

                        {/* ── Section Card: Tọa độ GPS ── */}
                        <div style={sectionBoxStyle}>
                          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32, boxSizing: 'border-box' }}>
                            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                              Tọa độ GPS ({coordinateList.length})
                            </span>
                            <Space size={8}>
                              <Button
                                icon={<EnvironmentOutlined style={{ color: !createGeometryType ? undefined : actionPrimary }} />}
                                onClick={() => {
                                  gisCoordSnapshotRef.current = {
                                    coords: coordinateList.map((c) => ({ ...c })),
                                    symbolId: createForm.getFieldValue('symbolId'),
                                    geometryType: createForm.getFieldValue('geometryType'),
                                  };
                                  latestGisMapValueRef.current = null;
                                  setGisMapOpen(true);
                                }}
                                disabled={!createGeometryType}
                                style={!createGeometryType ? {
                                  height: 32,
                                  fontSize: fontSizeSm,
                                  padding: '0 14px',
                                  borderRadius: radiusPill,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  opacity: 0.6,
                                  cursor: 'not-allowed',
                                } : {
                                  ...outlineButtonStyle,
                                  height: 32,
                                  fontSize: fontSizeSm,
                                  padding: '0 14px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  borderColor: actionPrimary,
                                  color: actionPrimary,
                                }}
                              >
                                Chọn tọa độ trên bản đồ
                              </Button>
                              <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={addGpsPoint}
                                disabled={!createGeometryType || (createGeometryType === 'POINT' && coordinateList.length >= 1)}
                                style={!createGeometryType || (createGeometryType === 'POINT' && coordinateList.length >= 1) ? {
                                  height: 32,
                                  fontSize: fontSizeSm,
                                  padding: '0 14px',
                                  borderRadius: radiusPill,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  background: '#f5f5f5',
                                  borderColor: '#d9d9d9',
                                  color: 'rgba(0, 0, 0, 0.25)',
                                  cursor: 'not-allowed',
                                } : {
                                  ...primaryButtonStyle,
                                  borderRadius: radiusPill,
                                  height: 32,
                                  fontSize: fontSizeSm,
                                  padding: '0 14px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                                title={createGeometryType === 'POINT' && coordinateList.length >= 1 ? 'Đối tượng điểm chỉ có tối đa 1 tọa độ GPS' : undefined}
                              >
                                Thêm tọa độ
                              </Button>
                            </Space>
                          </div>
                          {gpsError && (
                            <div style={{ marginBottom: spaceSm, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ color: statusCritical, fontSize: fontSizeMd, flex: 1 }}>⚠ {gpsError}</span>
                            </div>
                          )}
                          {coordinateList.length === 0 ? (
                            <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
                              <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block' }}>Chưa có tọa độ nào.</span>
                            </div>
                          ) : (
                            <DetailTable
                              scrollY={themeTokenChk.DRAWER_TABLE_SCROLL_Y.withGisForm}
                              dataSource={coordinateList.map((c, i) => ({ ...c, _idx: i }))}
                              emptyText="Chưa có tọa độ nào"
                              rowKey="_idx"
                              columns={[
                                {
                                  title: 'STT',
                                  key: 'stt',
                                  width: 60,
                                  align: 'center',
                                  onCell: () => ({ style: { verticalAlign: 'middle' } }),
                                  render: (_: any, __: any, i: number) => (
                                    <span style={{ fontSize: 13.5, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>
                                  ),
                                },
                                {
                                  title: 'Vĩ độ (Latitude - N)',
                                  key: 'lat',
                                  onCell: () => ({ style: { verticalAlign: 'middle' } }),
                                  render: (_: any, r: any) => renderDmsGroup(r.latD, r.latM, r.latS, 90, (d, m, s) => updateGpsPoint(r._idx, 'lat', d, m, s)),
                                },
                                {
                                  title: 'Kinh độ (Longitude - E)',
                                  key: 'lng',
                                  onCell: () => ({ style: { verticalAlign: 'middle' } }),
                                  render: (_: any, r: any) => renderDmsGroup(r.lngD, r.lngM, r.lngS, 180, (d, m, s) => updateGpsPoint(r._idx, 'lng', d, m, s)),
                                },
                                {
                                  title: '',
                                  key: 'actions',
                                  width: 50,
                                  align: 'center' as const,
                                  onCell: () => ({ style: { verticalAlign: 'middle' } }),
                                  render: (_: any, r: any) => (
                                    <Button
                                      type="text"
                                      danger
                                      size="small"
                                      icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                                      style={{ width: 32, height: 32, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                      onClick={() => removeGpsPoint(r._idx)}
                                      title="Xóa tọa độ"
                                    />
                                  ),
                                },
                              ]}
                            />
                          )}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'files',
                    forceRender: true,
                    label: `File đính kèm (${attachmentItems.length})`,
                    children: (
                      <div style={{ ...themeTokenChk.drawerFormScrollStyle, paddingTop: spaceMd }}>
                        <InfrastructureAttachmentTab
                          attachments={attachmentItems}
                          readonly={!attachmentsEditable}
                          onUpload={handlePickAttachment}
                          onDelete={(id) => { void handleRemoveAttachment(id); }}
                          onDownload={handleDownloadAttachment}
                        />
                      </div>
                    ),
                  },
                ]}
              />
            </Form>
          </>
        )}
      </AppDrawer>

      {/* ── GIS Map chooser (chuẩn CHK — GisLocationSelector) ──────────── */}
      <Modal
        rootClassName="dike-revetment-modal-scope"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>Chọn vị trí & tọa độ trên bản đồ chuyên dụng</span>
          </div>
        }
        open={gisMapOpen}
        onCancel={() => {
          setCoordinateList(gisCoordSnapshotRef.current.coords);
          createForm.setFieldValue('symbolId', gisCoordSnapshotRef.current.symbolId);
          if (gisCoordSnapshotRef.current.geometryType) {
            createForm.setFieldValue('geometryType', gisCoordSnapshotRef.current.geometryType);
          }
          latestGisMapValueRef.current = null;
          setGisMapOpen(false);
        }}
        destroyOnHidden
        width="94vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setCoordinateList(gisCoordSnapshotRef.current.coords);
              createForm.setFieldValue('symbolId', gisCoordSnapshotRef.current.symbolId);
              if (gisCoordSnapshotRef.current.geometryType) {
                createForm.setFieldValue('geometryType', gisCoordSnapshotRef.current.geometryType);
              }
              latestGisMapValueRef.current = null;
              setGisMapOpen(false);
            }}
            style={{ ...outlineButtonStyle, height: 36, borderRadius: radiusPill }}
          >
            Hủy
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={() => {
              if (latestGisMapValueRef.current) {
                applyMapSelection(latestGisMapValueRef.current);
              }
              latestGisMapValueRef.current = null;
              setGisMapOpen(false);
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
            height={520}
            value={{
              geometryType: createGeometryType || 'POINT',
              coordinates: serializeCoordinatesToWkt(
                coordinateList
                  .filter((c) => c.latD != null && c.lngD != null)
                  .map((c) => ({
                    latitude: dmsToDd(c.latD, c.latM, c.latS),
                    longitude: dmsToDd(c.lngD, c.lngM, c.lngS),
                  }))
                  .filter((c) => c.latitude != null && c.longitude != null) as { latitude: number; longitude: number }[],
                createGeometryType || 'POINT',
              ),
              symbolId: createForm.getFieldValue('symbolId'),
            }}
            defaultGeometryType={(createGeometryType as any) || 'POINT'}
            onChange={applyMapSelection}
          />
        </div>
      </Modal>

      {/* ── GIS Map viewer — Xem chi tiết (GisLocationSelector disabled = quy tắc 12) ── */}
      <Modal
        rootClassName="dike-revetment-modal-scope"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>Xem vị trí trên bản đồ chuyên dụng</span>
          </div>
        }
        open={gisViewOpen}
        onCancel={() => setGisViewOpen(false)}
        footer={null}
        destroyOnHidden
        width="90vw"
        style={{ top: 20, maxWidth: '1400px' }}
      >
        <div style={{ padding: '8px 0' }}>
          {detailRecord && (
            <GisLocationSelector
              inline={true}
              height={560}
              disabled={true}
              value={{
                geometryType: detailRecord.geometryType || 'POINT',
                coordinates: (() => {
                  const gt = detailRecord.geometryType || 'POINT';
                  // Chuẩn hóa WKT giống /vts-operation-center: bỏ tiền tố SRID (nếu có), parse rồi serialize lại đúng chuẩn selector
                  const raw = (detailRecord.coordinates || '').replace(/^SRID=\d+;/, '').trim();
                  const pts = raw ? parseWktToVertices(raw, gt) : [];
                  return pts.length > 0 ? serializeVerticesToWkt(pts, gt) : raw;
                })(),
                symbolId: detailRecord.symbolId,
              }}
              defaultGeometryType={(detailRecord.geometryType as any) || 'POINT'}
              onChange={() => { }}
            />
          )}
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal (chuẩn /berth) ─────────────── */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        onCancel={() => {
          if (!deleteLoading) {
            setDeleteModalOpen(false);
            setDeletingRecord(null);
          }
        }}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        itemType="đê kè"
        itemName={deletingRecord?.dikeRevetmentName}
        itemCode={deletingRecord?.code}
      />

      {/* ── Submit Modal (chuẩn /berth) ──────────────────────────── */}
      <Modal
        rootClassName="dike-revetment-modal-scope"
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận gửi Cảng vụ phê duyệt</span>}
        open={submitModalOpen}
        onCancel={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="submit" type="primary" onClick={confirmSubmit}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Xác nhận</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
            Gửi <strong>{submittingRecord?.code ? `${submittingRecord.code} — ` : ''}{submittingRecord?.dikeRevetmentName}</strong> để Cảng vụ phê duyệt?
          </p>
        </div>
      </Modal>

      {/* ── Approve Modal (chuẩn /berth & ApprovalModal CHK) ──────── */}
      <ApprovalModal
        visible={approveModalOpen}
        level={approvingRecord?.approvalStatus === 'APPROVED_LEVEL1' ? 'c2' : 'c1'}
        onConfirm={(content) => { if (approvingRecord) void confirmApprove(content); }}
        onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
      />

      {/* ── Reject Reason Modal (chuẩn /berth) ────────────────────── */}
      <Modal
        rootClassName="dike-revetment-modal-scope"
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
        open={rejectModalOpen}
        onCancel={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="reject" type="primary" danger onClick={confirmReject}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận từ chối</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập lý do từ chối cho đê kè (không bắt buộc):</p>
          {rejectingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              <strong style={{ color: textPrimary }}>
                {rejectingRecord.code ? `${rejectingRecord.code} — ` : ''}{rejectingRecord.dikeRevetmentName}
              </strong>
            </p>
          )}
          <Input.TextArea
            placeholder="Nhập lý do từ chối (nếu có)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            style={{ borderRadius: 8, fontSize: fontSizeMd }}
          />
        </div>
      </Modal>

      {/* ── History Drawer ──────────────────────────────────────── */}
      <AppDrawer
        width={DRAWER_WIDTH}
        rootClassName="dike-revetment-drawer-scope"
        className="dike-revetment-drawer-scope"
        mask
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm} style={{ alignItems: 'center' }}>
              <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
              <span style={drawerTitleStyle}>
                {historyTarget ? `Lịch sử thay đổi — ${historyTarget.dikeRevetmentName || historyTarget.code}` : 'Lịch sử thay đổi'}
              </span>
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>
                Tổng cộng {historyUpdateCount}
              </span>
            </Space>
          </div>
        }
        open={historyOpen}
        onClose={() => { setHistoryOpen(false); setHistoryTarget(null); setHistoryRecords([]); }}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '16px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
        }}
      >
        <style>{`.history-dt-popup .ant-picker-now-btn { color: ${actionPrimary} !important; }`}</style>
        <div style={{ flexShrink: 0 }}>
          {!historyLoading && (
            <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
              <Input
                placeholder="Tìm kiếm nội dung thay đổi..."
                allowClear
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                style={{ flex: 1, borderRadius: radiusPill, height: 40 }}
              />
              <DatePicker
                placeholder="Từ ngày"
                classNames={{ popup: { root: 'history-dt-popup' } }}
                value={historyFrom ? dayjs(historyFrom) : null}
                onChange={(d) => setHistoryFrom(d ? d.format('YYYY-MM-DD') : '')}
                style={{ width: 140, borderRadius: radiusPill, height: 40 }}
                format="DD/MM/YYYY"
              />
              <DatePicker
                placeholder="Đến ngày"
                classNames={{ popup: { root: 'history-dt-popup' } }}
                value={historyTo ? dayjs(historyTo) : null}
                onChange={(d) => setHistoryTo(d ? d.format('YYYY-MM-DD') : '')}
                style={{ width: 140, borderRadius: radiusPill, height: 40 }}
                format="DD/MM/YYYY"
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => setHistorySearch(historySearch.trim())}
                style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}
              >
                Tìm kiếm
              </Button>
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {historyLoading ? (
            <LoadingSkeleton rows={5} />
          ) : validHistoryGroups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
              <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
              <div style={{ color: textTertiary, fontSize: fontSizeMd }}>
                {historySearch || historyFrom || historyTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}
              </div>
            </div>
          ) : (
            <>
              {renderHistoryTimeline()}
              {loadingMoreHistory && <div style={{ textAlign: 'center', padding: `${spaceMd}px 0`, color: textTertiary, fontSize: fontSizeMd }}>Đang tải thêm...</div>}
            </>
          )}
        </div>
      </AppDrawer>
    </div>
    </ThemeTokenProvider>
  );
}
